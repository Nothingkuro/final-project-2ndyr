import { Router } from 'express';
import {
  createMembershipPlan,
  deleteMembershipPlan,
  getMembershipPlans,
  updateMembershipPlan,
} from '../controllers/membershipPlan.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all plan endpoints require authenticated users.
router.use(requireAuth);

// Authenticated endpoint to list membership plans.
router.get('/membership-plans', getMembershipPlans);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> create plan.
router.post('/membership-plans', requireRole('ADMIN'), createMembershipPlan);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> update plan.
router.put('/membership-plans/:planId', requireRole('ADMIN'), updateMembershipPlan);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> delete plan.
router.delete('/membership-plans/:planId', requireRole('ADMIN'), deleteMembershipPlan);

export default router;