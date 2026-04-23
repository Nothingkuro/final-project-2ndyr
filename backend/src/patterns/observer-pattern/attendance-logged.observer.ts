import analyticsService from '../../services/analytics.service';
import { IBaseObserver, Subject } from './base.observer';
import { globalNotificationSubject } from './notification.subject';

export type AttendanceLoggedEvent = {
  type: 'ATTENDANCE_LOGGED';
  attendanceId: string;
  memberId: string;
  happenedAt: string;
};

export class AttendanceAuditLogObserver implements IBaseObserver<AttendanceLoggedEvent> {
  update(event: AttendanceLoggedEvent): void {
    console.info('[attendance-logged]', JSON.stringify(event));
  }
}

export class AttendanceSseRefreshObserver implements IBaseObserver<AttendanceLoggedEvent> {
  async update(): Promise<void> {
    await globalNotificationSubject.notifyAll();
  }
}

export class RiskAnalysisObserver implements IBaseObserver<AttendanceLoggedEvent> {
  async update(): Promise<void> {
    // Recalculate transient cache so risk analytics stay fresh after each check-in.
    await analyticsService.refreshAtRiskMembersCache();
  }
}

const attendanceLoggedSubject = new Subject<AttendanceLoggedEvent>();
let isAttendanceLoggedObserversRegistered = false;

export function registerAttendanceLoggedObservers(): void {
  if (isAttendanceLoggedObserversRegistered) {
    return;
  }

  attendanceLoggedSubject.attach(new AttendanceAuditLogObserver());
  attendanceLoggedSubject.attach(new AttendanceSseRefreshObserver());
  attendanceLoggedSubject.attach(new RiskAnalysisObserver());

  isAttendanceLoggedObserversRegistered = true;
}

export async function notifyAttendanceLogged(event: AttendanceLoggedEvent): Promise<void> {
  await attendanceLoggedSubject.notify(event);
}
