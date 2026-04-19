import { Router } from 'express';
import {
  getUsers,
  getProfile,
  updateProfile,
  updateUser,
} from '../controllers/profile.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Get all users (admin only)
// Middleware chain: requireAuth -> requireRole('ADMIN') -> getUsers.
router.get('/users', requireAuth, requireRole('ADMIN'), getUsers);

// Get current user profile
// Middleware chain: requireAuth -> getProfile.
router.get('/profile', requireAuth, getProfile);

// Update own profile (username/password)
// Middleware chain: requireAuth -> updateProfile.
router.put('/profile', requireAuth, updateProfile);

// Update another user (admin only)
// Middleware chain: requireAuth -> requireRole('ADMIN') -> updateUser.
router.put('/users/:userId', requireAuth, requireRole('ADMIN'), updateUser);

export default router;
