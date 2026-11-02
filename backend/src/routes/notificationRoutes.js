import { Router } from 'express';
import { Staff, PushSubscription } from '../models/index.js';
import {
  getVapidPublicKey,
  sendNotificationToSubscription,
  sendPushToRoles,
} from '../services/push.service.js';
import { checkPendingPreOrdersAndNotify } from '../services/cron.service.js';

const router = Router();

/**
 * 1. Expose the VAPID Public Key to Frontend
 */
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    return res.json({ success: true, publicKey });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 2. Save User / Device Push Subscription
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, role = 'all', staffId = '', staffName = '' } = req.body || {};

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid push subscription payload' });
    }

    const endpoint = subscription.endpoint;
    const userAgent = req.headers['user-agent'] || '';

    // 1. Upsert into standalone PushSubscription collection
    const pushDoc = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          endpoint,
          keys: subscription.keys,
          role: role || 'all',
          staffId: staffId || '',
          staffName: staffName || '',
          userAgent,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 2. If staffId provided, also save in Staff document
    if (staffId) {
      await Staff.updateOne(
        { id: staffId },
        {
          $pull: { pushSubscriptions: { endpoint } },
        }
      );
      await Staff.updateOne(
        { id: staffId },
        {
          $push: {
            pushSubscriptions: {
              endpoint,
              keys: subscription.keys,
              userAgent,
              createdAt: new Date(),
            },
          },
        }
      );
    }

    console.log(`[WebPush] Subscription saved for role: [${role}] ${staffName ? `(${staffName})` : ''} - Endpoint: ${endpoint.slice(0, 45)}...`);
    return res.json({ success: true, message: 'Subscribed to push notifications', id: pushDoc._id });
  } catch (err) {
    console.error('[WebPush] Subscription save error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 3. Unsubscribe a Device
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint, staffId } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required to unsubscribe' });
    }

    await PushSubscription.deleteOne({ endpoint });
    if (staffId) {
      await Staff.updateOne(
        { id: staffId },
        { $pull: { pushSubscriptions: { endpoint } } }
      );
    }

    console.log(`[WebPush] Unsubscribed endpoint: ${endpoint.slice(0, 45)}...`);
    return res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 4. Send Instant Test Notification
 */
router.post('/test', async (req, res) => {
  try {
    const { subscription, title, body } = req.body || {};

    const testPayload = {
      title: title || '🔔 Test Notification from Thenisai',
      body: body || 'Web push notification is active! You will receive customer pre-orders in real time.',
      url: '/#admin/billing/preorders',
      icon: '/images/branding/logo-icon.png',
      badge: '/images/branding/logo-icon.png',
      tag: 'test-push',
      data: {
        type: 'test',
        timestamp: Date.now(),
        url: '/#admin/billing/preorders',
      },
    };

    if (subscription && subscription.endpoint) {
      const result = await sendNotificationToSubscription(subscription, testPayload);
      return res.json({ success: result.success, error: result.error });
    }

    // Broadcast test to all admin/cashier subscribers
    const broadcastRes = await sendPushToRoles(['admin', 'cashier', 'biller'], testPayload);
    return res.json({ success: true, message: `Delivered test alert to ${broadcastRes.count} devices` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 5. Manually trigger Cron Job Pending Pre-Orders Check
 */
router.post('/trigger-cron-check', async (req, res) => {
  try {
    const result = await checkPendingPreOrdersAndNotify();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

