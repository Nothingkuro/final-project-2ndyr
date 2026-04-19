import { notifyPaymentCreated } from '../../../src/patterns/observer-pattern/payment-created.observer';

describe('observer pattern', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('notifies registered observers when a payment is created', async () => {
    await notifyPaymentCreated({
      paymentId: 'payment-1',
      memberId: 'member-1',
      planId: 'plan-1',
      amount: 1200,
      paymentMethod: 'CASH',
      processedById: 'user-1',
      happenedAt: '2026-04-19T10:00:00.000Z',
    });

    expect(console.info).toHaveBeenCalledWith(
      '[payment-created]',
      JSON.stringify({
        paymentId: 'payment-1',
        memberId: 'member-1',
        planId: 'plan-1',
        amount: 1200,
        paymentMethod: 'CASH',
        processedById: 'user-1',
        happenedAt: '2026-04-19T10:00:00.000Z',
      }),
    );
  });
});