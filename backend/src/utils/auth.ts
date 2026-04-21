import type { CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ConfigManager from '../config/ConfigManager';
import type { AuthUser, SessionTokenPayload } from '../types/auth';

/**
 * Returns the cookie key used for session token storage.
 *
 * @returns Session cookie name for request/response cookie operations.
 */
export function getSessionCookieName(): string {
  return ConfigManager.getInstance().authCookieName;
}

/**
 * Builds shared cookie options for session lifecycle endpoints.
 *
 * @returns Cookie configuration aligned with current environment settings.
 */
export function getSessionCookieOptions(): CookieOptions {
  const config = ConfigManager.getInstance();

  return {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: config.authCookieSameSite,
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
  const config = ConfigManager.getInstance();

  const payload: SessionTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.sessionTtl as jwt.SignOptions['expiresIn'],
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
  return jwt.verify(token, ConfigManager.getInstance().jwtSecret) as SessionTokenPayload;
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
  return bcrypt.hash(password, ConfigManager.getInstance().bcryptRounds);
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
