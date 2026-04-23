import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AnalyticsCharts,
  DailyRevenueSummaryCard,
  LowInventoryAlertList,
  MembershipExpiryAlertList,
  MonthlyRevenueReportCard,
  RiskAlertList,
} from '../components/reports';
import {
  getAtRiskMembers,
  getPeakUtilization,
  getReportsOverview,
  getRevenueForecast,
} from '../services/reportsApi';
import type {
  AtRiskMembersResponse,
  ForecastMode,
  MonthlyRevenueRecord,
  PeakUtilization,
  ReportData,
  RevenueForecast,
} from '../types/report';

const DEFAULT_INVENTORY_THRESHOLD = 5;

/**
 * Finds the most recent month/year revenue record for default dashboard focus.
 *
 * The reports page uses this to preselect the freshest month in summary widgets,
 * so managers immediately see current business performance after load.
 *
 * @param records Monthly revenue records returned by reporting endpoints.
 * @returns Latest record by chronological order, or `null` when no data exists.
 */
function getLatestRecord(records: MonthlyRevenueRecord[]): MonthlyRevenueRecord | null {
  if (records.length === 0) {
    return null;
  }

  return records.reduce((latest, record) => {
    if (record.year > latest.year) {
      return record;
    }

    if (record.year === latest.year && record.month > latest.month) {
      return record;
    }

    return latest;
  });
}

/**
 * Reports and analytics dashboard for finance, inventory, and retention monitoring.
 *
 * This route composes multiple report sources so admin users can review revenue,
 * low-stock inventory alerts, upcoming expirations, churn-risk members, and
 * utilization trends in one operational view.
 */
export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [atRiskData, setAtRiskData] = useState<AtRiskMembersResponse | null>(null);
  const [forecastMode, setForecastMode] = useState<ForecastMode>('CONSERVATIVE');
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast | null>(null);
  const [peakUtilization, setPeakUtilization] = useState<PeakUtilization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRiskLoading, setIsRiskLoading] = useState(true);
  const [isForecastLoading, setIsForecastLoading] = useState(true);
  const [isUtilizationLoading, setIsUtilizationLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inventoryThreshold, setInventoryThreshold] = useState(DEFAULT_INVENTORY_THRESHOLD);
  const isInitialLoading = isLoading && !reportData && !loadError;

  const latestMonthlyRecord = getLatestRecord(reportData?.monthlyRevenue ?? []);
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    latestMonthlyRecord?.month ?? currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(
    latestMonthlyRecord?.year ?? currentDate.getFullYear(),
  );
  const authRole = window.sessionStorage.getItem('authRole');

  /**
   * Loads the report modules needed by the page and keeps the UI state synchronized.
   *
   * @param threshold Minimum stock level before equipment is treated as low inventory.
   * @param mode Forecasting strategy used for next-month projection (conservative vs optimistic).
   *
   * @returns Promise that resolves after all dashboard sections have been refreshed.
   */
  const loadReports = async (threshold: number, mode: ForecastMode = forecastMode) => {
    setIsLoading(true);
    setIsRiskLoading(true);
    setIsForecastLoading(true);
    setIsUtilizationLoading(true);
    setLoadError(null);

    try {
      const [overviewData, riskData, forecastData, utilizationData] = await Promise.all([
        getReportsOverview({ threshold, days: 3 }),
        getAtRiskMembers(),
        getRevenueForecast(mode),
        getPeakUtilization(),
      ]);

      setReportData({
        ...overviewData,
        atRiskMembers: riskData.items,
        revenueForecast: forecastData,
        peakUtilization: utilizationData,
      });
      setAtRiskData(riskData);
      setRevenueForecast(forecastData);
      setPeakUtilization(utilizationData);

      const latestRecord = getLatestRecord(overviewData.monthlyRevenue);
      if (latestRecord) {
        setSelectedMonth(latestRecord.month);
        setSelectedYear(latestRecord.year);
      }
    } finally {
      setIsLoading(false);
      setIsRiskLoading(false);
      setIsForecastLoading(false);
      setIsUtilizationLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    /**
     * Performs first-load dashboard fetch with the default inventory threshold.
     *
     * This ensures low-inventory cards initially reflect items below the baseline
     * operational minimum before user customization.
     */
    const loadInitialReports = async () => {
      try {
        await loadReports(DEFAULT_INVENTORY_THRESHOLD);

        if (isCancelled) {
          return;
        }
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load reports';
        setLoadError(message);
      }
    };

    void loadInitialReports();

    return () => {
      isCancelled = true;
    };
  }, []);

  /**
   * Re-runs all dashboard queries using the currently selected page filters.
   */
  const handleRefresh = async () => {
    try {
      await loadReports(inventoryThreshold, forecastMode);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load reports';
      setLoadError(message);
    }
  };

  /**
   * Refreshes only the forecast module when strategy mode changes.
   *
   * This allows quick scenario comparison without reloading unrelated report cards.
   *
   * @param mode Forecasting algorithm to apply (`CONSERVATIVE` or `OPTIMISTIC`).
   */
  const handleForecastModeChange = async (mode: ForecastMode) => {
    setForecastMode(mode);
    setIsForecastLoading(true);
    setLoadError(null);

    try {
      const forecastData = await getRevenueForecast(mode);
      setRevenueForecast(forecastData);

      setReportData((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          revenueForecast: forecastData,
        };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load forecast';
      setLoadError(message);
    } finally {
      setIsForecastLoading(false);
    }
  };

  if (authRole !== 'ADMIN') {
    return <Navigate to="/dashboard/members" replace />;
  }

  return (
    <div className="relative min-h-full">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-primary text-3xl sm:text-4xl font-semibold">
            Reports and Analytics
          </h1>
        </div>

        {isLoading && reportData ? (
          <p className="text-center text-sm text-secondary">Refreshing reports...</p>
        ) : null}

        {isInitialLoading ? (
          <div className="rounded-xl border border-neutral-300 bg-surface px-5 py-4 text-sm text-neutral-500">
            Loading reports...
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : reportData ? (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DailyRevenueSummaryCard revenue={reportData.dailyRevenue} />
              <MonthlyRevenueReportCard
                records={reportData.monthlyRevenue}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <MembershipExpiryAlertList alerts={reportData.membershipExpiryAlerts} />
              <LowInventoryAlertList
                alerts={reportData.inventoryAlerts}
                threshold={inventoryThreshold}
                onThresholdChange={setInventoryThreshold}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RiskAlertList
                members={atRiskData?.items ?? []}
                updatedAt={atRiskData?.updatedAt}
                isLoading={isRiskLoading}
              />
              <AnalyticsCharts
                monthlyRevenue={reportData.monthlyRevenue}
                revenueForecast={revenueForecast}
                peakUtilization={peakUtilization}
                forecastMode={forecastMode}
                onForecastModeChange={(mode) => {
                  void handleForecastModeChange(mode);
                }}
                isForecastLoading={isForecastLoading}
                isUtilizationLoading={isUtilizationLoading}
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
