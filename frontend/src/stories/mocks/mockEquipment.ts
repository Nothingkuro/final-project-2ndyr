import { EquipmentCondition, type Equipment } from '../../types/equipment';

const now = '2026-04-04T09:00:00.000Z';

export const newTreadmill: Equipment = {
  id: 'EQ-101',
  itemName: 'New Treadmill',
  quantity: 4,
  condition: EquipmentCondition.GOOD,
  lastChecked: '2026-04-03T11:30:00.000Z',
  createdAt: '2026-03-12T09:15:00.000Z',
  updatedAt: now,
};

export const wobblyBench: Equipment = {
  id: 'EQ-102',
  itemName: 'Wobbly Bench',
  quantity: 2,
  condition: EquipmentCondition.MAINTENANCE,
  lastChecked: '2026-04-02T16:45:00.000Z',
  createdAt: '2026-02-18T10:00:00.000Z',
  updatedAt: now,
};

export const brokenLatPulldown: Equipment = {
  id: 'EQ-103',
  itemName: 'Broken Lat Pulldown',
  quantity: 1,
  condition: EquipmentCondition.BROKEN,
  lastChecked: '2026-04-01T08:20:00.000Z',
  createdAt: '2026-01-22T14:40:00.000Z',
  updatedAt: now,
};

export const longNameEquipment: Equipment = {
  id: 'EQ-104',
  itemName: 'Multi-Station Functional Trainer with Extended Cable Pulley and Adjustable Columns',
  quantity: 3,
  condition: EquipmentCondition.GOOD,
  lastChecked: '2026-04-03T13:05:00.000Z',
  createdAt: '2026-03-05T07:55:00.000Z',
  updatedAt: now,
};

export const storyEquipment: Equipment[] = [
  newTreadmill,
  wobblyBench,
  brokenLatPulldown,
  longNameEquipment,
];
