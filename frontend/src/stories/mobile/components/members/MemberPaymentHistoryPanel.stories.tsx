import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import MemberPaymentHistoryPanel from '../../../../components/members/payment-history/MemberPaymentHistoryPanel';
import { MOCK_MEMBER_PAYMENTS } from '../../../mocks/mockPayments';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Members/Payment History Panel',
  component: MemberPaymentHistoryPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args: ComponentProps<typeof MemberPaymentHistoryPanel>) => (
    <div className="w-full max-w-2xl bg-surface-alt p-4 sm:p-6">
      <MemberPaymentHistoryPanel {...args} />
    </div>
  ),
} satisfies Meta<typeof MemberPaymentHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    memberId: '67',
    payments: MOCK_MEMBER_PAYMENTS,
  },
};

export const MobileNoRecords: Story = {
  args: {
    memberId: '999',
    payments: [],
  },
};
