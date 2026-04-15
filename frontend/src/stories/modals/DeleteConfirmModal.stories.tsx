import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { storyMembershipPlanConfigDeletePlanName } from '../mocks/mockMembershipPlanConfig';

const meta = {
  title: 'App/Common/Delete Confirm Modal',
  component: DeleteConfirmModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof DeleteConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteMembershipPlan: Story = {
  args: {
    planName: storyMembershipPlanConfigDeletePlanName,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 75 });

    await slowUser.click(canvas.getByRole('button', { name: 'Delete' }));

    expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const DeleteAsset: Story = {
  args: {
    itemName: 'Treadmill 2000',
    title: 'Delete Asset',
  },
};

export const DeleteSupplier: Story = {
  args: {
    itemName: 'GymBro Equipments Inc.',
    title: 'Delete Supplier',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    itemName: 'Hidden Item',
  },
};
