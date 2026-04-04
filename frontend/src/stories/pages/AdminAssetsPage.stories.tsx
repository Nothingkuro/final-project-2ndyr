import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminAssetsPage from '../../pages/AdminAssetsPage';
import { setMockEquipmentStore } from '../../services/mockEquipmentStore';
import { storyEquipment, wobblyBench } from '../helpers/mockEquipment';
import type { Equipment } from '../../types/equipment';

const meta = {
  title: 'App/Pages/Manage Assets Page',
  component: AdminAssetsPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const authRole = (context.parameters.authRole as string | undefined) ?? 'ADMIN';
      const mockEquipment = (context.parameters.mockEquipment as Equipment[] | undefined)
        ?? storyEquipment;

      window.sessionStorage.setItem('authRole', authRole);
      setMockEquipmentStore(mockEquipment);

      return (
        <MemoryRouter initialEntries={['/dashboard/manage-assets']}>
          <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/dashboard/manage-assets" element={<Story />} />
              <Route
                path="/dashboard/inventory"
                element={(
                  <div className="rounded-lg border border-neutral-300 bg-surface p-6 text-secondary">
                    Redirected to Equipment Status
                  </div>
                )}
              />
            </Routes>
          </div>
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof AdminAssetsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultList: Story = {
  render: () => <AdminAssetsPage />,
};

export const EmptyState: Story = {
  parameters: {
    mockEquipment: [],
  },
  render: () => <AdminAssetsPage />,
};

export const SearchAndFilterFlow: Story = {
  render: () => <AdminAssetsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    const searchInput = canvas.getByPlaceholderText('Search assets...');
    await slowUser.clear(searchInput);
    await slowUser.type(searchInput, 'treadmill');

    await waitFor(() => {
      expect(canvas.getByText('New Treadmill')).toBeInTheDocument();
      expect(canvas.queryByText('Wobbly Bench')).not.toBeInTheDocument();
    });

    await slowUser.click(canvas.getByRole('button', { name: 'Filter' }));
    await slowUser.click(canvas.getByRole('button', { name: 'Broken' }));

    await waitFor(() => {
      expect(canvas.getByText('No assets found matching your search.')).toBeInTheDocument();
    });
  },
};

export const AddAssetFlow: Story = {
  render: () => <AdminAssetsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(canvas.getByRole('button', { name: 'Add asset' }));

    await slowUser.type(await canvas.findByPlaceholderText('Item Name'), 'Hex Dumbbell Set');
    await slowUser.clear(canvas.getByPlaceholderText('Initial Quantity'));
    await slowUser.type(canvas.getByPlaceholderText('Initial Quantity'), '8');
    await slowUser.selectOptions(canvas.getByRole('combobox'), 'MAINTENANCE');

    await slowUser.click(canvas.getByRole('button', { name: 'Create Asset' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('Item Name')).not.toBeInTheDocument();
      expect(canvas.getByText('Hex Dumbbell Set')).toBeInTheDocument();
    });
  },
};

export const EditAssetFlow: Story = {
  render: () => <AdminAssetsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(await canvas.findByRole('button', { name: /Edit asset New Treadmill/i }));

    const itemNameInput = await canvas.findByPlaceholderText('Item Name');
    await slowUser.clear(itemNameInput);
    await slowUser.type(itemNameInput, 'New Treadmill X');

    await slowUser.click(canvas.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('Item Name')).not.toBeInTheDocument();
      expect(canvas.getByText('New Treadmill X')).toBeInTheDocument();
    });
  },
};

export const DeleteAssetFlow: Story = {
  render: () => <AdminAssetsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    const originalConfirm = window.confirm;
    window.confirm = () => true;

    try {
      await slowUser.click(
        await canvas.findByRole('button', { name: `Delete asset ${wobblyBench.itemName}` }),
      );

      await waitFor(() => {
        expect(canvas.queryByText(wobblyBench.itemName)).not.toBeInTheDocument();
      });
    } finally {
      window.confirm = originalConfirm;
    }
  },
};

export const AccessDeniedRedirect: Story = {
  parameters: {
    authRole: 'STAFF',
  },
  render: () => <AdminAssetsPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Redirected to Equipment Status')).toBeInTheDocument();
    });
  },
};
