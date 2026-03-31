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

    if (!memberId || !planId || !paymentMethod || amountPaid === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    const member = await prisma.member.findUnique({ where: { id: memberId } });

    if (!plan || !member) {
      return res.status(404).json({ error: 'Member or Plan not found' });
    }

    // In a real app, from auth token. Hardcoding a dummy User ID for now since "processedById" is required.
    let processedBy = await prisma.user.findFirst();
    if (!processedBy) {
         // Create a dummy user
         processedBy = await prisma.user.create({
            data: { username: 'admin_payment_' + Date.now(), passwordHash: 'hash', role: 'ADMIN' }
         });
    }

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
          amount: amountPaid,
          paymentMethod,
          processedById: processedBy!.id, 
        },
      });

      // Update Member
      const updatedMember = await tx.member.update({
        where: { id: memberId },
        data: {
          expiryDate: newExpiryDate,
          status: 'ACTIVE',
        },
      });

      return { payment, updatedMember };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

export const getMembers = async (req: Request, res: Response) => {
   try {
     const members = await prisma.member.findMany({
       orderBy: { firstName: 'asc' }
     });
     res.json(members);
   } catch (error) {
     res.status(500).json({ error: 'Failed to fetch members' });
   }
};
