import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipPlanTable from '../../components/payments/MembershipPlanTable';
import { mockManyMembershipPlans } from '../helpers/mockMembershipPlans';
import type { MembershipPlan } from '../../types/payment';

const storyPlans: MembershipPlan[] = [
  {
    id: 'plan-walkin',
    name: 'Walk-In',
    durationDays: 1,
    price: 100,
    description: 'Single-day gym access with basic equipment use.',
  },
  {
    id: 'plan-1month',
    name: 'One Month',
    durationDays: 30,
    price: 1000,
    description: 'Includes free fitness assessment and locker access.',
  },
  {
    id: 'plan-3months',
    name: 'Three Months',
    durationDays: 90,
    price: 2700,
    description: 'Best value for regular members with priority class booking.',
  },
];

const plansWithLongDescription: MembershipPlan[] = [
  {
    id: 'plan-premium-annual',
    name: 'Premium Annual',
    durationDays: 365,
    price: 10000,
    description:
      'Full-year premium access including unlimited group classes, personalized onboarding, quarterly program updates, towel and locker privileges, guest day passes every month, and access to selected holiday schedules with extended hours for members who train during peak and off-peak periods.',
  },
  {
    id: 'plan-basic-monthly',
    name: 'Basic Monthly',
    durationDays: 30,
    price: 900,
    description: 'Budget-friendly access to gym floor equipment during regular hours.',
  },
];

const plansWithMissingDescription: MembershipPlan[] = [
  {
    id: 'plan-nodec',
    name: 'Starter Plan',
    durationDays: 14,
    price: 500,
    description: '',
  },
  {
    id: 'plan-w-desc',
    name: 'Standard Plan',
    durationDays: 30,
    price: 1200,
    description: 'Great for first-time monthly members.',
  },
];

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
    plans: storyPlans,
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
    plans: plansWithLongDescription,
    selectedPlanId: 'plan-premium-annual',
    onSelectPlan: () => {},
  },
  render: (args) => <MembershipPlanTablePlayground {...args} />,
};

export const EdgeMissingDescription: Story = {
  args: {
    plans: plansWithMissingDescription,
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
