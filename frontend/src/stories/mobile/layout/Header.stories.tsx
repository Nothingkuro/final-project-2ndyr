import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import Header from '../../../components/layout/Header';
import {
  storyMembershipExpiryAlerts,
  storyMembershipExpiryAlertsNone,
} from '../../mocks/mockReports';
import type { MembershipExpiryAlert } from '../../../types/report';

function getExpiringWithinThreeDays(alerts: MembershipExpiryAlert[]): MembershipExpiryAlert[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 3);

  return alerts.filter((member) => {
    const expiryDate = new Date(member.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate >= today && expiryDate <= maxDate;
  });
}

function formatExpiryDate(expiryDate: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(expiryDate));
}

function StoryExpiryNotificationWidget({
  alerts,
}: {
  alerts: MembershipExpiryAlert[];
}) {
  if (alerts.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-secondary">Membership Expiry Alerts</p>
        <p className="mt-2 text-sm text-neutral-500">
          No subscriptions expire within the next 3 days.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-secondary">Membership Expiry Alerts</p>
      <p className="mt-1 text-xs text-neutral-500">Expiring within 3 days</p>

      <ul className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300">
        {alerts.map((member, index) => (
          <li
            key={`${member.id}-${member.expiryDate}-${index}`}
            className="border-b border-neutral-200 py-2 last:border-b-0"
          >
            <p className="text-sm font-medium text-secondary">{member.name}</p>
            <p className="text-xs text-neutral-500">Expires: {formatExpiryDate(member.expiryDate)}</p>
            <p className="text-xs text-neutral-500">{member.contactNumber}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const expiringAlerts = getExpiringWithinThreeDays(storyMembershipExpiryAlerts);

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    onMenuToggle: fn(),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileWithNotifications: Story = {
  args: {
    showNotificationDot: true,
    notificationWidget: <StoryExpiryNotificationWidget alerts={expiringAlerts} />,
  },
};

export const MobileWithoutNotificationDot: Story = {
  args: {
    showNotificationDot: false,
  },
};

export const MobileNotificationPopoverOpen: Story = {
  args: {
    showNotificationDot: true,
    notificationWidget: <StoryExpiryNotificationWidget alerts={expiringAlerts} />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Notifications'));
  },
};

export const MobileEmptyExpiryAlerts: Story = {
  args: {
    showNotificationDot: true,
    notificationWidget: (
      <StoryExpiryNotificationWidget
        alerts={getExpiringWithinThreeDays(storyMembershipExpiryAlertsNone)}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(
        canvas.getByText('No subscriptions expire within the next 3 days.'),
      ).toBeInTheDocument();
    });
  },
};
