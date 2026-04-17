import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MembersPage from '../../../pages/MembersPage';
import { storyMembers } from '../../mocks/mockMembers';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Members Page',
  component: MembersPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
} satisfies Meta<typeof MembersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function MembersPageCanvas(props: ComponentProps<typeof MembersPage>) {
  return (
    <MemoryRouter initialEntries={['/dashboard/members']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <MembersPage {...props} disableNavigation />
      </div>
    </MemoryRouter>
  );
}

export const MobileDefaultList: Story = {
  render: () => <MembersPageCanvas members={storyMembers} />,
};

export const MobileEmptyResults: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialSearchQuery="not-a-member"
    />
  ),
};

export const MobileFilterMenuOpen: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialFilterOpen
    />
  ),
};

export const MobileActiveOnly: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialFilter="ACTIVE"
    />
  ),
};

export const MobileAddModalOpen: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialAddModalOpen
    />
  ),
};
