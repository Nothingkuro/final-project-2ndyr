import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

type MembershipPlanItem = {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type MembershipPlanPayload = {
  name?: unknown;
  description?: unknown;
  durationDays?: unknown;
  price?: unknown;
  isActive?: unknown;
};

/**
 * Converts a Prisma membership plan into API output format.
 *
 * @param plan Membership plan row selected from Prisma.
 * @returns Membership plan item with decimal values converted to numbers.
 */
function toMembershipPlanItem(plan: {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: Prisma.Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MembershipPlanItem {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    durationDays: plan.durationDays,
    price: Number(plan.price),
    isActive: plan.isActive,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * Parses optional description input from untyped request payloads.
 *
 * @param value Raw payload value.
 * @returns Trimmed description or null when missing/invalid.
 */
function parseOptionalDescription(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Parses and validates a plan name.
 *
 * @param value Raw payload value.
 * @returns Trimmed name or null when missing/invalid.
 */
function parseName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Parses and validates membership duration in days.
 *
 * @param value Raw payload value.
 * @returns Integer number of days or null when invalid.
 */
function parseDuration(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

/**
 * Parses and validates membership plan price.
 *
 * @param value Raw payload value.
 * @returns Non-negative numeric price or null when invalid.
 */
function parsePrice(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

/**
 * Returns membership plans for management views.
 *
 * @param req Express request with optional includeArchived query.
 * @param res Express response containing plan list.
 * @returns Promise that resolves when the response is sent.
 */
export const getMembershipPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeArchived = typeof req.query.includeArchived === 'string'
      ? req.query.includeArchived.toLowerCase() === 'true'
      : true;

    const plans = await prisma.membershipPlan.findMany({
      where: includeArchived ? undefined : { isActive: true },
      orderBy: [
        { isActive: 'desc' },
        { durationDays: 'asc' },
        { price: 'asc' },
      ],
    });

    res.status(200).json({
      items: plans.map(toMembershipPlanItem),
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

/**
 * Creates a new membership plan after payload validation.
 *
 * @param req Express request containing plan payload.
 * @param res Express response containing created plan.
 * @returns Promise that resolves when the response is sent.
 */
export const createMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as MembershipPlanPayload;

    const name = parseName(payload.name);
    const durationDays = parseDuration(payload.durationDays);
    const price = parsePrice(payload.price);

    if (!name || durationDays === null || price === null) {
      res.status(400).json({
        error: 'Name, durationDays, and price are required. Duration must be a whole number >= 1 and price must be >= 0.',
      });
      return;
    }

    const existingPlan = await prisma.membershipPlan.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existingPlan) {
      res.status(409).json({ error: 'A membership plan with this name already exists.' });
      return;
    }

    const createdPlan = await prisma.membershipPlan.create({
      data: {
        name,
        description: parseOptionalDescription(payload.description),
        durationDays,
        price,
        isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
      },
    });

    res.status(201).json(toMembershipPlanItem(createdPlan));
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(500).json({ error: 'Failed to create membership plan' });
  }
};

/**
 * Updates an existing membership plan.
 *
 * @param req Express request containing plan id and patch data.
 * @param res Express response containing updated plan.
 * @returns Promise that resolves when the response is sent.
 */
export const updateMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;

    if (!planId) {
      res.status(400).json({ error: 'Plan id is required' });
      return;
    }

    const payload = req.body as MembershipPlanPayload;

    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });

    if (!existingPlan) {
      res.status(404).json({ error: 'Membership plan not found' });
      return;
    }

    const data: Prisma.MembershipPlanUpdateInput = {};

    if (payload.name !== undefined) {
      const name = parseName(payload.name);
      if (!name) {
        res.status(400).json({ error: 'Plan name must be a non-empty string' });
        return;
      }

      const duplicate = await prisma.membershipPlan.findFirst({
        where: {
          id: { not: planId },
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (duplicate) {
        res.status(409).json({ error: 'A membership plan with this name already exists.' });
        return;
      }

      data.name = name;
    }

    if (payload.description !== undefined) {
      data.description = parseOptionalDescription(payload.description);
    }

    if (payload.durationDays !== undefined) {
      const durationDays = parseDuration(payload.durationDays);

      if (durationDays === null) {
        res.status(400).json({ error: 'Duration must be a whole number >= 1' });
        return;
      }

      data.durationDays = durationDays;
    }

    if (payload.price !== undefined) {
      const price = parsePrice(payload.price);

      if (price === null) {
        res.status(400).json({ error: 'Price must be a number >= 0' });
        return;
      }

      data.price = price;
    }

    if (payload.isActive !== undefined) {
      if (typeof payload.isActive !== 'boolean') {
        res.status(400).json({ error: 'isActive must be a boolean value' });
        return;
      }

      data.isActive = payload.isActive;
    }

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id: planId },
      data,
    });

    res.status(200).json(toMembershipPlanItem(updatedPlan));
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(500).json({ error: 'Failed to update membership plan' });
  }
};

/**
 * Deletes a membership plan when it has no dependent records.
 *
 * @param req Express request containing plan id.
 * @param res Express response confirming deletion.
 * @returns Promise that resolves when the response is sent.
 */
export const deleteMembershipPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;

    if (!planId) {
      res.status(400).json({ error: 'Plan id is required' });
      return;
    }

    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });

    if (!existingPlan) {
      res.status(404).json({ error: 'Membership plan not found' });
      return;
    }

    await prisma.membershipPlan.delete({ where: { id: planId } });

    res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === 'P2003'
    ) {
      res.status(409).json({
        error: 'This plan cannot be deleted because it is already referenced by payment records.',
      });
      return;
    }

    console.error('Error deleting membership plan:', error);
    res.status(500).json({ error: 'Failed to delete membership plan' });
  }
};