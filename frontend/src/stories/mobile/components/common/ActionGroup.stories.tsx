import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ActionGroup from '../../../../components/common/ActionGroup';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Common/Action Group',
  component: ActionGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
} satisfies Meta<typeof ActionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileAllEnabled: Story = {
  args: {
    actions: [
      { label: 'Edit Profile', onClick: fn(), variant: 'secondary' },
      { label: 'Check-In', onClick: fn(), variant: 'neutral' },
      { label: 'Deactivate', onClick: fn(), variant: 'danger' },
    ],
  },
};

export const MobileWithDisabledActions: Story = {
  args: {
    actions: [
      { label: 'Edit Profile', onClick: fn(), variant: 'secondary' },
      { label: 'Check-In', onClick: fn(), variant: 'neutral', disabled: true },
      { label: 'Deactivate', onClick: fn(), variant: 'danger', disabled: true },
    ],
  },
};
