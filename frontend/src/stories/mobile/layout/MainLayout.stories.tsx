import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Layout/Main Layout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    children: null,
  },
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefaultShell: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard/members']}>
      <MainLayout>
        <div className="rounded-lg border border-neutral-200 bg-surface p-6">
          <h2 className="text-xl font-semibold text-primary">Dashboard Content</h2>
          <p className="mt-2 text-sm text-secondary">Mobile view of the default shell structure.</p>
        </div>
      </MainLayout>
    </MemoryRouter>
  ),
};

export const MobileOwnerShell: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard/suppliers']}>
      <MainLayout sidebarRole="owner">
        <div className="rounded-lg border border-neutral-200 bg-surface p-6">
          <h2 className="text-xl font-semibold text-primary">Owner Dashboard Content</h2>
          <p className="mt-2 text-sm text-secondary">
            Mobile view with owner privileges and additional sidebar tabs.
          </p>
        </div>
      </MainLayout>
    </MemoryRouter>
  ),
};
