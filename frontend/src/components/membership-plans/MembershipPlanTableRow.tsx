import { Edit, Trash2 } from 'lucide-react';
import type { MembershipPlan } from '../../types/membershipPlan';
import StatusBadge from './StatusBadge';

/**
 * Defines membership plan table row props used by feature UI behavior.
 */
interface MembershipPlanTableRowProps {
  /**
   * Data used for plan behavior.
   */
  plan: MembershipPlan;
  /**
   * Data used for index behavior.
   */
  index: number;
  /**
   * Callback fired when edit.
   */
  onEdit: (plan: MembershipPlan) => void;
  /**
   * Callback fired when delete.
   */
  onDelete: (plan: MembershipPlan) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDuration(days: number): string {
  if (days === 1) return '1 Day';
  if (days < 30) return `${days} Days`;
  if (days === 30) return '1 Month';
  if (days === 60) return '2 Months';
  if (days === 90) return '3 Months';
  if (days === 180) return '6 Months';
  if (days === 365) return '1 Year';
  return `${days} Days`;
}

/**
 * Renders the membership plan table row interface for feature UI behavior.
 *
 * @param params Input used by membership plan table row.
 * @returns Rendered JSX output.
 */
export default function MembershipPlanTableRow({
  plan,
  index,
  onEdit,
  onDelete,
}: MembershipPlanTableRowProps) {
  const actionButtons = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(plan)}
        title="Edit plan"
        className="
          p-2 rounded-lg text-neutral-400
          hover:text-info hover:bg-info/10
          transition-all duration-200 cursor-pointer
        "
      >
        <Edit size={16} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(plan)}
        title="Delete plan"
        className="
          p-2 rounded-lg text-neutral-400
          hover:text-danger hover:bg-danger/10
          transition-all duration-200 cursor-pointer
        "
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div
      className={`
        border-b border-neutral-200 last:border-b-0
        transition-colors duration-150 hover:bg-neutral-100/60
        ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt/40'}
      `}
    >
      {/* Mobile card layout */}
      <div className="md:hidden px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-secondary">{plan.name}</p>
          <StatusBadge isActive={plan.isActive} />
        </div>

        {plan.description && (
          <p className="text-sm text-neutral-500">{plan.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Price</p>
              <p className="font-medium tabular-nums text-secondary">
                {formatCurrency(plan.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Duration</p>
              <p className="text-neutral-600">{formatDuration(plan.durationDays)}</p>
            </div>
          </div>
          {actionButtons}
        </div>
      </div>

      {/* Desktop row layout — columns match MembershipPlanTable header */}
      <div className="hidden md:grid md:grid-cols-[2fr_3fr_1fr_1fr_auto_auto] items-center gap-4 px-6 py-4">
        <span className="text-sm font-medium text-secondary">{plan.name}</span>
        <span className="text-sm text-neutral-500 truncate">
          {plan.description || '—'}
        </span>
        <span className="text-sm font-medium text-secondary tabular-nums text-right">
          {formatCurrency(plan.price)}
        </span>
        <span className="text-sm text-neutral-600 text-center">
          {formatDuration(plan.durationDays)}
        </span>
        <div className="flex justify-center">
          <StatusBadge isActive={plan.isActive} />
        </div>
        {actionButtons}
      </div>
    </div>
  );
}
