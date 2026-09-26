import { Router } from 'express';
import {
  authOtp,
  getCustomerMe,
  wishlistToggle,
  wishlistSync,
  customerLogin,
} from '../controllers/customerController.js';

const router = Router();

router.post('/auth-otp', authOtp);
router.post('/login', customerLogin);
router.get('/me', getCustomerMe);
router.post('/wishlist/toggle', wishlistToggle);
router.post('/wishlist/sync', wishlistSync);

export default router;
