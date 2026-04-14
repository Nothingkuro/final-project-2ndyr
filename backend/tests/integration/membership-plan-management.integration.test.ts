import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function getCookie(setCookieHeader: string[] | string | undefined): string {
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : setCookieHeader ?? '';
}

describe('Membership plan management API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const staffUsername = `jest-staff-plan-${suffix}`;
  const staffPassword = `P@ss-staff-${suffix}`;
  const adminUsername = `jest-admin-plan-${suffix}`;
  const adminPassword = `P@ss-admin-${suffix}`;

  let staffCookie = '';
  let adminCookie = '';

  let createdPlanId: string | null = null;
  let createdPlanName = '';

  async function loginUser(username: string, password: string, role: 'Staff' | 'Owner') {
    const loginResponse = await request(app).post('/api/auth/login').send({
      username,
      password,
      role,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.username).toBe(username);

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

    staffCookie = await loginUser(staffUsername, staffPassword, 'Staff');
    adminCookie = await loginUser(adminUsername, adminPassword, 'Owner');
  });

  afterAll(async () => {
    if (createdPlanId) {
      await prisma.membershipPlan.deleteMany({ where: { id: createdPlanId } });
    }

    if (createdPlanName) {
      await prisma.membershipPlan.deleteMany({ where: { name: createdPlanName } });
    }

    await prisma.user.deleteMany({
      where: {
        username: {
          in: [staffUsername, adminUsername],
        },
      },
    });

    await disconnectPrisma();
  });

  it('rejects unauthenticated access to GET /api/membership-plans', async () => {
    const response = await request(app).get('/api/membership-plans');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('lets authenticated staff list membership plans', async () => {
    const response = await request(app)
      .get('/api/membership-plans?includeArchived=true')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('rejects staff from creating membership plans', async () => {
    const response = await request(app)
      .post('/api/membership-plans')
      .set('Cookie', staffCookie)
      .send({
        name: `Staff Plan ${suffix}`,
        durationDays: 30,
        price: 1000,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('creates membership plan as admin', async () => {
    createdPlanName = `Plan ${suffix}`;

    const response = await request(app)
      .post('/api/membership-plans')
      .set('Cookie', adminCookie)
      .send({
        name: createdPlanName,
        description: 'Integration test plan',
        durationDays: 45,
        price: 2345,
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(createdPlanName);
    expect(response.body.durationDays).toBe(45);
    expect(response.body.price).toBe(2345);
    expect(response.body.isActive).toBe(true);

    createdPlanId = response.body.id;
    expect(typeof createdPlanId).toBe('string');
  });

  it('rejects duplicate membership plan name', async () => {
    const response = await request(app)
      .post('/api/membership-plans')
      .set('Cookie', adminCookie)
      .send({
        name: createdPlanName,
        description: 'Duplicate',
        durationDays: 30,
        price: 1000,
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'A membership plan with this name already exists.' });
  });

  it('updates membership plan as admin', async () => {
    expect(createdPlanId).toBeTruthy();

    const response = await request(app)
      .put(`/api/membership-plans/${createdPlanId}`)
      .set('Cookie', adminCookie)
      .send({
        name: `${createdPlanName} Updated`,
        description: 'Updated integration plan',
        durationDays: 60,
        price: 2600,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdPlanId);
    expect(response.body.name).toBe(`${createdPlanName} Updated`);
    expect(response.body.durationDays).toBe(60);
    expect(response.body.price).toBe(2600);
    expect(response.body.isActive).toBe(false);
  });

  it('rejects staff from updating membership plans', async () => {
    expect(createdPlanId).toBeTruthy();

    const response = await request(app)
      .put(`/api/membership-plans/${createdPlanId}`)
      .set('Cookie', staffCookie)
      .send({
        name: 'Unauthorized Update',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('filters archived plans when includeArchived=false', async () => {
    expect(createdPlanId).toBeTruthy();

    const response = await request(app)
      .get('/api/membership-plans?includeArchived=false')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);

    const found = response.body.items.find((item: { id: string }) => item.id === createdPlanId);
    expect(found).toBeUndefined();
  });

  it('rejects staff from deleting membership plans', async () => {
    expect(createdPlanId).toBeTruthy();

    const response = await request(app)
      .delete(`/api/membership-plans/${createdPlanId}`)
      .set('Cookie', staffCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('deletes membership plan as admin', async () => {
    expect(createdPlanId).toBeTruthy();

    const response = await request(app)
      .delete(`/api/membership-plans/${createdPlanId}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(204);

    const verifyResponse = await request(app)
      .get('/api/membership-plans?includeArchived=true')
      .set('Cookie', adminCookie);

    expect(verifyResponse.status).toBe(200);
    const found = verifyResponse.body.items.find((item: { id: string }) => item.id === createdPlanId);
    expect(found).toBeUndefined();

    createdPlanId = null;
  });
});
