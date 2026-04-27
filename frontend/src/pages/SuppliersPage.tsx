import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterDropdown from '../components/common/FilterDropdown';
import SearchBar from '../components/common/SearchBar';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import AddTransactionModal from '../components/suppliers/AddTransactionModal';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierTable from '../components/suppliers/SupplierTable';
import DateFilters from '../components/common/DateFilters';
import TransactionList from '../components/suppliers/TransactionList';
import {
  createSupplier,
  createTransaction,
  deleteSupplier,
  listSupplierServiceCategories,
  listSuppliers,
  listTransactionsBySupplier,
  updateSupplier,
} from '../services/supplierApi';
import type {
  Supplier,
  SupplierFormData,
  SupplierTransaction,
  TransactionFormData,
} from '../types/supplier';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 150;
const TRANSACTION_PAGE_SIZE = 10;
const ALL_CATEGORY_FILTER = 'ALL';

/**
 * Renders the suppliers page view for route-level dashboard orchestration.
 * @returns Rendered JSX content.
 */
export default function SuppliersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(ALL_CATEGORY_FILTER);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [suppliersLoadError, setSuppliersLoadError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<'add' | 'edit'>('add');
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [supplierModalError, setSupplierModalError] = useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsLoadError, setTransactionsLoadError] = useState<string | null>(null);
  const [transactionRefreshNonce, setTransactionRefreshNonce] = useState(0);
  const [transactionMonth, setTransactionMonth] = useState('ALL');
  const [transactionYear, setTransactionYear] = useState(new Date().getFullYear().toString());

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [transactionModalError, setTransactionModalError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const categoryFilterOptions = useMemo(
    () => [
      { label: 'All Categories', value: ALL_CATEGORY_FILTER },
      ...serviceCategories.map((category) => ({ label: category, value: category })),
    ],
    [serviceCategories],
  );

  useEffect(() => {
    const role = window.sessionStorage.getItem('authRole');
    if (role !== 'ADMIN' && role !== 'owner') {
      navigate('/dashboard/inventory', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isCancelled = false;

    /**
     * Handles load service categories for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadServiceCategories = async () => {
      try {
        const categories = await listSupplierServiceCategories();

        if (isCancelled) {
          return;
        }

        setServiceCategories(categories);
      } catch {
        if (isCancelled) {
          return;
        }

        setServiceCategories([]);
      }
    };

    void loadServiceCategories();

    return () => {
      isCancelled = true;
    };
  }, [refreshNonce]);

  useEffect(() => {
    let isCancelled = false;

    /**
     * Handles load suppliers for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true);
        setSuppliersLoadError(null);

        const response = await listSuppliers({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearchQuery,
          serviceCategory:
            selectedCategoryFilter === ALL_CATEGORY_FILTER
              ? undefined
              : selectedCategoryFilter,
        });

        if (isCancelled) {
          return;
        }

        setSuppliers(response.items);
        setTotalSuppliers(response.total);
        setTotalPages(Math.max(1, response.totalPages));

        if (response.page !== currentPage) {
          setCurrentPage(response.page);
        }
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load suppliers';
        setSuppliersLoadError(message);
      } finally {
        if (!isCancelled) {
          setIsLoadingSuppliers(false);
        }
      }
    };

    void loadSuppliers();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearchQuery, refreshNonce, selectedCategoryFilter]);

  useEffect(() => {
    if (!selectedSupplier) {
      setTransactions([]);
      setTransactionsTotal(0);
      setTransactionsTotalPages(1);
      setTransactionsLoadError(null);
      return;
    }

    let isCancelled = false;

    /**
     * Handles load transactions for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        setTransactionsLoadError(null);

        const response = await listTransactionsBySupplier(selectedSupplier.id, {
          page: transactionsPage,
          pageSize: TRANSACTION_PAGE_SIZE,
          month: transactionMonth,
          year: transactionYear,
        });

        if (isCancelled) {
          return;
        }

        setTransactions(
          response.items.map((transaction) => ({
            ...transaction,
            totalCost: Number(transaction.totalCost),
          })),
        );
        setTransactionsTotal(response.total);
        const clampedTotalPages = Math.max(1, response.totalPages);
        setTransactionsTotalPages(clampedTotalPages);

        if (transactionsPage > clampedTotalPages) {
          setTransactionsPage(clampedTotalPages);
        } else if (response.page !== transactionsPage) {
          setTransactionsPage(response.page);
        }
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load supplier transactions';
        setTransactionsLoadError(message);
      } finally {
        if (!isCancelled) {
          setIsLoadingTransactions(false);
        }
      }
    };

    void loadTransactions();

    return () => {
      isCancelled = true;
    };
  }, [selectedSupplier, transactionsPage, transactionRefreshNonce, transactionMonth, transactionYear]);

  /**
   * Handles handle open add supplier for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleOpenAddSupplier = () => {
    setSupplierModalMode('add');
    setActiveSupplier(null);
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  /**
   * Handles handle open edit supplier for route-level dashboard orchestration.
   *
   * @param supplier Input consumed by handle open edit supplier.
   * @returns Computed value for the caller.
   */
  const handleOpenEditSupplier = (supplier: Supplier) => {
    setSupplierModalMode('edit');
    setActiveSupplier(supplier);
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  /**
   * Handles handle close supplier modal for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleCloseSupplierModal = () => {
    if (isSubmittingSupplier) {
      return;
    }

    setIsSupplierModalOpen(false);
    setSupplierModalError(null);
  };

  /**
   * Handles handle submit supplier for route-level dashboard orchestration.
   *
   * @param data Input consumed by handle submit supplier.
   * @returns A promise that resolves when processing completes.
   */
  const handleSubmitSupplier = async (data: SupplierFormData) => {
    if (isSubmittingSupplier) {
      return;
    }

    setIsSubmittingSupplier(true);
    setSupplierModalError(null);

    try {
      if (supplierModalMode === 'add') {
        await createSupplier(data);
        setCurrentPage(1);
      } else {
        if (!activeSupplier) {
          throw new Error('No supplier selected for editing');
        }

        const updatedSupplier = await updateSupplier(activeSupplier.id, data);
        if (selectedSupplier && selectedSupplier.id === activeSupplier.id) {
          setSelectedSupplier(updatedSupplier);
        }
      }

      setRefreshNonce((prev) => prev + 1);
      setIsSupplierModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save supplier';
      setSupplierModalError(message);
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  /**
   * Handles handle delete supplier for route-level dashboard orchestration.
   *
   * @param supplier Input consumed by handle delete supplier.
   * @returns Computed value for the caller.
   */
  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handles confirm delete supplier for route-level dashboard orchestration.
   * @returns A promise that resolves when processing completes.
   */
  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    setSuppliersLoadError(null);

    try {
      await deleteSupplier(supplierToDelete.id);

      if (selectedSupplier?.id === supplierToDelete.id) {
        setSelectedSupplier(null);
        setIsTransactionModalOpen(false);
      }

      setRefreshNonce((prev) => prev + 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete supplier';
      setSuppliersLoadError(message);
    } finally {
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  };

  /**
   * Handles handle view transactions for route-level dashboard orchestration.
   *
   * @param supplier Input consumed by handle view transactions.
   * @returns Computed value for the caller.
   */
  const handleViewTransactions = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTransactionsPage(1);
    setTransactionsLoadError(null);
    setTransactionMonth('ALL');
    setTransactionYear(new Date().getFullYear().toString());
    setTransactionRefreshNonce((prev) => prev + 1);
  };

  /**
   * Handles handle open transaction modal for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleOpenTransactionModal = () => {
    if (!selectedSupplier) {
      return;
    }

    setTransactionModalError(null);
    setIsTransactionModalOpen(true);
  };

  /**
   * Handles handle close transaction modal for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleCloseTransactionModal = () => {
    if (isSubmittingTransaction) {
      return;
    }

    setIsTransactionModalOpen(false);
    setTransactionModalError(null);
  };

  /**
   * Submits a new supplier transaction for the currently selected supplier.
   *
   * @param data Transaction payload without supplier id.
   * @returns A promise that resolves when processing is complete.
   */
  const handleSubmitTransaction = async (
    data: Omit<TransactionFormData, 'supplierId'>,
  ) => {
    if (!selectedSupplier || isSubmittingTransaction) {
      return;
    }

    setIsSubmittingTransaction(true);
    setTransactionModalError(null);

    try {
      await createTransaction(selectedSupplier.id, data);
      setIsTransactionModalOpen(false);
      setTransactionsPage(1);
      setTransactionRefreshNonce((prev) => prev + 1);
      setRefreshNonce((prev) => prev + 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save transaction';
      setTransactionModalError(message);
    } finally {
      setIsSubmittingTransaction(false);
    }
  };

  return (
    <div className="relative min-h-full pb-24">
      <div className="flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">Suppliers</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 max-w-2xl mx-auto">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          placeholder="Search supplier..."
          className="w-full sm:flex-1"
          inputClassName="bg-surface border-neutral-300 text-secondary placeholder:text-neutral-400"
        />

        <FilterDropdown
          label="Filter"
          options={categoryFilterOptions}
          activeOption={selectedCategoryFilter}
          isOpen={isCategoryFilterOpen}
          onToggle={() => setIsCategoryFilterOpen((prev) => !prev)}
          onSelect={(option) => {
            setSelectedCategoryFilter(option);
            setCurrentPage(1);
            setIsCategoryFilterOpen(false);
            setSelectedSupplier(null);
            setIsTransactionModalOpen(false);
          }}
        />
      </div>

      {/* ── Add Supplier FAB ── */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-20">
        <button
          type="button"
          onClick={handleOpenAddSupplier}
          className="
            flex items-center gap-2 px-5 py-3 bg-primary text-text-light
            rounded-full shadow-lg shadow-primary/30
            hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40
            active:scale-95 transition-all duration-200 cursor-pointer
            text-sm font-semibold
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Supplier</span>
        </button>
      </div>

      <div className="mx-auto max-w-6xl">
        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoadingSuppliers}
          errorMessage={suppliersLoadError}
          selectedSupplierId={selectedSupplier?.id}
          onEditSupplier={handleOpenEditSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          onViewTransactions={handleViewTransactions}
        />

        {!isLoadingSuppliers && !suppliersLoadError && (
          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Showing page {currentPage} of {totalPages} ({totalSuppliers} supplier
              {totalSuppliers === 1 ? '' : 's'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSupplier && (
        <section className="mt-8 mx-auto max-w-6xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-primary text-2xl font-semibold">
              Purchase Transactions: {selectedSupplier.name}
            </h2>

            <button
              type="button"
              onClick={handleOpenTransactionModal}
              className="
                inline-flex items-center justify-center gap-2 px-4 py-2
                bg-secondary-light text-text-light rounded-md
                hover:bg-secondary transition-all duration-200 cursor-pointer
                text-sm font-semibold
              "
            >
              <Plus size={16} strokeWidth={2.5} />
              Log Transaction
            </button>
          </div>

          <DateFilters
            selectedMonth={transactionMonth}
            selectedYear={transactionYear}
            yearOptions={Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())}
            onMonthChange={(month) => {
              setTransactionMonth(month);
              setTransactionsPage(1);
            }}
            onYearChange={(year) => {
              setTransactionYear(year);
              setTransactionsPage(1);
            }}
          />

          <TransactionList
            transactions={transactions}
            isLoading={isLoadingTransactions}
            errorMessage={transactionsLoadError}
            currentPage={transactionsPage}
            totalPages={transactionsTotalPages}
            totalTransactions={transactionsTotal}
            onPreviousPage={() => setTransactionsPage((prev) => Math.max(1, prev - 1))}
            onNextPage={() =>
              setTransactionsPage((prev) => Math.min(transactionsTotalPages, prev + 1))
            }
          />
        </section>
      )}

      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        mode={supplierModalMode}
        onClose={handleCloseSupplierModal}
        onSubmit={handleSubmitSupplier}
        initialData={
          activeSupplier
            ? {
                name: activeSupplier.name,
                serviceCategory: activeSupplier.serviceCategory,
                contactPerson: activeSupplier.contactPerson ?? '',
                contactNumber: activeSupplier.contactNumber ?? '',
                address: activeSupplier.address ?? '',
              }
            : undefined
        }
        isSubmitting={isSubmittingSupplier}
        errorMessage={supplierModalError}
      />

      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        supplierName={selectedSupplier?.name ?? ''}
        onClose={handleCloseTransactionModal}
        onSubmit={handleSubmitTransaction}
        isSubmitting={isSubmittingTransaction}
        errorMessage={transactionModalError}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        itemName={supplierToDelete?.name ?? ''}
        title="Delete Supplier"
        onConfirm={confirmDeleteSupplier}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
