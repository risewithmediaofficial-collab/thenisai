import { Router } from 'express';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staffController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;
