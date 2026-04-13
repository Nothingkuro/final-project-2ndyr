import request from 'supertest';
import { EquipmentCondition, Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function getCookie(setCookieHeader: string[] | string | undefined): string {
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : setCookieHeader ?? '';
}

describe('Equipment management API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const staffUsername = `jest-staff-equipment-${suffix}`;
  const staffPassword = `P@ss-staff-${suffix}`;
  const adminUsername = `jest-admin-equipment-${suffix}`;
  const adminPassword = `P@ss-admin-${suffix}`;

  let staffCookie = '';
  let adminCookie = '';

  let createdEquipmentId: string | null = null;
  let updatedEquipmentId: string | null = null;
  let secondaryEquipmentId: string | null = null;

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

    const createdEquipment = await prisma.equipment.create({
      data: {
        itemName: `Test Barbell ${suffix}`,
        quantity: 8,
        condition: EquipmentCondition.GOOD,
        lastChecked: new Date('2026-04-01T10:00:00.000Z'),
      },
    });

    createdEquipmentId = createdEquipment.id;

    const secondaryEquipment = await prisma.equipment.create({
      data: {
        itemName: `Test Bench ${suffix}`,
        quantity: 4,
        condition: EquipmentCondition.MAINTENANCE,
        lastChecked: new Date('2026-04-01T11:00:00.000Z'),
      },
    });

    secondaryEquipmentId = secondaryEquipment.id;
  });

  afterAll(async () => {
    await prisma.equipment.deleteMany({
      where: {
        id: {
          in: [createdEquipmentId, updatedEquipmentId, secondaryEquipmentId].filter(
            (value): value is string => Boolean(value),
          ),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        username: {
          in: [staffUsername, adminUsername],
        },
      },
    });

    await disconnectPrisma();
  });

  it('rejects unauthenticated access to GET /api/equipment', async () => {
    const response = await request(app).get('/api/equipment');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to POST /api/equipment', async () => {
    const response = await request(app).post('/api/equipment').send({
      itemName: `No Auth ${suffix}`,
      quantity: 1,
      condition: 'GOOD',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to PUT /api/equipment/:equipmentId', async () => {
    expect(createdEquipmentId).toBeTruthy();

    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}`)
      .send({
        itemName: `No Auth Update ${suffix}`,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to PUT /api/equipment/:equipmentId/condition', async () => {
    expect(createdEquipmentId).toBeTruthy();

    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}/condition`)
      .send({
        condition: 'GOOD',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to DELETE /api/equipment/:equipmentId', async () => {
    expect(secondaryEquipmentId).toBeTruthy();

    const response = await request(app).delete(`/api/equipment/${secondaryEquipmentId}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('lets authenticated staff list equipment with search and filter', async () => {
    const response = await request(app)
      .get(`/api/equipment?search=${encodeURIComponent(suffix)}&condition=GOOD&page=1&pageSize=10`)
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);

    const found = response.body.items.find((item: { id: string }) => item.id === createdEquipmentId);
    expect(found).toBeDefined();
    expect(found.itemName).toContain(`Test Barbell ${suffix}`);
    expect(found.condition).toBe('GOOD');
  });

  it('rejects staff from creating equipment', async () => {
    const response = await request(app)
      .post('/api/equipment')
      .set('Cookie', staffCookie)
      .send({
        itemName: `Unauthorized ${suffix}`,
        quantity: 1,
        condition: 'GOOD',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('creates equipment as admin', async () => {
    const response = await request(app)
      .post('/api/equipment')
      .set('Cookie', adminCookie)
      .send({
        itemName: `Created Asset ${suffix}`,
        quantity: 3,
        condition: 'BROKEN',
      });

    expect(response.status).toBe(201);
    expect(response.body.itemName).toBe(`Created Asset ${suffix}`);
    expect(response.body.quantity).toBe(3);
    expect(response.body.condition).toBe('BROKEN');
    expect(typeof response.body.lastChecked).toBe('string');

    updatedEquipmentId = response.body.id;
  });

  it('rejects invalid create payloads', async () => {
    const response = await request(app)
      .post('/api/equipment')
      .set('Cookie', adminCookie)
      .send({
        itemName: '',
        quantity: -1,
        condition: 'INVALID',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('updates equipment details as admin', async () => {
    expect(createdEquipmentId).toBeTruthy();

    const before = await prisma.equipment.findUnique({
      where: { id: createdEquipmentId as string },
      select: { lastChecked: true },
    });

    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}`)
      .set('Cookie', adminCookie)
      .send({
        itemName: `Updated Barbell ${suffix}`,
        quantity: 10,
        condition: 'MAINTENANCE',
      });

    expect(response.status).toBe(200);
    expect(response.body.itemName).toBe(`Updated Barbell ${suffix}`);
    expect(response.body.quantity).toBe(10);
    expect(response.body.condition).toBe('MAINTENANCE');

    const after = await prisma.equipment.findUnique({
      where: { id: createdEquipmentId as string },
      select: { lastChecked: true },
    });

    expect(before?.lastChecked?.getTime()).not.toBe(after?.lastChecked?.getTime());
  });

  it('rejects staff from updating equipment details', async () => {
    expect(createdEquipmentId).toBeTruthy();

    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}`)
      .set('Cookie', staffCookie)
      .send({
        itemName: `Staff Cannot Update ${suffix}`,
        quantity: 2,
        condition: 'GOOD',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('lets staff update only equipment condition and refreshes lastChecked', async () => {
    expect(createdEquipmentId).toBeTruthy();

    const before = await prisma.equipment.findUnique({
      where: { id: createdEquipmentId as string },
      select: { condition: true, lastChecked: true },
    });

    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}/condition`)
      .set('Cookie', staffCookie)
      .send({
        condition: 'BROKEN',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdEquipmentId);
    expect(response.body.condition).toBe('BROKEN');
    expect(typeof response.body.lastChecked).toBe('string');

    const after = await prisma.equipment.findUnique({
      where: { id: createdEquipmentId as string },
      select: { condition: true, lastChecked: true },
    });

    expect(before?.condition).not.toBe(after?.condition);
    expect(before?.lastChecked?.getTime()).not.toBe(after?.lastChecked?.getTime());
  });

  it('rejects invalid condition updates', async () => {
    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}/condition`)
      .set('Cookie', staffCookie)
      .send({
        condition: 'UNKNOWN',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid condition status' });
  });

  it('rejects missing condition updates', async () => {
    const response = await request(app)
      .put(`/api/equipment/${createdEquipmentId}/condition`)
      .set('Cookie', staffCookie)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Condition is required' });
  });

  it('deletes equipment as admin', async () => {
    expect(updatedEquipmentId).toBeTruthy();

    const response = await request(app)
      .delete(`/api/equipment/${updatedEquipmentId}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Equipment deleted successfully' });

    const verifyResponse = await request(app)
      .delete(`/api/equipment/${updatedEquipmentId}`)
      .set('Cookie', adminCookie);

    expect(verifyResponse.status).toBe(404);
    expect(verifyResponse.body).toEqual({ error: 'Equipment not found' });
  });

  it('rejects staff from deleting equipment', async () => {
    expect(secondaryEquipmentId).toBeTruthy();

    const response = await request(app)
      .delete(`/api/equipment/${secondaryEquipmentId}`)
      .set('Cookie', staffCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });
});
