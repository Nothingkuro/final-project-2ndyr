import type { Request, Response } from 'express';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('../../../src/services/analytics.service', () => ({
  __esModule: true,
  default: {
    getDailyRevenueSummary: jest.fn(),
    getMonthlyRevenueRecords: jest.fn(),
    getUpcomingExpirations: jest.fn(),
    getLowInventoryAlerts: jest.fn(),
    getReportsOverview: jest.fn(),
    getAtRiskMembers: jest.fn(),
    getMonthlyRevenueForecast: jest.fn(),
    getPeakUtilizationByPlan: jest.fn(),
  },
}));

import {
  getAtRiskMembers,
  getDailyRevenueSummary,
  getLowInventoryAlerts,
  getMonthlyRevenueRecords,
  getPeakUtilization,
  getReportsOverview,
  getRevenueForecast,
  getUpcomingExpirations,
} from '../../../src/controllers/report.controller';
import analyticsService from '../../../src/services/analytics.service';

function createResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('report controller (mocked service)', () => {
  const mockedService = analyticsService as jest.Mocked<typeof analyticsService>;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns daily revenue summary', async () => {
    mockedService.getDailyRevenueSummary.mockResolvedValue({
      cash: 1000,
      gcash: 750,
      total: 1750,
      date: '2026-04-22T00:00:00.000Z',
    });

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

  it('returns monthly revenue records', async () => {
    mockedService.getMonthlyRevenueRecords.mockResolvedValue([
      { month: 3, year: 2026, total: 1500 },
      { month: 4, year: 2026, total: 900 },
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

  it('returns upcoming expirations with normalized days', async () => {
    mockedService.getUpcomingExpirations.mockResolvedValue([
      {
        id: 'member-1',
        name: 'Alex Cruz',
        expiryDate: '2026-04-14T00:00:00.000Z',
        contactNumber: '09171234567',
      },
    ]);

    const req = { query: { days: '3' } } as unknown as Request;
    const res = createResponse();

    await getUpcomingExpirations(req, res);

    expect(mockedService.getUpcomingExpirations).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns low inventory alerts with normalized threshold', async () => {
    mockedService.getLowInventoryAlerts.mockResolvedValue([
      {
        id: 'eq-1',
        itemName: 'Barbell',
        category: 'Equipment',
        quantity: 2,
        threshold: 5,
      },
    ]);

    const req = { query: { threshold: '5' } } as unknown as Request;
    const res = createResponse();

    await getLowInventoryAlerts(req, res);

    expect(mockedService.getLowInventoryAlerts).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns reports overview payload', async () => {
    mockedService.getReportsOverview.mockResolvedValue({
      dailyRevenue: {
        cash: 700,
        gcash: 300,
        total: 1000,
        date: '2026-04-22T00:00:00.000Z',
      },
      monthlyRevenue: [{ month: 4, year: 2026, total: 1000 }],
      membershipExpiryAlerts: [],
      inventoryAlerts: [],
      atRiskMembers: [],
      revenueForecast: {
        projection: 'CONSERVATIVE',
        baselineActivePlanRevenue: 3000,
        projectedChurnAdjustment: 500,
        forecastedRevenue: 2500,
      },
      peakUtilization: [],
    });

    const req = {} as Request;
    const res = createResponse();

    await getReportsOverview(req, res);

    expect(mockedService.getReportsOverview).toHaveBeenCalledWith(5, 3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyRevenue: expect.any(Object),
        monthlyRevenue: expect.any(Array),
      }),
    );
  });

  it('returns at-risk members', async () => {
    mockedService.getAtRiskMembers.mockResolvedValue({
      items: [],
      updatedAt: '2026-04-22T00:00:00.000Z',
    });

    const req = {} as Request;
    const res = createResponse();

    await getAtRiskMembers(req, res);

    expect(mockedService.getAtRiskMembers).toHaveBeenCalledWith(true);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns revenue forecast with optimistic mode', async () => {
    mockedService.getMonthlyRevenueForecast.mockResolvedValue({
      projection: 'OPTIMISTIC',
      baselineActivePlanRevenue: 3000,
      projectedChurnAdjustment: 500,
      forecastedRevenue: 3000,
    });

    const req = { query: { mode: 'OPTIMISTIC' } } as unknown as Request;
    const res = createResponse();

    await getRevenueForecast(req, res);

    expect(mockedService.getMonthlyRevenueForecast).toHaveBeenCalledWith('OPTIMISTIC');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns peak utilization analytics', async () => {
    mockedService.getPeakUtilizationByPlan.mockResolvedValue([
      { hour: 14, planName: 'Student', count: 12 },
    ]);

    const req = {} as Request;
    const res = createResponse();

    await getPeakUtilization(req, res);

    expect(mockedService.getPeakUtilizationByPlan).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when service fails for reports overview', async () => {
    mockedService.getReportsOverview.mockRejectedValue(new Error('service failure'));

    const req = {} as Request;
    const res = createResponse();

    await getReportsOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch reports overview' });
  });
});
