import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SubmitPaymentButton from '../../../../components/payments/SubmitPaymentButton';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Payments/Submit Payment Button',
  component: SubmitPaymentButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  args: {
    onClick: fn(),
    label: 'Submit',
  },
} satisfies Meta<typeof SubmitPaymentButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileEnabled: Story = {
  args: {
    disabled: false,
  },
};

export const MobileDisabled: Story = {
  args: {
    disabled: true,
  },
};
