import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function getCookie(setCookieHeader: string[] | string | undefined): string {
  return Array.isArray(setCookieHeader)
    ? setCookieHeader[0] ?? ''
    : setCookieHeader ?? '';
}

describe('Profile management API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const staffUsername = `jest-staff-profile-${suffix}`;
  const staffPassword = `P@ss-staff-${suffix}`;
  const adminUsername = `jest-admin-profile-${suffix}`;
  const adminPassword = `P@ss-admin-${suffix}`;

  let staffCookie = '';
  let adminCookie = '';
  let staffId = '';
  let adminId = '';

  async function loginUser(
    username: string,
    password: string,
    role: 'Staff' | 'Owner'
  ) {
    const loginResponse = await request(app).post('/api/auth/login').send({
      username,
      password,
      role,
    });

    const cookie = getCookie(loginResponse.headers['set-cookie']);
    expect(cookie).toContain('arrowhead_session=');

    return cookie;
  }

  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          username: staffUsername,
          passwordHash: await hashPassword(staffPassword),
          role: Role.STAFF,
        },
        {
          username: adminUsername,
          passwordHash: await hashPassword(adminPassword),
          role: Role.ADMIN,
        },
      ],
    });

    // Get the IDs of created users
    const staffUser = await prisma.user.findUnique({
      where: { username: staffUsername },
    });
    const adminUser = await prisma.user.findUnique({
      where: { username: adminUsername },
    });

    staffId = staffUser?.id || '';
    adminId = adminUser?.id || '';

    staffCookie = await loginUser(staffUsername, staffPassword, 'Staff');
    adminCookie = await loginUser(adminUsername, adminPassword, 'Owner');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [staffId, adminId],
        },
      },
    });

    await disconnectPrisma();
  });

  describe('GET /api/users', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 403 if not admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(403);
    });

    it('should return all users if admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/profile', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return current user profile if authenticated', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(adminUsername);
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('staff can get their own profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(staffUsername);
      expect(res.body.user.role).toBe('STAFF');
    });
  });

  describe('PUT /api/profile', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .put('/api/profile')
        .send({ username: 'newadmin' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if no username or password provided', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Cookie', adminCookie)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('At least username or password');
    });

    it('should update own username successfully', async () => {
      const newUsername = `jest-admin-updated-${Date.now()}`;

      const res = await request(app)
        .put('/api/profile')
        .set('Cookie', adminCookie)
        .send({ username: newUsername });

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(newUsername);

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: adminId },
      });
      expect(updatedUser?.username).toBe(newUsername);
    });

    it('should return 400 if username is too short', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Cookie', adminCookie)
        .send({ username: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 3 characters');
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .put(`/api/users/${staffId}`)
        .send({ username: 'newstaff' });

      expect(res.status).toBe(401);
    });

    it('should return 403 if not admin', async () => {
      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Cookie', staffCookie)
        .send({ username: 'newadmin' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('should return 404 if target user not found', async () => {
      const res = await request(app)
        .put(`/api/users/nonexistent-id`)
        .set('Cookie', adminCookie)
        .send({ username: 'newstaff' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 403 if trying to update another admin', async () => {
      // Create another admin
      const otherAdmin = await prisma.user.create({
        data: {
          username: `other-admin-${Date.now()}`,
          passwordHash: await hashPassword('admin123'),
          role: Role.ADMIN,
        },
      });

      try {
        const res = await request(app)
          .put(`/api/users/${otherAdmin.id}`)
          .set('Cookie', adminCookie)
          .send({ username: 'newadmin' });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Cannot update another admin');
      } finally {
        await prisma.user.delete({ where: { id: otherAdmin.id } });
      }
    });

    it('should update staff username as admin', async () => {
      const newUsername = `jest-staff-updated-${Date.now()}`;

      const res = await request(app)
        .put(`/api/users/${staffId}`)
        .set('Cookie', adminCookie)
        .send({ username: newUsername });

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(newUsername);

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: staffId },
      });
      expect(updatedUser?.username).toBe(newUsername);
    });

    it('should update staff password as admin', async () => {
      const newPassword = 'newstaff456';

      const res = await request(app)
        .put(`/api/users/${staffId}`)
        .set('Cookie', adminCookie)
        .send({ newPassword });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();

      // Verify password was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: staffId },
      });
      expect(updatedUser?.passwordHash).toBeDefined();
    });
  });
});
