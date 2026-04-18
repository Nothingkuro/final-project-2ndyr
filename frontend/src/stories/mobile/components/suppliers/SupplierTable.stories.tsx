import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SupplierTable from '../../../../components/suppliers/SupplierTable';
import { mockSuppliers } from '../../../mocks/mockSuppliers';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Suppliers/Supplier Table',
  component: SupplierTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-6xl bg-surface-alt p-4 sm:p-6 rounded-lg border border-neutral-300">
      <SupplierTable {...args} />
    </div>
  ),
  args: {
    onEditSupplier: fn(),
    onDeleteSupplier: fn(),
    onViewTransactions: fn(),
  },
} satisfies Meta<typeof SupplierTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    suppliers: mockSuppliers,
    isLoading: false,
    errorMessage: null,
    selectedSupplierId: mockSuppliers[0].id,
  },
};

export const MobileEmpty: Story = {
  args: {
    suppliers: [],
    isLoading: false,
    errorMessage: null,
    selectedSupplierId: null,
  },
};

export const MobileLoading: Story = {
  args: {
    suppliers: [],
    isLoading: true,
    errorMessage: null,
    selectedSupplierId: null,
  },
};
