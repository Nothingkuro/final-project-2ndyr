import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipExpiryAlertList from '../../../../components/reports/MembershipExpiryAlertList';
import {
  storyMembershipExpiryAlerts,
  storyMembershipExpiryAlertsNone,
} from '../../../mocks/mockReports';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Reports/Membership Expiry Alert List',
  component: MembershipExpiryAlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-3xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <MembershipExpiryAlertList {...args} />
    </div>
  ),
} satisfies Meta<typeof MembershipExpiryAlertList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileWithUpcomingExpiries: Story = {
  args: {
    alerts: storyMembershipExpiryAlerts,
  },
};

export const MobileNoUpcomingExpiries: Story = {
  args: {
    alerts: storyMembershipExpiryAlertsNone,
  },
};
