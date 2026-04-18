import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfileInfoRow from '../../../../components/members/ProfileInfoRow';
import StatusBadge from '../../../../components/members/StatusBadge';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Members/Profile Info Row',
  component: ProfileInfoRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-80 rounded-lg border border-neutral-300 bg-surface-alt px-6 py-4">
      <ProfileInfoRow {...args} />
    </div>
  ),
} satisfies Meta<typeof ProfileInfoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileContactNumber: Story = {
  args: {
    label: 'Contact Number',
    value: '09171234567',
  },
};

export const MobileDateValue: Story = {
  args: {
    label: 'Join Date',
    value: 'January 1, 2023',
  },
};

export const MobileStatusValue: Story = {
  args: {
    label: 'Status',
    value: <StatusBadge status="ACTIVE" className="text-sm sm:text-base" />,
  },
};
