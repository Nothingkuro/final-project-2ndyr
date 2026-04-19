import type {
  Supplier,
  SupplierFormData,
  SupplierTransaction,
  TransactionFormData,
} from '../types/supplier';
import { API_BASE_URL } from './apiBaseUrl';

/**
 * Defines supplier list response used by API integration behavior.
 */
export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Defines supplier transaction list response used by API integration behavior.
 */
export interface SupplierTransactionListResponse {
  items: SupplierTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Defines supplier service category list response used by API integration behavior.
 */
interface SupplierServiceCategoryListResponse {
  items: string[];
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
  options: RequestInit = {},
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
      // If response is not JSON, use default error message.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Handles list suppliers logic for API integration behavior.
 *
 * @param params Input used by list suppliers.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function listSuppliers(params: {
  page: number;
  pageSize: number;
  search?: string;
  serviceCategory?: string;
}): Promise<SupplierListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', String(params.page));
  searchParams.append('pageSize', String(params.pageSize));

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    searchParams.append('search', trimmedSearch);
  }

  const trimmedServiceCategory = params.serviceCategory?.trim();
  if (trimmedServiceCategory) {
    searchParams.append('serviceCategory', trimmedServiceCategory);
  }

  return makeRequest<SupplierListResponse>(`/suppliers?${searchParams.toString()}`);
}

/**
 * Handles list supplier service categories logic for API integration behavior.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function listSupplierServiceCategories(): Promise<string[]> {
  const response = await makeRequest<SupplierServiceCategoryListResponse>(
    '/suppliers/categories',
  );

  return response.items;
}

/**
 * Handles create supplier logic for API integration behavior.
 *
 * @param data Input used by create supplier.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function createSupplier(data: SupplierFormData): Promise<Supplier> {
  return makeRequest<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Handles update supplier logic for API integration behavior.
 *
 * @param supplierId Input used by update supplier.
 * @param data Input used by update supplier.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function updateSupplier(
  supplierId: string,
  data: Partial<SupplierFormData>,
): Promise<Supplier> {
  return makeRequest<Supplier>(`/suppliers/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Handles delete supplier logic for API integration behavior.
 *
 * @param supplierId Input used by delete supplier.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
  return makeRequest<void>(`/suppliers/${supplierId}`, {
    method: 'DELETE',
  });
}

/**
 * Handles list transactions by supplier logic for API integration behavior.
 *
 * @param supplierId Input used by list transactions by supplier.
 * @param params Input used by list transactions by supplier.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function listTransactionsBySupplier(
  supplierId: string,
  params: {
    page: number;
    pageSize: number;
  },
): Promise<SupplierTransactionListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', String(params.page));
  searchParams.append('pageSize', String(params.pageSize));

  return makeRequest<SupplierTransactionListResponse>(
    `/suppliers/${supplierId}/transactions?${searchParams.toString()}`,
  );
}

/**
 * Handles create transaction logic for API integration behavior.
 *
 * @param supplierId Input used by create transaction.
 * @param data Input used by create transaction.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function createTransaction(
  supplierId: string,
  data: Omit<TransactionFormData, 'supplierId'>,
): Promise<SupplierTransaction> {
  return makeRequest<SupplierTransaction>(`/suppliers/${supplierId}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
