import type { AuthUser } from './auth';
import type { RequestContext } from './request-context';

declare global {
  namespace Express {
    /**
     * Extends Express Request with authenticated user context set by middleware.
     */
    interface Request {
      authUser?: AuthUser;
      requestContext?: RequestContext;
    }
  }
}

export {};
