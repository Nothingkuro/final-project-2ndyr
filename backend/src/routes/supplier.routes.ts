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

router.use(requireAuth);

router.get('/suppliers', getSuppliers);
router.get('/suppliers/categories', getSupplierServiceCategories);
router.post('/suppliers', requireRole('ADMIN'), createSupplier);
router.put('/suppliers/:supplierId', requireRole('ADMIN'), updateSupplier);
router.delete('/suppliers/:supplierId', requireRole('ADMIN'), deleteSupplier);

router.get('/suppliers/:supplierId/transactions', getSupplierTransactions);
router.post('/suppliers/:supplierId/transactions', requireRole('ADMIN'), createSupplierTransaction);

export default router;
