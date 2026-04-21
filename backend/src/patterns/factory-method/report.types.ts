import { ExpiryAlertDTO, InventoryAlertDTO } from './report.factory';

export enum ReportType {
  EXPIRY_ALERT = 'EXPIRY_ALERT',
  INVENTORY_ALERT = 'INVENTORY_ALERT',
}

export type ReportOutput = ExpiryAlertDTO | InventoryAlertDTO;
