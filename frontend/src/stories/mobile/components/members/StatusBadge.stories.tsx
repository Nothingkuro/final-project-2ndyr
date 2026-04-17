import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusBadge from '../../../../components/members/StatusBadge';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Members/Status Badge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileActiveText: Story = {
  args: {
    status: 'ACTIVE',
    variant: 'text',
  },
};

export const MobileExpiredText: Story = {
  args: {
    status: 'EXPIRED',
    variant: 'text',
  },
};

export const MobileInactiveText: Story = {
  args: {
    status: 'INACTIVE',
    variant: 'text',
  },
};

export const MobilePillVariant: Story = {
  args: {
    status: 'ACTIVE',
    variant: 'pill',
  },
};
