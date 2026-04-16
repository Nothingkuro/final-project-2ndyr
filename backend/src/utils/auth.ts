import type { CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthUser, SessionTokenPayload } from '../types/auth';

const DEFAULT_SESSION_TTL = '5m';
const DEFAULT_COOKIE_NAME = 'arrowhead_session';
const DEV_JWT_SECRET = 'dev-only-change-this-secret';
const DEFAULT_PROD_COOKIE_SAME_SITE = 'none';
const DEFAULT_NON_PROD_COOKIE_SAME_SITE = 'lax';

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV !== 'production') {
    return DEV_JWT_SECRET;
  }

  throw new Error('JWT_SECRET environment variable is required in production');
}

export function getSessionCookieName(): string {
  return process.env.AUTH_COOKIE_NAME ?? DEFAULT_COOKIE_NAME;
}

function getSessionTtl(): jwt.SignOptions['expiresIn'] {
  return (process.env.SESSION_TTL ?? DEFAULT_SESSION_TTL) as jwt.SignOptions['expiresIn'];
}

function getSessionCookieSameSite(): NonNullable<CookieOptions['sameSite']> {
  const configuredValue = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();

  if (configuredValue === 'lax' || configuredValue === 'strict' || configuredValue === 'none') {
    return configuredValue;
  }

  return process.env.NODE_ENV === 'production'
    ? DEFAULT_PROD_COOKIE_SAME_SITE
    : DEFAULT_NON_PROD_COOKIE_SAME_SITE;
}

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

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, getJwtSecret()) as SessionTokenPayload;
}

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!isBcryptHash(passwordHash)) {
    return passwordHash === password;
  }

  return bcrypt.compare(password, passwordHash);
}
