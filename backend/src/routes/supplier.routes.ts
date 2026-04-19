import { Router } from 'express';
import {
  createSupplier,
  createSupplierTransaction,
  deleteSupplier,
  getSuppliers,
  getSupplierServiceCategories,
  getSupplierTransactions,
  updateSupplier,
} from '../controllers/supplier.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Middleware chain base: all supplier endpoints require authenticated access.
router.use(requireAuth);

// Authenticated endpoint for supplier list/search/pagination.
router.get('/suppliers', getSuppliers);
// Authenticated endpoint for distinct service category filters.
router.get('/suppliers/categories', getSupplierServiceCategories);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> create supplier.
router.post('/suppliers', requireRole('ADMIN'), createSupplier);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> update supplier.
router.put('/suppliers/:supplierId', requireRole('ADMIN'), updateSupplier);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> delete supplier.
router.delete('/suppliers/:supplierId', requireRole('ADMIN'), deleteSupplier);

// Authenticated endpoint for supplier transaction history.
router.get('/suppliers/:supplierId/transactions', getSupplierTransactions);
// Authenticated admin chain: requireAuth -> requireRole('ADMIN') -> create supplier transaction.
router.post('/suppliers/:supplierId/transactions', requireRole('ADMIN'), createSupplierTransaction);

export default router;
