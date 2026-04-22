import request from 'supertest';
import { Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function getCookie(setCookieHeader: string[] | string | undefined): string {
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : setCookieHeader ?? '';
}

describe('Reporting and analysis API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const staffUsername = `jest-staff-report-${suffix}`;
  const staffPassword = `P@ss-staff-${suffix}`;
  const adminUsername = `jest-admin-report-${suffix}`;
  const adminPassword = `P@ss-admin-${suffix}`;

  let staffCookie = '';
  let adminCookie = '';

  let createdMemberId: string | null = null;
  let createdFarMemberId: string | null = null;
  let createdPlanId: string | null = null;
  let createdEquipmentIds: string[] = [];
  let createdPaymentIds: string[] = [];

  async function loginUser(username: string, password: string, role: 'Staff' | 'Owner') {
    const loginResponse = await request(app).post('/api/auth/login').send({
      username,
      password,
      role,
    });

    expect(loginResponse.status).toBe(200);

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

    const plan = await prisma.membershipPlan.create({
      data: {
        name: `Report Plan ${suffix}`,
        durationDays: 30,
        price: 1200,
        isActive: true,
      },
    });
    createdPlanId = plan.id;

    const expiringMember = await prisma.member.create({
      data: {
        firstName: 'Expiry',
        lastName: 'Soon',
        contactNumber: `0917${Math.floor(1000000 + Math.random() * 8999999)}`,
        status: 'ACTIVE',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });
    createdMemberId = expiringMember.id;

    const farMember = await prisma.member.create({
      data: {
        firstName: 'Expiry',
        lastName: 'Far',
        contactNumber: `0928${Math.floor(1000000 + Math.random() * 8999999)}`,
        status: 'ACTIVE',
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    });
    createdFarMemberId = farMember.id;

    const lowEquipment = await prisma.equipment.create({
      data: {
        itemName: `Low Inventory ${suffix}`,
        quantity: 2,
        condition: 'GOOD',
      },
    });

    const normalEquipment = await prisma.equipment.create({
      data: {
        itemName: `Normal Inventory ${suffix}`,
        quantity: 10,
        condition: 'GOOD',
      },
    });

    createdEquipmentIds = [lowEquipment.id, normalEquipment.id];

    const adminUser = await prisma.user.findUnique({
      where: { username: adminUsername },
      select: { id: true },
    });

    if (!adminUser || !createdPlanId || !createdMemberId) {
      throw new Error('Failed to create report test dependencies');
    }

    const todayPayment1 = await prisma.payment.create({
      data: {
        memberId: createdMemberId,
        planId: createdPlanId,
        amount: 1000,
        paymentMethod: 'CASH',
        processedById: adminUser.id,
        transactionDate: new Date(),
      },
    });

    const todayPayment2 = await prisma.payment.create({
      data: {
        memberId: createdMemberId,
        planId: createdPlanId,
        amount: 500,
        paymentMethod: 'GCASH',
        processedById: adminUser.id,
        transactionDate: new Date(),
      },
    });

    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    const previousMonthPayment = await prisma.payment.create({
      data: {
        memberId: createdMemberId,
        planId: createdPlanId,
        amount: 900,
        paymentMethod: 'CASH',
        processedById: adminUser.id,
        transactionDate: previousMonthDate,
      },
    });

    createdPaymentIds = [todayPayment1.id, todayPayment2.id, previousMonthPayment.id];
  });

  afterAll(async () => {
    if (createdPaymentIds.length > 0) {
      await prisma.payment.deleteMany({
        where: {
          id: {
            in: createdPaymentIds,
          },
        },
      });
    }

    if (createdEquipmentIds.length > 0) {
      await prisma.equipment.deleteMany({
        where: {
          id: {
            in: createdEquipmentIds,
          },
        },
      });
    }

    if (createdMemberId || createdFarMemberId) {
      await prisma.member.deleteMany({
        where: {
          id: {
            in: [createdMemberId, createdFarMemberId].filter((value): value is string => Boolean(value)),
          },
        },
      });
    }

    if (createdPlanId) {
      await prisma.membershipPlan.deleteMany({
        where: {
          id: createdPlanId,
        },
      });
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

  it('rejects unauthenticated access to reports overview', async () => {
    const response = await request(app).get('/api/reports/overview');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to daily revenue reports', async () => {
    const response = await request(app).get('/api/reports/daily-revenue');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('allows staff to fetch upcoming expirations', async () => {
    const response = await request(app)
      .get('/api/reports/upcoming-expirations?days=3')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const found = response.body.find((member: { id: string }) => member.id === createdMemberId);
    expect(found).toBeDefined();

    const farFound = response.body.find((member: { id: string }) => member.id === createdFarMemberId);
    expect(farFound).toBeUndefined();
  });

  it('rejects staff from admin reporting endpoints', async () => {
    const response = await request(app)
      .get('/api/reports/overview')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('rejects staff from daily revenue endpoint', async () => {
    const response = await request(app)
      .get('/api/reports/daily-revenue')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('rejects staff from low inventory endpoint', async () => {
    const response = await request(app)
      .get('/api/reports/low-inventory')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('returns low inventory alerts for admin', async () => {
    const response = await request(app)
      .get('/api/reports/low-inventory?threshold=5')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const lowItem = response.body.find((item: { id: string }) => item.id === createdEquipmentIds[0]);
    expect(lowItem).toBeDefined();
    expect(lowItem.threshold).toBe(5);
  });

  it('returns reporting overview for admin', async () => {
    const response = await request(app)
      .get('/api/reports/overview?threshold=5&days=3')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.dailyRevenue.total).toBeGreaterThanOrEqual(1500);
    expect(Array.isArray(response.body.monthlyRevenue)).toBe(true);
    expect(Array.isArray(response.body.membershipExpiryAlerts)).toBe(true);
    expect(Array.isArray(response.body.inventoryAlerts)).toBe(true);

    const lowItem = response.body.inventoryAlerts.find(
      (item: { id: string }) => item.id === createdEquipmentIds[0],
    );
    expect(lowItem).toBeDefined();
    expect(lowItem.threshold).toBe(5);
  });

  it('falls back to default overview params for invalid values', async () => {
    const response = await request(app)
      .get('/api/reports/overview?threshold=-1&days=0')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);

    const lowItem = response.body.inventoryAlerts.find(
      (item: { id: string }) => item.id === createdEquipmentIds[0],
    );
    expect(lowItem).toBeDefined();
    expect(lowItem.threshold).toBe(5);

    const farFound = response.body.membershipExpiryAlerts.find(
      (member: { id: string }) => member.id === createdFarMemberId,
    );
    expect(farFound).toBeUndefined();
  });

  it('clamps overview params to maximum values', async () => {
    const response = await request(app)
      .get('/api/reports/overview?threshold=100000&days=100')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);

    const lowItem = response.body.inventoryAlerts.find(
      (item: { id: string }) => item.id === createdEquipmentIds[0],
    );
    expect(lowItem).toBeDefined();
    expect(lowItem.threshold).toBe(9999);

    const farFound = response.body.membershipExpiryAlerts.find(
      (member: { id: string }) => member.id === createdFarMemberId,
    );
    expect(farFound).toBeDefined();
  });

  it('returns monthly revenue records for admin', async () => {
    const response = await request(app)
      .get('/api/reports/monthly-revenue')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);

    const hasPositive = response.body.some((record: { total: number }) => record.total > 0);
    expect(hasPositive).toBe(true);
  });
});
