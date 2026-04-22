import { registerAttendanceLoggedObservers } from './attendance-logged.observer';
import { registerMemberChangedObservers } from './member-changed.observer';
import { registerPaymentCreatedObservers } from './payment-created.observer';

let isObserverBootstrapComplete = false;

export function bootstrapObserverPattern(): void {
  if (isObserverBootstrapComplete) {
    return;
  }

  registerPaymentCreatedObservers();
  registerMemberChangedObservers();
  registerAttendanceLoggedObservers();

  isObserverBootstrapComplete = true;
}
