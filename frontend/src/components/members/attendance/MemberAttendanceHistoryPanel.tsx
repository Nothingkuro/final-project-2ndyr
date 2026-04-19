import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Attendance } from '../../../types/attendance';

/**
 * Defines member attendance history panel props used by feature UI behavior.
 */
interface MemberAttendanceHistoryPanelProps {
  /**
   * Identifier used for member lookups.
   */
  memberId: string;
  /**
   * Data used for attendances behavior.
   */
  attendances?: Attendance[];
}

/**
 * Handles format check in time logic for feature UI behavior.
 *
 * @param iso Input used by format check in time.
 * @returns Computed value for the caller.
 */
function formatCheckInTime(iso: string): string {
  if (!iso) {
    return '--';
  }

  const dateValue = new Date(iso);

  if (Number.isNaN(dateValue.getTime())) {
    return '--';
  }

  return dateValue.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Handles format attendance id logic for feature UI behavior.
 *
 * @param attendanceId Input used by format attendance id.
 * @returns Computed value for the caller.
 */
function formatAttendanceId(attendanceId: string): string {
  return attendanceId.length > 16 ? `${attendanceId.slice(0, 16)}...` : attendanceId;
}

/**
 * Renders the member attendance history panel interface for feature UI behavior.
 *
 * @param params Input used by member attendance history panel.
 * @returns Rendered JSX output.
 */
export default function MemberAttendanceHistoryPanel({
  memberId,
  attendances = [],
}: MemberAttendanceHistoryPanelProps) {
  const memberAttendances = useMemo(() => {
    return attendances
      .filter((attendanceRecord) => attendanceRecord.memberId === memberId)
      .sort((leftRecord, rightRecord) => {
        return new Date(rightRecord.checkInTime).getTime() - new Date(leftRecord.checkInTime).getTime();
      });
  }, [attendances, memberId]);

  return (
    <section
      className="
        w-130 max-w-full border border-neutral-300 bg-surface-alt
        px-5 py-5 sm:px-8 sm:py-7
      "
    >
      <div className="flex items-center gap-2 border-b border-neutral-300 pb-3">
        <CalendarClock size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-primary">Attendance History</h2>
      </div>

      {memberAttendances.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-500">
          No attendance records yet. Use Check-In to add a new entry.
        </div>
      ) : (
        <div className="mt-6 max-h-80 overflow-x-auto overflow-y-auto rounded-md border border-neutral-300 bg-surface">
          <table className="min-w-full border-collapse text-left text-sm text-secondary">
            <thead className="bg-secondary-light text-text-light">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold tracking-wide">Check-In Time</th>
                <th scope="col" className="px-4 py-3 font-semibold tracking-wide">Attendance ID</th>
              </tr>
            </thead>
            <tbody>
              {memberAttendances.map((attendanceRecord, index) => (
                <tr
                  key={attendanceRecord.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                >
                  <td className="px-4 py-3">{formatCheckInTime(attendanceRecord.checkInTime)}</td>
                  <td className="px-4 py-3 font-medium text-primary">#{formatAttendanceId(attendanceRecord.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
