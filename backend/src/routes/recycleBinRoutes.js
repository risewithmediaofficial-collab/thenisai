import { Router } from 'express';
import {
  getDeletedBills,
  restoreBill,
  bulkRestoreBills,
  permanentDeleteBill,
  bulkPermanentDeleteBills,
  getDeletedProducts,
  restoreProduct,
  bulkRestoreProducts,
  permanentDeleteProduct,
  bulkPermanentDeleteProducts,
} from '../controllers/recycleBinController.js';

const router = Router();

// Bills
router.get('/bills', getDeletedBills);
router.post('/bills/bulk-restore', bulkRestoreBills);
router.delete('/bills/bulk-permanent', bulkPermanentDeleteBills);
router.post('/bills/:id/restore', restoreBill);
router.delete('/bills/:id/permanent', permanentDeleteBill);

// Products
router.get('/products', getDeletedProducts);
router.post('/products/bulk-restore', bulkRestoreProducts);
router.delete('/products/bulk-permanent', bulkPermanentDeleteProducts);
router.post('/products/:id/restore', restoreProduct);
router.delete('/products/:id/permanent', permanentDeleteProduct);

export default router;
