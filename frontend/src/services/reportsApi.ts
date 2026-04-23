import { API_BASE_URL } from './apiBaseUrl';
import { getAuthHeaders } from './authHeaders';
import type {
  AtRiskMembersResponse,
  ForecastMode,
  InventoryAlert,
  MembershipExpiryAlert,
  MonthlyRevenueRecord,
  PeakUtilization,
  ReportData,
  RevenueForecast,
  RevenueBreakdown,
} from '../types/report';

/**
 * Backend response for the reports overview endpoint.
 *
 * This is the transport shape returned by the API before the page-level model is
 * completed with separately fetched modules (for example forecast and at-risk cache).
 */
type ReportsOverviewResponse = {
  dailyRevenue: RevenueBreakdown;
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
};

type RevenueForecastResponse = RevenueForecast;
type PeakUtilizationResponse = PeakUtilization[];

/**
 * Executes authenticated GET requests for reports endpoints with uniform error handling.
 *
 * Standardizing parsing and error translation here keeps report widgets consistent
 * when the backend is unavailable or misconfigured.
 *
 * @param endpoint Relative reports endpoint path (including query string when needed).
 * @returns Parsed JSON payload typed to the expected response model.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
async function makeRequest<T extends object>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      text.trim().startsWith('<')
        ? 'Server returned HTML instead of JSON. Check backend API route configuration.'
        : 'Server returned an unexpected response format.',
    );
  }

  const data = (await response.json()) as T | { error?: string };

  if (!response.ok) {
    const message = 'error' in data && typeof data.error === 'string'
      ? data.error
      : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * Fetches the consolidated overview cards for the reports dashboard.
 *
 * @param params Optional report filters.
 * @param params.threshold Minimum stock level before an item is considered low inventory.
 * @param params.days Number of days ahead to include in membership-expiry alerts.
 *
 * @returns Overview payload used by daily revenue, monthly revenue, inventory, and expiry sections.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getReportsOverview(params?: {
  threshold?: number;
  days?: number;
}): Promise<ReportData> {
  const search = new URLSearchParams();

  if (params?.threshold !== undefined) {
    search.set('threshold', String(params.threshold));
  }

  if (params?.days !== undefined) {
    search.set('days', String(params.days));
  }

  const query = search.toString();
  const endpoint = query ? `/reports/overview?${query}` : '/reports/overview';
  const data = await makeRequest<ReportsOverviewResponse>(endpoint);

  return {
    dailyRevenue: data.dailyRevenue,
    monthlyRevenue: data.monthlyRevenue,
    membershipExpiryAlerts: data.membershipExpiryAlerts,
    inventoryAlerts: data.inventoryAlerts,
  };
}

/**
 * Fetches active members expiring soon for renewal outreach workflows.
 *
 * @param days Forward-looking expiry window in days.
 * @returns Membership expiry alerts sorted by nearest expiry first.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getUpcomingExpirations(days = 3): Promise<MembershipExpiryAlert[]> {
  const search = new URLSearchParams({ days: String(days) });
  return makeRequest<MembershipExpiryAlert[]>(`/reports/upcoming-expirations?${search.toString()}`);
}

/**
 * Fetches members flagged as retention risk due to inactivity near expiry.
 *
 * @returns Cached at-risk list with server-side refresh timestamp.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getAtRiskMembers(): Promise<AtRiskMembersResponse> {
  return makeRequest<AtRiskMembersResponse>('/reports/at-risk-members');
}

/**
 * Fetches next-month revenue projection for the selected business scenario.
 *
 * @param mode Forecasting algorithm profile used by backend strategy logic
 * (`OPTIMISTIC` for stronger retention assumptions, `CONSERVATIVE` for higher churn allowance).
 *
 * @returns Forecast payload including baseline, churn adjustment, and projected revenue.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getRevenueForecast(mode: ForecastMode = 'CONSERVATIVE'): Promise<RevenueForecastResponse> {
  const search = new URLSearchParams({ mode });
  return makeRequest<RevenueForecastResponse>(`/reports/revenue-forecast?${search.toString()}`);
}

/**
 * Fetches hourly attendance distribution grouped by membership plan.
 *
 * @returns Flat utilization rows consumed by frontend pivot logic.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getPeakUtilization(): Promise<PeakUtilizationResponse> {
  return makeRequest<PeakUtilizationResponse>('/reports/peak-utilization');
}
