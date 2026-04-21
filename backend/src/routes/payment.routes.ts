import { Router } from 'express';
import {
	getPlans,
	createPayment,
	getMemberPayments,
	undoPayment,
} from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all payment endpoints require an authenticated operator.
router.use(requireAuth);

// Authenticated endpoint to fetch active plans for payment creation forms.
router.get('/plans', getPlans);
// Authenticated endpoint to create a payment and extend member subscription.
router.post('/payments', createPayment);
// Authenticated endpoint to undo a payment and restore member subscription state.
router.post('/payments/:id/undo', undoPayment);
// Authenticated endpoint to retrieve payment history per member.
router.get('/members/:memberId/payments', getMemberPayments);

export default router;
