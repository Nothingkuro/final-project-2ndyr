import type {
  Supplier,
  SupplierFormData,
  SupplierTransaction,
  TransactionFormData,
} from '../types/supplier';
import { API_BASE_URL } from './apiBaseUrl';

export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SupplierTransactionListResponse {
  items: SupplierTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getAuthToken(): Promise<string | null> {
  const token = window.sessionStorage.getItem('authToken');
  return token;
}

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

export async function listSuppliers(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<SupplierListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', String(params.page));
  searchParams.append('pageSize', String(params.pageSize));

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    searchParams.append('search', trimmedSearch);
  }

  return makeRequest<SupplierListResponse>(`/suppliers?${searchParams.toString()}`);
}

export async function createSupplier(data: SupplierFormData): Promise<Supplier> {
  return makeRequest<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSupplier(
  supplierId: string,
  data: Partial<SupplierFormData>,
): Promise<Supplier> {
  return makeRequest<Supplier>(`/suppliers/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  return makeRequest<void>(`/suppliers/${supplierId}`, {
    method: 'DELETE',
  });
}

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

export async function createTransaction(
  supplierId: string,
  data: Omit<TransactionFormData, 'supplierId'>,
): Promise<SupplierTransaction> {
  return makeRequest<SupplierTransaction>(`/suppliers/${supplierId}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
