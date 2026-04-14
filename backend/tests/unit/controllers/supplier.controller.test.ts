import type { Request, Response } from 'express';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    supplier: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplierTransaction: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import {
  createSupplier,
  createSupplierTransaction,
  deleteSupplier,
  getSuppliers,
  getSupplierServiceCategories,
  getSupplierTransactions,
  updateSupplier,
} from '../../../src/controllers/supplier.controller';
import prisma from '../../../src/lib/prisma';

function createResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('supplier controller (mocked)', () => {
  const mockedPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns paginated suppliers in getSuppliers', async () => {
    const now = new Date('2026-04-08T00:00:00.000Z');

    mockedPrisma.supplier.count.mockResolvedValue(1);
    mockedPrisma.supplier.findMany.mockResolvedValue([
      {
        id: 'supplier-1',
        name: 'FitSupply',
        serviceCategory: 'Supplies',
        contactPerson: 'Andrea',
        contactNumber: '09170000001',
        address: 'Quezon City',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    mockedPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getSuppliers(req, res);

    expect(mockedPrisma.supplier.count).toHaveBeenCalledWith({ where: {} });
    expect(mockedPrisma.supplier.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      items: [
        {
          id: 'supplier-1',
          name: 'FitSupply',
          serviceCategory: 'Supplies',
          contactPerson: 'Andrea',
          contactNumber: '09170000001',
          address: 'Quezon City',
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

  it('applies service category filtering in getSuppliers', async () => {
    mockedPrisma.supplier.count.mockResolvedValue(0);
    mockedPrisma.supplier.findMany.mockResolvedValue([]);
    mockedPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const req = {
      query: {
        serviceCategory: 'Nutrition',
      },
    } as unknown as Request;
    const res = createResponse();

    await getSuppliers(req, res);

    expect(mockedPrisma.supplier.count).toHaveBeenCalledWith({
      where: {
        serviceCategory: {
          equals: 'Nutrition',
          mode: 'insensitive',
        },
      },
    });
  });

  it('returns supplier service categories', async () => {
    mockedPrisma.supplier.findMany.mockResolvedValue([
      { serviceCategory: 'Equipment' },
      { serviceCategory: 'Nutrition' },
      { serviceCategory: 'Maintenance' },
    ]);

    const req = {} as unknown as Request;
    const res = createResponse();

    await getSupplierServiceCategories(req, res);

    expect(mockedPrisma.supplier.findMany).toHaveBeenCalledWith({
      distinct: ['serviceCategory'],
      select: { serviceCategory: true },
      orderBy: { serviceCategory: 'asc' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      items: ['Equipment', 'Nutrition', 'Maintenance'],
    });
  });

  it('returns 400 in createSupplier when required fields are missing', async () => {
    const req = {
      body: {
        name: 'Supplier only',
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Name and contact number are required' });
  });

  it('creates supplier in createSupplier', async () => {
    const now = new Date('2026-04-08T00:00:00.000Z');

    mockedPrisma.supplier.create.mockResolvedValue({
      id: 'supplier-2',
      name: 'Created Supplier',
      serviceCategory: 'Water Supplier',
      contactPerson: 'Test Person',
      contactNumber: '09171111111',
      address: 'Pasig',
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      body: {
        name: '  Created Supplier ',
        serviceCategory: ' Water Supplier ',
        contactPerson: '  Test Person ',
        contactNumber: ' 09171111111 ',
        address: ' Pasig ',
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplier(req, res);

    expect(mockedPrisma.supplier.create).toHaveBeenCalledWith({
      data: {
        name: 'Created Supplier',
        serviceCategory: 'Water Supplier',
        contactPerson: 'Test Person',
        contactNumber: '09171111111',
        address: 'Pasig',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'supplier-2',
        name: 'Created Supplier',
        serviceCategory: 'Water Supplier',
      }),
    );
  });

  it('returns 400 in createSupplier when contact number exceeds 11 digits', async () => {
    const req = {
      body: {
        name: 'Too Long Number Supplier',
        contactNumber: '091712345678',
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Contact number must contain at most 11 digits',
    });
  });

  it('returns 404 in updateSupplier when supplier does not exist', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue(null);

    const req = {
      params: { supplierId: 'missing-supplier' },
      body: { name: 'Updated Name' },
    } as unknown as Request;
    const res = createResponse();

    await updateSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Supplier not found' });
  });

  it('returns 400 in updateSupplier when contact number is empty', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });

    const req = {
      params: { supplierId: 'supplier-1' },
      body: { contactNumber: ' ' },
    } as unknown as Request;
    const res = createResponse();

    await updateSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contact number must be a non-empty string' });
  });

  it('returns 400 in updateSupplier when contact number exceeds 11 digits', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });

    const req = {
      params: { supplierId: 'supplier-1' },
      body: { contactNumber: '091712345678' },
    } as unknown as Request;
    const res = createResponse();

    await updateSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Contact number must contain at most 11 digits',
    });
  });

  it('updates supplier in updateSupplier', async () => {
    const now = new Date('2026-04-08T02:00:00.000Z');

    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplier.update.mockResolvedValue({
      id: 'supplier-1',
      name: 'Updated Supplier',
      serviceCategory: 'Equipment Repair',
      contactPerson: 'Updated Person',
      contactNumber: '09172222222',
      address: null,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      params: { supplierId: 'supplier-1' },
      body: {
        name: 'Updated Supplier',
        serviceCategory: 'Equipment Repair',
        contactPerson: 'Updated Person',
        contactNumber: '09172222222',
        address: ' ',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateSupplier(req, res);

    expect(mockedPrisma.supplier.update).toHaveBeenCalledWith({
      where: { id: 'supplier-1' },
      data: {
        name: 'Updated Supplier',
        serviceCategory: 'Equipment Repair',
        contactPerson: 'Updated Person',
        contactNumber: '09172222222',
        address: null,
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 204 in deleteSupplier when delete succeeds', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplier.delete.mockResolvedValue({ id: 'supplier-1' });

    const req = {
      params: { supplierId: 'supplier-1' },
    } as unknown as Request;
    const res = createResponse();

    await deleteSupplier(req, res);

    expect(mockedPrisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 'supplier-1' } });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('returns paginated supplier transactions in getSupplierTransactions', async () => {
    const now = new Date('2026-04-08T03:00:00.000Z');

    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplierTransaction.count.mockResolvedValue(1);
    mockedPrisma.supplierTransaction.findMany.mockResolvedValue([
      {
        id: 'tx-1',
        itemsPurchased: 'Disinfectant',
        totalCost: { toString: () => '1500.00', valueOf: () => 1500 },
        transactionDate: now,
        supplierId: 'supplier-1',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    mockedPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const req = {
      params: { supplierId: 'supplier-1' },
      query: { page: '1', pageSize: '10' },
    } as unknown as Request;
    const res = createResponse();

    await getSupplierTransactions(req, res);

    expect(mockedPrisma.supplierTransaction.findMany).toHaveBeenCalledWith({
      where: { supplierId: 'supplier-1' },
      orderBy: { transactionDate: 'desc' },
      skip: 0,
      take: 10,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 1,
        page: 1,
        pageSize: 10,
      }),
    );
  });

  it('returns 400 in createSupplierTransaction for invalid total cost', async () => {
    const req = {
      params: { supplierId: 'supplier-1' },
      body: {
        itemsPurchased: 'Item',
        totalCost: -5,
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplierTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Total cost must be a positive number' });
  });

  it('creates supplier transaction in createSupplierTransaction', async () => {
    const now = new Date('2026-04-08T04:00:00.000Z');

    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplierTransaction.create.mockResolvedValue({
      id: 'tx-2',
      supplierId: 'supplier-1',
      itemsPurchased: 'Resistance bands',
      totalCost: { toString: () => '2500.00', valueOf: () => 2500 },
      transactionDate: now,
      createdAt: now,
      updatedAt: now,
    });

    const req = {
      params: { supplierId: 'supplier-1' },
      body: {
        itemsPurchased: '  Resistance bands ',
        totalCost: 2500,
        transactionDate: now.toISOString(),
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplierTransaction(req, res);

    expect(mockedPrisma.supplierTransaction.create).toHaveBeenCalledWith({
      data: {
        supplierId: 'supplier-1',
        itemsPurchased: 'Resistance bands',
        totalCost: 2500,
        transactionDate: new Date(now.toISOString()),
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-2',
        totalCost: 2500,
      }),
    );
  });

  it('returns 500 in getSuppliers when query fails', async () => {
    mockedPrisma.$transaction.mockRejectedValue(new Error('db failure'));

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getSuppliers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch suppliers' });
  });

  it('returns 500 in getSupplierServiceCategories when query fails', async () => {
    mockedPrisma.supplier.findMany.mockRejectedValue(new Error('db failure'));

    const req = {} as unknown as Request;
    const res = createResponse();

    await getSupplierServiceCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch supplier service categories' });
  });

  it('returns 500 in createSupplier when create fails', async () => {
    mockedPrisma.supplier.create.mockRejectedValue(new Error('db failure'));

    const req = {
      body: {
        name: 'Valid Supplier',
        contactNumber: '09170000099',
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create supplier' });
  });

  it('returns 500 in updateSupplier when update fails', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplier.update.mockRejectedValue(new Error('db failure'));

    const req = {
      params: { supplierId: 'supplier-1' },
      body: { name: 'Updated Name' },
    } as unknown as Request;
    const res = createResponse();

    await updateSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update supplier' });
  });

  it('returns 500 in deleteSupplier when delete fails', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplier.delete.mockRejectedValue(new Error('db failure'));

    const req = {
      params: { supplierId: 'supplier-1' },
    } as unknown as Request;
    const res = createResponse();

    await deleteSupplier(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete supplier' });
  });

  it('returns 500 in getSupplierTransactions when query fails', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.$transaction.mockRejectedValue(new Error('db failure'));

    const req = {
      params: { supplierId: 'supplier-1' },
      query: { page: '1', pageSize: '10' },
    } as unknown as Request;
    const res = createResponse();

    await getSupplierTransactions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch supplier transactions' });
  });

  it('returns 500 in createSupplierTransaction when create fails', async () => {
    mockedPrisma.supplier.findUnique.mockResolvedValue({ id: 'supplier-1' });
    mockedPrisma.supplierTransaction.create.mockRejectedValue(new Error('db failure'));

    const req = {
      params: { supplierId: 'supplier-1' },
      body: {
        itemsPurchased: 'Resistance bands',
        totalCost: 2500,
      },
    } as unknown as Request;
    const res = createResponse();

    await createSupplierTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create supplier transaction' });
  });
});
