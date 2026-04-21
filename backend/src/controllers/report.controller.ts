import { Member, MemberStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  ExpiryAlertDTO,
  InventoryAlertDTO,
  InventoryAlertInput,
} from '../patterns/factory-method/report.factory';
import { ReportCreator } from '../patterns/factory-method/report-creator';
import { ReportType } from '../patterns/factory-method/report.types';
import revenueContext from '../services/revenueStrategy';

/**
 * Computes the local start-of-day boundary for date-window reporting queries.
 *
 * @returns Date representing 00:00:00.000 in server local time.
 */
function startOfTodayLocal(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Converts Prisma decimal-like values to native numbers.
 *
 * @param value Numeric value represented as Decimal, number, or string.
 * @returns Parsed JavaScript number.
 */
function toNumber(value: { toString(): string } | number | string): number {
  return Number(value);
}

/**
 * Returns today's revenue split by payment method.
 *
 * @param _req Express request (unused).
 * @param res Express response containing daily totals.
 * @returns Promise that resolves when the response is sent.
 */
export const getDailyRevenueSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const start = startOfTodayLocal();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const payments = await prisma.payment.findMany({
      where: {
        transactionDate: {
          gte: start,
          lt: end,
        },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    });

    const summary = revenueContext.aggregate(
      payments.map((payment) => ({
        amount: toNumber(payment.amount),
        paymentMethod: payment.paymentMethod,
      })),
    );

    const total = summary.cash + summary.gcash;

    res.status(200).json({
      cash: summary.cash,
      gcash: summary.gcash,
      total,
      date: start.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching daily revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily revenue summary' });
  }
};

/**
 * Returns historical monthly revenue totals.
 *
 * @param _req Express request (unused).
 * @param res Express response containing sorted month/year totals.
 * @returns Promise that resolves when the response is sent.
 */
export const getMonthlyRevenueRecords = async (_req: Request, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      select: {
        amount: true,
        transactionDate: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    const totals = new Map<string, { month: number; year: number; total: number }>();

    for (const payment of payments) {
      const date = new Date(payment.transactionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      const current = totals.get(key) ?? { month, year, total: 0 };
      current.total += toNumber(payment.amount);
      totals.set(key, current);
    }

    const records = Array.from(totals.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.month - b.month;
    });

    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching monthly revenue records:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue records' });
  }
};

/**
 * Lists active members whose memberships expire within the configured window.
 *
 * @param req Express request with optional days query parameter.
 * @param res Express response containing upcoming expirations.
 * @returns Promise that resolves when the response is sent.
 */
export const getUpcomingExpirations = async (req: Request, res: Response): Promise<void> => {
  try {
    const daysRaw = typeof req.query.days === 'string' ? Number(req.query.days) : 3;
    const days = Number.isFinite(daysRaw) && daysRaw > 0
      ? Math.min(Math.floor(daysRaw), 30)
      : 3;

    const start = startOfTodayLocal();
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const members = await prisma.member.findMany({
      where: {
        status: MemberStatus.ACTIVE,
        expiryDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    res.status(200).json(
      ReportCreator.createReportBatch<Member, ExpiryAlertDTO>(
        ReportType.EXPIRY_ALERT,
        members.filter((member) => member.expiryDate),
      ),
    );
  } catch (error) {
    console.error('Error fetching upcoming expirations:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming expirations' });
  }
};

/**
 * Lists inventory items below the requested threshold.
 *
 * @param req Express request with optional threshold query parameter.
 * @param res Express response containing inventory alerts.
 * @returns Promise that resolves when the response is sent.
 */
export const getLowInventoryAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const thresholdRaw = typeof req.query.threshold === 'string' ? Number(req.query.threshold) : 5;
    const threshold = Number.isFinite(thresholdRaw) && thresholdRaw >= 0
      ? Math.min(Math.floor(thresholdRaw), 9999)
      : 5;

    const equipment = await prisma.equipment.findMany({
      where: {
        quantity: {
          lt: threshold,
        },
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    res.status(200).json(
      ReportCreator.createReportBatch<InventoryAlertInput, InventoryAlertDTO>(
        ReportType.INVENTORY_ALERT,
        equipment.map((item) => ({ equipment: item, threshold })),
      ),
    );
  } catch (error) {
    console.error('Error fetching low inventory alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low inventory alerts' });
  }
};

/**
 * Returns a consolidated dashboard payload for reports overview pages.
 *
 * @param req Express request with optional threshold and days query parameters.
 * @param res Express response containing revenue and alert summaries.
 * @returns Promise that resolves when the response is sent.
 */
export const getReportsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const thresholdRaw = typeof req.query?.threshold === 'string' ? Number(req.query.threshold) : 5;
    const threshold = Number.isFinite(thresholdRaw) && thresholdRaw >= 0
      ? Math.min(Math.floor(thresholdRaw), 9999)
      : 5;

    const daysRaw = typeof req.query?.days === 'string' ? Number(req.query.days) : 3;
    const days = Number.isFinite(daysRaw) && daysRaw > 0
      ? Math.min(Math.floor(daysRaw), 30)
      : 3;

    const start = startOfTodayLocal();
    const endOfToday = new Date(start);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfExpiryWindow = new Date(start);
    endOfExpiryWindow.setDate(endOfExpiryWindow.getDate() + days);

    const [dailyPayments, allPayments, expiringMembers, inventory] = await Promise.all([
      prisma.payment.findMany({
        where: {
          transactionDate: {
            gte: start,
            lt: endOfToday,
          },
        },
        select: {
          amount: true,
          paymentMethod: true,
        },
      }),
      prisma.payment.findMany({
        select: {
          amount: true,
          transactionDate: true,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      }),
      prisma.member.findMany({
        where: {
          status: MemberStatus.ACTIVE,
          expiryDate: {
            gte: start,
            lte: endOfExpiryWindow,
          },
        },
        orderBy: {
          expiryDate: 'asc',
        },
      }),
      prisma.equipment.findMany({
        where: {
          quantity: {
            lt: threshold,
          },
        },
        orderBy: {
          quantity: 'asc',
        },
      }),
    ]);

    const daily = revenueContext.aggregate(
      dailyPayments.map((payment) => ({
        amount: toNumber(payment.amount),
        paymentMethod: payment.paymentMethod,
      })),
    );

    const monthlyTotals = new Map<string, { month: number; year: number; total: number }>();

    for (const payment of allPayments) {
      const date = new Date(payment.transactionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      const current = monthlyTotals.get(key) ?? { month, year, total: 0 };
      current.total += toNumber(payment.amount);
      monthlyTotals.set(key, current);
    }

    res.status(200).json({
      dailyRevenue: {
        cash: daily.cash,
        gcash: daily.gcash,
        total: daily.cash + daily.gcash,
        date: start.toISOString(),
      },
      monthlyRevenue: Array.from(monthlyTotals.values()).sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.month - b.month;
      }),
      membershipExpiryAlerts: ReportCreator.createReportBatch<Member, ExpiryAlertDTO>(
        ReportType.EXPIRY_ALERT,
        expiringMembers.filter((member) => member.expiryDate),
      ),
      inventoryAlerts: ReportCreator.createReportBatch<InventoryAlertInput, InventoryAlertDTO>(
        ReportType.INVENTORY_ALERT,
        inventory.map((item) => ({ equipment: item, threshold })),
      ),
    });
  } catch (error) {
    console.error('Error fetching reports overview:', error);
    res.status(500).json({ error: 'Failed to fetch reports overview' });
  }
};
