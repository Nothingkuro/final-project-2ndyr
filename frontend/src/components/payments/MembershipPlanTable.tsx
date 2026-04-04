import type { MembershipPlan } from '../../types/payment';

interface MembershipPlanTableProps {
  plans: MembershipPlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

function formatPhp(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MembershipPlanTable({
  plans,
  selectedPlanId,
  onSelectPlan,
  isLoading = false,
}: MembershipPlanTableProps) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-primary">Membership Plan Table</h2>
      <div className="max-h-50 overflow-auto rounded-md border border-neutral-300 bg-surface">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-alt/60 text-xs uppercase tracking-wide text-neutral-500">
              <th className="border-b border-neutral-300 px-4 py-2 text-left font-semibold">
                Membership Plan Name
              </th>
              <th className="border-b border-neutral-300 px-4 py-2 text-left font-semibold">
                Membership Price
              </th>
              <th className="border-b border-neutral-300 px-4 py-2 text-left font-semibold">
                Membership Description
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  {isLoading ? 'Loading plans...' : 'No active plans available'}
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => onSelectPlan(plan.id)}
                  className={`cursor-pointer border-b border-neutral-200 last:border-b-0 ${
                    selectedPlanId === plan.id ? 'bg-warning' : 'hover:bg-surface-alt/70'
                  }`}
                  aria-selected={selectedPlanId === plan.id}
                >
                  <td className="px-4 py-2 text-secondary">{plan.name}</td>
                  <td className="px-4 py-2 text-secondary">{formatPhp(plan.price)}</td>
                  <td className="px-4 py-2 text-secondary">{plan.description?.trim() || 'No description provided'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
