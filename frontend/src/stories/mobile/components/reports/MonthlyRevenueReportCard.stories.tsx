import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MonthlyRevenueReportCard from '../../../../components/reports/MonthlyRevenueReportCard';
import { storyMonthlyRevenue } from '../../../mocks/mockReports';

const latestRecord = storyMonthlyRevenue.reduce((latest, record) => {
  if (record.year > latest.year) {
    return record;
  }

  if (record.year === latest.year && record.month > latest.month) {
    return record;
  }

  return latest;
});

function MonthlyRevenuePlayground(args: ComponentProps<typeof MonthlyRevenueReportCard>) {
  const [selectedMonth, setSelectedMonth] = useState(args.selectedMonth);
  const [selectedYear, setSelectedYear] = useState(args.selectedYear);

  return (
    <MonthlyRevenueReportCard
      {...args}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      onMonthChange={setSelectedMonth}
      onYearChange={setSelectedYear}
    />
  );
}

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Reports/Monthly Revenue Report Card',
  component: MonthlyRevenueReportCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-2xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <MonthlyRevenuePlayground {...args} />
    </div>
  ),
} satisfies Meta<typeof MonthlyRevenueReportCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    records: storyMonthlyRevenue,
    selectedMonth: latestRecord.month,
    selectedYear: latestRecord.year,
    onMonthChange: () => {},
    onYearChange: () => {},
  },
};

export const MobilePreviousYearSnapshot: Story = {
  args: {
    records: storyMonthlyRevenue,
    selectedMonth: 11,
    selectedYear: latestRecord.year - 1,
    onMonthChange: () => {},
    onYearChange: () => {},
  },
};
