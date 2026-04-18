import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../../pages/LoginPage';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Login Page',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileRoleSelection: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage disableSubmit />
    </MemoryRouter>
  ),
};

export const MobileCredentialsInput: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage
        disableSubmit
        initialStep="enter-credentials"
        initialRole="Staff"
      />
    </MemoryRouter>
  ),
};

export const MobileLoadingState: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage
        disableSubmit
        initialStep="enter-credentials"
        initialRole="Owner"
        initialUsername="owner.user"
        initialPassword="secret123"
        initialLoading
      />
    </MemoryRouter>
  ),
};

export const MobileErrorState: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage
        disableSubmit
        initialStep="enter-credentials"
        initialRole="Staff"
        initialUsername="staff.user"
        initialPassword="bad-password"
        initialError="Invalid username or password"
      />
    </MemoryRouter>
  ),
};
