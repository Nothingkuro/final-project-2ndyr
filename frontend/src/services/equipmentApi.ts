import { EquipmentCondition, type Equipment } from '../types/equipment';
import { API_BASE_URL } from './apiBaseUrl';

/**
 * Type alias for equipment filter in API integration behavior.
 */
export type EquipmentFilter = 'ALL' | EquipmentCondition;

/**
 * Defines equipment list response used by API integration behavior.
 */
export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Defines equipment form data used by API integration behavior.
 */
export interface EquipmentFormData {
  itemName: string;
  quantity: number;
  condition: EquipmentCondition;
}

/**
 * Handles get auth token logic for API integration behavior.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
async function getAuthToken(): Promise<string | null> {
  const token = window.sessionStorage.getItem('authToken');
  return token;
}

/**
 * Handles make request logic for API integration behavior.
 *
 * @param endpoint Input used by make request.
 * @param options Input used by make request.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}/api${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * List equipment with filtering, searching, and pagination
 */
export async function listEquipment(params: {
  page: number;
  pageSize: number;
  search?: string;
  condition?: EquipmentFilter;
}): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', String(params.page));
  searchParams.append('pageSize', String(params.pageSize));

  if (params.search) {
    searchParams.append('search', params.search);
  }

  if (params.condition && params.condition !== 'ALL') {
    searchParams.append('condition', params.condition);
  }

  return makeRequest<EquipmentListResponse>(`/equipment?${searchParams.toString()}`);
}

/**
 * Create new equipment (admin only)
 */
export async function createEquipment(data: EquipmentFormData): Promise<Equipment> {
  return makeRequest<Equipment>('/equipment', {
    method: 'POST',
    body: JSON.stringify({
      itemName: data.itemName,
      quantity: data.quantity,
      condition: data.condition,
    }),
  });
}

/**
 * Update equipment details (admin only)
 */
export async function updateEquipment(
  equipmentId: string,
  data: Partial<EquipmentFormData>
): Promise<Equipment> {
  return makeRequest<Equipment>(`/equipment/${equipmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Update equipment condition status (staff can use this)
 */
export async function updateEquipmentCondition(
  equipmentId: string,
  condition: EquipmentCondition
): Promise<Equipment> {
  return makeRequest<Equipment>(`/equipment/${equipmentId}/condition`, {
    method: 'PUT',
    body: JSON.stringify({ condition }),
  });
}

/**
 * Delete equipment (admin only)
 */
export async function deleteEquipment(equipmentId: string): Promise<void> {
  return makeRequest<void>(`/equipment/${equipmentId}`, {
    method: 'DELETE',
  });
}
