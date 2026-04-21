import { PaymentMethod, Prisma } from '@prisma/client';

export type PaymentFactoryInput = {
  memberId: string;
  planId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  processedById: string;
};

/**
 * Factory Method for creating Payment create payloads.
 */
export class PaymentFactory {
  create(input: PaymentFactoryInput): Prisma.PaymentUncheckedCreateInput {
    return {
      memberId: input.memberId,
      planId: input.planId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      processedById: input.processedById,
    };
  }
}
