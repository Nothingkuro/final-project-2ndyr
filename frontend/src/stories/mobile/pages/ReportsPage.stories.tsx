import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import ReportsPage from '../../../pages/ReportsPage';

type StoryRole = 'ADMIN' | 'STAFF';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Reports Page',
  component: ReportsPage,
  parameters: {
    layout: 'fullscreen',
    authRole: 'ADMIN' as StoryRole,
    ...mobileViewport,
  },
  decorators: [
    (Story, context) => {
      const authRole = (context.parameters.authRole as StoryRole | undefined) ?? 'ADMIN';

      window.sessionStorage.setItem('authRole', authRole);
      window.sessionStorage.setItem('authUsername', 'storybook.admin');

      return (
        <MemoryRouter initialEntries={['/dashboard/reports']}>
          <div className="min-h-screen bg-surface-alt">
            <Routes>
              <Route
                path="/dashboard/reports"
                element={
                  <MainLayout sidebarRole={authRole}>
                    <Story />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/members"
                element={
                  <div className="m-6 rounded-lg border border-neutral-300 bg-surface p-6 text-secondary">
                    Redirected to Members Dashboard
                  </div>
                }
              />
            </Routes>
          </div>
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof ReportsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileAdminView: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <ReportsPage />,
};

export const MobileStaffRedirected: Story = {
  parameters: {
    authRole: 'STAFF' as StoryRole,
  },
  render: () => <ReportsPage />,
};
