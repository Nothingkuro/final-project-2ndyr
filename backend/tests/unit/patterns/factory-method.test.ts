import { PaymentMethod } from '@prisma/client';
import {
  ExpiryAlertDTO,
  InventoryAlertDTO,
  InventoryAlertInput,
} from '../../../src/patterns/factory-method/report.factory';
import { MemberFactory } from '../../../src/patterns/factory-method/member.factory';
import { PaymentFactory } from '../../../src/patterns/factory-method/payment.factory';
import { ReportCreator } from '../../../src/patterns/factory-method/report-creator';
import { ReportType } from '../../../src/patterns/factory-method/report.types';

describe('factory method patterns', () => {
  it('creates member payloads from normalized full names', () => {
    const factory = new MemberFactory();

    expect(
      factory.create({
        fullName: 'John Michael Doe',
        contactNumber: '09171234567',
        notes: 'Evening schedule',
      }),
    ).toEqual({
      firstName: 'John',
      lastName: 'Michael Doe',
      contactNumber: '09171234567',
      notes: 'Evening schedule',
      status: 'ACTIVE',
    });
  });

  it('creates payment payloads with the expected prisma shape', () => {
    const factory = new PaymentFactory();

    expect(
      factory.create({
        memberId: 'member-1',
        planId: 'plan-1',
        amount: 1200,
        paymentMethod: PaymentMethod.CASH,
        processedById: 'user-1',
      }),
    ).toEqual({
      memberId: 'member-1',
      planId: 'plan-1',
      amount: 1200,
      paymentMethod: PaymentMethod.CASH,
      processedById: 'user-1',
    });
  });
});

describe('Report Factories Unit Tests', () => {
  it('should correctly format a Member into an ExpiryAlertDTO', () => {
    const mockMember = {
      id: 'm-1',
      firstName: 'John',
      lastName: 'Doe',
      contactNumber: '09123',
      expiryDate: new Date('2026-01-01'),
    } as any;

    const result = ReportCreator.createReport<typeof mockMember, ExpiryAlertDTO>(
      ReportType.EXPIRY_ALERT,
      mockMember,
    );

    expect(result.name).toBe('John Doe');
    expect(result.expiryDate).toBe(mockMember.expiryDate.toISOString());
  });

  it('should correctly format Equipment into an InventoryAlertDTO', () => {
    const mockEq = { id: 'e-1', itemName: 'Dumbbell', quantity: 2 } as any;
    const input: InventoryAlertInput = { equipment: mockEq, threshold: 5 };

    const result = ReportCreator.createReport<InventoryAlertInput, InventoryAlertDTO>(
      ReportType.INVENTORY_ALERT,
      input,
    );

    expect(result.itemName).toBe('Dumbbell');
    expect(result.category).toBe('Equipment');
    expect(result.threshold).toBe(5);
  });

  it('should throw a clear error for an unregistered report type', () => {
    const unknownType = 'UNKNOWN_REPORT' as ReportType;

    expect(() =>
      ReportCreator.createReport<Record<string, never>, unknown>(unknownType, {}),
    ).toThrow('No report factory registered for type: UNKNOWN_REPORT');
  });
});
