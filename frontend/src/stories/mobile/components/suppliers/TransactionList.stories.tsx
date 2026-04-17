import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import TransactionList from '../../../../components/suppliers/TransactionList';
import { atlasFitnessSupply, mockTransactions } from '../../../mocks/mockSuppliers';

const atlasTransactions = mockTransactions.filter(
  (transaction) => transaction.supplierId === atlasFitnessSupply.id,
);

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Suppliers/Transaction List',
  component: TransactionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="w-[95vw] max-w-5xl bg-surface-alt p-4 sm:p-6 rounded-lg border border-neutral-300">
      <TransactionList {...args} />
    </div>
  ),
  args: {
    onPreviousPage: fn(),
    onNextPage: fn(),
  },
} satisfies Meta<typeof TransactionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileDefault: Story = {
  args: {
    transactions: atlasTransactions,
    isLoading: false,
    errorMessage: null,
    currentPage: 1,
    totalPages: 1,
    totalTransactions: atlasTransactions.length,
  },
};

export const MobileEmpty: Story = {
  args: {
    transactions: [],
    isLoading: false,
    errorMessage: null,
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
  },
};
