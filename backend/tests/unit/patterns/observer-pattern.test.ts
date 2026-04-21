import { Subject } from '../../../src/patterns/observer-pattern/base.observer';
import { globalNotificationSubject } from '../../../src/patterns/observer-pattern/notification.subject';
import { bootstrapObserverPattern } from '../../../src/patterns/observer-pattern/observer.bootstrap';
import {
  notifyPaymentCreated,
  type PaymentCreatedEvent,
} from '../../../src/patterns/observer-pattern/payment-created.observer';

const PAYMENT_CREATED_EVENT: PaymentCreatedEvent = {
  paymentId: 'payment-1',
  memberId: 'member-1',
  planId: 'plan-1',
  amount: 1200,
  paymentMethod: 'CASH',
  processedById: 'user-1',
  happenedAt: '2026-04-19T10:00:00.000Z',
};

describe('observer pattern', () => {
  beforeEach(() => {
    bootstrapObserverPattern();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(globalNotificationSubject, 'notifyAll').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('notifies registered observers when a payment is created', async () => {
    await notifyPaymentCreated(PAYMENT_CREATED_EVENT);

    expect(console.info).toHaveBeenCalledWith(
      '[payment-created]',
      JSON.stringify(PAYMENT_CREATED_EVENT),
    );
    expect(globalNotificationSubject.notifyAll).toHaveBeenCalledTimes(1);
  });

  it('does not notify detached observers', async () => {
    const subject = new Subject<PaymentCreatedEvent>();
    const observer = {
      update: jest.fn(),
    };

    subject.attach(observer);
    subject.detach(observer);

    await subject.notify(PAYMENT_CREATED_EVENT);

    expect(observer.update).not.toHaveBeenCalled();
  });

  it('starts observer updates concurrently and isolates failures', async () => {
    const subject = new Subject<{ id: string }>();
    let resolveSlowObserver: any = null;

    const slowObserver = {
      update: jest.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSlowObserver = resolve;
          }),
      ),
    };
    const fastObserver = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    const failingObserver = {
      update: jest.fn().mockRejectedValue(new Error('observer failed')),
    };

    subject.attach(slowObserver);
    subject.attach(fastObserver);
    subject.attach(failingObserver);

    const notifyPromise = subject.notify({ id: 'event-1' });

    expect(slowObserver.update).toHaveBeenCalledTimes(1);
    expect(fastObserver.update).toHaveBeenCalledTimes(1);
    expect(failingObserver.update).toHaveBeenCalledTimes(1);

    resolveSlowObserver?.();
    await notifyPromise;

    expect(console.error).toHaveBeenCalledWith('Observer execution failed:', expect.any(Error));
  });
});