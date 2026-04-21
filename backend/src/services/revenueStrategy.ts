import { PaymentMethod } from '@prisma/client';

export type RevenueTotals = {
  cash: number;
  gcash: number;
};

export type RevenuePayment = {
  amount: number | string | { toString(): string };
  paymentMethod: PaymentMethod | string;
};

export interface RevenueCalculationStrategy {
  readonly method: PaymentMethod;
  calculate(amount: number, currentTotals: RevenueTotals): RevenueTotals;
}

class CashCalculationStrategy implements RevenueCalculationStrategy {
  readonly method = PaymentMethod.CASH;

  calculate(amount: number, currentTotals: RevenueTotals): RevenueTotals {
    return {
      ...currentTotals,
      cash: currentTotals.cash + amount,
    };
  }
}

class GCashCalculationStrategy implements RevenueCalculationStrategy {
  readonly method = PaymentMethod.GCASH;

  calculate(amount: number, currentTotals: RevenueTotals): RevenueTotals {
    return {
      ...currentTotals,
      gcash: currentTotals.gcash + amount,
    };
  }
}

export class RevenueContext {
  private readonly strategies: RevenueCalculationStrategy[];

  constructor(strategies: RevenueCalculationStrategy[]) {
    this.strategies = strategies;
  }

  aggregate(payments: RevenuePayment[]): RevenueTotals {
    return payments.reduce((currentTotals, payment) => {
      const amount = Number(payment.amount);

      if (!Number.isFinite(amount)) {
        return currentTotals;
      }

      const strategy = this.strategies.find((candidate) => candidate.method === payment.paymentMethod);

      if (!strategy) {
        return currentTotals;
      }

      return strategy.calculate(amount, currentTotals);
    }, this.createEmptyTotals());
  }

  private createEmptyTotals(): RevenueTotals {
    return { cash: 0, gcash: 0 };
  }
}

export const revenueContext = new RevenueContext([
  new CashCalculationStrategy(),
  new GCashCalculationStrategy(),
]);

export default revenueContext;