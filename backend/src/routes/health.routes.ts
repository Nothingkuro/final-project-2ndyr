import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * @route GET /api/health
 * @desc Public endpoint for UptimeRobot to verify system status
 */
router.get('/health', async (_req, res) => {
  try {
    // 1. Verify Database Connection
    // Using $queryRaw is the lightest way to ping Postgres
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'healthy'
      }
    });
  } catch (error) {
    // If DB fails, return 503 (Service Unavailable)
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

export default router;