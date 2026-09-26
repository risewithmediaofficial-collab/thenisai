import { Router } from 'express';
import {
  getStockLogs,
  stockInward,
  stockDispatch,
  stockReturn,
} from '../controllers/stockController.js';

const router = Router();

router.get('/logs', getStockLogs);
router.post('/inward', stockInward);
router.post('/dispatch', stockDispatch);
router.post('/return', stockReturn);

export default router;
