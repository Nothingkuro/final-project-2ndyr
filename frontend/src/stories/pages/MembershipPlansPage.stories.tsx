import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import MembershipPlansPage from '../../pages/MembershipPlansPage';

const meta = {
  title: 'App/Pages/Membership Plans Page',
  component: MembershipPlansPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MembershipPlansPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function MembershipPlansPageCanvas() {
  return (
    <MemoryRouter initialEntries={['/dashboard/membership-plans']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <MembershipPlansPage />
      </div>
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <MembershipPlansPageCanvas />,
};

export const AddModalOpen: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getByRole('button', { name: 'Plan' }));

    await waitFor(() => {
      expect(canvas.getByPlaceholderText('e.g. Monthly Pass')).toBeInTheDocument();
    });

    await slowUser.type(canvas.getByPlaceholderText('e.g. Monthly Pass'), 'Storybook Pass');
    await slowUser.type(canvas.getByPlaceholderText('Brief description (optional)'), 'Created from story play');
    await slowUser.clear(canvas.getByPlaceholderText('0.00'));
    await slowUser.type(canvas.getByPlaceholderText('0.00'), '999');
    await slowUser.clear(canvas.getByPlaceholderText('30'));
    await slowUser.type(canvas.getByPlaceholderText('30'), '14');
    await slowUser.click(canvas.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => {
      expect(canvas.getByPlaceholderText('e.g. Monthly Pass')).toBeInTheDocument();
    });
  },
};

export const EditModalOpen: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getAllByRole('button', { name: 'Edit plan' })[0]);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: 'Edit Plan' })).toBeInTheDocument();
      expect(canvas.getByDisplayValue('Monthly Pass')).toBeInTheDocument();
    });
  },
};

export const DeleteConfirmOpen: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getAllByRole('button', { name: 'Delete plan' })[0]);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: 'Delete Plan' })).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  },
};

export const CreatePlanFlow: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getByRole('button', { name: 'Plan' }));

    await waitFor(() => {
      expect(canvas.getByPlaceholderText('e.g. Monthly Pass')).toBeInTheDocument();
    });

    await slowUser.type(canvas.getByPlaceholderText('e.g. Monthly Pass'), 'Storybook Pass');
    await slowUser.type(canvas.getByPlaceholderText('Brief description (optional)'), 'Created from story play');
    await slowUser.clear(canvas.getByPlaceholderText('0.00'));
    await slowUser.type(canvas.getByPlaceholderText('0.00'), '999');
    await slowUser.clear(canvas.getByPlaceholderText('30'));
    await slowUser.type(canvas.getByPlaceholderText('30'), '14');
    await slowUser.click(canvas.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => {
      expect(canvas.queryByPlaceholderText('e.g. Monthly Pass')).not.toBeInTheDocument();
      expect(canvas.getByText('Storybook Pass')).toBeInTheDocument();
    });
  },
};

export const EditPlanFlow: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getAllByRole('button', { name: 'Edit plan' })[0]);

    await waitFor(() => {
      expect(canvas.getByDisplayValue('Monthly Pass')).toBeInTheDocument();
    });

    const planNameField = canvas.getByDisplayValue('Monthly Pass');
    await slowUser.clear(planNameField);
    await slowUser.type(planNameField, 'Monthly Pass Updated');
    await slowUser.click(canvas.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: 'Edit Plan' })).not.toBeInTheDocument();
      expect(canvas.getByText('Monthly Pass Updated')).toBeInTheDocument();
    });
  },
};

export const DeletePlanFlow: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await waitFor(() => {
      expect(canvas.getByText('Quarterly Pass')).toBeInTheDocument();
    });

    await slowUser.click(canvas.getAllByRole('button', { name: 'Delete plan' })[1]);
    await slowUser.click(canvas.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: 'Delete Plan' })).not.toBeInTheDocument();
      expect(canvas.queryByText('Quarterly Pass')).not.toBeInTheDocument();
    });
  },
};

export const DeleteCancelFlow: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await waitFor(() => {
      expect(canvas.getByText('Monthly Pass')).toBeInTheDocument();
    });

    await slowUser.click(canvas.getAllByRole('button', { name: 'Delete plan' })[0]);
    await slowUser.click(canvas.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: 'Delete Plan' })).not.toBeInTheDocument();
      expect(canvas.getByText('Monthly Pass')).toBeInTheDocument();
    });
  },
};

export const AddValidationErrors: Story = {
  render: () => <MembershipPlansPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getByRole('button', { name: 'Plan' }));
    await slowUser.clear(canvas.getByPlaceholderText('30'));
    await slowUser.click(canvas.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => {
      expect(canvas.getByText('Plan name is required.')).toBeInTheDocument();
      expect(canvas.getByText('Price is required.')).toBeInTheDocument();
      expect(canvas.getByText('Duration is required.')).toBeInTheDocument();
    });
  },
};
