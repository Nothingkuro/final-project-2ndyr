import type { Request, Response } from 'express';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    membershipPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import {
  createMembershipPlan,
  deleteMembershipPlan,
  getMembershipPlans,
  updateMembershipPlan,
} from '../../../src/controllers/membershipPlan.controller';
import prisma from '../../../src/lib/prisma';

function createResponse(): Response {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  (res.send as jest.Mock).mockReturnValue(res);

  return res;
}

describe('membership plan controller (mocked)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists membership plans including archived by default', async () => {
    const now = new Date('2026-04-10T00:00:00.000Z');

    mockPrisma.membershipPlan.findMany.mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Monthly Pass',
        description: 'Standard plan',
        durationDays: 30,
        price: 1200,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getMembershipPlans(req, res);

    expect(mockPrisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: [{ isActive: 'desc' }, { durationDays: 'asc' }, { price: 'asc' }],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          id: 'plan-1',
          name: 'Monthly Pass',
          price: 1200,
          isActive: true,
        }),
      ],
    });
  });

  it('lists only active plans when includeArchived=false', async () => {
    mockPrisma.membershipPlan.findMany.mockResolvedValue([]);

    const req = { query: { includeArchived: 'false' } } as unknown as Request;
    const res = createResponse();

    await getMembershipPlans(req, res);

    expect(mockPrisma.membershipPlan.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ isActive: 'desc' }, { durationDays: 'asc' }, { price: 'asc' }],
    });
  });

  it('creates membership plan', async () => {
    const now = new Date('2026-04-10T01:00:00.000Z');

    mockPrisma.membershipPlan.findFirst.mockResolvedValue(null);
    mockPrisma.membershipPlan.create.mockResolvedValue({
      id: 'plan-created',
      name: 'Quarterly Pass',
      description: 'Three-month access',
      durationDays: 90,
      price: 3200,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      body: {
        name: '  Quarterly Pass ',
        description: ' Three-month access ',
        durationDays: 90,
        price: 3200,
        isActive: true,
      },
    } as unknown as Request;
    const res = createResponse();

    await createMembershipPlan(req, res);

    expect(mockPrisma.membershipPlan.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'Quarterly Pass',
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    expect(mockPrisma.membershipPlan.create).toHaveBeenCalledWith({
      data: {
        name: 'Quarterly Pass',
        description: 'Three-month access',
        durationDays: 90,
        price: 3200,
        isActive: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 409 when creating duplicate plan name', async () => {
    mockPrisma.membershipPlan.findFirst.mockResolvedValue({ id: 'dup-plan' });

    const req = {
      body: {
        name: 'Monthly Pass',
        durationDays: 30,
        price: 1200,
      },
    } as unknown as Request;
    const res = createResponse();

    await createMembershipPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'A membership plan with this name already exists.' });
  });

  it('returns 400 when creating with invalid payload', async () => {
    const req = {
      body: {
        name: '',
        durationDays: 0,
        price: -1,
      },
    } as unknown as Request;
    const res = createResponse();

    await createMembershipPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        'Name, durationDays, and price are required. Duration must be a whole number >= 1 and price must be >= 0.',
    });
  });

  it('updates membership plan', async () => {
    const now = new Date('2026-04-10T02:00:00.000Z');

    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
    mockPrisma.membershipPlan.findFirst.mockResolvedValue(null);
    mockPrisma.membershipPlan.update.mockResolvedValue({
      id: 'plan-1',
      name: 'Monthly Pass Updated',
      description: null,
      durationDays: 31,
      price: 1299,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      params: { planId: 'plan-1' },
      body: {
        name: 'Monthly Pass Updated',
        description: ' ',
        durationDays: 31,
        price: 1299,
        isActive: false,
      },
    } as unknown as Request;
    const res = createResponse();

    await updateMembershipPlan(req, res);

    expect(mockPrisma.membershipPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: {
        name: 'Monthly Pass Updated',
        description: null,
        durationDays: 31,
        price: 1299,
        isActive: false,
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when updating missing membership plan', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue(null);

    const req = {
      params: { planId: 'missing-plan' },
      body: { name: 'Any Name' },
    } as unknown as Request;
    const res = createResponse();

    await updateMembershipPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Membership plan not found' });
  });

  it('returns 400 when updating with invalid isActive type', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ id: 'plan-1' });

    const req = {
      params: { planId: 'plan-1' },
      body: { isActive: 'true' },
    } as unknown as Request;
    const res = createResponse();

    await updateMembershipPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'isActive must be a boolean value' });
  });

  it('deletes membership plan', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
    mockPrisma.membershipPlan.delete.mockResolvedValue({ id: 'plan-1' });

    const req = { params: { planId: 'plan-1' } } as unknown as Request;
    const res = createResponse();

    await deleteMembershipPlan(req, res);

    expect(mockPrisma.membershipPlan.delete).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('returns 404 when deleting missing membership plan', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue(null);

    const req = { params: { planId: 'missing-plan' } } as unknown as Request;
    const res = createResponse();

    await deleteMembershipPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Membership plan not found' });
  });
});
