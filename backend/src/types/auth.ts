/**
 * Authenticated user identity attached to request context.
 */
export interface AuthUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}

/**
 * JWT payload format used for short-lived session tokens.
 */
export interface SessionTokenPayload {
  sub: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}
