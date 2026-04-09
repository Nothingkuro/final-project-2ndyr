import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Supplier } from '../../types/supplier';

interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  errorMessage?: string | null;
  selectedSupplierId?: string | null;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  onViewTransactions: (supplier: Supplier) => void;
}

function getDisplayValue(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : 'N/A';
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export default function SupplierTable({
  suppliers,
  isLoading,
  errorMessage = null,
  selectedSupplierId = null,
  onEditSupplier,
  onDeleteSupplier,
  onViewTransactions,
}: SupplierTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
      <div className="w-full max-h-75 overflow-auto">
        <table className="w-full min-w-220 border-collapse">
          <thead className="bg-surface-alt border-b border-neutral-300">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Name
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Contact Person
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Contact Number
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Address
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                  Loading suppliers...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-red-600 text-sm">
                  {errorMessage}
                </td>
              </tr>
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier, index) => {
                const isHovered = hoveredRow === index;
                const isSelected = selectedSupplierId === supplier.id;
                const rowClassName = `
                  border-b border-neutral-200 last:border-b-0 transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/20'
                      : isHovered
                        ? 'bg-warning'
                        : index % 2 === 0
                          ? 'bg-surface'
                          : 'bg-surface-alt/50'
                  }
                `;

                return (
                  <tr
                    key={supplier.id}
                    className={rowClassName}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td
                      title={supplier.name}
                      className={`px-4 sm:px-6 py-3 text-sm min-w-0 truncate ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}
                    >
                      {truncateText(supplier.name, 36)}
                    </td>
                    <td
                      title={getDisplayValue(supplier.contactPerson)}
                      className={`px-4 sm:px-6 py-3 text-sm min-w-0 truncate ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}
                    >
                      {truncateText(getDisplayValue(supplier.contactPerson), 28)}
                    </td>
                    <td
                      title={getDisplayValue(supplier.contactNumber)}
                      className={`px-4 sm:px-6 py-3 text-sm whitespace-nowrap ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}
                    >
                      {getDisplayValue(supplier.contactNumber)}
                    </td>
                    <td
                      title={getDisplayValue(supplier.address)}
                      className={`px-4 sm:px-6 py-3 text-sm min-w-0 truncate ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}
                    >
                      {truncateText(getDisplayValue(supplier.address), 40)}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`View transactions for ${supplier.name}`}
                          title="View transactions"
                          onClick={() => onViewTransactions(supplier)}
                          className="p-2 rounded-md border border-info/40 text-info hover:bg-info/10 transition-colors duration-150 cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit supplier ${supplier.name}`}
                          title="Edit supplier"
                          onClick={() => onEditSupplier(supplier)}
                          className="p-2 rounded-md border border-neutral-300 text-secondary hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete supplier ${supplier.name}`}
                          title="Delete supplier"
                          onClick={() => onDeleteSupplier(supplier)}
                          className="p-2 rounded-md border border-danger/40 text-danger hover:bg-danger/10 transition-colors duration-150 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">
                  No suppliers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
