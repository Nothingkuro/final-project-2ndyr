/**
 * Defines revenue breakdown used by frontend domain models.
 */
export interface RevenueBreakdown {
  cash: number;
  gcash: number;
  total: number;
  date: string;
}

/**
 * Defines monthly revenue record used by frontend domain models.
 */
export interface MonthlyRevenueRecord {
  month: number;
  year: number;
  total: number;
}

/**
 * Defines membership expiry alert used by frontend domain models.
 */
export interface MembershipExpiryAlert {
  id: string;
  name: string;
  expiryDate: string;
  contactNumber: string;
}

/**
 * Defines inventory alert used by frontend domain models.
 */
export interface InventoryAlert {
  id: string;
  itemName: string;
  quantity: number;
  threshold: number;
}

/**
 * Defines risk status used by frontend analytics views.
 */
export type AtRiskSeverity = 'HIGH' | 'CRITICAL';

/**
 * Defines at-risk member prediction item used by frontend analytics views.
 */
export interface AtRiskMember {
  id: string;
  name: string;
  contactNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  lastCheckInTime: string | null;
  riskLevel: 'AT_RISK';
}

/**
 * Defines forecast mode used by frontend analytics views.
 */
export type ForecastMode = 'CONSERVATIVE' | 'OPTIMISTIC';

/**
 * Defines revenue forecast DTO used by frontend analytics views.
 */
export interface RevenueForecast {
  projection: ForecastMode;
  baselineActivePlanRevenue: number;
  projectedChurnAdjustment: number;
  forecastedRevenue: number;
}

/**
 * Defines peak utilization item used by frontend analytics views.
 */
export interface PeakUtilization {
  hour: number;
  planName: string;
  count: number;
}

/**
 * Defines at-risk members API response used by frontend analytics views.
 */
export interface AtRiskMembersResponse {
  items: AtRiskMember[];
  updatedAt: string;
}

/**
 * Defines report data used by frontend domain models.
 */
export interface ReportData {
  dailyRevenue: RevenueBreakdown;
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
  atRiskMembers?: AtRiskMember[];
  revenueForecast?: RevenueForecast;
  peakUtilization?: PeakUtilization[];
}
