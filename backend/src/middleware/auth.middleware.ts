import { NextFunction, Request, Response } from 'express';
import { getSessionCookieName, verifySessionToken } from '../utils/auth';

/**
 * Extracts a JWT token from a standard Bearer authorization header.
 *
 * @param authHeader Raw Authorization header value.
 * @returns Token string when header is valid Bearer format; otherwise null.
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Enforces that a request has a valid authenticated session.
 *
 * The middleware accepts tokens from either HTTP-only session cookies or
 * Authorization headers so browser and API client workflows share one guard.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express continuation callback.
 * @returns Void; sends 401 on auth failure.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const cookieToken = req.cookies?.[getSessionCookieName()] as string | undefined;
    const headerToken = extractBearerToken(req.header('Authorization'));
    const token = cookieToken ?? headerToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifySessionToken(token);

    req.authUser = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

/**
 * Builds middleware that enforces a specific application role.
 *
 * @param role Required role name for route access.
 * @returns Express middleware that sends 401/403 when access is denied.
 */
export const requireRole = (role: string) => {
  /**
   * Rejects authenticated users whose role does not match the route contract.
   *
   * @param req Express request containing auth user context.
   * @param res Express response.
   * @param next Express continuation callback.
   * @returns Void; calls next on success.
   */
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.authUser.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
