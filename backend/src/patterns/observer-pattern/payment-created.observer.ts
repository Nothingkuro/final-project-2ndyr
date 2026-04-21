import { Observer, Subject } from './base.observer';
import { globalNotificationSubject } from './notification.subject';

export type PaymentCreatedEvent = {
  paymentId: string;
  memberId: string;
  planId: string;
  amount: number;
  paymentMethod: string;
  processedById: string;
  happenedAt: string;
};

export class PaymentAuditLogObserver implements Observer<PaymentCreatedEvent> {
  async update(event: PaymentCreatedEvent): Promise<void> {
    console.info('[payment-created]', JSON.stringify(event));
  }
}

export class PaymentSseRefreshObserver implements Observer<PaymentCreatedEvent> {
  async update(): Promise<void> {
    await globalNotificationSubject.notifyAll();
  }
}

const paymentCreatedSubject = new Subject<PaymentCreatedEvent>();
let isPaymentCreatedObserversRegistered = false;

export function registerPaymentCreatedObservers(): void {
  if (isPaymentCreatedObserversRegistered) {
    return;
  }

  paymentCreatedSubject.attach(new PaymentAuditLogObserver());
  paymentCreatedSubject.attach(new PaymentSseRefreshObserver());
  isPaymentCreatedObserversRegistered = true;
}

export async function notifyPaymentCreated(event: PaymentCreatedEvent): Promise<void> {
  await paymentCreatedSubject.notify(event);
}
