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
  title: 'Mobile Views/Components/Modals/Edit Equipment Modal',
  component: AssetFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
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

export const MobileOpenPrefilled: Story = {};

export const MobileMaintenanceSelected: Story = {
  args: {
    initialData: {
      itemName: 'Cable Machine',
      quantity: 2,
      condition: EquipmentCondition.MAINTENANCE,
    },
  },
};

export const MobileWithError: Story = {
  args: {
    errorMessage: 'Quantity must be 0 or greater.',
    initialData: {
      itemName: 'Power Rack',
      quantity: 0,
      condition: EquipmentCondition.BROKEN,
    },
  },
};
