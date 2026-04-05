import type { Request, Response } from 'express';
import { EquipmentCondition } from '@prisma/client';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    equipment: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
  updateEquipmentCondition,
} from '../../../src/controllers/equipment.controller';
import prisma from '../../../src/lib/prisma';

function createResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('equipment controller (mocked)', () => {
  const mockedPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns paginated equipment in getEquipment', async () => {
    const now = new Date('2026-04-05T00:00:00.000Z');
    mockedPrisma.equipment.count.mockResolvedValue(1);
    mockedPrisma.equipment.findMany.mockResolvedValue([
      {
        id: 'eq-1',
        itemName: 'Bench',
        quantity: 3,
        condition: 'GOOD',
        lastChecked: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    mockedPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries)
    );

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getEquipment(req, res);

    expect(mockedPrisma.equipment.count).toHaveBeenCalledWith({ where: {} });
    expect(mockedPrisma.equipment.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(res.json).toHaveBeenCalledWith({
      items: [
        {
          id: 'eq-1',
          itemName: 'Bench',
          quantity: 3,
          condition: 'GOOD',
          lastChecked: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it('applies search, condition, and pagination limits in getEquipment', async () => {
    mockedPrisma.equipment.count.mockResolvedValue(0);
    mockedPrisma.equipment.findMany.mockResolvedValue([]);
    mockedPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries)
    );

    const req = {
      query: {
        search: '  bench ',
        condition: 'MAINTENANCE',
        page: '2',
        pageSize: '999',
      },
    } as unknown as Request;
    const res = createResponse();

    await getEquipment(req, res);

    expect(mockedPrisma.equipment.count).toHaveBeenCalledWith({
      where: {
        condition: EquipmentCondition.MAINTENANCE,
        itemName: { contains: 'bench', mode: 'insensitive' },
      },
    });
    expect(mockedPrisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
        take: 100,
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 100,
      })
    );
  });

  it('returns 500 in getEquipment when transaction fails', async () => {
    mockedPrisma.$transaction.mockRejectedValue(new Error('db error'));

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch equipment' });
  });

  it('returns 400 in createEquipment when itemName is missing', async () => {
    const req = { body: { quantity: 1, condition: 'GOOD' } } as unknown as Request;
    const res = createResponse();

    await createEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Item name is required' });
  });

  it('returns 400 in createEquipment for invalid quantity', async () => {
    const req = { body: { itemName: 'Bench', quantity: -1 } } as unknown as Request;
    const res = createResponse();

    await createEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Quantity must be a non-negative number' });
  });

  it('returns 400 in createEquipment for invalid condition', async () => {
    const req = {
      body: {
        itemName: 'Bench',
        quantity: 1,
        condition: 'INVALID',
      },
    } as unknown as Request;
    const res = createResponse();

    await createEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid condition status' });
  });

  it('creates equipment in createEquipment', async () => {
    const now = new Date('2026-04-05T00:00:00.000Z');
    mockedPrisma.equipment.create.mockResolvedValue({
      id: 'eq-2',
      itemName: 'Created Bench',
      quantity: 7,
      condition: 'GOOD',
      lastChecked: now,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      body: {
        itemName: '  Created Bench  ',
        quantity: 7,
      },
    } as unknown as Request;
    const res = createResponse();

    await createEquipment(req, res);

    expect(mockedPrisma.equipment.create).toHaveBeenCalledWith({
      data: {
        itemName: 'Created Bench',
        quantity: 7,
        condition: EquipmentCondition.GOOD,
        lastChecked: expect.any(Date),
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 'eq-2',
      itemName: 'Created Bench',
      quantity: 7,
      condition: 'GOOD',
      lastChecked: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('returns 500 in createEquipment when create throws', async () => {
    mockedPrisma.equipment.create.mockRejectedValue(new Error('create error'));

    const req = {
      body: {
        itemName: 'Bench',
        quantity: 3,
        condition: 'GOOD',
      },
    } as unknown as Request;
    const res = createResponse();

    await createEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create equipment' });
  });

  it('returns 404 in updateEquipment when not found', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue(null);

    const req = {
      params: { equipmentId: 'missing-id' },
      body: { itemName: 'Bench' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Equipment not found' });
  });

  it('returns 400 in updateEquipment for invalid quantity', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });

    const req = {
      params: { equipmentId: 'eq-1' },
      body: { quantity: -5 },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Quantity must be a non-negative number' });
  });

  it('returns 400 in updateEquipment for non-string itemName', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });

    const req = {
      params: { equipmentId: 'eq-1' },
      body: { itemName: 123 },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Item name must be a string' });
  });

  it('returns 400 in updateEquipment for invalid condition', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });

    const req = {
      params: { equipmentId: 'eq-1' },
      body: { condition: 'INVALID' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid condition status' });
  });

  it('updates equipment in updateEquipment', async () => {
    const now = new Date('2026-04-06T00:00:00.000Z');
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.update.mockResolvedValue({
      id: 'eq-1',
      itemName: 'Updated Bench',
      quantity: 9,
      condition: 'MAINTENANCE',
      lastChecked: now,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      params: { equipmentId: 'eq-1' },
      body: {
        itemName: 'Updated Bench',
        quantity: 9,
        condition: 'MAINTENANCE',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(mockedPrisma.equipment.update).toHaveBeenCalledWith({
      where: { id: 'eq-1' },
      data: {
        itemName: 'Updated Bench',
        quantity: 9,
        condition: EquipmentCondition.MAINTENANCE,
        lastChecked: expect.any(Date),
      },
    });
    expect(res.json).toHaveBeenCalledWith({
      id: 'eq-1',
      itemName: 'Updated Bench',
      quantity: 9,
      condition: 'MAINTENANCE',
      lastChecked: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('returns 500 in updateEquipment when update throws', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.update.mockRejectedValue(new Error('update error'));

    const req = {
      params: { equipmentId: 'eq-1' },
      body: {
        itemName: 'Updated Bench',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update equipment' });
  });

  it('returns 400 in updateEquipmentCondition for invalid condition', async () => {
    const req = {
      params: { equipmentId: 'eq-1' },
      body: { condition: 'INVALID' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipmentCondition(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid condition status' });
  });

  it('returns 400 in updateEquipmentCondition when condition is missing', async () => {
    const req = {
      params: { equipmentId: 'eq-1' },
      body: {},
    } as unknown as Request;
    const res = createResponse();

    await updateEquipmentCondition(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Condition is required' });
  });

  it('returns 404 in updateEquipmentCondition when equipment is missing', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue(null);

    const req = {
      params: { equipmentId: 'missing-id' },
      body: { condition: 'GOOD' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipmentCondition(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Equipment not found' });
  });

  it('updates condition in updateEquipmentCondition', async () => {
    const now = new Date('2026-04-07T00:00:00.000Z');
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.update.mockResolvedValue({
      id: 'eq-1',
      itemName: 'Bench',
      quantity: 4,
      condition: 'BROKEN',
      lastChecked: now,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      params: { equipmentId: 'eq-1' },
      body: { condition: 'BROKEN' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipmentCondition(req, res);

    expect(mockedPrisma.equipment.update).toHaveBeenCalledWith({
      where: { id: 'eq-1' },
      data: {
        condition: EquipmentCondition.BROKEN,
        lastChecked: expect.any(Date),
      },
    });
    expect(res.json).toHaveBeenCalledWith({
      id: 'eq-1',
      itemName: 'Bench',
      quantity: 4,
      condition: 'BROKEN',
      lastChecked: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('returns 500 in updateEquipmentCondition when update throws', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.update.mockRejectedValue(new Error('update condition error'));

    const req = {
      params: { equipmentId: 'eq-1' },
      body: { condition: 'GOOD' },
    } as unknown as Request;
    const res = createResponse();

    await updateEquipmentCondition(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update equipment condition' });
  });

  it('returns 404 in deleteEquipment when not found', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue(null);

    const req = { params: { equipmentId: 'missing-id' } } as unknown as Request;
    const res = createResponse();

    await deleteEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Equipment not found' });
  });

  it('deletes equipment in deleteEquipment', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.delete.mockResolvedValue({ id: 'eq-1' });

    const req = { params: { equipmentId: 'eq-1' } } as unknown as Request;
    const res = createResponse();

    await deleteEquipment(req, res);

    expect(mockedPrisma.equipment.delete).toHaveBeenCalledWith({
      where: { id: 'eq-1' },
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'Equipment deleted successfully' });
  });

  it('returns 500 in deleteEquipment when delete throws', async () => {
    mockedPrisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });
    mockedPrisma.equipment.delete.mockRejectedValue(new Error('delete error'));

    const req = { params: { equipmentId: 'eq-1' } } as unknown as Request;
    const res = createResponse();

    await deleteEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete equipment' });
  });
});
