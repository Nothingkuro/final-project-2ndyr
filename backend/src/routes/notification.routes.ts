import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { globalNotificationSubject } from '../patterns/observer-pattern/notification.subject';

const router = Router();

router.use(requireAuth);

router.get('/stream', (_req, res) => {
  const clientId = randomUUID();
  globalNotificationSubject.subscribeClient(clientId, res);
});

export default router;
