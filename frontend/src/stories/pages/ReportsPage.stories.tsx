import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import ReportsPage from '../../pages/ReportsPage';

type StoryRole = 'ADMIN' | 'STAFF';

const meta = {
  title: 'App/Pages/Reports Page',
  component: ReportsPage,
  parameters: {
    layout: 'fullscreen',
    authRole: 'ADMIN' as StoryRole,
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

export const AdminView: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <ReportsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notificationsButton = canvas.getByLabelText('Notifications');

    await userEvent.click(notificationsButton);

    await waitFor(() => {
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const AdminChangesMonthAndYear: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <ReportsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await waitFor(() => {
      expect(canvas.getByText('Reports and Analytics')).toBeInTheDocument();
      expect(canvas.getByText('Monthly Revenue Report')).toBeInTheDocument();
      expect(canvas.getByText(/212,740|214,360/)).toBeInTheDocument();
    });

    const monthPicker = canvas.getByLabelText('Select month') as HTMLSelectElement;
    const yearPicker = canvas.getByLabelText('Select year') as HTMLSelectElement;
    const oldestYearValue = yearPicker.options[yearPicker.options.length - 1]?.value;

    if (oldestYearValue) {
      await slowUser.selectOptions(yearPicker, oldestYearValue);
    }
    await slowUser.selectOptions(monthPicker, '10');

    await waitFor(() => {
      expect(canvas.getByText(/137,500|149,220/)).toBeInTheDocument();
    });
  },
};

export const AdminAdjustsInventoryThreshold: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <ReportsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 100 });

    await waitFor(() => {
      expect(canvas.getByText('Low Inventory Alerts')).toBeInTheDocument();
      expect(canvas.getByLabelText('Threshold')).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    });

    const thresholdInput = canvas.getByLabelText('Threshold') as HTMLInputElement;
    await slowUser.clear(thresholdInput);
    await slowUser.type(thresholdInput, '7');

    await waitFor(() => {
      expect(thresholdInput).toHaveValue(7);
    });

    const refreshButton = canvas.getByRole('button', { name: 'Refresh' });
    await slowUser.click(refreshButton);
  },
};

export const StaffRedirected: Story = {
  parameters: {
    authRole: 'STAFF' as StoryRole,
  },
  render: () => <ReportsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Redirected to Members Dashboard')).toBeInTheDocument();
    });
  },
};
