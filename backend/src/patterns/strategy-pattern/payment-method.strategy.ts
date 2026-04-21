import { PaymentMethod } from '@prisma/client';

export interface PaymentProcessingStrategy {
  readonly method: PaymentMethod;
  validate(amount: number): void;
}

class CashPaymentStrategy implements PaymentProcessingStrategy {
  readonly method = PaymentMethod.CASH;

  validate(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount paid must be a positive number');
    }
  }
}

class GCashPaymentStrategy implements PaymentProcessingStrategy {
  readonly method = PaymentMethod.GCASH;

  validate(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount paid must be a positive number');
    }
  }
}

const strategies: PaymentProcessingStrategy[] = [new CashPaymentStrategy(), new GCashPaymentStrategy()];

export class PaymentProcessingContext {
  private readonly strategy: PaymentProcessingStrategy | null;

  constructor(strategy: PaymentProcessingStrategy | null) {
    this.strategy = strategy;
  }

  isSupportedMethod(): boolean {
    return this.strategy !== null;
  }

  getMethod(): PaymentMethod {
    if (!this.strategy) {
      throw new Error('Invalid payment method');
    }

    return this.strategy.method;
  }

  validate(amount: number): void {
    if (!this.strategy) {
      throw new Error('Invalid payment method');
    }

    this.strategy.validate(amount);
  }
}

/**
 * Returns a payment processing context for the provided payment method.
 */
export function getPaymentContext(
  paymentMethod: unknown,
): PaymentProcessingContext {
  if (typeof paymentMethod !== 'string') {
    return new PaymentProcessingContext(null);
  }

  return new PaymentProcessingContext(
    strategies.find((strategy) => strategy.method === paymentMethod) ?? null,
  );
}

export { CashPaymentStrategy, GCashPaymentStrategy };
