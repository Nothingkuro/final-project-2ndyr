import { Router } from 'express';
import { getPlans, createPayment, getMemberPayments } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/plans', getPlans);
router.post('/payments', createPayment);
router.get('/members/:memberId/payments', getMemberPayments);

export default router;
