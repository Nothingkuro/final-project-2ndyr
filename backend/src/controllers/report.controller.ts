import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import type { ForecastMode } from '../services/revenueForecast.strategy';

function normalizePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function normalizeNonNegativeInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function normalizeForecastMode(value: unknown): ForecastMode {
  return value === 'OPTIMISTIC' ? 'OPTIMISTIC' : 'CONSERVATIVE';
}

export const getDailyRevenueSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await analyticsService.getDailyRevenueSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching daily revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily revenue summary' });
  }
};

export const getMonthlyRevenueRecords = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await analyticsService.getMonthlyRevenueRecords();
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching monthly revenue records:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue records' });
  }
};

export const getUpcomingExpirations = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query ?? {};
    const days = normalizePositiveInt(query.days, 3, 30);
    const alerts = await analyticsService.getUpcomingExpirations(days);
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching upcoming expirations:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming expirations' });
  }
};

export const getLowInventoryAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query ?? {};
    const threshold = normalizeNonNegativeInt(query.threshold, 5, 9999);
    const alerts = await analyticsService.getLowInventoryAlerts(threshold);
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching low inventory alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low inventory alerts' });
  }
};

export const getReportsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query ?? {};
    const threshold = normalizeNonNegativeInt(query.threshold, 5, 9999);
    const days = normalizePositiveInt(query.days, 3, 30);

    const overview = await analyticsService.getReportsOverview(threshold, days);
    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching reports overview:', error);
    res.status(500).json({ error: 'Failed to fetch reports overview' });
  }
};

export const getAtRiskMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await analyticsService.getAtRiskMembers(true);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching at-risk members:', error);
    res.status(500).json({ error: 'Failed to fetch at-risk members' });
  }
};

export const getRevenueForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query ?? {};
    const mode = normalizeForecastMode(query.mode);
    const forecast = await analyticsService.getMonthlyRevenueForecast(mode);
    res.status(200).json(forecast);
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({ error: 'Failed to fetch revenue forecast' });
  }
};

export const getPeakUtilization = async (_req: Request, res: Response): Promise<void> => {
  try {
    const utilization = await analyticsService.getPeakUtilizationByPlan();
    res.status(200).json(utilization);
  } catch (error) {
    console.error('Error fetching peak utilization analytics:', error);
    res.status(500).json({ error: 'Failed to fetch peak utilization analytics' });
  }
};
