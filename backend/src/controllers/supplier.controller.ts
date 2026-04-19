import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

type SupplierItem = {
  id: string;
  name: string;
  serviceCategory: string;
  contactPerson: string | null;
  contactNumber: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

type SupplierTransactionItem = {
  id: string;
  itemsPurchased: string;
  totalCost: number;
  transactionDate: string;
  supplierId: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Normalizes optional text payload fields for supplier records.
 *
 * @param value Raw payload value.
 * @returns Trimmed text or null when missing/empty.
 */
function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Keeps only digits from supplier contact numbers.
 *
 * @param value Raw contact number string.
 * @returns Digits-only contact number.
 */
function normalizeContactNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Maps supplier records to API output format.
 *
 * @param supplier Supplier row from Prisma.
 * @returns Supplier list item with ISO date strings.
 */
function toSupplierItem(supplier: {
  id: string;
  name: string;
  serviceCategory: string;
  contactPerson: string | null;
  contactNumber: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SupplierItem {
  return {
    id: supplier.id,
    name: supplier.name,
    serviceCategory: supplier.serviceCategory,
    contactPerson: supplier.contactPerson,
    contactNumber: supplier.contactNumber,
    address: supplier.address,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

/**
 * Maps supplier transaction records to API output format.
 *
 * @param transaction Supplier transaction row from Prisma.
 * @returns Transaction list item with numeric total cost.
 */
function toSupplierTransactionItem(transaction: {
  id: string;
  itemsPurchased: string;
  totalCost: Prisma.Decimal;
  transactionDate: Date;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}): SupplierTransactionItem {
  return {
    id: transaction.id,
    itemsPurchased: transaction.itemsPurchased,
    totalCost: Number(transaction.totalCost),
    transactionDate: transaction.transactionDate.toISOString(),
    supplierId: transaction.supplierId,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

/**
 * Lists suppliers with optional search, category filtering, and pagination.
 *
 * @param req Express request containing optional filters.
 * @param res Express response containing paginated suppliers.
 * @returns Promise that resolves when the response is sent.
 */
export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchRaw = typeof req.query.search === 'string' ? req.query.search : '';
    const serviceCategoryRaw =
      typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : '';
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : 20;

    const search = searchRaw.trim();
    const serviceCategory = serviceCategoryRaw.trim();
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.floor(pageSizeRaw), 100)
      : 20;

    const whereConditions: Prisma.SupplierWhereInput[] = [];

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { serviceCategory: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (serviceCategory) {
      whereConditions.push({
        serviceCategory: {
          equals: serviceCategory,
          mode: 'insensitive',
        },
      });
    }

    const where: Prisma.SupplierWhereInput = whereConditions.length === 0
      ? {}
      : whereConditions.length === 1
        ? whereConditions[0]
        : { AND: whereConditions };

    const [total, suppliers] = await prisma.$transaction([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    res.status(200).json({
      items: suppliers.map(toSupplierItem),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

/**
 * Returns distinct supplier service categories for filter dropdowns.
 *
 * @param _req Express request (unused).
 * @param res Express response containing service category values.
 * @returns Promise that resolves when the response is sent.
 */
export const getSupplierServiceCategories = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      distinct: ['serviceCategory'],
      select: { serviceCategory: true },
      orderBy: { serviceCategory: 'asc' },
    });

    const items = suppliers
      .map((supplier) => supplier.serviceCategory.trim())
      .filter((category) => category.length > 0);

    res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching supplier service categories:', error);
    res.status(500).json({ error: 'Failed to fetch supplier service categories' });
  }
};

/**
 * Creates a new supplier record.
 *
 * @param req Express request containing supplier payload.
 * @param res Express response containing created supplier.
 * @returns Promise that resolves when the response is sent.
 */
export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawName = req.body?.name;
    const rawContactNumber = req.body?.contactNumber;
    const rawServiceCategory = req.body?.serviceCategory;

    if (typeof rawName !== 'string' || typeof rawContactNumber !== 'string') {
      res.status(400).json({ error: 'Name and contact number are required' });
      return;
    }

    const name = rawName.trim();
    const contactNumber = normalizeContactNumber(rawContactNumber);

    if (!name || !contactNumber) {
      res.status(400).json({ error: 'Name and contact number are required' });
      return;
    }

    if (contactNumber.length > 11) {
      res.status(400).json({ error: 'Contact number must contain at most 11 digits' });
      return;
    }

    const serviceCategory =
      typeof rawServiceCategory === 'string' && rawServiceCategory.trim().length > 0
        ? rawServiceCategory.trim()
        : 'GENERAL';

    const createdSupplier = await prisma.supplier.create({
      data: {
        name,
        serviceCategory,
        contactPerson: normalizeOptionalText(req.body?.contactPerson),
        contactNumber,
        address: normalizeOptionalText(req.body?.address),
      },
    });

    res.status(201).json(toSupplierItem(createdSupplier));
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

/**
 * Updates supplier details for an existing record.
 *
 * @param req Express request containing supplier id and patch payload.
 * @param res Express response containing updated supplier.
 * @returns Promise that resolves when the response is sent.
 */
export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = Array.isArray(req.params.supplierId)
      ? req.params.supplierId[0]
      : req.params.supplierId;

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier id is required' });
      return;
    }

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const updateData: Prisma.SupplierUpdateInput = {};

    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        res.status(400).json({ error: 'Name must be a non-empty string' });
        return;
      }
      updateData.name = req.body.name.trim();
    }

    if (req.body?.serviceCategory !== undefined) {
      if (typeof req.body.serviceCategory !== 'string' || req.body.serviceCategory.trim().length === 0) {
        res.status(400).json({ error: 'Service category must be a non-empty string' });
        return;
      }
      updateData.serviceCategory = req.body.serviceCategory.trim();
    }

    if (req.body?.contactNumber !== undefined) {
      if (typeof req.body.contactNumber !== 'string' || req.body.contactNumber.trim().length === 0) {
        res.status(400).json({ error: 'Contact number must be a non-empty string' });
        return;
      }

      const contactNumber = normalizeContactNumber(req.body.contactNumber);

      if (!contactNumber) {
        res.status(400).json({ error: 'Contact number must be a non-empty string' });
        return;
      }

      if (contactNumber.length > 11) {
        res.status(400).json({ error: 'Contact number must contain at most 11 digits' });
        return;
      }

      updateData.contactNumber = contactNumber;
    }

    if (req.body?.contactPerson !== undefined) {
      updateData.contactPerson = normalizeOptionalText(req.body.contactPerson);
    }

    if (req.body?.address !== undefined) {
      updateData.address = normalizeOptionalText(req.body.address);
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
    });

    res.status(200).json(toSupplierItem(updatedSupplier));
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

/**
 * Deletes a supplier record.
 *
 * @param req Express request containing supplier id.
 * @param res Express response confirming deletion.
 * @returns Promise that resolves when the response is sent.
 */
export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = Array.isArray(req.params.supplierId)
      ? req.params.supplierId[0]
      : req.params.supplierId;

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier id is required' });
      return;
    }

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!existingSupplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await prisma.supplier.delete({
      where: { id: supplierId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};

/**
 * Lists paginated transaction history for a supplier.
 *
 * @param req Express request containing supplier id and pagination query.
 * @param res Express response containing transaction records.
 * @returns Promise that resolves when the response is sent.
 */
export const getSupplierTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = Array.isArray(req.params.supplierId)
      ? req.params.supplierId[0]
      : req.params.supplierId;

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier id is required' });
      return;
    }

    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : 10;

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.floor(pageSizeRaw), 100)
      : 10;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const where: Prisma.SupplierTransactionWhereInput = { supplierId };

    const [total, transactions] = await prisma.$transaction([
      prisma.supplierTransaction.count({ where }),
      prisma.supplierTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    res.status(200).json({
      items: transactions.map(toSupplierTransactionItem),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching supplier transactions:', error);
    res.status(500).json({ error: 'Failed to fetch supplier transactions' });
  }
};

/**
 * Creates a transaction entry for a supplier purchase.
 *
 * @param req Express request containing supplier id and purchase payload.
 * @param res Express response containing created transaction.
 * @returns Promise that resolves when the response is sent.
 */
export const createSupplierTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = Array.isArray(req.params.supplierId)
      ? req.params.supplierId[0]
      : req.params.supplierId;

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier id is required' });
      return;
    }

    const rawItemsPurchased = req.body?.itemsPurchased;
    const rawTotalCost = req.body?.totalCost;
    const rawTransactionDate = req.body?.transactionDate;

    if (typeof rawItemsPurchased !== 'string') {
      res.status(400).json({ error: 'Items purchased is required' });
      return;
    }

    const itemsPurchased = rawItemsPurchased.trim();

    if (!itemsPurchased) {
      res.status(400).json({ error: 'Items purchased is required' });
      return;
    }

    const totalCost = Number(rawTotalCost);

    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      res.status(400).json({ error: 'Total cost must be a positive number' });
      return;
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    let transactionDate = new Date();

    if (rawTransactionDate !== undefined) {
      if (typeof rawTransactionDate !== 'string') {
        res.status(400).json({ error: 'Transaction date must be a valid ISO date string' });
        return;
      }

      transactionDate = new Date(rawTransactionDate);

      if (Number.isNaN(transactionDate.getTime())) {
        res.status(400).json({ error: 'Transaction date must be a valid ISO date string' });
        return;
      }
    }

    const createdTransaction = await prisma.supplierTransaction.create({
      data: {
        supplierId,
        itemsPurchased,
        totalCost,
        transactionDate,
      },
    });

    res.status(201).json(toSupplierTransactionItem(createdTransaction));
  } catch (error) {
    console.error('Error creating supplier transaction:', error);
    res.status(500).json({ error: 'Failed to create supplier transaction' });
  }
};
