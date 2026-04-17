import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipPlanTable from '../../../../components/payments/MembershipPlanTable';
import {
  storyPaymentPlans,
  storyPlansWithLongDescription,
  mockManyMembershipPlans,
} from '../../../mocks/mockMembershipPlans';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Payments/Membership Plan Table',
  component: MembershipPlanTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...mobileViewport,
  },
} satisfies Meta<typeof MembershipPlanTable>;

export default meta;
type Story = StoryObj<typeof meta>;

function MembershipPlanTablePlayground(args: ComponentProps<typeof MembershipPlanTable>) {
  const [selectedPlanId, setSelectedPlanId] = useState(args.selectedPlanId);

  return (
    <div className="max-w-2xl">
      <MembershipPlanTable {...args} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />
    </div>
  );
}

export const MobileWithPlans: Story = {
  args: {
    plans: storyPaymentPlans,
    selectedPlanId: 'plan-1month',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const MobileEmptyPlans: Story = {
  args: {
    plans: [],
    selectedPlanId: '',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const MobileLongDescription: Story = {
  args: {
    plans: storyPlansWithLongDescription,
    selectedPlanId: 'plan-premium-annual',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const MobileManyPlans: Story = {
  args: {
    plans: mockManyMembershipPlans,
    selectedPlanId: 'plan-3months',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};
