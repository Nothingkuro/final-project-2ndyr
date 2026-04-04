import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AssetFormModal from '../../components/equipment/AssetFormModal';
import { EquipmentCondition } from '../../types/equipment';

const meta = {
  title: 'App/Modals/Edit Equipment Modal',
  component: AssetFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    mode: 'edit',
    isOpen: true,
    onClose: fn(),
    onSubmit: fn(),
    initialData: {
      itemName: 'New Treadmill',
      quantity: 4,
      condition: EquipmentCondition.GOOD,
    },
  },
} satisfies Meta<typeof AssetFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

export const OpenPrefilled: Story = {};

export const MaintenanceSelected: Story = {
  args: {
    initialData: {
      itemName: 'Cable Machine',
      quantity: 2,
      condition: EquipmentCondition.MAINTENANCE,
    },
  },
};

export const SavingState: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'Quantity must be 0 or greater.',
    initialData: {
      itemName: 'Power Rack',
      quantity: 0,
      condition: EquipmentCondition.BROKEN,
    },
  },
};
