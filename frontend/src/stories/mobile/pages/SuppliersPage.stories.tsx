import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import SuppliersPage from '../../../pages/SuppliersPage';

type StoryRole = 'ADMIN' | 'owner' | 'STAFF';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Suppliers Page',
  component: SuppliersPage,
  parameters: {
    layout: 'fullscreen',
    authRole: 'ADMIN' as StoryRole,
    ...mobileViewport,
  },
  decorators: [
    (Story, context) => {
      const authRole = (context.parameters.authRole as StoryRole | undefined) ?? 'ADMIN';

      window.sessionStorage.setItem('authRole', authRole);
      window.sessionStorage.setItem('authUsername', 'storybook.user');

      return (
        <MemoryRouter initialEntries={['/dashboard/suppliers']}>
          <div className="min-h-screen bg-surface-alt">
            <Routes>
              <Route
                path="/dashboard/suppliers"
                element={
                  <MainLayout sidebarRole={authRole === 'owner' ? 'owner' : authRole}>
                    <Story />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/inventory"
                element={
                  <div className="rounded-lg border border-neutral-300 bg-surface p-6 text-secondary m-6">
                    Redirected to Equipment Status
                  </div>
                }
              />
            </Routes>
          </div>
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof SuppliersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileOwnerView: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
};

export const MobileAdminView: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <SuppliersPage />,
};

export const MobileStaffRedirected: Story = {
  parameters: {
    authRole: 'STAFF' as StoryRole,
  },
  render: () => <SuppliersPage />,
};
