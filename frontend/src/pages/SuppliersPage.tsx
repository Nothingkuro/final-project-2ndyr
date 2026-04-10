import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterDropdown from '../components/common/FilterDropdown';
import SearchBar from '../components/common/SearchBar';
import AddTransactionModal from '../components/suppliers/AddTransactionModal';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierTable from '../components/suppliers/SupplierTable';
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

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [transactionModalError, setTransactionModalError] = useState<string | null>(null);

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

    const loadTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        setTransactionsLoadError(null);

        const response = await listTransactionsBySupplier(selectedSupplier.id, {
          page: transactionsPage,
          pageSize: TRANSACTION_PAGE_SIZE,
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
  }, [selectedSupplier, transactionsPage, transactionRefreshNonce]);

  const handleOpenAddSupplier = () => {
    setSupplierModalMode('add');
    setActiveSupplier(null);
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setSupplierModalMode('edit');
    setActiveSupplier(supplier);
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  const handleCloseSupplierModal = () => {
    if (isSubmittingSupplier) {
      return;
    }

    setIsSupplierModalOpen(false);
    setSupplierModalError(null);
  };

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

  const handleDeleteSupplier = async (supplier: Supplier) => {
    const isConfirmed = window.confirm(
      `Delete supplier ${supplier.name}? This action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    setSuppliersLoadError(null);

    try {
      await deleteSupplier(supplier.id);

      if (selectedSupplier?.id === supplier.id) {
        setSelectedSupplier(null);
        setIsTransactionModalOpen(false);
      }

      setRefreshNonce((prev) => prev + 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete supplier';
      setSuppliersLoadError(message);
    }
  };

  const handleViewTransactions = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTransactionsPage(1);
    setTransactionsLoadError(null);
    setTransactionRefreshNonce((prev) => prev + 1);
  };

  const handleOpenTransactionModal = () => {
    if (!selectedSupplier) {
      return;
    }

    setTransactionModalError(null);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    if (isSubmittingTransaction) {
      return;
    }

    setIsTransactionModalOpen(false);
    setTransactionModalError(null);
  };

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

      <div className="mb-6 mx-auto max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:items-center">
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

        <button
          type="button"
          onClick={handleOpenAddSupplier}
          className="
            inline-flex items-center justify-center gap-2 px-5 py-2.5
            bg-primary text-text-light rounded-full shadow-md shadow-primary/25
            hover:bg-primary-dark transition-all duration-200 cursor-pointer
            text-sm font-semibold
          "
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Supplier
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
    </div>
  );
}
