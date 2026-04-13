import type { Request, Response } from 'express';
import { jest, describe, expect, it } from '@jest/globals';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    payment: {
      findMany: jest.fn(),
    },
    member: {
      findMany: jest.fn(),
    },
    equipment: {
      findMany: jest.fn(),
    },
  },
}));

import {
  getDailyRevenueSummary,
  getLowInventoryAlerts,
  getMonthlyRevenueRecords,
  getReportsOverview,
  getUpcomingExpirations,
} from '../../../src/controllers/report.controller';
import prisma from '../../../src/lib/prisma';

function createResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('report controller (mocked)', () => {
  const mockedPrisma = prisma as any;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns daily revenue summary', async () => {
    mockedPrisma.payment.findMany.mockResolvedValue([
      { amount: 1000, paymentMethod: 'CASH' },
      { amount: 500, paymentMethod: 'GCASH' },
      { amount: 250, paymentMethod: 'GCASH' },
    ]);

    const req = {} as Request;
    const res = createResponse();

    await getDailyRevenueSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        cash: 1000,
        gcash: 750,
        total: 1750,
      }),
    );
  });

  it('returns monthly revenue records grouped by month/year', async () => {
    mockedPrisma.payment.findMany.mockResolvedValue([
      { amount: 1000, transactionDate: new Date('2026-03-01T00:00:00.000Z') },
      { amount: 500, transactionDate: new Date('2026-03-02T00:00:00.000Z') },
      { amount: 900, transactionDate: new Date('2026-04-01T00:00:00.000Z') },
    ]);

    const req = {} as Request;
    const res = createResponse();

    await getMonthlyRevenueRecords(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { month: 3, year: 2026, total: 1500 },
      { month: 4, year: 2026, total: 900 },
    ]);
  });

  it('returns upcoming expirations limited by days query', async () => {
    mockedPrisma.member.findMany.mockResolvedValue([
      {
        id: 'member-1',
        firstName: 'Alex',
        lastName: 'Cruz',
        contactNumber: '09171234567',
        expiryDate: new Date('2026-04-14T00:00:00.000Z'),
      },
    ]);

    const req = {
      query: {
        days: '3',
      },
    } as unknown as Request;
    const res = createResponse();

    await getUpcomingExpirations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'member-1',
        name: 'Alex Cruz',
      }),
    ]);
  });

  it('returns low inventory alerts with threshold', async () => {
    mockedPrisma.equipment.findMany.mockResolvedValue([
      { id: 'eq-1', itemName: 'Barbell', quantity: 2 },
    ]);

    const req = {
      query: {
        threshold: '5',
      },
    } as unknown as Request;
    const res = createResponse();

    await getLowInventoryAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 'eq-1',
        itemName: 'Barbell',
        category: 'Equipment',
        quantity: 2,
        threshold: 5,
      },
    ]);
  });

  it('falls back to default threshold when low inventory threshold is invalid', async () => {
    mockedPrisma.equipment.findMany.mockResolvedValue([
      { id: 'eq-1', itemName: 'Barbell', quantity: 2 },
    ]);

    const req = {
      query: {
        threshold: '-1',
      },
    } as unknown as Request;
    const res = createResponse();

    await getLowInventoryAlerts(req, res);

    expect(mockedPrisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          quantity: {
            lt: 5,
          },
        },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        threshold: 5,
      }),
    ]);
  });

  it('caps low inventory threshold at 9999', async () => {
    mockedPrisma.equipment.findMany.mockResolvedValue([
      { id: 'eq-1', itemName: 'Barbell', quantity: 2 },
    ]);

    const req = {
      query: {
        threshold: '100000',
      },
    } as unknown as Request;
    const res = createResponse();

    await getLowInventoryAlerts(req, res);

    expect(mockedPrisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          quantity: {
            lt: 9999,
          },
        },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        threshold: 9999,
      }),
    ]);
  });

  it('returns reports overview payload shape', async () => {
    mockedPrisma.payment.findMany
      .mockResolvedValueOnce([
        { amount: 700, paymentMethod: 'CASH' },
        { amount: 300, paymentMethod: 'GCASH' },
      ])
      .mockResolvedValueOnce([
        { amount: 700, transactionDate: new Date('2026-04-01T00:00:00.000Z') },
      ]);

    mockedPrisma.member.findMany.mockResolvedValue([
      {
        id: 'member-1',
        firstName: 'Ana',
        lastName: 'Reyes',
        contactNumber: '09171234567',
        expiryDate: new Date('2026-04-14T00:00:00.000Z'),
      },
    ]);

    mockedPrisma.equipment.findMany.mockResolvedValue([
      { id: 'eq-1', itemName: 'Bench', quantity: 1 },
    ]);

    const req = {} as Request;
    const res = createResponse();

    await getReportsOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyRevenue: expect.objectContaining({
          cash: 700,
          gcash: 300,
          total: 1000,
        }),
        monthlyRevenue: expect.any(Array),
        membershipExpiryAlerts: expect.any(Array),
        inventoryAlerts: expect.any(Array),
      }),
    );
  });

  it('returns 500 when daily revenue summary query fails', async () => {
    mockedPrisma.payment.findMany.mockRejectedValue(new Error('db failure'));

    const req = {} as Request;
    const res = createResponse();

    await getDailyRevenueSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch daily revenue summary' });
  });

  it('returns 500 when monthly revenue query fails', async () => {
    mockedPrisma.payment.findMany.mockRejectedValue(new Error('db failure'));

    const req = {} as Request;
    const res = createResponse();

    await getMonthlyRevenueRecords(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch monthly revenue records' });
  });

  it('returns 500 when upcoming expirations query fails', async () => {
    mockedPrisma.member.findMany.mockRejectedValue(new Error('db failure'));

    const req = {
      query: {
        days: '3',
      },
    } as unknown as Request;
    const res = createResponse();

    await getUpcomingExpirations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch upcoming expirations' });
  });

  it('returns 500 when low inventory query fails', async () => {
    mockedPrisma.equipment.findMany.mockRejectedValue(new Error('db failure'));

    const req = {
      query: {
        threshold: '5',
      },
    } as unknown as Request;
    const res = createResponse();

    await getLowInventoryAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch low inventory alerts' });
  });

  it('returns 500 when reports overview query fails', async () => {
    mockedPrisma.payment.findMany.mockRejectedValueOnce(new Error('db failure'));

    const req = {} as Request;
    const res = createResponse();

    await getReportsOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch reports overview' });
  });
});
