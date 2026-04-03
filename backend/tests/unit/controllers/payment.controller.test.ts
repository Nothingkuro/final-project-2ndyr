import type { Request, Response } from 'express';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    membershipPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { createPayment, getMemberPayments, getPlans } from '../../../src/controllers/payment.controller';
import prisma from '../../../src/lib/prisma';

function createMockResponse(): Response {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;

  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe('payment controller (mocked)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns active plans only in GET /api/plans', async () => {
    const plans = [
      {
        id: 'plan-1',
        name: 'Active Plan',
        durationDays: 30,
        price: 1000,
        isActive: true,
      },
    ];

    mockPrisma.membershipPlan.findMany.mockResolvedValue(plans);

    const req = {} as Request;
    const res = createMockResponse();

    await getPlans(req, res);

    expect(mockPrisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    expect(res.json).toHaveBeenCalledWith(plans);
  });

  it('returns 500 in GET /api/plans when prisma fails', async () => {
    const req = {} as Request;
    const res = createMockResponse();

    mockPrisma.membershipPlan.findMany.mockRejectedValue(new Error('db fail'));

    await getPlans(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch membership plans' });
  });

  it('creates payment and updates member in POST /api/payments', async () => {
    const now = new Date('2026-04-03T12:00:00.000Z');
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
      },
      authUser: {
        id: 'user-1',
        username: 'staff-user',
        role: 'STAFF',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      price: 1200,
      durationDays: 30,
    });
    mockPrisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'INACTIVE',
      expiryDate: null,
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'staff-user',
    });

    const createdPayment = {
      id: 'payment-1',
      memberId: 'member-1',
      planId: 'plan-1',
      amount: 1200,
      paymentMethod: 'CASH',
      transactionDate: now,
      processedById: 'user-1',
    };

    const updatedMember = {
      id: 'member-1',
      firstName: 'Payment',
      lastName: 'Test',
      contactNumber: '09171234567',
      joinDate: now,
      expiryDate: new Date('2026-05-03T12:00:00.000Z'),
      status: 'ACTIVE',
    };

    mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        payment: {
          create: jest.fn().mockResolvedValue(createdPayment),
        },
        member: {
          update: jest.fn().mockResolvedValue(updatedMember),
        },
      }),
    );

    await createPayment(req, res);

    expect(mockPrisma.membershipPlan.findUnique).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
    expect(mockPrisma.member.findUnique).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      select: {
        id: true,
        status: true,
        expiryDate: true,
      },
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        payment: expect.objectContaining({
          id: 'payment-1',
          memberId: 'member-1',
          planId: 'plan-1',
          amount: 1200,
          paymentMethod: 'CASH',
          processedById: 'user-1',
        }),
        updatedMember: expect.objectContaining({
          id: 'member-1',
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('returns 400 in POST /api/payments when required fields are missing', async () => {
    const req = {
      body: {
        planId: 'plan-1',
        paymentMethod: 'CASH',
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
  });

  it('returns 401 in POST /api/payments when auth user is missing', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
      },
    } as unknown as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('returns 400 in POST /api/payments when payment method is invalid', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CARD',
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payment method' });
  });

  it('returns 400 in POST /api/payments when amountPaid is not positive', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
        amountPaid: 0,
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Amount paid must be a positive number' });
  });

  it('returns 404 in POST /api/payments when plan or member does not exist', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'missing-plan',
        paymentMethod: 'CASH',
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.membershipPlan.findUnique.mockResolvedValue(null);
    mockPrisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      expiryDate: new Date('2026-05-01T00:00:00.000Z'),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member or Plan not found' });
  });

  it('returns 401 in POST /api/payments when auth user does not exist in database', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
      },
      authUser: {
        id: 'missing-user',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      price: 1200,
      durationDays: 30,
    });
    mockPrisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      expiryDate: new Date('2026-05-01T00:00:00.000Z'),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authenticated user not found' });
  });

  it('returns 500 in POST /api/payments when transaction fails', async () => {
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      price: 1200,
      durationDays: 30,
    });
    mockPrisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      expiryDate: new Date('2026-05-01T00:00:00.000Z'),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.$transaction.mockRejectedValue(new Error('tx fail'));

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process payment' });
  });

  it('extends from existing expiry when member is active and not expired', async () => {
    const existingExpiry = new Date('2026-06-01T00:00:00.000Z');
    const req = {
      body: {
        memberId: 'member-1',
        planId: 'plan-1',
        paymentMethod: 'CASH',
        amountPaid: 1500,
      },
      authUser: {
        id: 'user-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    const txPaymentCreate = jest.fn().mockResolvedValue({
      id: 'payment-2',
      memberId: 'member-1',
      planId: 'plan-1',
      amount: 1500,
      paymentMethod: 'CASH',
      transactionDate: new Date('2026-04-03T12:00:00.000Z'),
      processedById: 'user-1',
    });
    const txMemberUpdate = jest.fn().mockResolvedValue({
      id: 'member-1',
      firstName: 'Payment',
      lastName: 'Test',
      contactNumber: '09171234567',
      joinDate: new Date('2026-04-01T00:00:00.000Z'),
      expiryDate: new Date('2026-07-01T00:00:00.000Z'),
      status: 'ACTIVE',
    });

    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      price: 1200,
      durationDays: 30,
    });
    mockPrisma.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      expiryDate: existingExpiry,
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        payment: {
          create: txPaymentCreate,
        },
        member: {
          update: txMemberUpdate,
        },
      }),
    );

    await createPayment(req, res);

    expect(txPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 1500,
        }),
      }),
    );

    const updateCall = txMemberUpdate.mock.calls[0][0];
    const updatedExpiry = updateCall.data.expiryDate as Date;
    expect(updatedExpiry.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('returns member payment history in GET /api/members/:memberId/payments', async () => {
    const req = {
      params: {
        memberId: 'member-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.member.findUnique.mockResolvedValue({ id: 'member-1' });
    mockPrisma.payment.findMany.mockResolvedValue([
      {
        id: 'payment-1',
        memberId: 'member-1',
        amount: 1200,
        paymentMethod: 'CASH',
        transactionDate: new Date('2026-04-03T12:00:00.000Z'),
        plan: { name: 'Payment Plan' },
        processedBy: { username: 'staff-user' },
      },
    ]);

    await getMemberPayments(req, res);

    expect(mockPrisma.member.findUnique).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      select: { id: true },
    });
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
      where: { memberId: 'member-1' },
      orderBy: { transactionDate: 'desc' },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
        processedBy: {
          select: {
            username: true,
          },
        },
      },
    });
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 'payment-1',
        memberId: 'member-1',
        paidAt: '2026-04-03T12:00:00.000Z',
        amountPhp: 1200,
        paymentMethod: 'CASH',
        membershipPlan: 'Payment Plan',
        processedBy: 'staff-user',
      },
    ]);
  });

  it('returns 400 in GET /api/members/:memberId/payments when member id is missing', async () => {
    const req = {
      params: {},
    } as unknown as Request;
    const res = createMockResponse();

    await getMemberPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member id is required' });
  });

  it('returns 404 in GET /api/members/:memberId/payments when member does not exist', async () => {
    const req = {
      params: {
        memberId: 'missing-member',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.member.findUnique.mockResolvedValue(null);

    await getMemberPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member not found' });
  });

  it('returns 500 in GET /api/members/:memberId/payments when prisma fails', async () => {
    const req = {
      params: {
        memberId: 'member-1',
      },
    } as unknown as Request;
    const res = createMockResponse();

    mockPrisma.member.findUnique.mockRejectedValue(new Error('db fail'));

    await getMemberPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch payment history' });
  });
});
