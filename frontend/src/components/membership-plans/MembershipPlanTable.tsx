import type { MembershipPlan } from '../../types/membershipPlan';
import MembershipPlanTableRow from './MembershipPlanTableRow';

/**
 * Defines membership plan table props used by feature UI behavior.
 */
interface MembershipPlanTableProps {
  /**
   * Collection data rendered by plans UI.
   */
  plans: MembershipPlan[];
  /**
   * Callback fired when edit.
   */
  onEdit: (plan: MembershipPlan) => void;
  /**
   * Callback fired when delete.
   */
  onDelete: (plan: MembershipPlan) => void;
}

/**
 * Renders the membership plan table interface for feature UI behavior.
 *
 * @param params Input used by membership plan table.
 * @returns Rendered JSX output.
 */
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
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface flex flex-col max-h-100">
      {/* Desktop-only header row */}
      <div className="hidden md:grid md:grid-cols-[2fr_3fr_1fr_1fr_auto_auto] gap-4 bg-surface-alt border-b border-neutral-300 px-6 py-3 sticky top-0 z-10 shrink-0">
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
          Plan Name
        </span>
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
          Description
        </span>
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase text-right">
          Price
        </span>
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase text-center">
          Duration
        </span>
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase text-center">
          Status
        </span>
        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase text-right">
          Actions
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {plans.map((plan, index) => (
          <MembershipPlanTableRow
            key={plan.id}
            plan={plan}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
