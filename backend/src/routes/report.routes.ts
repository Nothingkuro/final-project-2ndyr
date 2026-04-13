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

router.use(requireAuth);

router.get('/reports/upcoming-expirations', getUpcomingExpirations);

router.get('/reports/daily-revenue', requireRole('ADMIN'), getDailyRevenueSummary);
router.get('/reports/monthly-revenue', requireRole('ADMIN'), getMonthlyRevenueRecords);
router.get('/reports/low-inventory', requireRole('ADMIN'), getLowInventoryAlerts);
router.get('/reports/overview', requireRole('ADMIN'), getReportsOverview);

export default router;
