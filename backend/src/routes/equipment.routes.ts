import { Router } from 'express';
import {
	createEquipment,
	deleteEquipment,
	getEquipment,
	updateEquipment,
	updateEquipmentCondition,
} from '../controllers/equipment.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all equipment endpoints require an authenticated user.
router.use(requireAuth);

// List all equipment with filtering and pagination (accessible to all authenticated users)
router.get('/equipment', getEquipment);

// Create new equipment (admin only)
router.post('/equipment', requireRole('ADMIN'), createEquipment);

// Update equipment details (admin only)
router.put('/equipment/:equipmentId', requireRole('ADMIN'), updateEquipment);

// Update equipment condition status (staff/admin)
router.put('/equipment/:equipmentId/condition', updateEquipmentCondition);

// Delete equipment (admin only)
router.delete('/equipment/:equipmentId', requireRole('ADMIN'), deleteEquipment);

export default router;
