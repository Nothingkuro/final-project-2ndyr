import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AddTransactionModal from '../../../../components/suppliers/AddTransactionModal';
import { atlasFitnessSupply } from '../../../mocks/mockSuppliers';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Modals/Add Transaction Modal',
  component: AddTransactionModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    isOpen: true,
    supplierName: atlasFitnessSupply.name,
    onClose: fn(),
    onSubmit: fn(),
    errorMessage: null,
  },
} satisfies Meta<typeof AddTransactionModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {};

export const MobileWithValidationError: Story = {
  args: {
    errorMessage: 'Total cost must be a non-negative number.',
  },
};
