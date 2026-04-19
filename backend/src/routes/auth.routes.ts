import { Router } from 'express';
import { login, logout, me, refresh } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public sign-in endpoint that issues the session cookie.
router.post('/login', login);
// Public sign-out endpoint that clears the session cookie.
router.post('/logout', logout);
// Protected endpoint: requireAuth -> me controller for current user context.
router.get('/me', requireAuth, me);
// Protected endpoint: requireAuth -> refresh controller for token rotation.
router.post('/refresh', requireAuth, refresh);

export default router;
