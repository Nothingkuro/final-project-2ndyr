import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberProfilePage from '../../../pages/MemberProfilePage';
import { storyMembers } from '../../mocks/mockMembers';
import type { Member } from '../../../types/member';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Member Profile Page',
  component: MemberProfilePage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof MemberProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

function ProfileCanvas({
  route,
  members = storyMembers,
}: {
  route: string;
  members?: Member[];
}) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route
            path="/dashboard/members/:memberId"
            element={
              <MemberProfilePage
                members={members}
                disableNavigation
              />
            }
          />
        </Routes>
      </div>
    </MemoryRouter>
  );
}

export const MobileActiveMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/67" />,
};

export const MobileExpiredMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/69" />,
};

export const MobileInactiveMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/71" />,
};

export const MobileNotFound: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/999" members={[]} />,
};
