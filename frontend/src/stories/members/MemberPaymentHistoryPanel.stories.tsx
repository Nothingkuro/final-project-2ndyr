import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import MemberPaymentHistoryPanel from '../../components/members/payment-history/MemberPaymentHistoryPanel';
import type { MemberPaymentHistoryRecord } from '../../types/payment';

const STORY_PAYMENTS: MemberPaymentHistoryRecord[] = [
  {
    id: '50011',
    memberId: '67',
    paidAt: '2026-03-01T08:00:00.000Z',
    amountPhp: 1500,
    membershipPlan: 'Three Months',
    processedBy: 'Staff A',
  },
  {
    id: '50032',
    memberId: '67',
    paidAt: '2026-02-01T08:00:00.000Z',
    amountPhp: 600,
    membershipPlan: 'One Month',
    processedBy: 'Staff B',
  },
  {
    id: '50077',
    memberId: '999',
    paidAt: '2026-01-01T08:00:00.000Z',
    amountPhp: 300,
    membershipPlan: 'Walk-In',
    processedBy: 'Staff C',
  },
];

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
    payments: STORY_PAYMENTS,
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
    payments: STORY_PAYMENTS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: 120 });

    await user.selectOptions(canvas.getByLabelText('Month'), '3');
    await user.selectOptions(canvas.getByLabelText('Year'), '2026');

    expect(canvas.getByText('Payment #50011')).toBeInTheDocument();
  },
};

export const LongPaymentId: Story = {
  args: {
    memberId: '67',
    payments: [
      {
        id: 'PAYMENT-2026-VERY-LONG-ID-1234567890',
        memberId: '67',
        paidAt: '2026-04-01T08:00:00.000Z',
        amountPhp: 600,
        membershipPlan: 'One Month',
        processedBy: 'Staff D',
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('Payment #PAYMENT-20...')).toBeInTheDocument();
  },
};
