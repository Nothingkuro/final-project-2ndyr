import { MemberStatus, PaymentMethod, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const MEMBER_NOT_FOUND_DURING_PAYMENT_TX = 'MEMBER_NOT_FOUND_DURING_PAYMENT_TX';
const MAX_PAYMENT_TX_ATTEMPTS = 3;

/**
 * Detects Prisma transaction conflicts that are safe to retry.
 *
 * @param error Unknown error thrown by Prisma transaction calls.
 * @returns True when the error indicates a serializable transaction conflict.
 */
function isRetryableTransactionError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  return (error as { code?: string }).code === 'P2034';
}

/**
 * Lists active membership plans for payment selection screens.
 *
 * @param req Express request.
 * @param res Express response containing active plans sorted by price.
 * @returns Promise that resolves when the response is sent.
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

/**
 * Creates a payment record and extends member expiry in one serializable transaction.
 *
 * Retrying on transaction conflicts prevents lost updates when multiple staff
 * process payments for the same member around the same time.
 *
 * @param req Express request containing payment payload.
 * @param res Express response containing payment and updated membership state.
 * @returns Promise that resolves when the response is sent.
 */
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { memberId, planId, paymentMethod, amountPaid } = req.body;
    const processedById = req.authUser?.id;

    if (!memberId || !planId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!processedById) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (paymentMethod !== PaymentMethod.CASH && paymentMethod !== PaymentMethod.GCASH) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const parsedAmountPaid =
      amountPaid === undefined || amountPaid === null ? null : Number(amountPaid);

    if (parsedAmountPaid !== null && (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid <= 0)) {
      return res.status(400).json({ error: 'Amount paid must be a positive number' });
    }

    const [plan, member, user] = await Promise.all([
      prisma.membershipPlan.findUnique({ where: { id: planId } }),
      prisma.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          status: true,
          expiryDate: true,
        },
      }),
      prisma.user.findUnique({ where: { id: processedById } }),
    ]);

    if (!user) {
      return res.status(401).json({ error: 'Authenticated user not found' });
    }

    if (!plan || !member) {
      return res.status(404).json({ error: 'Member or Plan not found' });
    }

    const finalAmount = parsedAmountPaid ?? Number(plan.price);

    let result:
      | {
          payment: {
            id: string;
            memberId: string;
            planId: string;
            amount: Prisma.Decimal;
            paymentMethod: PaymentMethod;
            transactionDate: Date;
            processedById: string;
          };
          updatedMember: {
            id: string;
            firstName: string;
            lastName: string;
            contactNumber: string;
            joinDate: Date;
            expiryDate: Date | null;
            status: MemberStatus;
          };
        }
      | null = null;

    for (let attempt = 1; attempt <= MAX_PAYMENT_TX_ATTEMPTS; attempt += 1) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            const lockedMembers = await tx.$queryRaw<
              Array<{
                id: string;
                status: MemberStatus;
                expiryDate: Date | null;
              }>
            >`SELECT id, status, "expiryDate" FROM "members" WHERE id = ${memberId} FOR UPDATE`;

            const lockedMember = lockedMembers[0];

            if (!lockedMember) {
              throw new Error(MEMBER_NOT_FOUND_DURING_PAYMENT_TX);
            }

            const now = new Date();
            let newExpiryDate: Date;

            if (
              lockedMember.status === MemberStatus.INACTIVE ||
              !lockedMember.expiryDate ||
              lockedMember.expiryDate < now
            ) {
              newExpiryDate = new Date(now);
              newExpiryDate.setDate(newExpiryDate.getDate() + plan.durationDays);
            } else {
              newExpiryDate = new Date(lockedMember.expiryDate);
              newExpiryDate.setDate(newExpiryDate.getDate() + plan.durationDays);
            }

            const payment = await tx.payment.create({
              data: {
                memberId,
                planId,
                amount: finalAmount,
                paymentMethod,
                processedById,
              },
            });

            const updatedMember = await tx.member.update({
              where: { id: memberId },
              data: {
                expiryDate: newExpiryDate,
                status: MemberStatus.ACTIVE,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                contactNumber: true,
                joinDate: true,
                expiryDate: true,
                status: true,
              },
            });

            return { payment, updatedMember };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        break;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === MEMBER_NOT_FOUND_DURING_PAYMENT_TX
        ) {
          return res.status(404).json({ error: 'Member or Plan not found' });
        }

        if (isRetryableTransactionError(error) && attempt < MAX_PAYMENT_TX_ATTEMPTS) {
          continue;
        }

        throw error;
      }
    }

    if (!result) {
      throw new Error('Failed to process payment transaction');
    }

    res.status(201).json({
      payment: {
        id: result.payment.id,
        memberId: result.payment.memberId,
        planId: result.payment.planId,
        amount: Number(result.payment.amount),
        paymentMethod: result.payment.paymentMethod,
        transactionDate: result.payment.transactionDate.toISOString(),
        processedById: result.payment.processedById,
      },
      updatedMember: {
        id: result.updatedMember.id,
        firstName: result.updatedMember.firstName,
        lastName: result.updatedMember.lastName,
        contactNumber: result.updatedMember.contactNumber,
        joinDate: result.updatedMember.joinDate.toISOString(),
        expiryDate: result.updatedMember.expiryDate ? result.updatedMember.expiryDate.toISOString() : '',
        status: result.updatedMember.status,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

/**
 * Returns payment history for a single member.
 *
 * @param req Express request containing member id.
 * @param res Express response containing normalized payment records.
 * @returns Promise that resolves when the response is sent.
 */
export const getMemberPayments = async (req: Request, res: Response) => {
  try {
    const memberIdParam = req.params.memberId;
    const memberId = Array.isArray(memberIdParam) ? memberIdParam[0] : memberIdParam;

    if (!memberId) {
      return res.status(400).json({ error: 'Member id is required' });
    }

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const payments = (await prisma.payment.findMany({
      where: { memberId },
      orderBy: { transactionDate: 'desc' },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
        processedBy: {
          select: {
            username: true,
          },
        },
      },
    })) as Array<{
      id: string;
      memberId: string;
      amount: { toString(): string };
      paymentMethod: PaymentMethod;
      transactionDate: Date;
      plan: { name: string };
      processedBy: { username: string };
    }>;

    res.json(
      payments.map((payment) => ({
        id: payment.id,
        memberId: payment.memberId,
        paidAt: payment.transactionDate.toISOString(),
        amountPhp: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        membershipPlan: payment.plan.name,
        processedBy: payment.processedBy.username,
      })),
    );
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};
