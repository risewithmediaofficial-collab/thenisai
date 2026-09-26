import { Router } from 'express';
import { login, getMe, logout } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
