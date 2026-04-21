import { Observer, Subject } from './base.observer';
import { globalNotificationSubject } from './notification.subject';

export type MemberChangedAction = 'CREATED' | 'UPDATED';

export type MemberChangedEvent = {
  memberId: string;
  action: MemberChangedAction;
  happenedAt: string;
};

export class MemberSseRefreshObserver implements Observer<MemberChangedEvent> {
  async update(): Promise<void> {
    await globalNotificationSubject.notifyAll();
  }
}

const memberChangedSubject = new Subject<MemberChangedEvent>();
let isMemberChangedObserversRegistered = false;

export function registerMemberChangedObservers(): void {
  if (isMemberChangedObserversRegistered) {
    return;
  }

  memberChangedSubject.attach(new MemberSseRefreshObserver());
  isMemberChangedObserversRegistered = true;
}

export async function notifyMemberChanged(event: MemberChangedEvent): Promise<void> {
  await memberChangedSubject.notify(event);
}
