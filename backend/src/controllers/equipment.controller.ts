import { EquipmentCondition, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

type EquipmentListItem = {
  id: string;
  itemName: string;
  quantity: number;
  condition: 'GOOD' | 'MAINTENANCE' | 'BROKEN';
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Maps Prisma equipment records into API-friendly list items.
 *
 * @param equipment Equipment row selected from Prisma.
 * @returns Equipment item with ISO date strings.
 */
function toEquipmentListItem(equipment: {
  id: string;
  itemName: string;
  quantity: number;
  condition: 'GOOD' | 'MAINTENANCE' | 'BROKEN';
  lastChecked: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): EquipmentListItem {
  return {
    id: equipment.id,
    itemName: equipment.itemName,
    quantity: equipment.quantity,
    condition: equipment.condition,
    lastChecked: equipment.lastChecked ? equipment.lastChecked.toISOString() : null,
    createdAt: equipment.createdAt.toISOString(),
    updatedAt: equipment.updatedAt.toISOString(),
  };
}

/**
 * Lists equipment inventory with optional filtering and pagination.
 *
 * @param req Express request containing query filters.
 * @param res Express response containing paginated equipment items.
 * @returns Promise that resolves when the response is sent.
 */
export const getEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchRaw = typeof req.query.search === 'string' ? req.query.search : '';
    const conditionRaw = typeof req.query.condition === 'string' ? req.query.condition : 'ALL';
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : 20;

    const search = searchRaw.trim();
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.floor(pageSizeRaw), 100)
      : 20;

    const condition =
      conditionRaw === EquipmentCondition.GOOD ||
      conditionRaw === EquipmentCondition.MAINTENANCE ||
      conditionRaw === EquipmentCondition.BROKEN
        ? conditionRaw
        : null;

    const where: Prisma.EquipmentWhereInput = {
      ...(condition ? { condition } : {}),
      ...(search
        ? {
            itemName: { contains: search, mode: 'insensitive' },
          }
        : {}),
    };

    const [total, equipment] = await prisma.$transaction([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.json({
      items: equipment.map(toEquipmentListItem),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
};

/**
 * Creates a new equipment item.
 *
 * @param req Express request containing equipment payload.
 * @param res Express response containing created equipment item.
 * @returns Promise that resolves when the response is sent.
 */
export const createEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemName, quantity, condition } = req.body;

    // Validation
    if (!itemName || typeof itemName !== 'string') {
      res.status(400).json({ error: 'Item name is required' });
      return;
    }

    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number' });
      return;
    }

    if (condition) {
      const validConditions: EquipmentCondition[] = [
        EquipmentCondition.GOOD,
        EquipmentCondition.MAINTENANCE,
        EquipmentCondition.BROKEN,
      ];

      if (!validConditions.includes(condition as EquipmentCondition)) {
        res.status(400).json({ error: 'Invalid condition status' });
        return;
      }
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        itemName: itemName.trim(),
        quantity,
        condition: (condition || EquipmentCondition.GOOD) as EquipmentCondition,
        lastChecked: new Date(),
      },
    });

    res.status(201).json(toEquipmentListItem(newEquipment));
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
};

/**
 * Updates editable fields for an equipment item.
 *
 * @param req Express request containing equipment id and patch payload.
 * @param res Express response containing updated equipment item.
 * @returns Promise that resolves when the response is sent.
 */
export const updateEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipmentId = Array.isArray(req.params.equipmentId)
      ? req.params.equipmentId[0]
      : req.params.equipmentId;
    const { itemName, quantity, condition } = req.body;

    // Find equipment first
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    // Prepare update data
    const updateData: Prisma.EquipmentUpdateInput = {};

    if (itemName !== undefined) {
      if (typeof itemName !== 'string') {
        res.status(400).json({ error: 'Item name must be a string' });
        return;
      }
      updateData.itemName = itemName.trim();
    }

    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity < 0) {
        res.status(400).json({ error: 'Quantity must be a non-negative number' });
        return;
      }
      updateData.quantity = quantity;
    }

    if (condition !== undefined) {
      const validConditions: EquipmentCondition[] = [
        EquipmentCondition.GOOD,
        EquipmentCondition.MAINTENANCE,
        EquipmentCondition.BROKEN,
      ];

      if (!validConditions.includes(condition as EquipmentCondition)) {
        res.status(400).json({ error: 'Invalid condition status' });
        return;
      }
      updateData.condition = condition as EquipmentCondition;
      updateData.lastChecked = new Date();
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: updateData,
    });

    res.json(toEquipmentListItem(updatedEquipment));
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
};

/**
 * Updates only the condition state of an equipment item.
 *
 * @param req Express request containing equipment id and condition.
 * @param res Express response containing updated equipment item.
 * @returns Promise that resolves when the response is sent.
 */
export const updateEquipmentCondition = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipmentId = Array.isArray(req.params.equipmentId)
      ? req.params.equipmentId[0]
      : req.params.equipmentId;
    const { condition } = req.body;

    // Validation
    if (!condition || typeof condition !== 'string') {
      res.status(400).json({ error: 'Condition is required' });
      return;
    }

    const validConditions: EquipmentCondition[] = [
      EquipmentCondition.GOOD,
      EquipmentCondition.MAINTENANCE,
      EquipmentCondition.BROKEN,
    ];

    if (!validConditions.includes(condition as EquipmentCondition)) {
      res.status(400).json({ error: 'Invalid condition status' });
      return;
    }

    // Find equipment first
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        condition: condition as EquipmentCondition,
        lastChecked: new Date(),
      },
    });

    res.json(toEquipmentListItem(updatedEquipment));
  } catch (error) {
    console.error('Error updating equipment condition:', error);
    res.status(500).json({ error: 'Failed to update equipment condition' });
  }
};

/**
 * Removes an equipment item from inventory.
 *
 * @param req Express request containing equipment id.
 * @param res Express response confirming deletion.
 * @returns Promise that resolves when the response is sent.
 */
export const deleteEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipmentId = Array.isArray(req.params.equipmentId)
      ? req.params.equipmentId[0]
      : req.params.equipmentId;

    // Find equipment first
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    await prisma.equipment.delete({
      where: { id: equipmentId },
    });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
};
