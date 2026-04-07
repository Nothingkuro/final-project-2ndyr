import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import MemberPaymentHistoryPanel from '../../components/members/payment-history/MemberPaymentHistoryPanel';
import { MOCK_MEMBER_PAYMENTS } from '../mocks/mockPayments';

const meta = {
  title: 'App/Members/Payment History Panel',
  component: MemberPaymentHistoryPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args: ComponentProps<typeof MemberPaymentHistoryPanel>) => (
    <div className="w-full max-w-2xl bg-surface-alt p-4 sm:p-6">
      <MemberPaymentHistoryPanel {...args} />
    </div>
  ),
} satisfies Meta<typeof MemberPaymentHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    memberId: '67',
    payments: MOCK_MEMBER_PAYMENTS,
  },
};

export const NoRecordsForMember: Story = {
  args: {
    memberId: '999',
    payments: [],
  },
};

export const FilterByMonthAndYear: Story = {
  args: {
    memberId: '67',
    payments: MOCK_MEMBER_PAYMENTS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: 120 });

    await user.selectOptions(canvas.getByLabelText('Month'), '3');
    await user.selectOptions(canvas.getByLabelText('Year'), '2026');

    expect(canvas.getByText('Payment #23511')).toBeInTheDocument();
  },
};

export const LongPaymentId: Story = {
  args: {
    memberId: '67',
    payments: MOCK_MEMBER_PAYMENTS.filter(
      (paymentRecord) => paymentRecord.id === 'PAYMENT-2026-VERY-LONG-ID-1234567890',
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('Payment #PAYMENT-20...')).toBeInTheDocument();
  },
};
