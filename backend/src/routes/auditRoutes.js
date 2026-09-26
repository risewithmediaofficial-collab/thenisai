import { Router } from 'express';
import {
  recordPriceOverride,
  getPriceOverrides,
  getActivities,
  recordActivity,
  clearActivities,
  clearPriceOverrides,
} from '../controllers/auditController.js';

const router = Router();

router.post('/price-override', recordPriceOverride);
router.get('/price-overrides', getPriceOverrides);
router.delete('/price-overrides', clearPriceOverrides);
router.get('/activities', getActivities);
router.post('/activity', recordActivity);
router.delete('/activities', clearActivities);

export default router;
