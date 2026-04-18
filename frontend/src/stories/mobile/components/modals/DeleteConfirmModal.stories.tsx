import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DeleteConfirmModal from '../../../../components/common/DeleteConfirmModal';
import { storyMembershipPlanConfigDeletePlanName } from '../../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Modals/Delete Confirm Modal',
  component: DeleteConfirmModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    isOpen: true,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof DeleteConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDeleteMembershipPlan: Story = {
  args: {
    planName: storyMembershipPlanConfigDeletePlanName,
  },
};

export const MobileDeleteAsset: Story = {
  args: {
    itemName: 'Treadmill 2000',
    title: 'Delete Asset',
  },
};

export const MobileDeleteSupplier: Story = {
  args: {
    itemName: 'GymBro Equipments Inc.',
    title: 'Delete Supplier',
  },
};
