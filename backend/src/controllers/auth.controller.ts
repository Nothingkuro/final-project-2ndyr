import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  getSessionCookieName,
  getSessionCookieOptions,
  hashPassword,
  isBcryptHash,
  signSessionToken,
  verifyPassword,
} from '../utils/auth';

/**
 * Authenticates a user and starts a cookie-backed session.
 *
 * This endpoint validates credentials, enforces role mapping from frontend terms,
 * and upgrades legacy plaintext passwords to bcrypt after successful login.
 *
 * @param req Express request containing username, password, and role.
 * @param res Express response with session cookie and user payload.
 * @returns Promise that resolves when the response is sent.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Map frontend roles to database roles
    const mappedRole = role === 'Owner' ? 'ADMIN' : 'STAFF';

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.role !== mappedRole) {
      res.status(401).json({ error: 'Role mismatch' });
      return;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    if (!isBcryptHash(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      });
    }

    const token = signSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    res.cookie(getSessionCookieName(), token, getSessionCookieOptions());

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Returns the currently authenticated user's profile.
 *
 * @param req Express request with auth context from middleware.
 * @param res Express response containing the current user.
 * @returns Promise that resolves when the response is sent.
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.authUser.id },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Session user no longer exists' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Clears the session cookie to terminate the current login session.
 *
 * @param _req Express request (unused).
 * @param res Express response confirming logout.
 * @returns Promise that resolves when the response is sent.
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(getSessionCookieName(), {
    ...getSessionCookieOptions(),
    maxAge: undefined,
  });

  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Rotates the current session token while preserving user identity.
 *
 * @param req Express request with authenticated user context.
 * @param res Express response with refreshed session cookie.
 * @returns Promise that resolves when the response is sent.
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = signSessionToken({
      id: req.authUser.id,
      username: req.authUser.username,
      role: req.authUser.role,
    });

    res.cookie(getSessionCookieName(), token, getSessionCookieOptions());

    res.status(200).json({ message: 'Session refreshed successfully' });
  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
