import type { CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthUser, SessionTokenPayload } from '../types/auth';

const DEFAULT_SESSION_TTL = '5m';
const DEFAULT_COOKIE_NAME = 'arrowhead_session';
const DEV_JWT_SECRET = 'dev-only-change-this-secret';
const DEFAULT_PROD_COOKIE_SAME_SITE = 'none';
const DEFAULT_NON_PROD_COOKIE_SAME_SITE = 'lax';

/**
 * Resolves the JWT secret used to sign and verify session tokens.
 *
 * Development falls back to a local-only default to reduce setup friction,
 * while production strictly requires an explicit secret.
 *
 * @returns Secret string used by jsonwebtoken.
 * @throws {Error} When running in production without JWT_SECRET configured.
 */
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV !== 'production') {
    return DEV_JWT_SECRET;
  }

  throw new Error('JWT_SECRET environment variable is required in production');
}

/**
 * Returns the cookie key used for session token storage.
 *
 * @returns Session cookie name for request/response cookie operations.
 */
export function getSessionCookieName(): string {
  return process.env.AUTH_COOKIE_NAME ?? DEFAULT_COOKIE_NAME;
}

/**
 * Returns the JWT lifetime for session tokens.
 *
 * @returns jsonwebtoken expiresIn value.
 */
function getSessionTtl(): jwt.SignOptions['expiresIn'] {
  return (process.env.SESSION_TTL ?? DEFAULT_SESSION_TTL) as jwt.SignOptions['expiresIn'];
}

/**
 * Resolves SameSite behavior for auth cookies.
 *
 * @returns Cookie SameSite mode compatible with Express CookieOptions.
 */
function getSessionCookieSameSite(): NonNullable<CookieOptions['sameSite']> {
  const configuredValue = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();

  if (configuredValue === 'lax' || configuredValue === 'strict' || configuredValue === 'none') {
    return configuredValue;
  }

  return process.env.NODE_ENV === 'production'
    ? DEFAULT_PROD_COOKIE_SAME_SITE
    : DEFAULT_NON_PROD_COOKIE_SAME_SITE;
}

/**
 * Resolves whether the auth cookie must be Secure.
 *
 * Browsers reject SameSite=None cookies unless Secure is true, so this helper
 * enforces that rule even when env overrides are provided.
 *
 * @param sameSite Effective SameSite value selected for the cookie.
 * @returns True when the cookie should only be sent over HTTPS.
 */
function getSessionCookieSecure(sameSite: NonNullable<CookieOptions['sameSite']>): boolean {
  const configuredValue = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (configuredValue === 'true') {
    return true;
  }

  if (configuredValue === 'false') {
    // Browsers reject SameSite=None cookies without Secure, so force a safe value.
    return sameSite === 'none';
  }

  return process.env.NODE_ENV === 'production' || sameSite === 'none';
}

/**
 * Builds shared cookie options for session lifecycle endpoints.
 *
 * @returns Cookie configuration aligned with current environment settings.
 */
export function getSessionCookieOptions(): CookieOptions {
  const sameSite = getSessionCookieSameSite();

  return {
    httpOnly: true,
    secure: getSessionCookieSecure(sameSite),
    sameSite,
    path: '/',
    maxAge: 5 * 60 * 1000, // 5 minutes
  };
}

/**
 * Creates a signed JWT session token from an authenticated user record.
 *
 * @param user Authenticated user identity.
 * @returns Signed JWT string consumed by cookie or Authorization header.
 * @throws {Error} When signing configuration is invalid.
 */
export function signSessionToken(user: AuthUser): string {
  const payload: SessionTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getSessionTtl(),
  });
}

/**
 * Verifies and decodes a JWT session token.
 *
 * @param token Raw JWT token value from cookie or bearer header.
 * @returns Decoded session payload for request authorization.
 * @throws {Error} When token is invalid, expired, or signed with the wrong key.
 */
export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, getJwtSecret()) as SessionTokenPayload;
}

/**
 * Checks if a stored password value is a bcrypt hash.
 *
 * @param value Stored credential string.
 * @returns True when the value matches the bcrypt hash format.
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

/**
 * Hashes a plaintext password using configured bcrypt rounds.
 *
 * @param password Plaintext password to hash.
 * @returns Promise that resolves to a bcrypt hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  return bcrypt.hash(password, rounds);
}

/**
 * Verifies login credentials against either bcrypt or legacy plaintext values.
 *
 * Legacy plaintext support allows seamless migration of old accounts that have
 * not yet been re-hashed.
 *
 * @param password Plaintext password supplied by the user.
 * @param passwordHash Stored password value from the database.
 * @returns True when the supplied password is valid.
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!isBcryptHash(passwordHash)) {
    return passwordHash === password;
  }

  return bcrypt.compare(password, passwordHash);
}
