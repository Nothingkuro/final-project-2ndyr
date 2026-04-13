import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipExpiryAlertList from '../../components/reports/MembershipExpiryAlertList';
import {
  storyMembershipExpiryAlerts,
  storyMembershipExpiryAlertsNone,
} from '../mocks/mockReports';

const meta = {
  title: 'App/Reports/Membership Expiry Alert List',
  component: MembershipExpiryAlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="w-[95vw] max-w-3xl rounded-xl bg-surface-alt p-4 sm:p-6">
      <MembershipExpiryAlertList {...args} />
    </div>
  ),
} satisfies Meta<typeof MembershipExpiryAlertList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithUpcomingExpiries: Story = {
  args: {
    alerts: storyMembershipExpiryAlerts,
  },
};

export const NoUpcomingExpiries: Story = {
  args: {
    alerts: storyMembershipExpiryAlertsNone,
  },
};
