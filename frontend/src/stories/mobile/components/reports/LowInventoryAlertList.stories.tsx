import type { Meta, StoryObj } from '@storybook/react-vite';
import LowInventoryAlertList from '../../../../components/reports/LowInventoryAlertList';
import {
  storyInventoryAlerts,
  storyInventoryAlertsHealthy,
} from '../../../mocks/mockReports';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Reports/Low Inventory Alert List',
  component: LowInventoryAlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-3xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <LowInventoryAlertList {...args} />
    </div>
  ),
} satisfies Meta<typeof LowInventoryAlertList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileWithLowStockItems: Story = {
  args: {
    alerts: storyInventoryAlerts,
  },
};

export const MobileAllHealthyStock: Story = {
  args: {
    alerts: storyInventoryAlertsHealthy,
  },
};
