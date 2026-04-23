import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import type { ForecastMode } from '../services/revenueForecast.strategy';

/**
 * Parses a query value into a strictly positive integer with upper-bound clamping.
 *
 * This hardens pagination/window parameters against abusive inputs (for example,
 * huge offsets/limits or negative/invalid values) that could drive expensive
 * database scans and degrade API availability.
 *
 * @param value Raw query-string value from the request.
 * @param fallback Safe default applied when the input is invalid.
 * @param max Maximum accepted value to cap resource usage.
 */
function normalizePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

/**
 * Parses a query value into a non-negative integer with upper-bound clamping.
 *
 * Used for threshold-like filters where zero is valid, while still blocking
 * malformed or extreme values that could trigger heavy backend work.
 *
 * @param value Raw query-string value from the request.
 * @param fallback Safe default applied when the input is invalid.
 * @param max Maximum accepted value to cap resource usage.
 */
function normalizeNonNegativeInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

/**
 * Normalizes forecast mode to known strategy values.
 *
 * Unknown or missing values default to a conservative projection to avoid
 * overstating expected revenue in managerial reporting.
 *
 * @param value Raw query-string value (`?mode=OPTIMISTIC|CONSERVATIVE`).
 */
function normalizeForecastMode(value: unknown): ForecastMode {
  return value === 'OPTIMISTIC' ? 'OPTIMISTIC' : 'CONSERVATIVE';
}

/**
 * Returns the current business-day revenue split by payment channel.
 */
export const getDailyRevenueSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await analyticsService.getDailyRevenueSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching daily revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily revenue summary' });
  }
};

/**
 * Returns historical month-level revenue records for trend analysis.
 */
export const getMonthlyRevenueRecords = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await analyticsService.getMonthlyRevenueRecords();
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching monthly revenue records:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue records' });
  }
};

/**
 * Returns active members expiring within the requested window.
 *
 * @param req Query parameter `days` (`?days=3`) defines how many upcoming days
 * to include when generating renewal alerts.
 */
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

/**
 * Returns equipment items below the configured stock threshold.
 *
 * @param req Query parameter `threshold` (`?threshold=5`) is the minimum stock
 * level before an item is classified as low inventory.
 */
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

/**
 * Returns the combined reports dashboard payload in a single request.
 *
 * @param req Query parameter `threshold` controls low-inventory sensitivity;
 * query parameter `days` controls the membership-expiry alert horizon.
 */
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

/**
 * Returns members identified by retention-risk logic (expiry + inactivity).
 */
export const getAtRiskMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await analyticsService.getAtRiskMembers(true);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching at-risk members:', error);
    res.status(500).json({ error: 'Failed to fetch at-risk members' });
  }
};

/**
 * Returns next-month revenue projection based on selected forecasting strategy.
 *
 * @param req Query parameter `mode` (`?mode=OPTIMISTIC|CONSERVATIVE`) selects
 * which projection algorithm to apply.
 */
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

/**
 * Returns hourly attendance concentration grouped by latest plan assignment.
 */
export const getPeakUtilization = async (_req: Request, res: Response): Promise<void> => {
  try {
    const utilization = await analyticsService.getPeakUtilizationByPlan();
    res.status(200).json(utilization);
  } catch (error) {
    console.error('Error fetching peak utilization analytics:', error);
    res.status(500).json({ error: 'Failed to fetch peak utilization analytics' });
  }
};
