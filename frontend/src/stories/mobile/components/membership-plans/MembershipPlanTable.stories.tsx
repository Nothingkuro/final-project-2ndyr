import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MembershipPlanTable from '../../../../components/membership-plans/MembershipPlanTable';
import {
  storyMembershipPlanConfigPlans,
  storyMembershipPlanConfigLongDescriptionPlans,
  storyMembershipPlanConfigManyPlans,
} from '../../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Membership Plans/Membership Plan Table',
  component: MembershipPlanTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...mobileViewport,
  },
  args: {
    plans: storyMembershipPlanConfigPlans,
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof MembershipPlanTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {};

export const MobileEmpty: Story = {
  args: {
    plans: [],
  },
};

export const MobileLongDescription: Story = {
  args: {
    plans: storyMembershipPlanConfigLongDescriptionPlans,
  },
};

export const MobileScrollableManyRows: Story = {
  args: {
    plans: storyMembershipPlanConfigManyPlans,
  },
};
