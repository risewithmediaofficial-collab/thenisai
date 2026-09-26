import { Router } from 'express';
import {
  getInventory,
  addStock,
  addProduct,
  updateAvailability,
  updateProduct,
  updateUnlimitedStock,
  updatePrice,
  updateSku,
  deleteProduct,
} from '../controllers/inventoryController.js';

const router = Router();

router.get('/', getInventory);
router.post('/stock', addStock);
router.post('/products', addProduct);
router.patch('/:id/availability', updateAvailability);
router.patch('/:id/unlimited-stock', updateUnlimitedStock);
router.patch('/:id/price', updatePrice);
router.patch('/:id/sku', updateSku);
router.patch('/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
