import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Returns API and database health used by monitoring services.
 *
 * @param _req Express request (unused).
 * @param res Express response containing health status details.
 * @returns Promise that resolves when the response is sent.
 */
const healthHandler = async (_req: Request, res: Response): Promise<void> => {
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
};

// Public route with no auth middleware to support external uptime probes.
router.get('/health', healthHandler);

export default router;