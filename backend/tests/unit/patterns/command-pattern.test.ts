import { MemberStatus, PaymentMethod } from '@prisma/client';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

import { CheckInCommand } from '../../../src/patterns/command/check-in.command';
import { ProcessPaymentCommand } from '../../../src/patterns/command/process-payment.command';

describe('command patterns', () => {
  const mockPrismaClient = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    member: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CheckInCommand', () => {
    it('executes check-in for active member', async () => {
      const params = { memberId: 'member-1' };
      const command = new CheckInCommand(params, mockPrismaClient);

      mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaClient);
      });

      mockPrismaClient.member.findUnique.mockResolvedValue({
        id: 'member-1',
        status: MemberStatus.ACTIVE,
      });

      mockPrismaClient.attendance.create.mockResolvedValue({
        id: 'attendance-1',
        memberId: 'member-1',
        checkInTime: new Date(),
      });

      const result = await command.execute();

      expect(result.memberId).toBe('member-1');
      expect(mockPrismaClient.attendance.create).toHaveBeenCalledWith({
        data: { memberId: 'member-1' },
        select: { id: true, memberId: true, checkInTime: true },
      });
    });

    it('throws when member is not found', async () => {
      const params = { memberId: 'missing-member' };
      const command = new CheckInCommand(params, mockPrismaClient);

      mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaClient);
      });

      mockPrismaClient.member.findUnique.mockResolvedValue(null);

      await expect(command.execute()).rejects.toThrow('MEMBER_NOT_FOUND_FOR_CHECKIN');
    });

    it('undoes check-in by deleting record', async () => {
      const params = { attendanceId: 'attendance-1' };
      const command = new CheckInCommand(params, mockPrismaClient);

      mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaClient);
      });

      mockPrismaClient.attendance.findUnique.mockResolvedValue({ id: 'attendance-1' });

      await command.undo();

      expect(mockPrismaClient.attendance.delete).toHaveBeenCalledWith({
        where: { id: 'attendance-1' },
      });
    });
  });

  describe('ProcessPaymentCommand', () => {
    it('successfully processes payment and updates member', async () => {
      const params = {
        memberId: 'member-1',
        planId: 'plan-1',
        processedById: 'user-1',
        planDurationDays: 30,
        amount: 1200,
        paymentMethod: PaymentMethod.CASH,
      };
      const command = new ProcessPaymentCommand(params, mockPrismaClient);

      mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaClient);
      });

      mockPrismaClient.$queryRaw.mockResolvedValue([{
        id: 'member-1',
        status: MemberStatus.INACTIVE,
        expiryDate: null,
      }]);

      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment-1',
        ...params,
        transactionDate: new Date(),
      });

      mockPrismaClient.member.update.mockResolvedValue({
        id: 'member-1',
        status: MemberStatus.ACTIVE,
      });

      const result = await command.execute();

      expect(result.payment.id).toBe('payment-1');
      expect(result.updatedMember.status).toBe(MemberStatus.ACTIVE);
      expect(mockPrismaClient.member.update).toHaveBeenCalled();
    });

    it('restores state during undo', async () => {
      const params = { paymentId: 'payment-1' };
      const command = new ProcessPaymentCommand(params, mockPrismaClient);

      mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaClient);
      });

      mockPrismaClient.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        memberId: 'member-1',
        previousStatus: MemberStatus.INACTIVE,
        previousExpiryDate: null,
      });

      mockPrismaClient.$queryRaw.mockResolvedValue([{ id: 'member-1' }]);

      await command.undo();

      expect(mockPrismaClient.member.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: {
          status: MemberStatus.INACTIVE,
          expiryDate: null,
        },
      });
      expect(mockPrismaClient.payment.delete).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
      });
    });
  });
});
