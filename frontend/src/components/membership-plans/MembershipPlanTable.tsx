import { Edit, Trash2 } from 'lucide-react';
import type { MembershipPlan } from '../../types/membershipPlan';
import StatusBadge from './StatusBadge';

interface MembershipPlanTableProps {
  plans: MembershipPlan[];
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

export default function MembershipPlanTable({
  plans,
  onEdit,
  onDelete,
}: MembershipPlanTableProps) {
  if (plans.length === 0) {
    return (
      <div className="border border-neutral-300 rounded-lg bg-surface px-6 py-16 text-center text-neutral-400 text-sm">
        No membership plans found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="max-h-[400px] border border-neutral-300 rounded-lg overflow-hidden bg-surface h-full flex flex-col">
      <div className="w-full flex-1 overflow-auto">
        <table className="w-full min-w-[640px] border-collapse relative">
          <thead className="bg-surface-alt border-b border-neutral-300 sticky top-0 z-10">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Plan Name
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold tracking-wide text-neutral-600 uppercase hidden sm:table-cell">
                Description
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Price
              </th>
              <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Duration
              </th>
              <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan, index) => (
              <tr
                key={plan.id}
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
                <td className="px-4 sm:px-6 py-4 text-sm text-neutral-500 hidden sm:table-cell max-w-[200px] truncate">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
