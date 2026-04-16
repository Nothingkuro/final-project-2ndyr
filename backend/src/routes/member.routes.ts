import { Router } from 'express';
import {
	checkInMember,
	createMember,
	deactivateMember,
	getMemberAttendances,
	getMembers,
	updateMember,
} from '../controllers/member.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/members', getMembers);
router.post('/members', createMember);
router.patch('/members/:memberId', updateMember);
router.patch('/members/:memberId/deactivate', deactivateMember);
router.get('/members/:memberId/attendance', getMemberAttendances);
router.post('/members/:memberId/check-in', checkInMember);

export default router;
