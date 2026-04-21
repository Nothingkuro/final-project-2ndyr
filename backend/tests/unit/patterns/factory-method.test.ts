import { PaymentMethod } from '@prisma/client';
import { ExpiryAlertFactory, InventoryAlertFactory } from '../../../src/patterns/factory-method/report.factory';
import { MemberFactory } from '../../../src/patterns/factory-method/member.factory';
import { PaymentFactory } from '../../../src/patterns/factory-method/payment.factory';

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
  const expiryFactory = new ExpiryAlertFactory();
  const inventoryFactory = new InventoryAlertFactory();

  it('should correctly format a Member into an ExpiryAlertDTO', () => {
    const mockMember = {
      id: 'm-1',
      firstName: 'John',
      lastName: 'Doe',
      contactNumber: '09123',
      expiryDate: new Date('2026-01-01'),
    } as any;
    
    const result = expiryFactory.create(mockMember);
    expect(result.name).toBe('John Doe');
    expect(result.expiryDate).toBe(mockMember.expiryDate.toISOString());
  });

  it('should return empty string for expiryDate when member expiry is null', () => {
    const mockMember = {
      id: 'm-2',
      firstName: 'Jane',
      lastName: 'Smith',
      contactNumber: '09876',
      expiryDate: null,
    } as any;
    
    const result = expiryFactory.create(mockMember);
    expect(result.expiryDate).toBe('');
  });

  it('should correctly format Equipment into an InventoryAlertDTO', () => {
    const mockEq = { id: 'e-1', itemName: 'Dumbbell', quantity: 2 } as any;
    const result = inventoryFactory.create({ equipment: mockEq, threshold: 5 });
    
    expect(result.itemName).toBe('Dumbbell');
    expect(result.category).toBe('Equipment');
    expect(result.threshold).toBe(5);
  });
});
