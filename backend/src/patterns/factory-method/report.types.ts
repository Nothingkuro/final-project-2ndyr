import {
  AtRiskMemberDTO,
  ExpiryAlertDTO,
  InventoryAlertDTO,
  PeakUtilizationDTO,
  RevenueForecastDTO,
} from './report.factory';

export enum ReportType {
  EXPIRY_ALERT = 'EXPIRY_ALERT',
  INVENTORY_ALERT = 'INVENTORY_ALERT',
  AT_RISK_MEMBER = 'AT_RISK_MEMBER',
  REVENUE_FORECAST = 'REVENUE_FORECAST',
  PEAK_UTILIZATION = 'PEAK_UTILIZATION',
}

export type ReportOutput =
  | ExpiryAlertDTO
  | InventoryAlertDTO
  | AtRiskMemberDTO
  | RevenueForecastDTO
  | PeakUtilizationDTO;
