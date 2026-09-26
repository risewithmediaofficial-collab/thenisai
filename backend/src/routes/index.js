import { Router } from 'express';
import authRoutes from './authRoutes.js';
import staffRoutes from './staffRoutes.js';
import otpRoutes from './otpRoutes.js';
import customerRoutes from './customerRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import stockRoutes from './stockRoutes.js';
import orderRoutes from './orderRoutes.js';
import billRoutes from './billRoutes.js';
import preOrderRoutes from './preOrderRoutes.js';
import recycleBinRoutes from './recycleBinRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import auditRoutes from './auditRoutes.js';
import { getDailyReport } from '../controllers/expenseController.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/otp', otpRoutes);
router.use('/customer', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stock', stockRoutes);
router.use('/orders', orderRoutes);
router.use('/bills', billRoutes);
router.use('/preorders', preOrderRoutes);
router.use('/recycle-bin', recycleBinRoutes);
router.use('/expenses', expenseRoutes);
router.get('/daily-report', getDailyReport);
router.use('/audit', auditRoutes);

export default router;
