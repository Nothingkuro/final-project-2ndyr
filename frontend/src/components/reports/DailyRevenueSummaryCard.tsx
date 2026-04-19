import { Smartphone, TrendingUp, Wallet } from 'lucide-react';
import type { RevenueBreakdown } from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

/**
 * Defines daily revenue summary card props used by feature UI behavior.
 */
interface DailyRevenueSummaryCardProps {
  /**
   * Data used for revenue behavior.
   */
  revenue: RevenueBreakdown;
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Handles format date label logic for feature UI behavior.
 *
 * @param value Input used by format date label.
 * @returns Computed value for the caller.
 */
function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

/**
 * Renders the daily revenue summary card view for feature UI behavior.
 *
 * @param params Input consumed by daily revenue summary card.
 * @returns Rendered JSX content.
 */
export default function DailyRevenueSummaryCard({ revenue }: DailyRevenueSummaryCardProps) {
  return (
    <ReportSectionCard
      title="Daily Revenue Summary"
      subtitle={`For ${formatDateLabel(revenue.date)}`}
      icon={<TrendingUp size={20} />}
      iconClassName="bg-success/20 text-success"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/10 p-4">
          <p className="text-xs uppercase tracking-wide text-success">Total Collected Today</p>
          <p className="mt-2 text-3xl font-semibold leading-tight text-success">
            {pesoFormatter.format(revenue.total)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-700 bg-secondary p-3">
            <div className="mb-2 flex items-center gap-2 text-neutral-300">
              <Wallet size={16} />
              <span className="text-sm">Cash</span>
            </div>
            <p className="text-xl font-semibold text-text-light">{pesoFormatter.format(revenue.cash)}</p>
          </div>

          <div className="rounded-lg border border-neutral-700 bg-secondary p-3">
            <div className="mb-2 flex items-center gap-2 text-neutral-300">
              <Smartphone size={16} />
              <span className="text-sm">GCash</span>
            </div>
            <p className="text-xl font-semibold text-text-light">{pesoFormatter.format(revenue.gcash)}</p>
          </div>
        </div>
      </div>
    </ReportSectionCard>
  );
}
