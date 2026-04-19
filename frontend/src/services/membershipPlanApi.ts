import type { MembershipPlan, MembershipPlanFormData } from '../types/membershipPlan';
import { getAuthHeaders } from './authHeaders';
import { API_BASE_URL } from './apiBaseUrl';

/**
 * Type alias for membership plan list response in API integration behavior.
 */
type MembershipPlanListResponse = {
  items: MembershipPlan[];
};

/**
 * Handles make request logic for API integration behavior.
 *
 * @param endpoint Input used by make request.
 * @param options Input used by make request.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = (await response.json()) as { error?: string };
      if (typeof errorData.error === 'string' && errorData.error.trim().length > 0) {
        errorMessage = errorData.error;
      }
    } catch {
      // Keep fallback error message when response body is not JSON.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Handles list membership plans logic for API integration behavior.
 *
 * @param includeArchived Input used by list membership plans.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function listMembershipPlans(includeArchived = true): Promise<MembershipPlan[]> {
  const query = new URLSearchParams({ includeArchived: String(includeArchived) });
  const response = await makeRequest<MembershipPlanListResponse>(
    `/membership-plans?${query.toString()}`,
    { method: 'GET' },
  );

  return response.items;
}

/**
 * Handles create membership plan logic for API integration behavior.
 *
 * @param data Input used by create membership plan.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function createMembershipPlan(data: MembershipPlanFormData): Promise<MembershipPlan> {
  return makeRequest<MembershipPlan>('/membership-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Handles update membership plan logic for API integration behavior.
 *
 * @param planId Input used by update membership plan.
 * @param data Input used by update membership plan.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function updateMembershipPlan(
  planId: string,
  data: MembershipPlanFormData,
): Promise<MembershipPlan> {
  return makeRequest<MembershipPlan>(`/membership-plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Handles delete membership plan logic for API integration behavior.
 *
 * @param planId Input used by delete membership plan.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function deleteMembershipPlan(planId: string): Promise<void> {
  await makeRequest<void>(`/membership-plans/${planId}`, {
    method: 'DELETE',
  });
}
