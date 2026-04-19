import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import FilterDropdown from '../components/common/FilterDropdown';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import AssetFormModal, { type AssetFormData } from '../components/equipment/AssetFormModal';
import EquipmentTableRow from '../components/equipment/EquipmentTableRow';
import { EquipmentCondition, type Equipment } from '../types/equipment';
import {
  createEquipment,
  deleteEquipment,
  listEquipment,
  updateEquipment,
  type EquipmentFilter,
} from '../services/equipmentApi';

const filterOptions: Array<{ label: string; value: EquipmentFilter }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Good', value: EquipmentCondition.GOOD },
  { label: 'Maintenance', value: EquipmentCondition.MAINTENANCE },
  { label: 'Broken', value: EquipmentCondition.BROKEN },
];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Renders the admin assets page view for route-level dashboard orchestration.
 * @returns Rendered JSX content.
 */
export default function AdminAssetsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EquipmentFilter>('ALL');
  const [assets, setAssets] = useState<Equipment[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetsLoadError, setAssetsLoadError] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetModalMode, setAssetModalMode] = useState<'add' | 'edit'>('add');
  const [activeAsset, setActiveAsset] = useState<Equipment | null>(null);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [assetModalError, setAssetModalError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Equipment | null>(null);

  useEffect(() => {
    const role = window.sessionStorage.getItem('authRole');
    if (role !== 'ADMIN') {
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
     * Handles load assets for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadAssets = async () => {
      try {
        setIsLoadingAssets(true);
        setAssetsLoadError(null);

        const response = await listEquipment({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearchQuery,
          condition: activeFilter,
        });

        if (isCancelled) {
          return;
        }

        setAssets(response.items);
        setTotalAssets(response.total);
        setTotalPages(Math.max(1, response.totalPages));

        if (response.page !== currentPage) {
          setCurrentPage(response.page);
        }
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load assets';
        setAssetsLoadError(message);
      } finally {
        if (!isCancelled) {
          setIsLoadingAssets(false);
        }
      }
    };

    void loadAssets();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchQuery, activeFilter, currentPage, refreshNonce]);

  /**
   * Handles handle open add asset for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleOpenAddAsset = () => {
    setAssetModalMode('add');
    setActiveAsset(null);
    setAssetModalError(null);
    setIsAssetModalOpen(true);
  };

  /**
   * Handles handle open edit asset for route-level dashboard orchestration.
   *
   * @param equipment Input consumed by handle open edit asset.
   * @returns Computed value for the caller.
   */
  const handleOpenEditAsset = (equipment: Equipment) => {
    setAssetModalMode('edit');
    setActiveAsset(equipment);
    setAssetModalError(null);
    setIsAssetModalOpen(true);
  };

  /**
   * Handles handle close asset modal for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleCloseAssetModal = () => {
    if (isSubmittingAsset) {
      return;
    }

    setIsAssetModalOpen(false);
    setAssetModalError(null);
  };

  /**
   * Handles handle submit asset for route-level dashboard orchestration.
   *
   * @param data Input consumed by handle submit asset.
   * @returns A promise that resolves when processing completes.
   */
  const handleSubmitAsset = async (data: AssetFormData) => {
    if (isSubmittingAsset) {
      return;
    }

    setIsSubmittingAsset(true);
    setAssetModalError(null);

    try {
      if (assetModalMode === 'add') {
        await createEquipment({
          itemName: data.itemName,
          quantity: data.quantity,
          condition: data.condition,
        });
      } else {
        if (!activeAsset) {
          throw new Error('No asset selected for editing');
        }

        await updateEquipment(activeAsset.id, {
          itemName: data.itemName,
          quantity: data.quantity,
          condition: data.condition,
        });
      }

      if (assetModalMode === 'add') {
        setCurrentPage(1);
      }
      setRefreshNonce((prev) => prev + 1);
      setIsAssetModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save asset';
      setAssetModalError(message);
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  /**
   * Handles handle delete asset for route-level dashboard orchestration.
   *
   * @param equipment Input consumed by handle delete asset.
   * @returns Computed value for the caller.
   */
  const handleDeleteAsset = (equipment: Equipment) => {
    setAssetToDelete(equipment);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handles confirm delete asset for route-level dashboard orchestration.
   * @returns A promise that resolves when processing completes.
   */
  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;

    setAssetsLoadError(null);

    try {
      await deleteEquipment(assetToDelete.id);
      setRefreshNonce((prev) => prev + 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete asset';
      setAssetsLoadError(message);
    } finally {
      setIsDeleteModalOpen(false);
      setAssetToDelete(null);
    }
  };

  return (
    <div className="relative min-h-full pb-24">
      <div className="flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">
          Assets Inventory
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          placeholder="Search assets..."
          className="flex-1"
          inputClassName="bg-surface border-neutral-300 text-secondary placeholder:text-neutral-400"
        />

        <FilterDropdown
          label="Filter"
          options={filterOptions}
          activeOption={activeFilter}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen((prev) => !prev)}
          onSelect={(option) => {
            setActiveFilter(option as EquipmentFilter);
            setCurrentPage(1);
            setFilterOpen(false);
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
          <div className="w-full max-h-96 overflow-auto">
            <table className="w-full min-w-180 border-collapse">
              <thead className="bg-surface-alt border-b border-neutral-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Item Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Qty
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Condition
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Updated At
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoadingAssets ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                      Loading assets...
                    </td>
                  </tr>
                ) : assetsLoadError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-red-600 text-sm">
                      {assetsLoadError}
                    </td>
                  </tr>
                ) : assets.length > 0 ? (
                  assets.map((equipment, index) => (
                    <EquipmentTableRow
                      key={equipment.id}
                      equipment={equipment}
                      mode="admin"
                      index={index}
                      isHovered={hoveredRow === index}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onEditAsset={handleOpenEditAsset}
                      onDeleteAsset={handleDeleteAsset}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                      No assets found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoadingAssets && !assetsLoadError && (
          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Showing page {currentPage} of {totalPages} ({totalAssets} asset{totalAssets === 1 ? '' : 's'})
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

      <button
        type="button"
        onClick={handleOpenAddAsset}
        className="
          fixed bottom-8 right-6 sm:right-10 z-20
          inline-flex items-center gap-2 px-5 py-3
          rounded-full bg-primary text-text-light font-semibold text-sm
          shadow-lg shadow-primary/35 hover:bg-primary-dark
          active:scale-[0.98] transition-all duration-200 cursor-pointer
        "
        aria-label="Add asset"
      >
        <Plus size={18} />
        <span>Add Asset</span>
      </button>

      <AssetFormModal
        isOpen={isAssetModalOpen}
        mode={assetModalMode}
        onClose={handleCloseAssetModal}
        onSubmit={handleSubmitAsset}
        initialData={
          activeAsset
            ? {
                itemName: activeAsset.itemName,
                quantity: activeAsset.quantity,
                condition: activeAsset.condition,
              }
            : undefined
        }
        isSubmitting={isSubmittingAsset}
        errorMessage={assetModalError}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        itemName={assetToDelete?.itemName ?? ''}
        title="Delete Asset"
        onConfirm={confirmDeleteAsset}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
