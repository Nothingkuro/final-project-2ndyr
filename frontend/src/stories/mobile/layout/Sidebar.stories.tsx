import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    ...mobileViewport,
  },
  args: {
    onToggle: fn(),
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileOpen: Story = {
  args: {
    isOpen: true,
    defaultCollapsed: false,
  },
  render: (args) => (
    <MemoryRouter initialEntries={['/dashboard/members']}>
      <div className="h-screen">
        <Sidebar {...args} />
      </div>
    </MemoryRouter>
  ),
};

export const MobileClosed: Story = {
  args: {
    isOpen: false,
    defaultCollapsed: false,
  },
  render: (args) => (
    <MemoryRouter initialEntries={['/dashboard/members']}>
      <div className="h-screen">
        <Sidebar {...args} />
      </div>
    </MemoryRouter>
  ),
};

export const MobileOwnerOpen: Story = {
  args: {
    isOpen: true,
    defaultCollapsed: false,
    role: 'owner',
  },
  render: (args) => (
    <MemoryRouter initialEntries={['/dashboard/suppliers']}>
      <div className="h-screen">
        <Sidebar {...args} />
      </div>
    </MemoryRouter>
  ),
};

export const MobileOwnerClosed: Story = {
  args: {
    isOpen: false,
    defaultCollapsed: false,
    role: 'owner',
  },
  render: (args) => (
    <MemoryRouter initialEntries={['/dashboard/reports']}>
      <div className="h-screen">
        <Sidebar {...args} />
      </div>
    </MemoryRouter>
  ),
};
