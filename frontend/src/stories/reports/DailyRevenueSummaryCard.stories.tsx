import type { Meta, StoryObj } from '@storybook/react-vite';
import DailyRevenueSummaryCard from '../../components/reports/DailyRevenueSummaryCard';
import { storyDailyRevenue } from '../mocks/mockReports';

const meta = {
  title: 'App/Reports/Daily Revenue Summary Card',
  component: DailyRevenueSummaryCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="w-[95vw] max-w-2xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <DailyRevenueSummaryCard {...args} />
    </div>
  ),
} satisfies Meta<typeof DailyRevenueSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    revenue: storyDailyRevenue,
  },
};

export const HighRevenueDay: Story = {
  args: {
    revenue: {
      ...storyDailyRevenue,
      cash: 11320,
      gcash: 8790,
      total: 20110,
    },
  },
};
