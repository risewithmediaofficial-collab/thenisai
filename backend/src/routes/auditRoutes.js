import { Router } from 'express';
import {
  recordPriceOverride,
  getPriceOverrides,
  getActivities,
  recordActivity,
} from '../controllers/auditController.js';

const router = Router();

router.post('/price-override', recordPriceOverride);
router.get('/price-overrides', getPriceOverrides);
router.get('/activities', getActivities);
router.post('/activity', recordActivity);

export default router;
