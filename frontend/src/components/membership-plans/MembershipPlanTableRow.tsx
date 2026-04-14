import { Edit, Trash2 } from 'lucide-react';
import type { MembershipPlan } from '../../types/membershipPlan';
import StatusBadge from './StatusBadge';

interface MembershipPlanTableRowProps {
  plan: MembershipPlan;
  index: number;
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (plan: MembershipPlan) => void;
}

/** Format a number as Philippine Peso currency */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
}

/** Humanise a duration in days */
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

export default function MembershipPlanTableRow({
  plan,
  index,
  onEdit,
  onDelete,
}: MembershipPlanTableRowProps) {
  return (
    <tr
      className={`
        border-b border-neutral-200 last:border-b-0
        transition-colors duration-150
        hover:bg-neutral-100/60
        ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-alt/40'}
      `}
    >
      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-secondary">
        {plan.name}
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm text-neutral-500 hidden sm:table-cell max-w-50 truncate">
        {plan.description || '—'}
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm text-secondary text-right font-medium tabular-nums">
        {formatCurrency(plan.price)}
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 text-center">
        {formatDuration(plan.durationDays)}
      </td>
      <td className="px-4 sm:px-6 py-4 text-center">
        <StatusBadge isActive={plan.isActive} />
      </td>
      <td className="px-4 sm:px-6 py-4 text-right">
        <div className="inline-flex items-center gap-1">
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
      </td>
    </tr>
  );
}