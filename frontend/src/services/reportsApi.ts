import { API_BASE_URL } from './apiBaseUrl';
import { getAuthHeaders } from './authHeaders';
import type {
  InventoryAlert,
  MembershipExpiryAlert,
  MonthlyRevenueRecord,
  ReportData,
  RevenueBreakdown,
} from '../types/report';

/**
 * Type alias for reports overview response in API integration behavior.
 */
type ReportsOverviewResponse = {
  dailyRevenue: RevenueBreakdown;
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
};

/**
 * Handles make request logic for API integration behavior.
 *
 * @param endpoint Input used by make request.
 * @returns A promise that resolves when processing is complete.
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
 * Handles get reports overview logic for API integration behavior.
 *
 * @param params Input used by get reports overview.
 * @returns A promise that resolves when processing is complete.
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
 * Handles get upcoming expirations logic for API integration behavior.
 *
 * @param days Input used by get upcoming expirations.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function getUpcomingExpirations(days = 3): Promise<MembershipExpiryAlert[]> {
  const search = new URLSearchParams({ days: String(days) });
  return makeRequest<MembershipExpiryAlert[]>(`/reports/upcoming-expirations?${search.toString()}`);
}
