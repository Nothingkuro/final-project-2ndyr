import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SupplierFormModal from '../../../../components/suppliers/SupplierFormModal';
import { peakWellnessTraders } from '../../../mocks/mockSuppliers';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Modals/Supplier Form Modal',
  component: SupplierFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    isOpen: true,
    mode: 'add',
    onClose: fn(),
    onSubmit: fn(),
    errorMessage: null,
  },
} satisfies Meta<typeof SupplierFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileAddSupplier: Story = {
  args: {
    mode: 'add',
    initialData: {
      name: '',
      contactPerson: '',
      contactNumber: '',
      address: '',
    },
  },
};

export const MobileEditSupplier: Story = {
  args: {
    mode: 'edit',
    initialData: {
      name: peakWellnessTraders.name,
      contactPerson: peakWellnessTraders.contactPerson ?? '',
      contactNumber: peakWellnessTraders.contactNumber ?? '',
      address: peakWellnessTraders.address ?? '',
    },
  },
};
