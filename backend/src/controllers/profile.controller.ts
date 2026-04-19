import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword } from '../utils/auth';

/**
 * Lists all users for admin profile management views.
 *
 * @param req Express request.
 * @param res Express response containing user summaries.
 * @returns Promise that resolves when the response is sent.
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ role: 'desc' }, { username: 'asc' }],
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Returns the authenticated user's current profile.
 *
 * @param req Express request with auth context.
 * @param res Express response containing current user profile.
 * @returns Promise that resolves when the response is sent.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Updates the authenticated user's username and/or password.
 *
 * @param req Express request containing profile patch payload.
 * @param res Express response containing updated user data.
 * @returns Promise that resolves when the response is sent.
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { username, newPassword } = req.body;

    // Validate input
    if (!username && !newPassword) {
      res.status(400).json({
        error: 'At least username or password must be provided',
      });
      return;
    }

    if (username && username.trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if new username already exists (if changing username)
    if (username && username !== req.authUser.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() },
      });

      if (existingUser) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
    }

    // Update user
    const updateData: { username?: string; passwordHash?: string } = {};
    if (username) {
      updateData.username = username.trim();
    }
    if (newPassword) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.authUser.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Allows admins to update another user's credentials.
 *
 * Business rules prevent admins from editing other admin accounts.
 *
 * @param req Express request containing target user id and patch payload.
 * @param res Express response containing updated user data.
 * @returns Promise that resolves when the response is sent.
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.authUser.role !== 'ADMIN') {
      res
        .status(403)
        .json({ error: 'Only admins can update other user profiles' });
      return;
    }

    const userIdParam = req.params.userId;
    const { username, newPassword } = req.body;

    if (typeof userIdParam !== 'string' || userIdParam.trim().length === 0) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userId = userIdParam;

    // Validate input
    if (!username && !newPassword) {
      res.status(400).json({
        error: 'At least username or password must be provided',
      });
      return;
    }

    if (username && username.trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Admin cannot update another admin
    if (targetUser.role === 'ADMIN' && targetUser.id !== req.authUser.id) {
      res.status(403).json({ error: 'Cannot update another admin account' });
      return;
    }

    // Check if new username already exists (if changing username)
    if (username && username !== targetUser.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() },
      });

      if (existingUser) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
    }

    // Update user
    const updateData: { username?: string; passwordHash?: string } = {};
    if (username) {
      updateData.username = username.trim();
    }
    if (newPassword) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
