import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusBadge from '../../../../components/membership-plans/StatusBadge';
import { storyMembershipPlanConfigStatusLabels } from '../../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Membership Plans/Status Badge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    ...mobileViewport,
  },
  args: {
    activeLabel: storyMembershipPlanConfigStatusLabels.activeLabel,
    archivedLabel: storyMembershipPlanConfigStatusLabels.archivedLabel,
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileActive: Story = {
  args: {
    isActive: true,
  },
};

export const MobileArchived: Story = {
  args: {
    isActive: false,
  },
};
