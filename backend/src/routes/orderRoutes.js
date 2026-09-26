import { Router } from 'express';
import {
  getOrders,
  createOrder,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
