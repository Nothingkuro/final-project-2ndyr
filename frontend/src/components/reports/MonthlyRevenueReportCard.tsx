import { Calendar } from 'lucide-react';
import type { MonthlyRevenueRecord } from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

/**
 * Defines monthly revenue report card props used by feature UI behavior.
 */
interface MonthlyRevenueReportCardProps {
  /**
   * Collection data rendered by records UI.
   */
  records: MonthlyRevenueRecord[];
  /**
   * Data used for selected month behavior.
   */
  selectedMonth: number;
  /**
   * Data used for selected year behavior.
   */
  selectedYear: number;
  /**
   * Callback fired when month change.
   */
  onMonthChange: (month: number) => void;
  /**
   * Callback fired when year change.
   */
  onYearChange: (year: number) => void;
}

const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Renders the monthly revenue report card interface for feature UI behavior.
 *
 * @param params Input used by monthly revenue report card.
 * @returns Rendered JSX output.
 */
export default function MonthlyRevenueReportCard({
  records,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: MonthlyRevenueReportCardProps) {
  const currentYear = new Date().getFullYear();
  const earliestYear = records.reduce(
    (oldestYear, record) => Math.min(oldestYear, record.year),
    currentYear,
  );
  const resolvedYearOptions = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, index) => currentYear - index,
  );

  const selectedTotal =
    records.find((record) => record.month === selectedMonth && record.year === selectedYear)?.total ?? 0;

  return (
    <ReportSectionCard
      title="Monthly Revenue Report"
      subtitle="Calendar month total"
      icon={<Calendar size={20} />}
      iconClassName="bg-info/20 text-info"
      actionSlot={
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="report-month-picker">
            Select month
          </label>
          <select
            id="report-month-picker"
            value={selectedMonth}
            onChange={(event) => onMonthChange(Number(event.target.value))}
            className="rounded-lg border border-neutral-700 bg-secondary px-3 py-2 text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-info/60"
          >
            {monthLabels.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="report-year-picker">
            Select year
          </label>
          <select
            id="report-year-picker"
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="rounded-lg border border-neutral-700 bg-secondary px-3 py-2 text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-info/60"
          >
            {resolvedYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="rounded-lg border border-info/30 bg-info/10 p-4">
        <p className="text-xs uppercase tracking-wide text-info">Total Revenue</p>
        <p className="mt-2 text-3xl font-semibold leading-tight text-text-light">
          {pesoFormatter.format(selectedTotal)}
        </p>
      </div>
    </ReportSectionCard>
  );
}
