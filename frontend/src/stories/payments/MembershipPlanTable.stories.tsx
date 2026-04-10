import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipPlanTable from '../../components/payments/MembershipPlanTable';
import {
  storyPaymentPlans,
  storyPlansWithLongDescription,
  storyPlansWithMissingDescription,
  mockManyMembershipPlans,
} from '../mocks/mockMembershipPlans';

const meta = {
  title: 'App/Payments/Membership Plan Table',
  component: MembershipPlanTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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

export const HappyWithPlans: Story = {
  args: {
    plans: storyPaymentPlans,
    selectedPlanId: 'plan-1month',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const SadEmptyPlans: Story = {
  args: {
    plans: [],
    selectedPlanId: '',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const EdgeLongDescription: Story = {
  args: {
    plans: storyPlansWithLongDescription,
    selectedPlanId: 'plan-premium-annual',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const EdgeMissingDescription: Story = {
  args: {
    plans: storyPlansWithMissingDescription,
    selectedPlanId: 'plan-nodec',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const OverflowManyPlans: Story = {
  args: {
    plans: mockManyMembershipPlans,
    selectedPlanId: 'plan-3months',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};
