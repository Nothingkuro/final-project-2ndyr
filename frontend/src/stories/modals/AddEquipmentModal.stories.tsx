import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AssetFormModal from '../../components/equipment/AssetFormModal';
import { EquipmentCondition } from '../../types/equipment';

const meta = {
  title: 'App/Modals/Add Equipment Modal',
  component: AssetFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    mode: 'add',
    isOpen: true,
    onClose: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof AssetFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

export const OpenEmpty: Story = {
  args: {
    initialData: {
      itemName: '',
      quantity: 1,
      condition: EquipmentCondition.GOOD,
    },
  },
};

export const OpenPrefilled: Story = {
  args: {
    initialData: {
      itemName: 'Leg Extension Machine',
      quantity: 2,
      condition: EquipmentCondition.MAINTENANCE,
    },
  },
};

export const SubmittingState: Story = {
  args: {
    isSubmitting: true,
    initialData: {
      itemName: 'Hex Dumbbell Set',
      quantity: 8,
      condition: EquipmentCondition.GOOD,
    },
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'Item name is required.',
    initialData: {
      itemName: '',
      quantity: 0,
      condition: EquipmentCondition.BROKEN,
    },
  },
};
