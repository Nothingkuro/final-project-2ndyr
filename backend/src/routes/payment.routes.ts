import { Router } from 'express';
import { getPlans, createPayment, getMembers } from '../controllers/payment.controller';

const router = Router();

router.get('/plans', getPlans);
router.post('/payments', createPayment);
router.get('/members', getMembers);

export default router;
