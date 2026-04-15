import type { Request, Response } from 'express';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../src/utils/auth', () => ({
  ...jest.requireActual('../../../src/utils/auth'),
  hashPassword: jest.fn(),
}));

import {
  getUsers,
  getProfile,
  updateProfile,
  updateUser,
} from '../../../src/controllers/profile.controller';
import prisma from '../../../src/lib/prisma';
import { hashPassword } from '../../../src/utils/auth';

function createResponse(): Response {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;

  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);

  return res;
}

describe('profile controller (mocked)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUsers', () => {
    it('returns users when query succeeds', async () => {
      const users = [
        {
          id: 'admin-1',
          username: 'admin',
          role: 'ADMIN',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users);

      const req = {} as Request;
      const res = createResponse();

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ users });
    });

    it('returns 500 on query error', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('db fail'));

      const req = {} as Request;
      const res = createResponse();

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getProfile', () => {
    it('returns 401 when auth user is missing', async () => {
      const req = { authUser: undefined } as unknown as Request;
      const res = createResponse();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('returns 404 when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = {
        authUser: { id: 'missing', username: 'ghost', role: 'ADMIN' },
      } as unknown as Request;
      const res = createResponse();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns current user profile', async () => {
      const user = {
        id: 'admin-1',
        username: 'admin',
        role: 'ADMIN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
      } as unknown as Request;
      const res = createResponse();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user });
    });
  });

  describe('updateProfile', () => {
    it('returns 400 when nothing to update', async () => {
      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
        body: {},
      } as unknown as Request;
      const res = createResponse();

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'At least username or password must be provided',
      });
    });

    it('updates username only', async () => {
      const updatedUser = {
        id: 'admin-1',
        username: 'admin.updated',
        role: 'ADMIN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
        body: { username: 'admin.updated' },
      } as unknown as Request;
      const res = createResponse();

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    });

    it('updates password for the current user', async () => {
      (hashPassword as jest.Mock).mockResolvedValue('new-hash');
      mockPrisma.user.update.mockResolvedValue({
        id: 'admin-1',
        username: 'admin',
        role: 'ADMIN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      });

      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
        body: {
          newPassword: 'new-pass-123',
        },
      } as unknown as Request;
      const res = createResponse();

      await updateProfile(req, res);

      expect(hashPassword).toHaveBeenCalledWith('new-pass-123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUser', () => {
    it('returns 403 for non-admin actor', async () => {
      const req = {
        authUser: { id: 'staff-1', username: 'staff', role: 'STAFF' },
        params: { userId: 'staff-2' },
        body: { username: 'staff.updated' },
      } as unknown as Request;
      const res = createResponse();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only admins can update other user profiles',
      });
    });

    it('returns 404 when target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
        params: { userId: 'missing' },
        body: { username: 'staff.updated' },
      } as unknown as Request;
      const res = createResponse();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('updates staff account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'staff-1',
        username: 'staff',
        role: 'STAFF',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      (hashPassword as jest.Mock).mockResolvedValue('staff-new-hash');
      mockPrisma.user.update.mockResolvedValue({
        id: 'staff-1',
        username: 'staff.updated',
        role: 'STAFF',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      });

      const req = {
        authUser: { id: 'admin-1', username: 'admin', role: 'ADMIN' },
        params: { userId: 'staff-1' },
        body: {
          username: 'staff.updated',
          newPassword: 'staff-pass-456',
        },
      } as unknown as Request;
      const res = createResponse();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User updated successfully',
        })
      );
    });
  });
});
