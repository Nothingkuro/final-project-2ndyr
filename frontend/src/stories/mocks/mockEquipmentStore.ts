import { EquipmentCondition, type Equipment } from '../../types/equipment';
import { storyEquipment } from './mockEquipment';

export type EquipmentFilter = 'ALL' | EquipmentCondition;

export type MockEquipmentListResponse = {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const initialEquipment: Equipment[] = storyEquipment.map((item) => ({ ...item }));

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
