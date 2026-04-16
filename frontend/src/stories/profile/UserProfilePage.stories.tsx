import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '../../types/user';
import UserProfilePage from '../../pages/UserProfilePage';
import { storyProfileUsers, storyProfileUsersNoStaff } from '../mocks/mockUserProfiles';

const meta = {
  title: 'App/Profile/User Profile Page',
  component: UserProfilePage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UserProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

function UserProfileCanvas(props: { users?: User[] }) {
  return (
    <MemoryRouter initialEntries={['/dashboard/profile']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <UserProfilePage users={props.users ?? storyProfileUsers} />
      </div>
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <UserProfileCanvas />,
};

export const NoStaffRecord: Story = {
  render: () => <UserProfileCanvas users={storyProfileUsersNoStaff} />,
};

export const AdminValidationFeedback: Story = {
  render: () => <UserProfileCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 50 });

    await slowUser.click(canvas.getByRole('button', { name: 'Save Admin Profile' }));

    await waitFor(() => {
      expect(
        canvas.getByText('Provide a new admin username or password before saving.'),
      ).toBeInTheDocument();
    });
  },
};
