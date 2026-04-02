import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import MembersPage from '../../pages/MembersPage';
import { storyMembers } from '../helpers/mockMembers';

const meta = {
  title: 'App/Pages/Members Page',
  component: MembersPage,
  parameters: {
    layout: 'fullscreen',
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

export const DefaultList: Story = {
  render: () => <MembersPageCanvas members={storyMembers} />,
};

export const EmptyResults: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialSearchQuery="not-a-member"
    />
  ),
};

export const FilterMenuOpen: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialFilterOpen
    />
  ),
};

export const ActiveOnly: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialFilter="ACTIVE"
    />
  ),
};

export const ExpiredOnly: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialFilter="EXPIRED"
    />
  ),
};

export const SearchResults: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialSearchQuery="67"
    />
  ),
};

export const AddModalOpen: Story = {
  render: () => (
    <MembersPageCanvas
      members={storyMembers}
      initialAddModalOpen
    />
  ),
};

export const SearchFilterAndAddMemberFlow: Story = {
  render: () => <MembersPageCanvas members={storyMembers} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 800 });

    const searchInput = canvas.getByPlaceholderText('Search member...');
    await slowUser.clear(searchInput);
    await slowUser.type(searchInput, '67');

    const selectedMember = await canvas.findByText('#67');
    await slowUser.click(selectedMember);

    await slowUser.click(canvas.getByRole('button', { name: 'Filter' }));
    await slowUser.click(canvas.getByRole('button', { name: 'Active' }));

    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'Active' })).not.toBeInTheDocument();
    });

    await slowUser.click(canvas.getByRole('button', { name: 'Member' }));

    await slowUser.type(await canvas.findByPlaceholderText('First Name'), 'Jane');
    await slowUser.type(canvas.getByPlaceholderText('Last Name'), 'Smith');
    await slowUser.type(canvas.getByPlaceholderText('Contact Number'), '09171234567');
    await slowUser.type(canvas.getByPlaceholderText('Notes'), 'Added from Storybook play flow');

    await slowUser.click(canvas.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
    });
  },
};
