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

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const MEMBERSHIP_PLAN_LABELS = ['Daily Pass', 'Monthly Basic', 'Quarterly Plus'] as const;

type RevenueTrendPoint = {
  day: (typeof WEEKDAY_LABELS)[number];
  revenue: number;
};

type MembershipDistributionPoint = {
  plan: (typeof MEMBERSHIP_PLAN_LABELS)[number];
  memberCount: number;
  percentage: number;
};

/**
 * Aggregates payments into Monday-Sunday revenue totals for a selected month.
 *
 * @param payments List of payment entries with amount and transaction date.
 * @returns Ordered Monday-Sunday trend data with zero-filled missing days.
 */
function buildRevenueTrends(
  payments: Array<{ amount: { toString(): string } | number | string; transactionDate: Date }>,
): RevenueTrendPoint[] {
  const totalsByDay = new Map<number, number>();

  for (const payment of payments) {
    const dayIndex = payment.transactionDate.getDay();

    totalsByDay.set(dayIndex, (totalsByDay.get(dayIndex) ?? 0) + toNumber(payment.amount));
  }

  return [
    { day: 'Monday' as const, revenue: totalsByDay.get(1) ?? 0 },
    { day: 'Tuesday' as const, revenue: totalsByDay.get(2) ?? 0 },
    { day: 'Wednesday' as const, revenue: totalsByDay.get(3) ?? 0 },
    { day: 'Thursday' as const, revenue: totalsByDay.get(4) ?? 0 },
    { day: 'Friday' as const, revenue: totalsByDay.get(5) ?? 0 },
    { day: 'Saturday' as const, revenue: totalsByDay.get(6) ?? 0 },
    { day: 'Sunday' as const, revenue: totalsByDay.get(0) ?? 0 },
  ];
}

/**
 * Builds percentage distribution for supported membership plans based on each
 * member's latest payment plan.
 *
 * @param payments Payment records sorted newest-first with member and plan names.
 * @returns Distribution data for Daily Pass, Monthly Basic, and Quarterly Plus.
 */
function buildMembershipDistribution(
  payments: Array<{ memberId: string; plan: { name: string }; transactionDate: Date }>,
): MembershipDistributionPoint[] {
  const latestPlanByMember = new Map<string, string>();

  for (const payment of payments) {
    if (!latestPlanByMember.has(payment.memberId)) {
      latestPlanByMember.set(payment.memberId, payment.plan.name);
    }
  }

  const planCounts = new Map<string, number>();
  for (const label of MEMBERSHIP_PLAN_LABELS) {
    planCounts.set(label, 0);
  }

  for (const planName of latestPlanByMember.values()) {
    if (planCounts.has(planName)) {
      planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
    }
  }

  const totalMembers = Array.from(planCounts.values()).reduce((sum, count) => sum + count, 0);

  return MEMBERSHIP_PLAN_LABELS.map((plan) => {
    const memberCount = planCounts.get(plan) ?? 0;
    const percentage = totalMembers > 0
      ? Number(((memberCount / totalMembers) * 100).toFixed(1))
      : 0;

    return {
      plan,
      memberCount,
      percentage,
    };
  });
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
    const monthRaw = typeof req.query?.month === 'string' ? Number(req.query.month) : start.getMonth() + 1;
    const selectedMonth = Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12
      ? Math.floor(monthRaw)
      : start.getMonth() + 1;
    const yearRaw = typeof req.query?.year === 'string' ? Number(req.query.year) : start.getFullYear();
    const selectedYear = Number.isFinite(yearRaw) && yearRaw >= 1970 && yearRaw <= 9999
      ? Math.floor(yearRaw)
      : start.getFullYear();
    const selectedMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const selectedMonthEnd = new Date(selectedYear, selectedMonth, 1);
    const endOfToday = new Date(start);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfExpiryWindow = new Date(start);
    endOfExpiryWindow.setDate(endOfExpiryWindow.getDate() + days);

    const [dailyPayments, allPayments, weeklyPayments, latestPlanPayments, expiringMembers, inventory] = await Promise.all([
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
      prisma.payment.findMany({
        where: {
          transactionDate: {
            gte: selectedMonthStart,
            lt: selectedMonthEnd,
          },
        },
        select: {
          amount: true,
          transactionDate: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          transactionDate: {
            gte: selectedMonthStart,
            lt: selectedMonthEnd,
          },
        },
        select: {
          memberId: true,
          transactionDate: true,
          plan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
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

    const revenueTrends = buildRevenueTrends(weeklyPayments);
    const membershipDistribution = buildMembershipDistribution(latestPlanPayments);

    res.status(200).json({
      dailyRevenue: {
        cash: daily.cash,
        gcash: daily.gcash,
        total: daily.cash + daily.gcash,
        date: start.toISOString(),
      },
      revenueTrends,
      membershipDistribution,
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
