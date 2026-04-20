import { PaymentMethod } from '@prisma/client';

import {
  getPaymentContext,
} from '../../../src/patterns/strategy-pattern/payment-method.strategy';

describe('strategy pattern', () => {
  it('resolves cash strategy and validates positive amounts', () => {
    const context = getPaymentContext(PaymentMethod.CASH);

    expect(context.strategy).not.toBeNull();
    expect(context.strategy?.method).toBe(PaymentMethod.CASH);
    expect(() => context.validate(500)).not.toThrow();
    expect(() => context.validate(0)).toThrow('Amount paid must be a positive number');
  });

  it('resolves gcash strategy and validates positive amounts', () => {
    const context = getPaymentContext(PaymentMethod.GCASH);

    expect(context.strategy).not.toBeNull();
    expect(context.strategy?.method).toBe(PaymentMethod.GCASH);
    expect(() => context.validate(1)).not.toThrow();
    expect(() => context.validate(0)).toThrow('Amount paid must be a positive number');
  });

  it('returns null for unsupported payment methods', () => {
    const context = getPaymentContext('CARD');

    expect(context.strategy).toBeNull();
    expect(() => context.validate(1)).toThrow('Invalid payment method');
  });
});