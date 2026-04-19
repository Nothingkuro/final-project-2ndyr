import { CheckCircle, Edit, Trash2, X } from 'lucide-react';
import { EquipmentCondition, type Equipment } from '../../types/equipment';
import ConditionBadge from './ConditionBadge';

/**
 * Defines equipment table row props used by feature UI behavior.
 */
interface EquipmentTableRowProps {
  /**
   * Collection data rendered by equipment UI.
   */
  equipment: Equipment;
  /**
   * Data used for mode behavior.
   */
  mode: 'status' | 'admin';
  /**
   * Data used for index behavior.
   */
  index: number;
  /**
   * Data used for is hovered behavior.
   */
  isHovered: boolean;
  /**
   * Callback fired when mouse enter.
   */
  onMouseEnter: () => void;
  /**
   * Callback fired when mouse leave.
   */
  onMouseLeave: () => void;
  /**
   * Callback fired when edit status.
   */
  onEditStatus?: (equipment: Equipment) => void;
  /**
   * Callback fired when edit asset.
   */
  onEditAsset?: (equipment: Equipment) => void;
  /**
   * Callback fired when delete asset.
   */
  onDeleteAsset?: (equipment: Equipment) => void;
  /**
   * Data used for is editing condition behavior.
   */
  isEditingCondition?: boolean;
  /**
   * Data used for edited condition behavior.
   */
  editedCondition?: EquipmentCondition;
  /**
   * Callback fired when condition change.
   */
  onConditionChange?: (condition: EquipmentCondition) => void;
  /**
   * Callback fired when save condition.
   */
  onSaveCondition?: () => void;
  /**
   * Callback fired when cancel condition edit.
   */
  onCancelConditionEdit?: () => void;
  /**
   * Callback fired when click.
   */
  onClick?: () => void;
}

/**
 * Handles format date time logic for feature UI behavior.
 *
 * @param value Input used by format date time.
 * @returns Computed value for the caller.
 */
function formatDateTime(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders the equipment table row interface for feature UI behavior.
 *
 * @param params Input used by equipment table row.
 * @returns Rendered JSX output.
 */
export default function EquipmentTableRow({
  equipment,
  mode,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onEditStatus,
  onEditAsset,
  onDeleteAsset,
  isEditingCondition = false,
  editedCondition,
  onConditionChange,
  onSaveCondition,
  onCancelConditionEdit,
  onClick,
}: EquipmentTableRowProps) {
  const displayedItemName =
    equipment.itemName.length > 20
      ? `${equipment.itemName.slice(0, 20)}...`
      : equipment.itemName;

  const rowClassName = `
    border-b border-neutral-200 last:border-b-0 transition-all duration-200
    ${
      isHovered
        ? 'bg-warning'
        : index % 2 === 0
          ? 'bg-surface'
          : 'bg-surface-alt/50'
    }
    ${onClick ? 'cursor-pointer' : ''}
  `;

  return (
    <tr
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={rowClassName}
    >
      <td
        title={equipment.itemName}
        className={`px-4 sm:px-6 py-3 text-sm min-w-0 truncate ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}
      >
        {displayedItemName}
      </td>

      <td className={`px-4 sm:px-6 py-3 text-sm text-center whitespace-nowrap ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}>
        {equipment.quantity}
      </td>

      <td className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">
        {mode === 'status' && isEditingCondition ? (
          <select
            aria-label={`Condition for ${equipment.itemName}`}
            value={editedCondition ?? equipment.condition}
            onChange={(event) => onConditionChange?.(event.target.value as EquipmentCondition)}
            className="w-36 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          >
            <option value={EquipmentCondition.GOOD}>Good</option>
            <option value={EquipmentCondition.MAINTENANCE}>Maintenance</option>
            <option value={EquipmentCondition.BROKEN}>Broken</option>
          </select>
        ) : (
          <ConditionBadge
            condition={equipment.condition}
            variant="pill"
            className={isHovered ? 'ring-1 ring-secondary/20' : ''}
          />
        )}
      </td>

      <td className={`px-4 sm:px-6 py-3 text-sm text-right whitespace-nowrap ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}`}>
        {mode === 'status' ? formatDateTime(equipment.lastChecked) : formatDateTime(equipment.updatedAt)}
      </td>

      <td className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-end gap-2">
          {mode === 'status' && isEditingCondition ? (
            <>
              <button
                type="button"
                aria-label={`Save condition for ${equipment.itemName}`}
                title="Save condition"
                onClick={(event) => {
                  event.stopPropagation();
                  onSaveCondition?.();
                }}
                className="p-2 rounded-md border border-success/40 text-success hover:bg-success/10 transition-colors duration-150 cursor-pointer"
              >
                <CheckCircle size={16} />
              </button>
              <button
                type="button"
                aria-label={`Cancel editing condition for ${equipment.itemName}`}
                title="Cancel"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelConditionEdit?.();
                }}
                className="p-2 rounded-md border border-neutral-300 text-secondary hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
              >
                <X size={16} />
              </button>
            </>
          ) : mode === 'status' ? (
            <button
              type="button"
              aria-label={`Edit condition for ${equipment.itemName}`}
              title="Edit condition"
              onClick={(event) => {
                event.stopPropagation();
                onEditStatus?.(equipment);
              }}
              className="p-2 rounded-md border border-neutral-300 text-secondary hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
            >
              <Edit size={16} />
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-label={`Edit asset ${equipment.itemName}`}
                title="Edit asset"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditAsset?.(equipment);
                }}
                className="p-2 rounded-md border border-neutral-300 text-secondary hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
              >
                <Edit size={16} />
              </button>
              <button
                type="button"
                aria-label={`Delete asset ${equipment.itemName}`}
                title="Delete asset"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteAsset?.(equipment);
                }}
                className="p-2 rounded-md border border-danger/40 text-danger hover:bg-danger/10 transition-colors duration-150 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
