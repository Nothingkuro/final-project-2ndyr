import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

describe('Membership management API (no mocks)', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `jest-staff-${suffix}`;
  const password = `P@ss-${suffix}`;
  let authCookie = '';

  let createdMemberId: string | null = null;
  let originalContactNumber = '';
  let updatedContactNumber = '';

  beforeAll(async () => {
    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: Role.STAFF,
      },
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      username,
      password,
      role: 'Staff',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.username).toBe(username);
    const setCookieHeader = loginResponse.headers['set-cookie'];
    authCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader[0]
      : setCookieHeader ?? '';
    expect(authCookie).toContain('arrowhead_session=');
  });

  afterAll(async () => {
    if (createdMemberId) {
      await prisma.member.deleteMany({
        where: {
          id: createdMemberId,
        },
      });
    }

    if (originalContactNumber) {
      await prisma.member.deleteMany({
        where: {
          contactNumber: originalContactNumber,
        },
      });
    }

    if (updatedContactNumber) {
      await prisma.member.deleteMany({
        where: {
          contactNumber: updatedContactNumber,
        },
      });
    }

    await prisma.user.deleteMany({
      where: {
        username,
      },
    });

    await disconnectPrisma();
  });

  it('rejects unauthenticated access to GET /api/members', async () => {
    const response = await request(app).get('/api/members');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects access with invalid session token', async () => {
    const response = await request(app)
      .get('/api/members')
      .set('Cookie', 'arrowhead_session=invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired session' });
  });

  it('rejects member creation when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/members')
      .set('Cookie', authCookie)
      .send({
        fullName: 'Only Name',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Full name and contact number are required' });
  });

  it('creates a member with authenticated request', async () => {
    originalContactNumber = `0917${Math.floor(1000000 + Math.random() * 8999999)}`;

    const response = await request(app)
      .post('/api/members')
      .set('Cookie', authCookie)
      .send({
      fullName: 'Test Member',
      contactNumber: originalContactNumber,
    });

    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe('Test');
    expect(response.body.lastName).toBe('Member');
    expect(response.body.contactNumber).toBe(originalContactNumber);
    expect(response.body.status).toBe('ACTIVE');

    createdMemberId = response.body.id;
    expect(typeof createdMemberId).toBe('string');
  });

  it('rejects duplicate contact number when creating a member', async () => {
    const response = await request(app)
      .post('/api/members')
      .set('Cookie', authCookie)
      .send({
        fullName: 'Another Member',
        contactNumber: originalContactNumber,
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Contact number already exists' });
  });

  it('returns created member in paginated list', async () => {
    const response = await request(app)
      .get(`/api/members?search=${originalContactNumber}&page=1&pageSize=10`)
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);

    const found = response.body.items.find((item: { id: string }) => item.id === createdMemberId);
    expect(found).toBeDefined();
  });

  it('updates an existing member', async () => {
    expect(createdMemberId).toBeTruthy();

    updatedContactNumber = `0928${Math.floor(1000000 + Math.random() * 8999999)}`;

    const response = await request(app)
      .patch(`/api/members/${createdMemberId}`)
      .set('Cookie', authCookie)
      .send({
      firstName: 'Updated',
      lastName: 'Member',
      contactNumber: updatedContactNumber,
    });

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe('Updated');
    expect(response.body.lastName).toBe('Member');
    expect(response.body.contactNumber).toBe(updatedContactNumber);
  });

  it('rejects update when required fields are missing', async () => {
    expect(createdMemberId).toBeTruthy();

    const response = await request(app)
      .patch(`/api/members/${createdMemberId}`)
      .set('Cookie', authCookie)
      .send({
        firstName: 'OnlyFirstName',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'First name, last name, and contact number are required',
    });
  });

  it('rejects update when contact number format is invalid', async () => {
    expect(createdMemberId).toBeTruthy();

    const response = await request(app)
      .patch(`/api/members/${createdMemberId}`)
      .set('Cookie', authCookie)
      .send({
        firstName: 'Updated',
        lastName: 'Member',
        contactNumber: '123-45',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Contact number must contain 7 to 15 digits' });
  });

  it('returns 404 when updating a non-existent member', async () => {
    const response = await request(app)
      .patch('/api/members/non-existent-member-id')
      .set('Cookie', authCookie)
      .send({
        firstName: 'Ghost',
        lastName: 'Member',
        contactNumber: '09175554444',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Member not found' });
  });

  it('deactivates an existing member', async () => {
    expect(createdMemberId).toBeTruthy();

    const response = await request(app)
      .patch(`/api/members/${createdMemberId}/deactivate`)
      .set('Cookie', authCookie)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdMemberId);
    expect(response.body.status).toBe('INACTIVE');
    expect(response.body.expiryDate).toBe('');
  });

  it('returns 404 when deactivating a non-existent member', async () => {
    const response = await request(app)
      .patch('/api/members/non-existent-member-id/deactivate')
      .set('Cookie', authCookie)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Member not found' });
  });
});
