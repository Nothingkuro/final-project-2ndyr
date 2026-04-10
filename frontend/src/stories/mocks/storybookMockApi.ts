import { EquipmentCondition } from '../../types/equipment';
import type { Member } from '../../types/member';
import type {
  MemberPaymentHistoryRecord,
  MembershipPlan,
  PaymentMethod,
} from '../../types/payment';
import type { Supplier, SupplierTransaction } from '../../types/supplier';
import {
  createMockEquipment,
  deleteMockEquipment,
  listMockEquipment,
  updateMockEquipment,
  updateMockEquipmentCondition,
} from './mockEquipmentStore';
import { storyMembers } from './mockMembers';
import { mockManyMembershipPlans } from './mockMembershipPlans';
import { MOCK_MEMBER_PAYMENTS } from './mockPayments';
import { mockSuppliers, mockTransactions } from './mockSuppliers';

type MembersListResponse = {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type SuppliersListResponse = {
  items: Supplier[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type SupplierTransactionsListResponse = {
  items: SupplierTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type MockApiState = {
  members: Member[];
  plans: MembershipPlan[];
  payments: MemberPaymentHistoryRecord[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  nextMemberId: number;
  nextPaymentId: number;
  nextSupplierId: number;
  nextSupplierTransactionId: number;
};

let restoreFetch: (() => void) | null = null;

let mockApiState: MockApiState = createInitialState();

function createInitialState(): MockApiState {
  const members = storyMembers.map((member) => ({ ...member }));
  const plans = mockManyMembershipPlans.map((plan) => ({ ...plan }));
  const payments = MOCK_MEMBER_PAYMENTS.map((payment) => ({ ...payment }));
  const suppliers = mockSuppliers.map((supplier) => ({ ...supplier }));
  const supplierTransactions = mockTransactions.map((transaction) => ({ ...transaction }));

  const maxMemberId = members.reduce((maxId, member) => {
    const numericId = Number.parseInt(member.id, 10);
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
  }, 0);

  const maxPaymentId = payments.reduce((maxId, payment) => {
    const numericId = Number.parseInt(payment.id, 10);
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
  }, 0);

  const maxSupplierId = suppliers.reduce((maxId, supplier) => {
    const numericId = Number.parseInt(supplier.id.replace(/\D/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
  }, 0);

  const maxSupplierTransactionId = supplierTransactions.reduce((maxId, transaction) => {
    const numericId = Number.parseInt(transaction.id.replace(/\D/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
  }, 0);

  return {
    members,
    plans,
    payments,
    suppliers,
    supplierTransactions,
    nextMemberId: maxMemberId + 1,
    nextPaymentId: maxPaymentId + 1,
    nextSupplierId: maxSupplierId + 1,
    nextSupplierTransactionId: maxSupplierTransactionId + 1,
  };
}

export function resetStorybookApiMockState(): void {
  mockApiState = createInitialState();
}

export function installStorybookApiMock(): void {
  if (typeof window === 'undefined' || restoreFetch) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const mockedResponse = await handleMockRequest(input, init);

    if (mockedResponse) {
      return mockedResponse;
    }

    return originalFetch(input, init);
  };

  restoreFetch = () => {
    globalThis.fetch = originalFetch;
    restoreFetch = null;
  };
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return 'GET';
}

function toRequestUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === 'string') {
    return new URL(input, window.location.origin);
  }

  return new URL(input.url, window.location.origin);
}

async function readRequestBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const rawBody = init?.body;

  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  }

  if (rawBody instanceof URLSearchParams) {
    return Object.fromEntries(rawBody.entries());
  }

  if (input instanceof Request) {
    try {
      const text = await input.clone().text();
      if (!text) {
        return null;
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  return null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function paginateMembers(url: URL): MembersListResponse {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20);
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const status = (url.searchParams.get('status') ?? '').trim().toUpperCase();

  const filteredMembers = mockApiState.members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch =
      !search
      || fullName.includes(search)
      || member.id.toLowerCase().includes(search)
      || member.contactNumber.toLowerCase().includes(search);
    const matchesStatus = !status || status === 'ALL' || member.status === status;

    return matchesSearch && matchesStatus;
  });

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filteredMembers.slice(start, start + pageSize).map((member) => ({ ...member })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function paginateSuppliers(url: URL): SuppliersListResponse {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20);
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const serviceCategory = (url.searchParams.get('serviceCategory') ?? '').trim().toLowerCase();

  const filteredSuppliers = mockApiState.suppliers.filter((supplier) => {
    const searchableFields = [
      supplier.id,
      supplier.name,
      supplier.serviceCategory,
      supplier.contactPerson ?? '',
      supplier.contactNumber ?? '',
      supplier.address ?? '',
    ];

    const matchesSearch =
      !search || searchableFields.some((value) => value.toLowerCase().includes(search));
    const matchesServiceCategory =
      !serviceCategory || supplier.serviceCategory.toLowerCase() === serviceCategory;

    return matchesSearch && matchesServiceCategory;
  });

  const total = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filteredSuppliers.slice(start, start + pageSize).map((supplier) => ({ ...supplier })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function paginateSupplierTransactions(
  supplierId: string,
  url: URL,
): SupplierTransactionsListResponse {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '10', 10) || 10);

  const supplierTransactions = mockApiState.supplierTransactions
    .filter((transaction) => transaction.supplierId === supplierId)
    .sort((left, right) => {
      return new Date(right.transactionDate).getTime() - new Date(left.transactionDate).getTime();
    });

  const total = supplierTransactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: supplierTransactions.slice(start, start + pageSize).map((transaction) => ({ ...transaction })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function resolveMemberName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      firstName: 'New',
      lastName: 'Member',
    };
  }

  const [firstName, ...lastNameParts] = normalized.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' ') || 'Member',
  };
}

function toIsoDateString(dateValue: Date): string {
  return dateValue.toISOString().slice(0, 10);
}

function addDays(dateValue: Date, dayCount: number): Date {
  const result = new Date(dateValue);
  result.setDate(result.getDate() + dayCount);
  return result;
}

function normalizeOptionalField(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

function formatSupplierId(id: number): string {
  return `SUP-${String(id).padStart(3, '0')}`;
}

function formatSupplierTransactionId(id: number): string {
  return `STX-${String(id).padStart(3, '0')}`;
}

async function handleMembersApi(url: URL, method: string, body: unknown): Promise<Response | null> {
  if (url.pathname === '/api/members' && method === 'GET') {
    return jsonResponse(paginateMembers(url));
  }

  if (url.pathname === '/api/members' && method === 'POST') {
    const payload = (body ?? {}) as { fullName?: string; contactNumber?: string };
    const contactNumber = String(payload.contactNumber ?? '').trim();

    if (!contactNumber) {
      return errorResponse('Contact number is required', 400);
    }

    const hasDuplicate = mockApiState.members.some((member) => member.contactNumber === contactNumber);
    if (hasDuplicate) {
      return errorResponse('Contact number already exists.', 409);
    }

    const now = new Date();
    const { firstName, lastName } = resolveMemberName(String(payload.fullName ?? ''));
    const nextMember: Member = {
      id: String(mockApiState.nextMemberId),
      firstName,
      lastName,
      contactNumber,
      joinDate: toIsoDateString(now),
      expiryDate: toIsoDateString(addDays(now, 30)),
      status: 'ACTIVE',
      notes: '',
    };

    mockApiState.nextMemberId += 1;
    mockApiState.members = [nextMember, ...mockApiState.members];

    return jsonResponse(nextMember, 201);
  }

  const paymentsMatch = /^\/api\/members\/([^/]+)\/payments$/.exec(url.pathname);
  if (paymentsMatch && method === 'GET') {
    const [, memberId] = paymentsMatch;
    const memberPayments = mockApiState.payments
      .filter((payment) => payment.memberId === memberId)
      .map((payment) => ({ ...payment }));

    return jsonResponse(memberPayments);
  }

  const deactivateMatch = /^\/api\/members\/([^/]+)\/deactivate$/.exec(url.pathname);
  if (deactivateMatch && method === 'PATCH') {
    const [, memberId] = deactivateMatch;
    const existingMemberIndex = mockApiState.members.findIndex((member) => member.id === memberId);

    if (existingMemberIndex < 0) {
      return errorResponse('Member not found', 404);
    }

    const updatedMember: Member = {
      ...mockApiState.members[existingMemberIndex],
      status: 'INACTIVE',
      expiryDate: '',
    };

    mockApiState.members[existingMemberIndex] = updatedMember;

    return jsonResponse(updatedMember);
  }

  const editMemberMatch = /^\/api\/members\/([^/]+)$/.exec(url.pathname);
  if (editMemberMatch && method === 'PATCH') {
    const [, memberId] = editMemberMatch;
    const payload = (body ?? {}) as {
      firstName?: string;
      lastName?: string;
      contactNumber?: string;
    };

    const existingMemberIndex = mockApiState.members.findIndex((member) => member.id === memberId);
    if (existingMemberIndex < 0) {
      return errorResponse('Member not found', 404);
    }

    const normalizedContact = String(payload.contactNumber ?? '').replace(/\D/g, '');
    if (!normalizedContact) {
      return errorResponse('Contact number is required.', 400);
    }

    const duplicateContact = mockApiState.members.some(
      (member) => member.id !== memberId && member.contactNumber === normalizedContact,
    );

    if (duplicateContact) {
      return errorResponse('Contact number already exists.', 409);
    }

    const updatedMember: Member = {
      ...mockApiState.members[existingMemberIndex],
      firstName: String(payload.firstName ?? '').trim() || mockApiState.members[existingMemberIndex].firstName,
      lastName: String(payload.lastName ?? '').trim() || mockApiState.members[existingMemberIndex].lastName,
      contactNumber: normalizedContact,
    };

    mockApiState.members[existingMemberIndex] = updatedMember;

    return jsonResponse(updatedMember);
  }

  return null;
}

async function handlePlansApi(url: URL, method: string): Promise<Response | null> {
  if (url.pathname === '/api/plans' && method === 'GET') {
    return jsonResponse(mockApiState.plans.map((plan) => ({ ...plan })));
  }

  return null;
}

async function handlePaymentsApi(url: URL, method: string, body: unknown): Promise<Response | null> {
  if (url.pathname !== '/api/payments' || method !== 'POST') {
    return null;
  }

  const payload = (body ?? {}) as {
    memberId?: string;
    planId?: string;
    paymentMethod?: PaymentMethod;
    amountPaid?: number;
  };

  const memberId = String(payload.memberId ?? '').trim();
  const planId = String(payload.planId ?? '').trim();

  if (!memberId || !planId) {
    return errorResponse('memberId and planId are required', 400);
  }

  const member = mockApiState.members.find((item) => item.id === memberId);
  if (!member) {
    return errorResponse('Member not found', 404);
  }

  const plan = mockApiState.plans.find((item) => item.id === planId);
  const paidAt = new Date().toISOString();
  const amountPhp = Number(payload.amountPaid ?? plan?.price ?? 0);

  const paymentRecord: MemberPaymentHistoryRecord = {
    id: String(mockApiState.nextPaymentId),
    memberId,
    paidAt,
    amountPhp,
    membershipPlan: plan?.name ?? 'Membership Plan',
    processedBy: 'Storybook Staff',
    paymentMethod: payload.paymentMethod === 'GCASH' ? 'GCASH' : 'CASH',
  };

  mockApiState.nextPaymentId += 1;
  mockApiState.payments = [paymentRecord, ...mockApiState.payments];

  if (plan) {
    const now = new Date();
    const nextExpiryDate = toIsoDateString(addDays(now, plan.durationDays));
    mockApiState.members = mockApiState.members.map((item) => {
      if (item.id !== memberId) {
        return item;
      }

      return {
        ...item,
        status: 'ACTIVE',
        expiryDate: nextExpiryDate,
      };
    });
  }

  return jsonResponse({
    id: paymentRecord.id,
    memberId,
    planId,
    paymentMethod: paymentRecord.paymentMethod,
    amountPaid: amountPhp,
  }, 201);
}

async function handleAuthApi(url: URL, method: string, body: unknown): Promise<Response | null> {
  if (url.pathname !== '/api/auth/login' || method !== 'POST') {
    return null;
  }

  const payload = (body ?? {}) as { username?: string; role?: string };
  const requestedRole = String(payload.role ?? '').toLowerCase();

  const resolvedRole = requestedRole === 'owner' ? 'ADMIN' : 'STAFF';

  return jsonResponse({
    user: {
      id: 'storybook-user',
      username: String(payload.username ?? 'storybook.user').trim() || 'storybook.user',
      role: resolvedRole,
    },
  });
}

async function handleEquipmentApi(url: URL, method: string, body: unknown): Promise<Response | null> {
  if (url.pathname === '/api/equipment' && method === 'GET') {
    const response = await listMockEquipment({
      page: Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1,
      pageSize: Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20,
      search: url.searchParams.get('search') ?? undefined,
      condition: (url.searchParams.get('condition') ?? 'ALL') as
        | 'ALL'
        | EquipmentCondition,
    });

    return jsonResponse(response);
  }

  if (url.pathname === '/api/equipment' && method === 'POST') {
    const payload = (body ?? {}) as {
      itemName?: string;
      quantity?: number;
      condition?: EquipmentCondition;
    };

    const createdEquipment = await createMockEquipment({
      itemName: String(payload.itemName ?? ''),
      quantity: Number(payload.quantity ?? 0),
      condition: payload.condition ?? EquipmentCondition.GOOD,
    });

    return jsonResponse(createdEquipment, 201);
  }

  const conditionMatch = /^\/api\/equipment\/([^/]+)\/condition$/.exec(url.pathname);
  if (conditionMatch && method === 'PUT') {
    const [, equipmentId] = conditionMatch;
    const payload = (body ?? {}) as { condition?: EquipmentCondition };

    try {
      const updatedEquipment = await updateMockEquipmentCondition(
        equipmentId,
        payload.condition ?? EquipmentCondition.GOOD,
      );
      return jsonResponse(updatedEquipment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Equipment not found';
      return errorResponse(message, 404);
    }
  }

  const updateMatch = /^\/api\/equipment\/([^/]+)$/.exec(url.pathname);
  if (updateMatch && method === 'PUT') {
    const [, equipmentId] = updateMatch;
    const payload = (body ?? {}) as {
      itemName?: string;
      quantity?: number;
      condition?: EquipmentCondition;
    };

    try {
      const updatedEquipment = await updateMockEquipment(equipmentId, {
        itemName: String(payload.itemName ?? ''),
        quantity: Number(payload.quantity ?? 0),
        condition: payload.condition ?? EquipmentCondition.GOOD,
      });
      return jsonResponse(updatedEquipment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Equipment not found';
      return errorResponse(message, 404);
    }
  }

  if (updateMatch && method === 'DELETE') {
    const [, equipmentId] = updateMatch;

    try {
      await deleteMockEquipment(equipmentId);
      return jsonResponse({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Equipment not found';
      return errorResponse(message, 404);
    }
  }

  return null;
}

async function handleSuppliersApi(url: URL, method: string, body: unknown): Promise<Response | null> {
  if (url.pathname === '/api/suppliers/categories' && method === 'GET') {
    const items = Array.from(
      new Set(mockApiState.suppliers.map((supplier) => supplier.serviceCategory.trim())),
    )
      .filter((category) => category.length > 0)
      .sort((left, right) => left.localeCompare(right));

    return jsonResponse({ items });
  }

  if (url.pathname === '/api/suppliers' && method === 'GET') {
    return jsonResponse(paginateSuppliers(url));
  }

  if (url.pathname === '/api/suppliers' && method === 'POST') {
    const payload = (body ?? {}) as {
      name?: string;
      serviceCategory?: string;
      contactPerson?: string;
      contactNumber?: string;
      address?: string;
    };

    const name = String(payload.name ?? '').trim();
    const contactNumber = String(payload.contactNumber ?? '').replace(/\D/g, '');

    if (!name || !contactNumber) {
      return errorResponse('Name and contact number are required', 400);
    }

    if (contactNumber.length > 11) {
      return errorResponse('Contact number must contain at most 11 digits', 400);
    }

    const serviceCategory =
      payload.serviceCategory && String(payload.serviceCategory).trim().length > 0
        ? String(payload.serviceCategory).trim()
        : 'GENERAL';

    const now = new Date().toISOString();
    const nextSupplier: Supplier = {
      id: formatSupplierId(mockApiState.nextSupplierId),
      name,
      serviceCategory,
      contactPerson: normalizeOptionalField(payload.contactPerson),
      contactNumber,
      address: normalizeOptionalField(payload.address),
      createdAt: now,
      updatedAt: now,
    };

    mockApiState.nextSupplierId += 1;
    mockApiState.suppliers = [nextSupplier, ...mockApiState.suppliers];

    return jsonResponse(nextSupplier, 201);
  }

  const supplierMatch = /^\/api\/suppliers\/([^/]+)$/.exec(url.pathname);
  if (supplierMatch && method === 'PUT') {
    const [, supplierId] = supplierMatch;
    const supplierIndex = mockApiState.suppliers.findIndex((supplier) => supplier.id === supplierId);

    if (supplierIndex < 0) {
      return errorResponse('Supplier not found.', 404);
    }

    const payload = (body ?? {}) as {
      name?: string;
      serviceCategory?: string;
      contactPerson?: string;
      contactNumber?: string;
      address?: string;
    };

    const currentSupplier = mockApiState.suppliers[supplierIndex];
    const nextName =
      payload.name !== undefined
        ? String(payload.name).trim()
        : currentSupplier.name;

    if (!nextName) {
      return errorResponse('Supplier name is required.', 400);
    }

    const updatedSupplier: Supplier = {
      ...currentSupplier,
      name: nextName,
      serviceCategory:
        payload.serviceCategory !== undefined && String(payload.serviceCategory).trim().length > 0
          ? String(payload.serviceCategory).trim()
          : currentSupplier.serviceCategory,
      contactPerson:
        payload.contactPerson !== undefined
          ? normalizeOptionalField(payload.contactPerson)
          : currentSupplier.contactPerson,
      contactNumber:
        payload.contactNumber !== undefined
          ? normalizeOptionalField(payload.contactNumber)
          : currentSupplier.contactNumber,
      address:
        payload.address !== undefined
          ? normalizeOptionalField(payload.address)
          : currentSupplier.address,
      updatedAt: new Date().toISOString(),
    };

    mockApiState.suppliers[supplierIndex] = updatedSupplier;

    return jsonResponse(updatedSupplier);
  }

  if (supplierMatch && method === 'DELETE') {
    const [, supplierId] = supplierMatch;
    const hasSupplier = mockApiState.suppliers.some((supplier) => supplier.id === supplierId);

    if (!hasSupplier) {
      return errorResponse('Supplier not found.', 404);
    }

    mockApiState.suppliers = mockApiState.suppliers.filter((supplier) => supplier.id !== supplierId);
    mockApiState.supplierTransactions = mockApiState.supplierTransactions.filter(
      (transaction) => transaction.supplierId !== supplierId,
    );

    return jsonResponse({ success: true });
  }

  const transactionMatch = /^\/api\/suppliers\/([^/]+)\/transactions$/.exec(url.pathname);
  if (transactionMatch && method === 'GET') {
    const [, supplierId] = transactionMatch;
    const hasSupplier = mockApiState.suppliers.some((supplier) => supplier.id === supplierId);

    if (!hasSupplier) {
      return errorResponse('Supplier not found.', 404);
    }

    return jsonResponse(paginateSupplierTransactions(supplierId, url));
  }

  if (transactionMatch && method === 'POST') {
    const [, supplierId] = transactionMatch;
    const hasSupplier = mockApiState.suppliers.some((supplier) => supplier.id === supplierId);

    if (!hasSupplier) {
      return errorResponse('Supplier not found.', 404);
    }

    const payload = (body ?? {}) as {
      itemsPurchased?: string;
      totalCost?: number;
      transactionDate?: string;
    };

    const itemsPurchased = String(payload.itemsPurchased ?? '').trim();
    const totalCost = Number(payload.totalCost);

    if (!itemsPurchased) {
      return errorResponse('Items purchased is required.', 400);
    }

    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      return errorResponse('Total cost must be a positive number.', 400);
    }

    const parsedTransactionDate = payload.transactionDate
      ? new Date(payload.transactionDate)
      : new Date();
    const transactionDate = Number.isNaN(parsedTransactionDate.getTime())
      ? new Date().toISOString()
      : parsedTransactionDate.toISOString();
    const now = new Date().toISOString();

    const transactionRecord: SupplierTransaction = {
      id: formatSupplierTransactionId(mockApiState.nextSupplierTransactionId),
      itemsPurchased,
      totalCost,
      transactionDate,
      supplierId,
      createdAt: now,
      updatedAt: now,
    };

    mockApiState.nextSupplierTransactionId += 1;
    mockApiState.supplierTransactions = [transactionRecord, ...mockApiState.supplierTransactions];

    return jsonResponse(transactionRecord, 201);
  }

  return null;
}

async function handleMockRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const url = toRequestUrl(input);

  if (!url.pathname.startsWith('/api/')) {
    return null;
  }

  const method = getRequestMethod(input, init);
  const body = await readRequestBody(input, init);

  const handlers = [
    handleAuthApi,
    handleMembersApi,
    handlePlansApi,
    handlePaymentsApi,
    handleSuppliersApi,
    handleEquipmentApi,
  ];

  for (const handler of handlers) {
    const response = await handler(url, method, body);
    if (response) {
      return response;
    }
  }

  return errorResponse(`No Storybook mock handler for ${method} ${url.pathname}`, 404);
}
