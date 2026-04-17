import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import MembershipPlansPage from '../../../pages/MembershipPlansPage';
import { storyMembershipPlanConfigPlans } from '../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Membership Plans Page',
  component: MembershipPlansPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof MembershipPlansPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function MembershipPlansPageCanvas() {
  return (
    <MemoryRouter initialEntries={['/dashboard/membership-plans']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <MembershipPlansPage plans={storyMembershipPlanConfigPlans} />
      </div>
    </MemoryRouter>
  );
}

export const MobileDefault: Story = {
  render: () => <MembershipPlansPageCanvas />,
};
