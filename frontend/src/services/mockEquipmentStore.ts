import { EquipmentCondition, type Equipment } from '../types/equipment';

export type EquipmentFilter = 'ALL' | EquipmentCondition;

export type MockEquipmentListResponse = {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const initialEquipment: Equipment[] = [
  {
    id: 'EQ-001',
    itemName: 'Olympic Barbell',
    quantity: 6,
    condition: EquipmentCondition.GOOD,
    lastChecked: '2026-04-01T09:00:00.000Z',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'EQ-002',
    itemName: 'Adjustable Bench',
    quantity: 4,
    condition: EquipmentCondition.MAINTENANCE,
    lastChecked: '2026-04-02T10:30:00.000Z',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-04-02T10:30:00.000Z',
  },
  {
    id: 'EQ-003',
    itemName: 'Treadmill Pro X',
    quantity: 3,
    condition: EquipmentCondition.BROKEN,
    lastChecked: '2026-04-02T14:00:00.000Z',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-04-02T14:00:00.000Z',
  },
  {
    id: 'EQ-004',
    itemName: 'Yoga Mats',
    quantity: 25,
    condition: EquipmentCondition.GOOD,
    lastChecked: '2026-03-30T07:45:00.000Z',
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-03-30T07:45:00.000Z',
  },
  {
    id: 'EQ-005',
    itemName: 'Cable Machine',
    quantity: 2,
    condition: EquipmentCondition.MAINTENANCE,
    lastChecked: '2026-03-28T16:20:00.000Z',
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-03-28T16:20:00.000Z',
  },
  {
    id: 'EQ-006',
    itemName: 'Kettlebell Set',
    quantity: 12,
    condition: EquipmentCondition.GOOD,
    lastChecked: '2026-03-27T12:15:00.000Z',
    createdAt: '2026-02-04T08:00:00.000Z',
    updatedAt: '2026-03-27T12:15:00.000Z',
  },
  {
    id: 'EQ-007',
    itemName: 'Leg Press Machine',
    quantity: 1,
    condition: EquipmentCondition.BROKEN,
    lastChecked: '2026-03-29T11:05:00.000Z',
    createdAt: '2026-01-26T08:00:00.000Z',
    updatedAt: '2026-03-29T11:05:00.000Z',
  },
  {
    id: 'EQ-008',
    itemName: 'Medicine Ball Rack',
    quantity: 2,
    condition: EquipmentCondition.GOOD,
    lastChecked: '2026-04-03T09:20:00.000Z',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-04-03T09:20:00.000Z',
  },
];

let equipmentStore: Equipment[] = initialEquipment.map((item) => ({ ...item }));

function cloneEquipment(item: Equipment): Equipment {
  return { ...item };
}

export function resetMockEquipmentStore(): void {
  equipmentStore = initialEquipment.map((item) => ({ ...item }));
}

export function setMockEquipmentStore(items: Equipment[]): void {
  equipmentStore = items.map((item) => ({ ...item }));
}

function nextEquipmentId(): string {
  const highestId = equipmentStore.reduce((maxValue, item) => {
    const match = /^EQ-(\d+)$/.exec(item.id);
    if (!match) {
      return maxValue;
    }

    const numericId = Number(match[1]);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);

  return `EQ-${String(highestId + 1).padStart(3, '0')}`;
}

export async function listMockEquipment(params: {
  page: number;
  pageSize: number;
  search?: string;
  condition?: EquipmentFilter;
}): Promise<MockEquipmentListResponse> {
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, params.pageSize);
  const searchTerm = (params.search ?? '').trim().toLowerCase();
  const condition = params.condition ?? 'ALL';

  const filtered = equipmentStore.filter((item) => {
    const matchesQuery = !searchTerm
      || item.itemName.toLowerCase().includes(searchTerm)
      || item.id.toLowerCase().includes(searchTerm);
    const matchesCondition = condition === 'ALL' || item.condition === condition;

    return matchesQuery && matchesCondition;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize).map(cloneEquipment),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function updateMockEquipmentCondition(
  equipmentId: string,
  condition: EquipmentCondition,
): Promise<Equipment> {
  const nowIso = new Date().toISOString();
  const index = equipmentStore.findIndex((item) => item.id === equipmentId);

  if (index < 0) {
    throw new Error('Equipment not found');
  }

  equipmentStore[index] = {
    ...equipmentStore[index],
    condition,
    lastChecked: nowIso,
    updatedAt: nowIso,
  };

  return cloneEquipment(equipmentStore[index]);
}

export async function createMockEquipment(data: {
  itemName: string;
  quantity: number;
  condition: EquipmentCondition;
}): Promise<Equipment> {
  const nowIso = new Date().toISOString();
  const created: Equipment = {
    id: nextEquipmentId(),
    itemName: data.itemName.trim(),
    quantity: Math.max(0, data.quantity),
    condition: data.condition,
    lastChecked: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  equipmentStore = [created, ...equipmentStore];
  return cloneEquipment(created);
}

export async function updateMockEquipment(
  equipmentId: string,
  data: {
    itemName: string;
    quantity: number;
    condition: EquipmentCondition;
  },
): Promise<Equipment> {
  const nowIso = new Date().toISOString();
  const index = equipmentStore.findIndex((item) => item.id === equipmentId);

  if (index < 0) {
    throw new Error('Equipment not found');
  }

  const previous = equipmentStore[index];
  const conditionChanged = previous.condition !== data.condition;

  equipmentStore[index] = {
    ...previous,
    itemName: data.itemName.trim(),
    quantity: Math.max(0, data.quantity),
    condition: data.condition,
    lastChecked: conditionChanged ? nowIso : previous.lastChecked,
    updatedAt: nowIso,
  };

  return cloneEquipment(equipmentStore[index]);
}

export async function deleteMockEquipment(equipmentId: string): Promise<void> {
  const nextStore = equipmentStore.filter((item) => item.id !== equipmentId);

  if (nextStore.length === equipmentStore.length) {
    throw new Error('Equipment not found');
  }

  equipmentStore = nextStore;
}
