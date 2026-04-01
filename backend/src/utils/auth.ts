import type { CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthUser, SessionTokenPayload } from '../types/auth';

const DEFAULT_SESSION_TTL = '7d';
const DEFAULT_COOKIE_NAME = 'arrowhead_session';
const DEV_JWT_SECRET = 'dev-only-change-this-secret';

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

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
