import request from 'supertest';
import { Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

describe('Payment and subscription API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `jest-staff-${suffix}`;
  const password = `P@ss-${suffix}`;
  const memberContactNumber = `0917${Math.floor(1000000 + Math.random() * 8999999)}`;
  const planName = `Test Plan ${suffix}`;

  let authCookie = '';
  let createdMemberId: string | null = null;
  let createdPlanId: string | null = null;
  let createdPaymentId: string | null = null;

  it('rejects unauthenticated access to POST /api/payments', async () => {
    const response = await request(app)
      .post('/api/payments')
      .send({
        memberId: 'any-member-id',
        planId: 'any-plan-id',
        paymentMethod: 'CASH',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects access with invalid session token in GET /api/members/:memberId/payments', async () => {
    const response = await request(app)
      .get('/api/members/non-existent-member-id/payments')
      .set('Cookie', 'arrowhead_session=invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired session' });
  });

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

    const createdMember = await prisma.member.create({
      data: {
        firstName: 'Payment',
        lastName: 'Test',
        contactNumber: memberContactNumber,
        status: 'ACTIVE',
      },
    });

    createdMemberId = createdMember.id;

    const createdPlan = await prisma.membershipPlan.create({
      data: {
        name: planName,
        durationDays: 30,
        price: 1200,
        isActive: true,
      },
    });

    createdPlanId = createdPlan.id;
  });

  afterAll(async () => {
    if (createdPaymentId) {
      await prisma.payment.deleteMany({
        where: {
          id: createdPaymentId,
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

    if (createdMemberId) {
      await prisma.member.deleteMany({
        where: {
          id: createdMemberId,
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

  it('creates a payment and returns member payment history', async () => {
    expect(createdMemberId).toBeTruthy();
    expect(createdPlanId).toBeTruthy();

    const paymentResponse = await request(app)
      .post('/api/payments')
      .set('Cookie', authCookie)
      .send({
        memberId: createdMemberId,
        planId: createdPlanId,
        paymentMethod: 'CASH',
      });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.payment.memberId).toBe(createdMemberId);
    expect(paymentResponse.body.payment.planId).toBe(createdPlanId);
    expect(paymentResponse.body.payment.amount).toBe(1200);
    expect(paymentResponse.body.payment.paymentMethod).toBe('CASH');
    expect(paymentResponse.body.updatedMember.status).toBe('ACTIVE');
    expect(typeof paymentResponse.body.updatedMember.expiryDate).toBe('string');
    expect(paymentResponse.body.updatedMember.expiryDate).not.toBe('');

    createdPaymentId = paymentResponse.body.payment.id;

    const historyResponse = await request(app)
      .get(`/api/members/${createdMemberId}/payments`)
      .set('Cookie', authCookie);

    expect(historyResponse.status).toBe(200);
    expect(Array.isArray(historyResponse.body)).toBe(true);
    expect(historyResponse.body.length).toBeGreaterThan(0);

    const createdPayment = historyResponse.body.find(
      (item: { id: string }) => item.id === createdPaymentId,
    );

    expect(createdPayment).toBeDefined();
    expect(createdPayment.memberId).toBe(createdMemberId);
    expect(createdPayment.membershipPlan).toBe(planName);
    expect(createdPayment.processedBy).toBe(username);
    expect(createdPayment.amountPhp).toBe(1200);
  });

  it('rolls back payment creation when member expiry update fails', async () => {
    expect(createdMemberId).toBeTruthy();

    const memberId = createdMemberId as string;

    await prisma.member.update({
      where: { id: memberId },
      data: {
        status: 'INACTIVE',
        expiryDate: null,
      },
    });

    const overflowPlan = await prisma.membershipPlan.create({
      data: {
        name: `Overflow Plan ${suffix}`,
        durationDays: 2147483647,
        price: 800,
        isActive: true,
      },
    });

    try {
      const paymentsBefore = await prisma.payment.count({ where: { memberId } });

      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Cookie', authCookie)
        .send({
          memberId,
          planId: overflowPlan.id,
          paymentMethod: 'CASH',
        });

      expect(paymentResponse.status).toBe(500);
      expect(paymentResponse.body).toEqual({ error: 'Failed to process payment' });

      const paymentsAfter = await prisma.payment.count({ where: { memberId } });
      expect(paymentsAfter).toBe(paymentsBefore);

      const memberAfter = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
          status: true,
          expiryDate: true,
        },
      });

      expect(memberAfter?.status).toBe('INACTIVE');
      expect(memberAfter?.expiryDate).toBeNull();
    } finally {
      await prisma.payment.deleteMany({ where: { planId: overflowPlan.id } });
      await prisma.membershipPlan.deleteMany({ where: { id: overflowPlan.id } });
    }
  });
});
