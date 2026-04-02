import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import LoginPage from '../../pages/LoginPage';
import MembersPage from '../../pages/MembersPage';
import { storyMembers } from '../helpers/mockMembers';

const meta = {
  title: 'App/Pages/Login Page',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function LoginFlowCanvas() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard/members"
          element={
            <MainLayout>
              <MembersPage members={storyMembers} disableNavigation />
            </MainLayout>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

export const RoleSelection: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage disableSubmit />
    </MemoryRouter>
  ),
};

export const CredentialsInput: Story = {
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

export const LoadingState: Story = {
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

export const InvalidCredentialsErrorState: Story = {
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

export const RoleMismatchErrorState: Story = {
  render: () => (
    <MemoryRouter>
      <LoginPage
        disableSubmit
        initialStep="enter-credentials"
        initialRole="Owner"
        initialUsername="staff"
        initialPassword="secret123"
        initialError="Role mismatch"
      />
    </MemoryRouter>
  ),
};

export const StaffLoginWithSidebarToggle: Story = {
  render: () => <LoginFlowCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 800 });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          user: {
            id: 'staff-user',
            role: 'Staff',
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

    try {
      await slowUser.click(canvas.getByRole('button', { name: 'Staff' }));
      await slowUser.type(canvas.getByPlaceholderText('Username'), 'staff');
      await slowUser.type(canvas.getByPlaceholderText('Password'), 'secret123');
      await slowUser.click(canvas.getByRole('button', { name: 'Log In' }));

      await waitFor(() => {
        expect(
          canvas.getByRole('heading', {
            name: 'Members',
          }),
        ).toBeInTheDocument();
      });

      const collapseControl = canvasElement.querySelector<HTMLButtonElement>(
        'button[title="Collapse sidebar"]',
      );

      const isDesktopCollapseVisible =
        collapseControl && window.getComputedStyle(collapseControl).display !== 'none';

      if (isDesktopCollapseVisible && collapseControl) {
        await slowUser.click(collapseControl);

        await waitFor(() => {
          expect(canvasElement.querySelector('button[title="Expand sidebar"]')).toBeInTheDocument();
        });

        const expandControl = canvasElement.querySelector<HTMLButtonElement>(
          'button[title="Expand sidebar"]',
        );

        if (!expandControl) {
          throw new Error('Expand sidebar button was not rendered after collapsing.');
        }

        await slowUser.click(expandControl);
        await waitFor(() => {
          expect(canvasElement.querySelector('button[title="Collapse sidebar"]')).toBeInTheDocument();
        });
        return;
      }

      const mobileToggle = canvas.queryByLabelText('Toggle sidebar');
      if (!mobileToggle) {
        throw new Error('No sidebar toggle control available in the current viewport.');
      }

      await slowUser.click(mobileToggle);
      await slowUser.click(mobileToggle);
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
};
