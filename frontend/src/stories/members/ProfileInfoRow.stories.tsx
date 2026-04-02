import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfileInfoRow from '../../components/members/ProfileInfoRow';
import StatusBadge from '../../components/members/StatusBadge';

const meta = {
  title: 'App/Members/Profile Info Row',
  component: ProfileInfoRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="w-105 rounded-lg border border-neutral-300 bg-surface-alt px-6 py-4">
      <ProfileInfoRow {...args} />
    </div>
  ),
} satisfies Meta<typeof ProfileInfoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContactNumberValue: Story = {
  args: {
    label: 'Contact Number',
    value: '09171234567',
  },
};

export const DateValue: Story = {
  args: {
    label: 'Join Date',
    value: 'January 1, 2023',
  },
};

export const StatusValue: Story = {
  args: {
    label: 'Status',
    value: <StatusBadge status="ACTIVE" className="text-sm sm:text-base" />,
  },
};

export const NotesLongTextValue: Story = {
  args: {
    label: 'Notes',
    value: '',
  },
  render: () => (
    <div className="w-105 rounded-lg border border-neutral-300 bg-surface-alt px-6 py-4">
      <span className="text-primary font-semibold text-sm sm:text-base">Notes:</span>
      <div
        className="
          mt-2 w-full min-h-20 px-4 py-3
          bg-white border border-neutral-300 rounded-md
          text-sm text-secondary
        "
      >
        Member requested a custom workout schedule focused on lower back recovery, asked for periodic progress updates every two weeks, and mentioned potential schedule adjustments due to rotating shift work on weekends and late evenings.
      </div>
    </div>
  ),
};
