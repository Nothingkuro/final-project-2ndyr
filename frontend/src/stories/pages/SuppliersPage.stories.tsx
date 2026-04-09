import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import SuppliersPage from '../../pages/SuppliersPage';

type StoryRole = 'ADMIN' | 'owner' | 'STAFF';

const meta = {
  title: 'App/Pages/Suppliers Page',
  component: SuppliersPage,
  parameters: {
    layout: 'fullscreen',
    authRole: 'ADMIN' as StoryRole,
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

export const OwnerView: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
};

export const LargeDataset: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await waitFor(() => {
      expect(canvas.getByText('Showing page 1 of 1 (20 suppliers)')).toBeInTheDocument();
    });

    await slowUser.click(
      await canvas.findByRole('button', { name: 'View transactions for MoveWell Industrial Parts' }),
    );

    await waitFor(() => {
      expect(canvas.getByText('Purchase Transactions: MoveWell Industrial Parts')).toBeInTheDocument();
      expect(canvas.getByText('Cable Carabiner Replacements (100 pcs)')).toBeInTheDocument();
    });
  },
};

export const OwnerAddsSupplier: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(await canvas.findByRole('button', { name: 'Add Supplier' }));

    await slowUser.type(await canvas.findByPlaceholderText('Supplier Name'), 'Summit Gear Depot');
    await slowUser.type(canvas.getByPlaceholderText('Contact Person'), 'Lana Morales');
    await slowUser.type(canvas.getByPlaceholderText('Contact Number'), '09190001111');
    await slowUser.type(canvas.getByPlaceholderText('Address'), 'Quezon Avenue, Quezon City');

    await slowUser.click(canvas.getByRole('button', { name: 'Create Supplier' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('Supplier Name')).not.toBeInTheDocument();
      expect(canvas.getByText('Summit Gear Depot')).toBeInTheDocument();
    });
  },
};

export const OwnerEditsSupplier: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(
      await canvas.findByRole('button', { name: 'Edit supplier Atlas Fitness Supply Co.' }),
    );

    const supplierNameInput = await canvas.findByPlaceholderText('Supplier Name');
    await slowUser.clear(supplierNameInput);
    await slowUser.type(supplierNameInput, 'Atlas Supply Updated');

    await slowUser.click(canvas.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('Supplier Name')).not.toBeInTheDocument();
      expect(canvas.getByText('Atlas Supply Updated')).toBeInTheDocument();
    });
  },
};

export const OwnerDeletesSupplier: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    const originalConfirm = window.confirm;
    window.confirm = () => true;

    try {
      await slowUser.click(
        await canvas.findByRole('button', { name: 'Delete supplier Peak Wellness Traders' }),
      );

      await waitFor(() => {
        expect(canvas.queryByText('Peak Wellness Traders')).not.toBeInTheDocument();
      });
    } finally {
      window.confirm = originalConfirm;
    }
  },
};

export const OwnerViewsSupplierTransactions: Story = {
  parameters: {
    authRole: 'owner' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(
      await canvas.findByRole('button', { name: 'View transactions for Atlas Fitness Supply Co.' }),
    );

    await waitFor(() => {
      expect(canvas.getByText('Purchase Transactions: Atlas Fitness Supply Co.')).toBeInTheDocument();
      expect(canvas.getByText('Olympic Barbell Set')).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: 'Log Transaction' })).toBeInTheDocument();
    });
  },
};

export const SearchNoResults: Story = {
  parameters: {
    authRole: 'ADMIN' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    const searchInput = await canvas.findByPlaceholderText('Search supplier...');
    await slowUser.clear(searchInput);
    await slowUser.type(searchInput, 'supplier-that-does-not-exist');

    await waitFor(() => {
      expect(canvas.getByText('No suppliers found matching your search.')).toBeInTheDocument();
    });
  },
};

export const StaffRedirected: Story = {
  parameters: {
    authRole: 'STAFF' as StoryRole,
  },
  render: () => <SuppliersPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Redirected to Equipment Status')).toBeInTheDocument();
    });
  },
};
