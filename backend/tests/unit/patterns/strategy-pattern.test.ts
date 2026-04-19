import { PaymentMethod } from '@prisma/client';

import {
  createEmptyPaymentMethodBreakdown,
  resolvePaymentMethodStrategy,
} from '../../../src/patterns/strategy-pattern/payment-method.strategy';

describe('strategy pattern', () => {
  it('resolves cash strategy and updates revenue breakdown', () => {
    const strategy = resolvePaymentMethodStrategy(PaymentMethod.CASH);

    expect(strategy).not.toBeNull();
    expect(strategy?.method).toBe(PaymentMethod.CASH);

    const breakdown = strategy?.applyRevenue(500, createEmptyPaymentMethodBreakdown());

    expect(breakdown).toEqual({ cash: 500, gcash: 0 });
  });

  it('resolves gcash strategy and validates positive amounts', () => {
    const strategy = resolvePaymentMethodStrategy(PaymentMethod.GCASH);

    expect(strategy).not.toBeNull();
    expect(() => strategy!.validate(1)).not.toThrow();
    expect(() => strategy!.validate(0)).toThrow('Amount paid must be a positive number');
  });

  it('returns null for unsupported payment methods', () => {
    expect(resolvePaymentMethodStrategy('CARD')).toBeNull();
  });
});