import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';

const meta = {
  title: 'App/Layouts/Main Layout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    children: null,
  },
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultShell: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard/members']}>
      <MainLayout>
        <div className="rounded-lg border border-neutral-200 bg-surface p-6">
          <h2 className="text-xl font-semibold text-primary">Dashboard Content</h2>
          <p className="mt-2 text-sm text-secondary">This story shows the default shell structure.</p>
        </div>
      </MainLayout>
    </MemoryRouter>
  ),
};

export const OwnerShellExpanded: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard/suppliers']}>
      <MainLayout sidebarRole="owner">
        <div className="rounded-lg border border-neutral-200 bg-surface p-6">
          <h2 className="text-xl font-semibold text-primary">Owner Dashboard Content</h2>
          <p className="mt-2 text-sm text-secondary">
            This story shows the shell with owner privileges and additional sidebar tabs.
          </p>
        </div>
      </MainLayout>
    </MemoryRouter>
  ),
};

export const OwnerShellCollapsed: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard/reports']}>
      <MainLayout sidebarRole="owner" sidebarDefaultCollapsed>
        <div className="rounded-lg border border-neutral-200 bg-surface p-6">
          <h2 className="text-xl font-semibold text-primary">Owner Dashboard Content</h2>
          <p className="mt-2 text-sm text-secondary">
            Collapsed owner shell with fixed sidebar background and no visible sidebar scrollbars.
          </p>
        </div>
      </MainLayout>
    </MemoryRouter>
  ),
};
