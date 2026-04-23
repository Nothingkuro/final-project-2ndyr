import { MemberStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { notifyAttendanceLogged } from '../observer-pattern/attendance-logged.observer';
import type { ICommand } from './command.interface';

export const MEMBER_NOT_FOUND_FOR_CHECKIN = 'MEMBER_NOT_FOUND_FOR_CHECKIN';
export const MEMBER_NOT_ACTIVE_FOR_CHECKIN = 'MEMBER_NOT_ACTIVE_FOR_CHECKIN';
export const ATTENDANCE_NOT_FOUND_FOR_UNDO = 'ATTENDANCE_NOT_FOUND_FOR_UNDO';

type CheckInCommandParams = {
  memberId?: string;
  attendanceId?: string;
};

export type CheckInExecuteResult = {
  id: string;
  memberId: string;
  checkInTime: Date;
};

export class CheckInCommand implements ICommand {
  constructor(
    private readonly params: CheckInCommandParams,
    private readonly prismaClient = prisma,
  ) {}

  async execute(): Promise<CheckInExecuteResult> {
    const { memberId } = this.params;

    if (!memberId) {
      throw new Error('INVALID_CHECKIN_COMMAND_INPUT');
    }

    const createdAttendance = await this.prismaClient.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!member) {
        throw new Error(MEMBER_NOT_FOUND_FOR_CHECKIN);
      }

      if (member.status !== MemberStatus.ACTIVE) {
        throw new Error(MEMBER_NOT_ACTIVE_FOR_CHECKIN);
      }

      return tx.attendance.create({
        data: {
          memberId,
        },
        select: {
          id: true,
          memberId: true,
          checkInTime: true,
        },
      });
    });

    await notifyAttendanceLogged({
      type: 'ATTENDANCE_LOGGED',
      attendanceId: createdAttendance.id,
      memberId: createdAttendance.memberId,
      happenedAt: createdAttendance.checkInTime.toISOString(),
    });

    return createdAttendance;
  }

  async undo(): Promise<void> {
    const { attendanceId } = this.params;

    if (!attendanceId) {
      throw new Error('INVALID_UNDO_CHECKIN_COMMAND_INPUT');
    }

    await this.prismaClient.$transaction(async (tx) => {
      const attendance = await tx.attendance.findUnique({
        where: { id: attendanceId },
        select: { id: true },
      });

      if (!attendance) {
        throw new Error(ATTENDANCE_NOT_FOUND_FOR_UNDO);
      }

      await tx.attendance.delete({
        where: { id: attendanceId },
      });
    });
  }
}
