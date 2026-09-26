import { Router } from 'express';
import {
  createPreOrder,
  getPreOrders,
  getCustomerPreOrders,
  updatePreOrderStatus,
  deletePreOrder,
} from '../controllers/preOrderController.js';

const router = Router();

router.post('/', createPreOrder);
router.get('/', getPreOrders);
router.get('/customer/:phone', getCustomerPreOrders);
router.patch('/:id/status', updatePreOrderStatus);
router.delete('/:id', deletePreOrder);

export default router;
