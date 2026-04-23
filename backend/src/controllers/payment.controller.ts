import { PaymentMethod } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  MEMBER_NOT_FOUND_DURING_PAYMENT_TX,
  PAYMENT_NOT_FOUND_FOR_UNDO,
  PAYMENT_UNDO_STATE_UNAVAILABLE,
  ProcessPaymentCommand,
} from '../patterns/command/process-payment.command';
import { notifyMemberChanged } from '../patterns/observer-pattern/member-changed.observer';
import { notifyPaymentCreated } from '../patterns/observer-pattern/payment-created.observer';
import { getPaymentContext } from '../patterns/strategy-pattern/payment-method.strategy';

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
    const {
      memberId,
      planId,
      paymentMethod,
      amountPaid,
      referenceNumber,
    } = req.body;
    const processedById = req.authUser?.id;

    if (!memberId || !planId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!processedById) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const paymentContext = getPaymentContext(paymentMethod);

    if (!paymentContext.isSupportedMethod()) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const parsedAmountPaid =
      amountPaid === undefined || amountPaid === null ? null : Number(amountPaid);

    const normalizedReferenceNumber =
      typeof referenceNumber === 'string' && referenceNumber.trim().length > 0
        ? referenceNumber.trim()
        : undefined;

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

    try {
      paymentContext.validate({
        amount: finalAmount,
        referenceNumber: normalizedReferenceNumber,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid payment details';
      return res.status(400).json({ error: message });
    }

    const processPaymentCommand = new ProcessPaymentCommand({
      memberId,
      planId,
      processedById,
      planDurationDays: plan.durationDays,
      amount: finalAmount,
      paymentMethod: paymentContext.getMethod(),
      referenceNumber: normalizedReferenceNumber,
    });

    const result = await processPaymentCommand.execute();

    await notifyPaymentCreated({
      paymentId: result.payment.id,
      memberId: result.payment.memberId,
      planId: result.payment.planId,
      amount: Number(result.payment.amount),
      paymentMethod: result.payment.paymentMethod,
      processedById: result.payment.processedById,
      happenedAt: result.payment.transactionDate.toISOString(),
    });

    res.status(201).json({
      payment: {
        id: result.payment.id,
        memberId: result.payment.memberId,
        planId: result.payment.planId,
        amount: Number(result.payment.amount),
        paymentMethod: result.payment.paymentMethod,
        referenceNumber: result.payment.referenceNumber,
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
    if (
      error instanceof Error
      && error.message === MEMBER_NOT_FOUND_DURING_PAYMENT_TX
    ) {
      return res.status(404).json({ error: 'Member or Plan not found' });
    }

    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

/**
 * Reverts a previously created payment and restores the member subscription state.
 *
 * @param req Express request containing payment id.
 * @param res Express response confirming the undo operation.
 * @returns Promise that resolves when the response is sent.
 */
export const undoPayment = async (req: Request, res: Response) => {
  try {
    const paymentIdParam = req.params.id;
    const paymentId = Array.isArray(paymentIdParam) ? paymentIdParam[0] : paymentIdParam;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment id is required' });
    }

    const processPaymentCommand = new ProcessPaymentCommand({ paymentId });
    await processPaymentCommand.undo();

    await notifyMemberChanged({
      memberId: paymentId,
      action: 'UPDATED',
      happenedAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: 'Payment undone successfully.',
      paymentId,
    });
  } catch (error) {
    if (
      error instanceof Error
      && (
        error.message === PAYMENT_NOT_FOUND_FOR_UNDO
        || error.message === MEMBER_NOT_FOUND_DURING_PAYMENT_TX
      )
    ) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (error instanceof Error && error.message === PAYMENT_UNDO_STATE_UNAVAILABLE) {
      return res.status(409).json({ error: 'Payment cannot be undone' });
    }

    console.error('Error undoing payment:', error);
    res.status(500).json({ error: 'Failed to undo payment' });
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
      referenceNumber: string | null;
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
        referenceNumber: payment.referenceNumber,
        membershipPlan: payment.plan.name,
        processedBy: payment.processedBy.username,
      })),
    );
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};
