import { PaymentMethod } from '@prisma/client';

import {
  getPaymentContext,
} from '../../../src/patterns/strategy-pattern/payment-method.strategy';

describe('strategy pattern', () => {
  it('resolves cash strategy and validates positive amounts', () => {
    const context = getPaymentContext(PaymentMethod.CASH);

    expect(context.isSupportedMethod()).toBe(true);
    expect(context.getMethod()).toBe(PaymentMethod.CASH);
    expect(() => context.validate({ amount: 500 })).not.toThrow();
    expect(() => context.validate({ amount: 0 })).toThrow('Amount paid must be a positive number');
  });

  it('fails gcash validation when reference number is missing', () => {
    const context = getPaymentContext(PaymentMethod.GCASH);

    expect(context.isSupportedMethod()).toBe(true);
    expect(context.getMethod()).toBe(PaymentMethod.GCASH);
    expect(() => context.validate({ amount: 1 })).toThrow('GCash Reference Number must be exactly 13 digits and contain only numbers.');
  });

  it('should throw error if GCash reference number contains non-numeric characters', () => {
    const context = getPaymentContext(PaymentMethod.GCASH);

    expect(context.isSupportedMethod()).toBe(true);
    expect(() => context.validate({ amount: 1, referenceNumber: '10293847AB123' })).toThrow(
      'GCash Reference Number must be exactly 13 digits and contain only numbers.',
    );
  });

  it('should throw error if GCash reference number is not exactly 13 digits', () => {
    const context = getPaymentContext(PaymentMethod.GCASH);

    expect(context.isSupportedMethod()).toBe(true);
    expect(() => context.validate({ amount: 1, referenceNumber: '102938475612' })).toThrow(
      'GCash Reference Number must be exactly 13 digits and contain only numbers.',
    );
  });

  it('passes gcash validation with a valid reference number', () => {
    const context = getPaymentContext(PaymentMethod.GCASH);

    expect(context.isSupportedMethod()).toBe(true);
    expect(context.getMethod()).toBe(PaymentMethod.GCASH);
    expect(() => context.validate({ amount: 1, referenceNumber: '1029384756123' })).not.toThrow();
    expect(() => context.validate({ amount: 0, referenceNumber: '1029384756123' })).toThrow('Amount paid must be a positive number');
  });

  it('returns null for unsupported payment methods', () => {
    const context = getPaymentContext('CARD');

    expect(context.isSupportedMethod()).toBe(false);
    expect(() => context.getMethod()).toThrow('Invalid payment method');
    expect(() => context.validate({ amount: 1 })).toThrow('Invalid payment method');
  });
});