import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import PaymentsPage from '../../../pages/PaymentsPage';
import { storyPaymentMembers } from '../../mocks/mockMembers';
import { storyPaymentPlans } from '../../mocks/mockMembershipPlans';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Payments Page',
  component: PaymentsPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof PaymentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaymentsCanvas(args: ComponentProps<typeof PaymentsPage>) {
  return (
    <MemoryRouter initialEntries={['/dashboard/payments']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <PaymentsPage {...args} />
      </div>
    </MemoryRouter>
  );
}

export const MobileDefault: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
    />
  ),
};

export const MobileGCashSelected: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
      initialPaymentMethod="GCASH"
    />
  ),
};

export const MobilePlanPreselected: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
      initialSelectedPlanId="plan-1month"
    />
  ),
};

export const MobileNoMembers: Story = {
  render: () => (
    <PaymentsCanvas
      members={[]}
      plans={storyPaymentPlans}
    />
  ),
};

export const MobileLoadingState: Story = {
  render: () => (
    <PaymentsCanvas
      members={[]}
      plans={[]}
      initialLoading
    />
  ),
};
