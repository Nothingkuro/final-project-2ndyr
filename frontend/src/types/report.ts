export interface RevenueBreakdown {
  cash: number;
  gcash: number;
  total: number;
  date: string;
}

export interface MonthlyRevenueRecord {
  month: number;
  year: number;
  total: number;
}

export interface MembershipExpiryAlert {
  id: string;
  name: string;
  expiryDate: string;
  contactNumber: string;
}

export interface InventoryAlert {
  id: string;
  itemName: string;
  quantity: number;
  threshold: number;
}

export interface ReportData {
  dailyRevenue: RevenueBreakdown;
  monthlyRevenue: MonthlyRevenueRecord[];
  membershipExpiryAlerts: MembershipExpiryAlert[];
  inventoryAlerts: InventoryAlert[];
}
