import { Router } from 'express';
import {
	checkInMember,
	createMember,
	deactivateMember,
	getMemberAttendances,
	getMembers,
	undoCheckIn,
	updateMember,
} from '../controllers/member.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all member endpoints require authenticated access.
router.use(requireAuth);
// Authenticated list endpoint for member search, status filtering, and pagination.
router.get('/members', getMembers);
// Authenticated create endpoint for new member enrollment.
router.post('/members', createMember);
// Authenticated update endpoint for editable member profile fields.
router.patch('/members/:memberId', updateMember);
// Authenticated action endpoint to deactivate a member account.
router.patch('/members/:memberId/deactivate', deactivateMember);
// Authenticated endpoint returning attendance history for one member.
router.get('/members/:memberId/attendance', getMemberAttendances);
// Authenticated action endpoints to record member check-in.
router.post('/members/:memberId/checkin', checkInMember);
router.post('/members/:memberId/check-in', checkInMember);
// Authenticated endpoint to undo a specific attendance check-in.
router.post('/members/attendance/:id/undo', undoCheckIn);

export default router;
