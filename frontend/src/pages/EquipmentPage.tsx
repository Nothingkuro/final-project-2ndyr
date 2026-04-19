import { useEffect, useState } from 'react';
import SearchBar from '../components/common/SearchBar';
import FilterDropdown from '../components/common/FilterDropdown';
import EquipmentTableRow from '../components/equipment/EquipmentTableRow';
import { EquipmentCondition, type Equipment } from '../types/equipment';
import {
  listEquipment,
  updateEquipmentCondition,
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
 * Defines equipment page props used by route-level dashboard orchestration.
 */
interface EquipmentPageProps {
  /**
   * Initial state value for search query.
   */
  initialSearchQuery?: string;
  /**
   * Initial state value for filter.
   */
  initialFilter?: EquipmentFilter;
  /**
   * Initial state value for filter open.
   */
  initialFilterOpen?: boolean;
}

/**
 * Renders the equipment page interface for page-level dashboard orchestration.
 *
 * @param params Input used by equipment page.
 * @returns Rendered JSX output.
 */
export default function EquipmentPage({
  initialSearchQuery = '',
  initialFilter = 'ALL',
  initialFilterOpen = false,
}: EquipmentPageProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearchQuery);
  const [filterOpen, setFilterOpen] = useState(initialFilterOpen);
  const [activeFilter, setActiveFilter] = useState<EquipmentFilter>(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [editingCondition, setEditingCondition] = useState<EquipmentCondition | null>(null);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [equipmentLoadError, setEquipmentLoadError] = useState<string | null>(null);
  const [isSavingCondition, setIsSavingCondition] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isCancelled = false;

    /**
     * Handles load equipment for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadEquipment = async () => {
      try {
        setIsLoadingEquipment(true);
        setEquipmentLoadError(null);

        const response = await listEquipment({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearchQuery,
          condition: activeFilter,
        });

        if (isCancelled) {
          return;
        }

        setEquipmentList(response.items);
        setTotalEquipment(response.total);
        setTotalPages(Math.max(1, response.totalPages));

        if (response.page !== currentPage) {
          setCurrentPage(response.page);
        }
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Failed to load equipment inventory';
        setEquipmentLoadError(message);
      } finally {
        if (!isCancelled) {
          setIsLoadingEquipment(false);
        }
      }
    };

    void loadEquipment();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchQuery, activeFilter, currentPage, refreshNonce]);

  /**
   * Handles handle edit for route-level dashboard orchestration.
   *
   * @param equipmentItem Input consumed by handle edit.
   * @returns Computed value for the caller.
   */
  const handleEdit = (equipmentItem: Equipment) => {
    setEditingEquipmentId(equipmentItem.id);
    setEditingCondition(equipmentItem.condition);
  };

  /**
   * Handles handle cancel edit for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleCancelEdit = () => {
    setEditingEquipmentId(null);
    setEditingCondition(null);
  };

  /**
   * Handles handle save condition for route-level dashboard orchestration.
   * @returns A promise that resolves when processing completes.
   */
  const handleSaveCondition = async () => {
    if (!editingEquipmentId || !editingCondition) {
      return;
    }

    setIsSavingCondition(true);
    setEquipmentLoadError(null);

    try {
      await updateEquipmentCondition(editingEquipmentId, editingCondition);

      setEditingEquipmentId(null);
      setEditingCondition(null);
      setRefreshNonce((prev) => prev + 1);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update equipment condition';
      setEquipmentLoadError(message);
    } finally {
      setIsSavingCondition(false);
    }
  };

  return (
    <div className="relative min-h-full">
      <div className="flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">
          Equipment Status
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          placeholder="Search equipment..."
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

      <div className="max-w-3xl mx-auto">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
          <div className="w-full max-h-96 overflow-auto">
            <table className="w-full min-w-160 border-collapse">
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
                    Last Checked
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoadingEquipment ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                      Loading equipment...
                    </td>
                  </tr>
                ) : equipmentLoadError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-red-600 text-sm">
                      {equipmentLoadError}
                    </td>
                  </tr>
                ) : equipmentList.length > 0 ? (
                  equipmentList.map((equipment, index) => (
                    <EquipmentTableRow
                      key={equipment.id}
                      equipment={equipment}
                      mode="status"
                      index={index}
                      isHovered={hoveredRow === index}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onEditStatus={handleEdit}
                      isEditingCondition={editingEquipmentId === equipment.id}
                      editedCondition={
                        editingEquipmentId === equipment.id
                          ? editingCondition ?? equipment.condition
                          : undefined
                      }
                      onConditionChange={setEditingCondition}
                      onSaveCondition={handleSaveCondition}
                      onCancelConditionEdit={handleCancelEdit}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                      No equipment found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoadingEquipment && !equipmentLoadError && (
          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Showing page {currentPage} of {totalPages} ({totalEquipment} item{totalEquipment === 1 ? '' : 's'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || isSavingCondition}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || isSavingCondition}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
