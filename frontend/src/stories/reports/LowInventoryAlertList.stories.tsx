import type { Meta, StoryObj } from '@storybook/react-vite';
import LowInventoryAlertList from '../../components/reports/LowInventoryAlertList';
import {
  storyInventoryAlerts,
  storyInventoryAlertsHealthy,
} from '../mocks/mockReports';

const meta = {
  title: 'App/Reports/Low Inventory Alert List',
  component: LowInventoryAlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="w-[95vw] max-w-3xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <LowInventoryAlertList {...args} />
    </div>
  ),
} satisfies Meta<typeof LowInventoryAlertList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLowStockItems: Story = {
  args: {
    alerts: storyInventoryAlerts,
  },
};

export const AllHealthyStock: Story = {
  args: {
    alerts: storyInventoryAlertsHealthy,
  },
};

export const CustomThresholdThree: Story = {
  args: {
    alerts: storyInventoryAlerts,
    threshold: 3,
  },
};
