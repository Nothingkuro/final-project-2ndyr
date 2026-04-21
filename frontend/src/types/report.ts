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
 * Defines weekday revenue trend point used by frontend domain models.
 */
export interface RevenueTrendPoint {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  revenue: number;
}

/**
 * Defines membership distribution point used by frontend domain models.
 */
export interface MembershipDistributionPoint {
  plan: 'Daily Pass' | 'Monthly Basic' | 'Quarterly Plus';
  memberCount: number;
  percentage: number;
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
 * Defines report data used by frontend domain models.
 */
export interface ReportData {
  dailyRevenue: RevenueBreakdown;
  revenueTrends: RevenueTrendPoint[];
  membershipDistribution: MembershipDistributionPoint[];
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
}
