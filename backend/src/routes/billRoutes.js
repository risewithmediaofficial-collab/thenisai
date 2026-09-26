import { Router } from 'express';
import {
  validateStock,
  getNextInvoiceNumber,
  resetSequence,
  createBill,
  getBills,
  updateBill,
  deleteBill,
  syncBatch,
} from '../controllers/billController.js';

const router = Router();

router.post('/validate-stock', validateStock);
router.get('/next-invoice-number', getNextInvoiceNumber);
router.post('/reset-sequence', resetSequence);
router.post('/sync-batch', syncBatch);
router.post('/', createBill);
router.get('/', getBills);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

export default router;
