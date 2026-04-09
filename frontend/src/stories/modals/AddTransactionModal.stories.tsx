import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AddTransactionModal from '../../components/suppliers/AddTransactionModal';
import { atlasFitnessSupply } from '../mocks/mockSuppliers';

const meta = {
  title: 'App/Modals/Add Transaction Modal',
  component: AddTransactionModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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

export const Default: Story = {};

export const WithValidationError: Story = {
  args: {
    errorMessage: 'Total cost must be a non-negative number.',
  },
};
