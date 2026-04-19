import type { AuthUser } from './auth';

declare global {
  namespace Express {
    /**
     * Extends Express Request with authenticated user context set by middleware.
     */
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
