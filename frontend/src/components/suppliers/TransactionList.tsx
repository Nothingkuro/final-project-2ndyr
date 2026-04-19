import type { SupplierTransaction } from '../../types/supplier';

/**
 * Defines transaction list props used by feature UI behavior.
 */
interface TransactionListProps {
  /**
   * Collection data rendered by transactions UI.
   */
  transactions: SupplierTransaction[];
  /**
   * Marks whether asynchronous data is currently loading.
   */
  isLoading: boolean;
  /**
   * Error message shown when an operation fails.
   */
  errorMessage?: string | null;
  /**
   * Data used for current page behavior.
   */
  currentPage: number;
  /**
   * Data used for total pages behavior.
   */
  totalPages: number;
  /**
   * Collection data rendered by total transactions UI.
   */
  totalTransactions: number;
  /**
   * Callback fired when previous page.
   */
  onPreviousPage: () => void;
  /**
   * Callback fired when next page.
   */
  onNextPage: () => void;
}

/**
 * Handles format cost logic for feature UI behavior.
 *
 * @param value Input used by format cost.
 * @returns Computed value for the caller.
 */
function formatCost(value: number): string {
  if (Number.isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Handles format date logic for feature UI behavior.
 *
 * @param value Input used by format date.
 * @returns Computed value for the caller.
 */
function formatDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Renders the transaction list interface for feature UI behavior.
 *
 * @param params Input used by transaction list.
 * @returns Rendered JSX output.
 */
export default function TransactionList({
  transactions,
  isLoading,
  errorMessage = null,
  currentPage,
  totalPages,
  totalTransactions,
  onPreviousPage,
  onNextPage,
}: TransactionListProps) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-surface-alt px-4 py-4 sm:px-5 sm:py-5">
      {isLoading ? (
        <div className="rounded-md border border-neutral-300 bg-surface px-4 py-10 text-center text-sm text-neutral-500">
          Loading transactions...
        </div>
      ) : errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
          {errorMessage}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 bg-surface px-4 py-10 text-center text-sm text-neutral-500">
          No transaction records found for this supplier.
        </div>
      ) : (
        <>
          <div className="max-h-60 overflow-y-auto overscroll-contain rounded-md border border-neutral-300 bg-surface">
            <table className="w-full min-w-180 border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-alt border-b border-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Items Purchased
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`border-b border-neutral-200 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-secondary">{transaction.itemsPurchased}</td>
                    <td className="px-4 py-3 text-sm text-right text-secondary">
                      {formatCost(transaction.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-secondary">
                      {formatDate(transaction.transactionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Showing page {currentPage} of {totalPages} ({totalTransactions} transaction
              {totalTransactions === 1 ? '' : 's'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
