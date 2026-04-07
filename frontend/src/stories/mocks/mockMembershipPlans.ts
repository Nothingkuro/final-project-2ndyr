import type { MembershipPlan } from '../../types/payment';

export const mockManyMembershipPlans: MembershipPlan[] = [
  {
    id: 'plan-1day',
    name: '1 Day Pass',
    durationDays: 1,
    price: 120,
    description: 'Single-day gym access.',
  },
  {
    id: 'plan-3days',
    name: '3 Day Pass',
    durationDays: 3,
    price: 300,
    description: 'Flexible short-term pass for quick training cycles.',
  },
  {
    id: 'plan-1week',
    name: '1 Week',
    durationDays: 7,
    price: 650,
    description: 'One week unlimited access during gym hours.',
  },
  {
    id: 'plan-2weeks',
    name: '2 Weeks',
    durationDays: 14,
    price: 1100,
    description: 'Great for short lifestyle reset programs.',
  },
  {
    id: 'plan-1month',
    name: '1 Month',
    durationDays: 30,
    price: 1500,
    description: 'Standard monthly membership with basic perks.',
  },
  {
    id: 'plan-6weeks',
    name: '6 Weeks',
    durationDays: 42,
    price: 2000,
    description: 'Popular choice for challenge-based training blocks.',
  },
  {
    id: 'plan-2months',
    name: '2 Months',
    durationDays: 60,
    price: 2800,
    description: 'Good balance of commitment and savings.',
  },
  {
    id: 'plan-3months',
    name: '3 Months',
    durationDays: 90,
    price: 3900,
    description: 'Quarterly plan with improved value.',
  },
  {
    id: 'plan-4months',
    name: '4 Months',
    durationDays: 120,
    price: 5000,
    description: 'For members building long-term consistency.',
  },
  {
    id: 'plan-6months',
    name: '6 Months',
    durationDays: 180,
    price: 6900,
    description: 'Semi-annual savings plan with stable routine support.',
  },
  {
    id: 'plan-9months',
    name: '9 Months',
    durationDays: 270,
    price: 9200,
    description: 'Extended plan for sustained progress.',
  },
  {
    id: 'plan-1year',
    name: '1 Year',
    durationDays: 365,
    price: 11500,
    description: 'Annual membership with the best per-month rate.',
  },
];

export const storyPaymentPlans: MembershipPlan[] = [
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

export const storyPlansWithLongDescription: MembershipPlan[] = [
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

export const storyPlansWithMissingDescription: MembershipPlan[] = [
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
