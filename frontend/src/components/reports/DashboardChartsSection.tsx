import { useMemo } from 'react';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { MembershipDistributionPoint, RevenueTrendPoint } from '../../types/report';

const donutColors = ['#ff7a18', '#00d4ff', '#14b8a6'];
const membershipPlanOrder = ['Daily Pass', 'Monthly Basic', 'Quarterly Plus'] as const;

function normalizePlanName(name: string): (typeof membershipPlanOrder)[number] {
  const normalized = name.trim().toLowerCase();

  if (normalized === 'daily pass') {
    return 'Daily Pass';
  }

  if (normalized === 'monthly basic' || normalized === 'monthly basis') {
    return 'Monthly Basic';
  }

  return 'Quarterly Plus';
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function formatDayLabel(day: string): string {
  return day.slice(0, 3);
}

interface DashboardChartsSectionProps {
  revenueTrends: RevenueTrendPoint[];
  membershipDistribution: MembershipDistributionPoint[];
}

/**
 * Renders dark-themed revenue and membership charts for the reports dashboard.
 */
export default function DashboardChartsSection({
  revenueTrends,
  membershipDistribution,
}: DashboardChartsSectionProps) {
  const normalizedMembershipDistribution = useMemo(() => {
    const totals = new Map<string, number>();

    for (const plan of membershipPlanOrder) {
      totals.set(plan, 0);
    }

    for (const item of membershipDistribution) {
      const normalizedPlanName = normalizePlanName(item.plan);
      totals.set(normalizedPlanName, (totals.get(normalizedPlanName) ?? 0) + item.percentage);
    }

    return membershipPlanOrder.map((plan) => ({
      plan,
      memberCount: 0,
      percentage: Number((totals.get(plan) ?? 0).toFixed(1)),
    }));
  }, [membershipDistribution]);

  return (
    <section
      className="grid grid-cols-1 gap-6 rounded-2xl border border-neutral-800 p-5 lg:grid-cols-2"
      style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
      aria-label="Gym dashboard charts"
    >
      <article className="rounded-xl border border-neutral-800 bg-[#202020] p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">Revenue Trends</h2>
        <div className="h-[332px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrends} margin={{ top: 20, right: 30, left: 20, bottom: 8 }}>
              <CartesianGrid stroke="#303030" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#ffffff', fontSize: 11 }}
                axisLine={{ stroke: '#4b4b4b' }}
                interval={0}
                tickFormatter={formatDayLabel}
                angle={-20}
                textAnchor="end"
                height={48}
              />
              <YAxis
                tick={{ fill: '#ffffff', fontSize: 12 }}
                axisLine={{ stroke: '#4b4b4b' }}
                tickFormatter={(value) => `PHP ${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#101010',
                  border: '1px solid #3f3f3f',
                  borderRadius: 8,
                  color: '#ffffff',
                }}
                formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00d4ff"
                strokeWidth={3}
                dot={{ r: 4, fill: '#00d4ff' }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-xl border border-neutral-800 bg-[#202020] p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">Membership Distribution</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
          <div className="h-[340px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 16, right: 24, left: 24, bottom: 44 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101010',
                    border: '1px solid #3f3f3f',
                    borderRadius: 8,
                    color: '#ffffff',
                  }}
                  formatter={(value) => [formatPercent(Number(value)), 'Members']}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="square"
                  wrapperStyle={{
                    color: '#ffffff',
                    fontSize: 12,
                    lineHeight: '18px',
                    paddingTop: '8px',
                  }}
                  formatter={(value) => normalizePlanName(String(value))}
                />
                <Pie
                  data={normalizedMembershipDistribution}
                  dataKey="percentage"
                  nameKey="plan"
                  cx="50%"
                  cy="46%"
                  innerRadius={68}
                  outerRadius={102}
                  paddingAngle={3}
                  name="Membership"
                  label={false}
                  labelLine={false}
                >
                  {normalizedMembershipDistribution.map((entry, index) => (
                    <Cell key={entry.plan} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-3 pr-2 md:pl-1" aria-label="Membership distribution labels">
            {normalizedMembershipDistribution.map((entry, index) => (
              <li key={entry.plan} className="flex items-center gap-2 text-sm leading-5 text-white">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: donutColors[index % donutColors.length] }}
                />
                <span className="whitespace-nowrap">
                  {entry.plan}: {formatPercent(entry.percentage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}
