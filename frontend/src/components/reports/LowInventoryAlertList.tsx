import { AlertTriangle } from 'lucide-react';
import type { InventoryAlert } from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

/**
 * Defines low inventory alert list props used by feature UI behavior.
 */
interface LowInventoryAlertListProps {
  /**
   * Collection data rendered by alerts UI.
   */
  alerts: InventoryAlert[];
  /**
   * Data used for threshold behavior.
   */
  threshold?: number;
  /**
   * Callback fired when threshold change.
   */
  onThresholdChange?: (threshold: number) => void;
  /**
   * Callback fired when refresh.
   */
  onRefresh?: () => void;
  /**
   * Data used for is refreshing behavior.
   */
  isRefreshing?: boolean;
}

/**
 * Renders the low inventory alert list interface for feature UI behavior.
 *
 * @param params Input used by low inventory alert list.
 * @returns Rendered JSX output.
 */
export default function LowInventoryAlertList({
  alerts,
  threshold = 5,
  onThresholdChange,
  onRefresh,
  isRefreshing = false,
}: LowInventoryAlertListProps) {
  const effectiveThreshold = alerts[0]?.threshold ?? threshold;

  const lowStockItems = alerts
    .filter((alert) => alert.quantity < (alert.threshold ?? threshold))
    .sort((a, b) => a.quantity - b.quantity);

  return (
    <ReportSectionCard
      title="Low Inventory Alerts"
      subtitle={`Equipment below threshold (${effectiveThreshold} units)`}
      icon={<AlertTriangle size={20} />}
      iconClassName="bg-danger/20 text-danger"
      actionSlot={
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="inventory-threshold" className="text-sm text-neutral-300">
            Threshold
          </label>
          <input
            id="inventory-threshold"
            type="number"
            min={0}
            value={threshold}
            onChange={(event) => {
              const nextValue = Math.max(0, Number(event.target.value) || 0);
              onThresholdChange?.(nextValue);
            }}
            className="w-24 rounded-md border border-neutral-700 bg-secondary px-3 py-2 text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-danger/60"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || !onRefresh}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-text-light transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      }
    >
      {lowStockItems.length === 0 ? (
        <p className="rounded-lg border border-neutral-600 bg-secondary px-4 py-3 text-sm text-neutral-300">
          No low inventory alerts right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {lowStockItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-600 bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-text-light">{item.itemName}</p>
              </div>

              <span className="inline-flex w-fit items-center rounded-md border border-danger/40 bg-danger/15 px-2.5 py-1 text-sm font-semibold text-danger">
                Qty: {item.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportSectionCard>
  );
}
