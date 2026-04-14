import type {
  InventoryAlert,
  MembershipExpiryAlert,
  MonthlyRevenueRecord,
  ReportData,
  RevenueBreakdown,
} from '../../types/report';

function toIsoDateWithOffset(daysFromToday: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
}

const currentYear = new Date().getFullYear();

export const storyDailyRevenue: RevenueBreakdown = {
  cash: 7250,
  gcash: 5420,
  total: 12670,
  date: new Date().toISOString(),
};

export const storyMonthlyRevenue: MonthlyRevenueRecord[] = [
  { month: 10, year: currentYear - 1, total: 149220 },
  { month: 11, year: currentYear - 1, total: 153440 },
  { month: 12, year: currentYear - 1, total: 159380 },
  { month: 1, year: currentYear, total: 162200 },
  { month: 2, year: currentYear, total: 168750 },
  { month: 3, year: currentYear, total: 171300 },
  { month: 4, year: currentYear, total: 178900 },
  { month: 5, year: currentYear, total: 181450 },
  { month: 6, year: currentYear, total: 184620 },
  { month: 7, year: currentYear, total: 190880 },
  { month: 8, year: currentYear, total: 194500 },
  { month: 9, year: currentYear, total: 198240 },
  { month: 10, year: currentYear, total: 202110 },
  { month: 11, year: currentYear, total: 207840 },
  { month: 12, year: currentYear, total: 214360 },
];

export const storyMembershipExpiryAlerts: MembershipExpiryAlert[] = [
  {
    id: 'M-1001',
    name: 'Carlo Reyes',
    expiryDate: toIsoDateWithOffset(1),
    contactNumber: '0917-220-1178',
  },
  {
    id: 'M-1002',
    name: 'Mika Alonzo',
    expiryDate: toIsoDateWithOffset(2),
    contactNumber: '0928-110-6620',
  },
  {
    id: 'M-1003',
    name: 'Levi Santos',
    expiryDate: toIsoDateWithOffset(3),
    contactNumber: '0918-330-9910',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
  {
    id: 'M-1004',
    name: 'Dana Gomez',
    expiryDate: toIsoDateWithOffset(7),
    contactNumber: '0999-700-8012',
  },
];

export const storyMembershipExpiryAlertsNone: MembershipExpiryAlert[] = [
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2001',
    name: 'Rina Villaflor',
    expiryDate: toIsoDateWithOffset(5),
    contactNumber: '0915-100-2001',
  },
  {
    id: 'M-2002',
    name: 'Joel Martinez',
    expiryDate: toIsoDateWithOffset(9),
    contactNumber: '0915-100-2002',
  },
];

export const storyInventoryAlerts: InventoryAlert[] = [
  {
    id: 'EQ-101',
    itemName: 'Olympic Barbell 20kg',
    quantity: 2,
    threshold: 5,
  },
  {
    id: 'EQ-101',
    itemName: 'Olympic Barbell 20kg',
    quantity: 2,
    threshold: 5,
  },
  {
    id: 'EQ-101',
    itemName: 'Olympic Barbell 20kg',
    quantity: 2,
    threshold: 5,
  },
  {
    id: 'EQ-101',
    itemName: 'Olympic Barbell 20kg',
    quantity: 2,
    threshold: 5,
  },
  {
    id: 'EQ-101',
    itemName: 'Olympic Barbell 20kg',
    quantity: 2,
    threshold: 5,
  },
  {
    id: 'EQ-102',
    itemName: 'Kettlebell 24kg',
    quantity: 3,
    threshold: 5,
  },
  {
    id: 'EQ-103',
    itemName: 'Medicine Ball 6kg',
    quantity: 4,
    threshold: 5,
  },
  {
    id: 'EQ-104',
    itemName: 'Foam Roller',
    quantity: 8,
    threshold: 5,
  },
];

export const storyInventoryAlertsHealthy: InventoryAlert[] = [
  {
    id: 'EQ-201',
    itemName: 'Yoga Mat',
    quantity: 9,
    threshold: 5,
  },
  {
    id: 'EQ-201',
    itemName: 'Yoga Mat',
    quantity: 9,
    threshold: 5,
  },
  {
    id: 'EQ-201',
    itemName: 'Yoga Mat',
    quantity: 9,
    threshold: 5,
  },
  {
    id: 'EQ-201',
    itemName: 'Yoga Mat',
    quantity: 9,
    threshold: 5,
  },
  {
    id: 'EQ-201',
    itemName: 'Yoga Mat',
    quantity: 9,
    threshold: 5,
  },
  
  {
    id: 'EQ-202',
    itemName: 'Resistance Band Set',
    quantity: 11,
    threshold: 5,
  },
];

export const storyReportData: ReportData = {
  dailyRevenue: storyDailyRevenue,
  monthlyRevenue: storyMonthlyRevenue,
  membershipExpiryAlerts: storyMembershipExpiryAlerts,
  inventoryAlerts: storyInventoryAlerts,
};
