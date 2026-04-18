import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import UserProfilePage from '../../../pages/UserProfilePage';
import { storyProfileUsers, storyProfileUsersNoStaff } from '../../mocks/mockUserProfiles';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/User Profile Page',
  component: UserProfilePage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof UserProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

function UserProfileCanvas(props: { users?: typeof storyProfileUsers }) {
  return (
    <MemoryRouter initialEntries={['/dashboard/profile']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <UserProfilePage users={props.users ?? storyProfileUsers} />
      </div>
    </MemoryRouter>
  );
}

export const MobileDefault: Story = {
  render: () => <UserProfileCanvas />,
};

export const MobileNoStaffRecord: Story = {
  render: () => <UserProfileCanvas users={storyProfileUsersNoStaff} />,
};
