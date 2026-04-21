import { MemberStatus, PaymentMethod, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import { PaymentFactory } from '../factory-method/payment.factory';
import type { ICommand } from './command.interface';

export const MEMBER_NOT_FOUND_DURING_PAYMENT_TX = 'MEMBER_NOT_FOUND_DURING_PAYMENT_TX';
export const PAYMENT_NOT_FOUND_FOR_UNDO = 'PAYMENT_NOT_FOUND_FOR_UNDO';
export const PAYMENT_UNDO_STATE_UNAVAILABLE = 'PAYMENT_UNDO_STATE_UNAVAILABLE';

const MAX_PAYMENT_TX_ATTEMPTS = 3;
const paymentFactory = new PaymentFactory();

type ProcessPaymentCommandParams = {
  memberId?: string;
  planId?: string;
  processedById?: string;
  planDurationDays?: number;
  amount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  paymentId?: string;
};

export type ProcessPaymentExecuteResult = {
  payment: {
    id: string;
    memberId: string;
    planId: string;
    amount: Prisma.Decimal;
    paymentMethod: PaymentMethod;
    referenceNumber: string | null;
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
};

/**
 * Detects Prisma transaction conflicts that are safe to retry.
 */
function isRetryableTransactionError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  return (error as { code?: string }).code === 'P2034';
}

function toMemberStatus(status: string): MemberStatus {
  if (status === MemberStatus.ACTIVE || status === MemberStatus.INACTIVE || status === MemberStatus.EXPIRED) {
    return status;
  }

  return MemberStatus.INACTIVE;
}

export class ProcessPaymentCommand implements ICommand {
  constructor(
    private readonly params: ProcessPaymentCommandParams,
    private readonly prismaClient = prisma,
  ) {}

  async execute(): Promise<ProcessPaymentExecuteResult> {
    const {
      memberId,
      planId,
      processedById,
      planDurationDays,
      amount,
      paymentMethod,
      referenceNumber,
    } = this.params;

    if (!memberId || !planId || !processedById || !planDurationDays || !paymentMethod || amount === undefined) {
      throw new Error('INVALID_PROCESS_PAYMENT_COMMAND_INPUT');
    }

    for (let attempt = 1; attempt <= MAX_PAYMENT_TX_ATTEMPTS; attempt += 1) {
      try {
        const result = await this.prismaClient.$transaction(
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
              lockedMember.status === MemberStatus.INACTIVE
              || !lockedMember.expiryDate
              || lockedMember.expiryDate < now
            ) {
              newExpiryDate = new Date(now);
              newExpiryDate.setDate(newExpiryDate.getDate() + planDurationDays);
            } else {
              newExpiryDate = new Date(lockedMember.expiryDate);
              newExpiryDate.setDate(newExpiryDate.getDate() + planDurationDays);
            }

            const paymentCreatePayload = paymentFactory.create({
              memberId,
              planId,
              amount,
              paymentMethod,
              referenceNumber,
              processedById,
            });

            const payment = await tx.payment.create({
              data: {
                ...paymentCreatePayload,
                previousStatus: lockedMember.status,
                previousExpiryDate: lockedMember.expiryDate,
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

        return result;
      } catch (error) {
        if (isRetryableTransactionError(error) && attempt < MAX_PAYMENT_TX_ATTEMPTS) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('FAILED_TO_PROCESS_PAYMENT_TRANSACTION');
  }

  async undo(): Promise<void> {
    const { paymentId } = this.params;

    if (!paymentId) {
      throw new Error('INVALID_UNDO_PAYMENT_COMMAND_INPUT');
    }

    await this.prismaClient.$transaction(
      async (tx) => {
        const paymentToUndo = await tx.payment.findUnique({
          where: { id: paymentId },
          select: {
            id: true,
            memberId: true,
            previousStatus: true,
            previousExpiryDate: true,
          },
        });

        if (!paymentToUndo) {
          throw new Error(PAYMENT_NOT_FOUND_FOR_UNDO);
        }

        if (!paymentToUndo.previousStatus) {
          throw new Error(PAYMENT_UNDO_STATE_UNAVAILABLE);
        }

        const lockedMembers = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "members" WHERE id = ${paymentToUndo.memberId} FOR UPDATE
        `;

        if (!lockedMembers[0]) {
          throw new Error(MEMBER_NOT_FOUND_DURING_PAYMENT_TX);
        }

        await tx.member.update({
          where: { id: paymentToUndo.memberId },
          data: {
            status: toMemberStatus(paymentToUndo.previousStatus),
            expiryDate: paymentToUndo.previousExpiryDate,
          },
        });

        await tx.payment.delete({
          where: { id: paymentId },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
