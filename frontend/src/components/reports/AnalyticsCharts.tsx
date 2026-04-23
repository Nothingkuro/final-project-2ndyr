import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart, TrendingUp } from 'lucide-react';
import type {
  ForecastMode,
  MonthlyRevenueRecord,
  PeakUtilization,
  RevenueForecast,
} from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

interface AnalyticsChartsProps {
  monthlyRevenue: MonthlyRevenueRecord[];
  revenueForecast: RevenueForecast | null;
  peakUtilization: PeakUtilization[];
  forecastMode: ForecastMode;
  onForecastModeChange: (mode: ForecastMode) => void;
  isForecastLoading?: boolean;
  isUtilizationLoading?: boolean;
}

type ForecastChartPoint = {
  label: string;
  historical: number | null;
  projected: number | null;
};

const CHART_COLORS = ['#BE0000', '#F97316', '#22C55E', '#0EA5E9', '#A855F7', '#EAB308'];

/**
 * Formats numeric month values into compact labels for dashboard chart axes.
 */
function getMonthLabel(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-PH', { month: 'short' });
}

/**
 * Converts historical monthly revenue plus optional forecast output into the shape
 * expected by the Recharts area chart.
 *
 * The transformer keeps historical values on existing months and appends the next
 * month as a projection point when forecast data is available, allowing the UI to
 * visually bridge past performance and projected revenue.
 */
function buildForecastChartData(
  monthlyRevenue: MonthlyRevenueRecord[],
  revenueForecast: RevenueForecast | null,
): ForecastChartPoint[] {
  if (monthlyRevenue.length === 0) {
    return [];
  }

  const sorted = [...monthlyRevenue].sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }

    return a.month - b.month;
  });

  const chartData: ForecastChartPoint[] = sorted.map((record, index) => ({
    label: `${getMonthLabel(record.month)} ${String(record.year).slice(-2)}`,
    historical: record.total,
    projected: index === sorted.length - 1 ? record.total : null,
  }));

  if (!revenueForecast) {
    return chartData;
  }

  const latest = sorted[sorted.length - 1];
  const nextMonthDate = new Date(latest.year, latest.month, 1);

  chartData.push({
    label: `${getMonthLabel(nextMonthDate.getMonth() + 1)} ${String(nextMonthDate.getFullYear()).slice(-2)}`,
    historical: null,
    projected: revenueForecast.forecastedRevenue,
  });

  return chartData;
}

/**
 * Pivots flat check-in utilization rows into a 24-hour time-series matrix for the
 * stacked bar chart component.
 *
 * Backend data arrives as individual `{hour, planName, count}` records. The chart
 * needs one row per hour with dynamic keys per plan, so this function prebuilds all
 * 24 hours, initializes missing plan/hour combinations to zero, then accumulates
 * counts into the corresponding hour bucket.
 */
function buildPeakUtilizationData(peakUtilization: PeakUtilization[]): {
  data: Array<Record<string, number | string>>;
  planKeys: string[];
} {
  const planKeys = Array.from(new Set(peakUtilization.map((item) => item.planName))).sort();

  const byHour = Array.from({ length: 24 }, (_, hour) => {
    const row: Record<string, number | string> = { hourLabel: `${hour}` };

    planKeys.forEach((planName) => {
      row[planName] = 0;
    });

    return row;
  });

  peakUtilization.forEach((item) => {
    const target = byHour[item.hour];

    if (!target) {
      return;
    }

    const current = typeof target[item.planName] === 'number' ? Number(target[item.planName]) : 0;
    target[item.planName] = current + item.count;
  });

  return { data: byHour, planKeys };
}

/**
 * Renders forecast and utilization analytics cards for the reports dashboard.
 */
export default function AnalyticsCharts({
  monthlyRevenue,
  revenueForecast,
  peakUtilization,
  forecastMode,
  onForecastModeChange,
  isForecastLoading = false,
  isUtilizationLoading = false,
}: AnalyticsChartsProps) {
  const forecastData = buildForecastChartData(monthlyRevenue, revenueForecast);
  const { data: utilizationData, planKeys } = buildPeakUtilizationData(peakUtilization);

  return (
    <>
      <ReportSectionCard
        title="MRR Revenue Forecast"
        subtitle="Retention vs churn projection"
        icon={<TrendingUp size={20} />}
        iconClassName="bg-success/20 text-success"
        contentMaxHeightClassName="max-h-[20rem]"
        actionSlot={
          <label className="text-xs text-neutral-300">
            Projection
            <select
              value={forecastMode}
              onChange={(event) => onForecastModeChange(event.target.value as ForecastMode)}
              className="ml-2 rounded-md border border-neutral-700 bg-secondary px-2 py-1 text-xs text-text-light focus:outline-none focus:ring-2 focus:ring-success/60"
            >
              <option value="CONSERVATIVE">Conservative</option>
              <option value="OPTIMISTIC">Optimistic</option>
            </select>
          </label>
        }
      >
        {isForecastLoading ? (
          <div className="h-60 animate-pulse rounded-lg bg-secondary" />
        ) : forecastData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-600 bg-secondary px-4 py-6 text-center text-sm text-neutral-300">
            No monthly revenue data available yet to generate a forecast.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#3A3A3A" />
                <XAxis dataKey="label" tick={{ fill: '#E5E7EB', fontSize: 11 }} />
                <YAxis tick={{ fill: '#E5E7EB', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    borderColor: '#525252',
                    borderRadius: 8,
                    color: '#F5F5F5',
                  }}
                  formatter={(value, name) => {
                    const numericValue = Number(value ?? 0);
                    const seriesName = String(name ?? '');

                    if (seriesName === 'projected') {
                      return [
                        `PHP ${numericValue.toLocaleString('en-PH')}`,
                        'Projected Revenue',
                      ];
                    }

                    return [
                      `PHP ${numericValue.toLocaleString('en-PH')}`,
                      'Historical Revenue',
                    ];
                  }}
                  labelFormatter={(label) => `${label} (Projection logic: retention vs churn)`}
                />
                <Area
                  type="monotone"
                  dataKey="historical"
                  name="historical"
                  stroke="#22C55E"
                  fill="#22C55E"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="projected"
                  stroke="#F97316"
                  fill="#F97316"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="6 6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ReportSectionCard>

      <ReportSectionCard
        title="Peak Utilization by Plan"
        subtitle="Hourly attendance intensity"
        icon={<LineChart size={20} />}
        iconClassName="bg-info/20 text-info"
        contentMaxHeightClassName="max-h-[20rem]"
      >
        {isUtilizationLoading ? (
          <div className="h-60 animate-pulse rounded-lg bg-secondary" />
        ) : peakUtilization.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-600 bg-secondary px-4 py-6 text-center text-sm text-neutral-300">
            No attendance utilization data available yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#3A3A3A" />
                <XAxis dataKey="hourLabel" tick={{ fill: '#E5E7EB', fontSize: 10 }} />
                <YAxis tick={{ fill: '#E5E7EB', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    borderColor: '#525252',
                    borderRadius: 8,
                    color: '#F5F5F5',
                  }}
                />
                <Legend wrapperStyle={{ color: '#E5E7EB', fontSize: 11 }} />
                {planKeys.map((planName, index) => (
                  <Bar key={planName} dataKey={planName} stackId="attendance" name={planName} fill={CHART_COLORS[index % CHART_COLORS.length]}>
                    {utilizationData.map((entry, cellIndex) => (
                      <Cell
                        key={`${planName}-${cellIndex}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        opacity={Number(entry[planName] ?? 0) > 0 ? 0.9 : 0.15}
                      />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ReportSectionCard>
    </>
  );
}
