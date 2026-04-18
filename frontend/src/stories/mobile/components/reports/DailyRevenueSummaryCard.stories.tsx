import type { Meta, StoryObj } from '@storybook/react-vite';
import DailyRevenueSummaryCard from '../../../../components/reports/DailyRevenueSummaryCard';
import { storyDailyRevenue } from '../../../mocks/mockReports';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Reports/Daily Revenue Summary Card',
  component: DailyRevenueSummaryCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-2xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <DailyRevenueSummaryCard {...args} />
    </div>
  ),
} satisfies Meta<typeof DailyRevenueSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    revenue: storyDailyRevenue,
  },
};

export const MobileHighRevenueDay: Story = {
  args: {
    revenue: {
      ...storyDailyRevenue,
      cash: 11320,
      gcash: 8790,
      total: 20110,
    },
  },
};
