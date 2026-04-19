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
 * Defines report data used by frontend domain models.
 */
export interface ReportData {
  dailyRevenue: RevenueBreakdown;
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
}
