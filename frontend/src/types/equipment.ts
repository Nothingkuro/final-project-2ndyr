export enum EquipmentCondition {
  GOOD = 'GOOD',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN',
}

/**
 * Defines equipment used by frontend domain models.
 */
export interface Equipment {
  id: string;
  itemName: string;
  quantity: number;
  condition: EquipmentCondition;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
}
