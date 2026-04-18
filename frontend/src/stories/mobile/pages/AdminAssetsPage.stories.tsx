import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminAssetsPage from '../../../pages/AdminAssetsPage';
import { setMockEquipmentStore } from '../../mocks/mockEquipmentStore';
import { storyEquipment } from '../../mocks/mockEquipment';
import type { Equipment } from '../../../types/equipment';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Manage Assets Page',
  component: AdminAssetsPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
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

export const MobileDefaultList: Story = {
  render: () => <AdminAssetsPage />,
};

export const MobileEmptyState: Story = {
  parameters: {
    mockEquipment: [],
  },
  render: () => <AdminAssetsPage />,
};

export const MobileAccessDenied: Story = {
  parameters: {
    authRole: 'STAFF',
  },
  render: () => <AdminAssetsPage />,
};
