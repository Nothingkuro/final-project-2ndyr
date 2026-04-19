import { PaymentMethod } from '@prisma/client';

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