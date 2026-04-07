import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import PaymentsPage from '../../pages/PaymentsPage';
import { storyPaymentMembers } from '../mocks/mockMembers';
import { storyPaymentPlans } from '../mocks/mockMembershipPlans';

const meta = {
  title: 'App/Pages/Payments Page',
  component: PaymentsPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PaymentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaymentsCanvas(args: ComponentProps<typeof PaymentsPage>) {
  return (
    <MemoryRouter initialEntries={['/dashboard/payments']}>
      <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
        <PaymentsPage {...args} />
      </div>
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
    />
  ),
};

export const GCashMethodSelected: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
      initialPaymentMethod="GCASH"
    />
  ),
};

export const PlanPreselected: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
      initialSelectedPlanId="plan-1month"
    />
  ),
};

export const NoMembers: Story = {
  render: () => (
    <PaymentsCanvas
      members={[]}
      plans={storyPaymentPlans}
    />
  ),
};

export const NoPlans: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={[]}
    />
  ),
};

export const LoadingState: Story = {
  render: () => (
    <PaymentsCanvas
      members={[]}
      plans={[]}
      initialLoading
    />
  ),
};

export const SubmitButtonVisible: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  },
};

export const SelectionFlow: Story = {
  render: () => (
    <PaymentsCanvas
      members={storyPaymentMembers}
      plans={storyPaymentPlans}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.clear(canvas.getByPlaceholderText('Search member...'));
    await slowUser.type(canvas.getByPlaceholderText('Search member...'), 'lea');
    await slowUser.click(canvas.getByRole('button', { name: /Lea Santos/i }));

    await slowUser.selectOptions(canvas.getByLabelText('Select Payment Method'), 'GCASH');

    await slowUser.click(canvas.getByText('Three Months'));
    await slowUser.click(canvas.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(canvas.getByLabelText('Select Payment Method')).toHaveValue('GCASH');
      expect(canvas.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  },
};
