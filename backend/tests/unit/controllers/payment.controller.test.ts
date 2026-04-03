import 'dotenv/config';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../../src/app';
import prisma, { disconnectPrisma } from '../../../src/lib/prisma';
import { hashPassword } from '../../../src/utils/auth';

describe('payment controller', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `jest-payment-${suffix}`;
  const password = `P@ss-${suffix}`;
  const createdPlanIds: string[] = [];

  let authCookie = '';
  let createdMemberId: string | null = null;
  let createdPaymentId: string | null = null;

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

    const setCookieHeader = loginResponse.headers['set-cookie'];
    authCookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader ?? '';
    expect(authCookie).toContain('arrowhead_session=');
  });

  afterAll(async () => {
    if (createdPaymentId) {
      await prisma.payment.deleteMany({
        where: {
          id: createdPaymentId,
        },
      });
    }

    if (createdMemberId) {
      await prisma.member.deleteMany({
        where: {
          id: createdMemberId,
        },
      });
    }

    if (createdPlanIds.length > 0) {
      await prisma.membershipPlan.deleteMany({
        where: {
          id: {
            in: createdPlanIds,
          },
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

  it('returns active plans only in GET /api/plans', async () => {
    const activePlan = await prisma.membershipPlan.create({
      data: {
        name: `Active Plan ${suffix}`,
        durationDays: 30,
        price: 1000,
        isActive: true,
      },
    });

    const inactivePlan = await prisma.membershipPlan.create({
      data: {
        name: `Inactive Plan ${suffix}`,
        durationDays: 15,
        price: 500,
        isActive: false,
      },
    });

    createdPlanIds.push(activePlan.id, inactivePlan.id);

    const response = await request(app)
      .get('/api/plans')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const activeExists = response.body.some((plan: { id: string }) => plan.id === activePlan.id);
    const inactiveExists = response.body.some((plan: { id: string }) => plan.id === inactivePlan.id);

    expect(activeExists).toBe(true);
    expect(inactiveExists).toBe(false);
  });

  it('creates payment and updates member in POST /api/payments', async () => {
    const memberResponse = await request(app)
      .post('/api/members')
      .set('Cookie', authCookie)
      .send({
        fullName: 'Payment Test Member',
        contactNumber: `09${Math.floor(100000000 + Math.random() * 899999999)}`,
      });

    expect(memberResponse.status).toBe(201);
    createdMemberId = memberResponse.body.id;

    const plan = await prisma.membershipPlan.create({
      data: {
        name: `Payment Plan ${suffix}`,
        durationDays: 30,
        price: 1200,
        isActive: true,
      },
    });
    createdPlanIds.push(plan.id);

    const response = await request(app)
      .post('/api/payments')
      .set('Cookie', authCookie)
      .send({
        memberId: createdMemberId,
        planId: plan.id,
        paymentMethod: 'CASH',
      });

    expect(response.status).toBe(201);
    expect(response.body.payment.memberId).toBe(createdMemberId);
    expect(response.body.payment.planId).toBe(plan.id);
    expect(response.body.payment.amount).toBe(1200);
    expect(response.body.payment.paymentMethod).toBe('CASH');
    expect(response.body.updatedMember.status).toBe('ACTIVE');
    expect(response.body.updatedMember.expiryDate).not.toBe('');

    createdPaymentId = response.body.payment.id;
  });

  it('returns member payment history in GET /api/members/:memberId/payments', async () => {
    expect(createdMemberId).toBeTruthy();
    expect(createdPaymentId).toBeTruthy();

    const response = await request(app)
      .get(`/api/members/${createdMemberId}/payments`)
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const paymentRecord = response.body.find((item: { id: string }) => item.id === createdPaymentId);

    expect(paymentRecord).toBeDefined();
    expect(paymentRecord.memberId).toBe(createdMemberId);
    expect(paymentRecord.processedBy).toBe(username);
    expect(paymentRecord.paymentMethod).toBe('CASH');
  });
});
