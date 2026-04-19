import { Router } from 'express';
import {
  getDailyRevenueSummary,
  getLowInventoryAlerts,
  getMonthlyRevenueRecords,
  getReportsOverview,
  getUpcomingExpirations,
} from '../controllers/report.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all report endpoints require authenticated access.
router.use(requireAuth);

// Authenticated endpoint to list memberships expiring soon (staff and admin).
router.get('/reports/upcoming-expirations', getUpcomingExpirations);

// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> daily revenue.
router.get('/reports/daily-revenue', requireRole('ADMIN'), getDailyRevenueSummary);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> monthly revenue.
router.get('/reports/monthly-revenue', requireRole('ADMIN'), getMonthlyRevenueRecords);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> low inventory alerts.
router.get('/reports/low-inventory', requireRole('ADMIN'), getLowInventoryAlerts);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> consolidated overview.
router.get('/reports/overview', requireRole('ADMIN'), getReportsOverview);

export default router;
