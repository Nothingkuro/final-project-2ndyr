import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Attendance } from '../../../types/attendance';
import DateFilters from '../../common/DateFilters';

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

function formatCheckInDate(iso: string): string {
  if (!iso) return '--';
  const dateValue = new Date(iso);
  if (Number.isNaN(dateValue.getTime())) return '--';
  return dateValue.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCheckInTimeOnly(iso: string): string {
  if (!iso) return '--';
  const dateValue = new Date(iso);
  if (Number.isNaN(dateValue.getTime())) return '--';
  return dateValue.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
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
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const memberAttendances = useMemo(() => {
    return attendances
      .filter((attendanceRecord) => attendanceRecord.memberId === memberId)
      .sort((leftRecord, rightRecord) => {
        return new Date(rightRecord.checkInTime).getTime() - new Date(leftRecord.checkInTime).getTime();
      });
  }, [attendances, memberId]);

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(
        memberAttendances.map((record) => String(new Date(record.checkInTime).getFullYear()))
      )
    ).sort((a, b) => Number(b) - Number(a));
  }, [memberAttendances]);

  const filteredAttendances = useMemo(() => {
    return memberAttendances.filter((record) => {
      const date = new Date(record.checkInTime);
      const monthMatches = selectedMonth === 'ALL' || String(date.getMonth() + 1) === selectedMonth;
      const yearMatches = selectedYear === 'ALL' || String(date.getFullYear()) === selectedYear;
      return monthMatches && yearMatches;
    });
  }, [memberAttendances, selectedMonth, selectedYear]);

  return (
    <section
      className="
        max-w-2xl w-full min-h-[400px] border border-neutral-300 bg-surface-alt
        px-8 py-6 sm:px-10 sm:py-8 flex flex-col
      "
    >
      <div className="flex items-center gap-2 border-b border-neutral-300 pb-3 mb-4">
        <CalendarClock size={18} className="text-primary" />
        <h2 className="text-lg font-semibold text-primary">Attendance History</h2>
      </div>

      <div className="mb-6">
        <DateFilters
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </div>

      {filteredAttendances.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-500">
          No attendance records yet. Use Check-In to add a new entry.
        </div>
      ) : (
        <div className="mt-6 max-h-35 overflow-x-auto overflow-y-auto rounded-md border border-neutral-300 bg-surface">
          <table className="min-w-full border-collapse text-left text-sm text-secondary">
            <thead className="bg-secondary-light text-text-light">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold tracking-wide">Check-In Date</th>
                <th scope="col" className="px-4 py-3 font-semibold tracking-wide">Check-In Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendances.map((attendanceRecord, index) => (
                <tr
                  key={attendanceRecord.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                >
                  <td className="px-4 py-3">{formatCheckInDate(attendanceRecord.checkInTime)}</td>
                  <td className="px-4 py-3 font-medium text-primary">{formatCheckInTimeOnly(attendanceRecord.checkInTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
