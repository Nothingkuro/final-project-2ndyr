import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AssetFormModal from '../../../../components/equipment/AssetFormModal';
import { EquipmentCondition } from '../../../../types/equipment';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Modals/Add Equipment Modal',
  component: AssetFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
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

export const MobileOpenEmpty: Story = {
  args: {
    initialData: {
      itemName: '',
      quantity: 1,
      condition: EquipmentCondition.GOOD,
    },
  },
};

export const MobileOpenPrefilled: Story = {
  args: {
    initialData: {
      itemName: 'Leg Extension Machine',
      quantity: 2,
      condition: EquipmentCondition.MAINTENANCE,
    },
  },
};

export const MobileWithError: Story = {
  args: {
    errorMessage: 'Item name is required.',
    initialData: {
      itemName: '',
      quantity: 0,
      condition: EquipmentCondition.BROKEN,
    },
  },
};
