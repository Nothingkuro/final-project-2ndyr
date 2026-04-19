const MONTH_OPTIONS = [
  { value: 'ALL', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

/**
 * Defines payment history filters props used by feature UI behavior.
 */
interface PaymentHistoryFiltersProps {
  /**
   * Data used for selected month behavior.
   */
  selectedMonth: string;
  /**
   * Data used for selected year behavior.
   */
  selectedYear: string;
  /**
   * Data used for year options behavior.
   */
  yearOptions: string[];
  /**
   * Callback fired when month change.
   */
  onMonthChange: (month: string) => void;
  /**
   * Callback fired when year change.
   */
  onYearChange: (year: string) => void;
}

/**
 * Renders the payment history filters interface for feature UI behavior.
 *
 * @param params Input used by payment history filters.
 * @returns Rendered JSX output.
 */
export default function PaymentHistoryFilters({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
}: PaymentHistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-4 border-b border-neutral-300 pb-4">
      <label className="flex min-w-36 flex-col gap-1.5 text-sm text-secondary">
        Month
        <select
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
        >
          {MONTH_OPTIONS.map((monthOption) => (
            <option key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-36 flex-col gap-1.5 text-sm text-secondary">
        Year
        <select
          value={selectedYear}
          onChange={(event) => onYearChange(event.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
        >
          <option value="ALL">All Years</option>
          {yearOptions.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}