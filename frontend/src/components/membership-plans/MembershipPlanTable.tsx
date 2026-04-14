import type { MembershipPlan } from '../../types/membershipPlan';
import MembershipPlanTableRow from './MembershipPlanTableRow';

interface MembershipPlanTableProps {
  plans: MembershipPlan[];
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (plan: MembershipPlan) => void;
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
              <MembershipPlanTableRow
                key={plan.id}
                plan={plan}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
