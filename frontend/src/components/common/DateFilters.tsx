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

interface DateFiltersProps {
  selectedMonth: string;
  selectedYear: string;
  yearOptions: string[];
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  allowAll?: boolean;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  hideLabels?: boolean;
  monthId?: string;
  yearId?: string;
}

export default function DateFilters({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
  allowAll = true,
  className = "flex flex-wrap items-end justify-center gap-4 border-b border-neutral-300 pb-4",
  selectClassName = "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary",
  labelClassName = "flex min-w-36 flex-col gap-1.5 text-sm text-secondary",
  hideLabels = false,
  monthId = "month-filter",
  yearId = "year-filter",
}: DateFiltersProps) {
  const filteredMonthOptions = allowAll ? MONTH_OPTIONS : MONTH_OPTIONS.filter((opt) => opt.value !== 'ALL');

  return (
    <div className={className}>
      <label className={labelClassName}>
        <span className={hideLabels ? "sr-only" : ""}>Month</span>
        <select
          id={monthId}
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className={selectClassName}
        >
          {filteredMonthOptions.map((monthOption) => (
            <option key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        <span className={hideLabels ? "sr-only" : ""}>Year</span>
        <select
          id={yearId}
          value={selectedYear}
          onChange={(event) => onYearChange(event.target.value)}
          className={selectClassName}
        >
          {allowAll && <option value="ALL">All Years</option>}
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
