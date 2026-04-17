import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MembershipPlanTableRow from '../../../../components/membership-plans/MembershipPlanTableRow';
import { storyMembershipPlanConfigPlans } from '../../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Membership Plans/Membership Plan Table Row',
  component: MembershipPlanTableRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="max-w-4xl overflow-hidden rounded-lg border border-neutral-300 bg-surface">
      <table className="w-full border-collapse">
        <tbody>
          <MembershipPlanTableRow {...args} />
        </tbody>
      </table>
    </div>
  ),
} satisfies Meta<typeof MembershipPlanTableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    plan: storyMembershipPlanConfigPlans[0],
    index: 0,
    onEdit: fn(),
    onDelete: fn(),
  },
};

export const MobileArchivedRow: Story = {
  args: {
    plan: storyMembershipPlanConfigPlans[2],
    index: 1,
    onEdit: fn(),
    onDelete: fn(),
  },
};
