import { PaymentMethod } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        status: true,
        expiryDate: true,
      },
    });
    const processedBy = await prisma.user.findUnique({ where: { id: processedById } });

    if (!plan || !member) {
      return res.status(404).json({ error: 'Member or Plan not found' });
    }

    if (!processedBy) {
      return res.status(401).json({ error: 'Authenticated user not found' });
    }

    const finalAmount = parsedAmountPaid ?? Number(plan.price);

    const now = new Date();
    let newExpiryDate: Date;

    // Logic: 
    // If a member is Inactive or their membership has expired: Current Date + Plan Duration (in months/days based on definition).
    // The schema says `durationDays`.
    if (member.status === 'INACTIVE' || !member.expiryDate || member.expiryDate < now) {
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + plan.durationDays);
    } else {
      newExpiryDate = new Date(member.expiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + plan.durationDays);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          memberId,
          planId,
          amount: finalAmount,
          paymentMethod,
          processedById: processedBy.id,
        },
      });

      // Update Member
      const updatedMember = await tx.member.update({
        where: { id: memberId },
        data: {
          expiryDate: newExpiryDate,
          status: 'ACTIVE',
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
    });

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
