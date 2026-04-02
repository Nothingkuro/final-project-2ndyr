import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberProfilePage from '../../pages/MemberProfilePage';
import { storyMembers } from '../helpers/mockMembers';
import type { Member, MemberStatus } from '../../types/member';

const meta = {
  title: 'App/Pages/Member Profile Page',
  component: MemberProfilePage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MemberProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

function ProfileCanvas({
  route,
  members = storyMembers,
  initialStatus,
}: {
  route: string;
  members?: Member[];
  initialStatus?: MemberStatus;
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
                initialStatus={initialStatus}
                disableNavigation
              />
            }
          />
        </Routes>
      </div>
    </MemoryRouter>
  );
}

export const ActiveMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/67" />,
};

export const ExpiredMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/69" />,
};

export const InactiveMember: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/71" />,
};

export const NotFound: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/999" members={[]} />,
};

export const ActiveMemberDeactivateFlow: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/67" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 800 });

    await slowUser.click(canvas.getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => {
      expect(canvas.getByText('INACTIVE')).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
      expect(canvas.getByRole('button', { name: 'Check-In' })).toBeDisabled();
    });
  },
};
