import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MemberProfilePage from '../../pages/MemberProfilePage';
import { storyMembers } from '../mocks/mockMembers';
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

export const ActiveMemberEditProfileFlow: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/67" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: 120 });

    await user.click(canvas.getByRole('button', { name: 'Edit Profile' }));

    const firstNameInput = await canvas.findByPlaceholderText('First Name');
    const lastNameInput = canvas.getByPlaceholderText('Last Name');
    const contactNumberInput = canvas.getByPlaceholderText('Contact Number');
    const notesInput = canvas.getByPlaceholderText('Notes');

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Ariana');

    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Santos');

    await user.clear(contactNumberInput);
    await user.type(contactNumberInput, '09171234567');

    await user.clear(notesInput);
    await user.type(notesInput, 'Prefers evening sessions and text updates.');

    await user.click(canvas.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
      expect(canvas.getByRole('heading', { name: 'Ariana Santos' })).toBeInTheDocument();
      expect(canvas.getByText('09171234567')).toBeInTheDocument();
      expect(canvas.getByText('Prefers evening sessions and text updates.')).toBeInTheDocument();
    });
  },
};

export const ActiveMemberEditProfileDuplicateContactFlow: Story = {
  render: () => <ProfileCanvas route="/dashboard/members/67" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: 120 });

    await user.click(canvas.getByRole('button', { name: 'Edit Profile' }));

    const contactNumberInput = await canvas.findByPlaceholderText('Contact Number');
    await user.clear(contactNumberInput);
    await user.type(contactNumberInput, '123445456465');

    await user.click(canvas.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(canvas.getByText('Contact number already exists.')).toBeInTheDocument();
      expect(canvas.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(canvas.getByPlaceholderText('Contact Number')).toHaveValue('123445456465');
    });
  },
};
