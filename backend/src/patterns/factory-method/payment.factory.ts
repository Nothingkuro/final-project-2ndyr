import { PaymentMethod, Prisma } from '@prisma/client';
import { IFactory } from './factory.interface';

export type PaymentFactoryInput = {
  memberId: string;
  planId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  processedById: string;
};

/**
 * Factory Method for creating Payment create payloads.
 */
export class PaymentFactory
  implements IFactory<PaymentFactoryInput, Prisma.PaymentUncheckedCreateInput>
{
  create(input: PaymentFactoryInput): Prisma.PaymentUncheckedCreateInput {
    return {
      memberId: input.memberId,
      planId: input.planId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      processedById: input.processedById,
    };
  }
}
