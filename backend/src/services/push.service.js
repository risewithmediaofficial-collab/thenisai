import webpush from 'web-push';
import { Staff, PushSubscription } from '../models/index.js';

// Fallback VAPID credentials generated specifically for Thenisai
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:orders@thenisai.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BAWtmSmKI9Cwzf4IiBsNZiWjr90YVGeNBAVA3fk8VbkWT-1g-HHyI-FjaNxYGziLr4OhDWcCG6XX0qIojHfL25g';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'il9zoIBJRuYZFDh87lQKeHXRidHd02byoMyDwza-b9U';

try {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web-Push initialized with VAPID details');
} catch (err) {
  console.error('❌ Failed to initialize Web-Push:', err.message);
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY;
}

/**
 * Send push notification to a single PushSubscription object
 */
export async function sendNotificationToSubscription(subscription, payload) {
  if (!subscription || !subscription.endpoint) return { success: false, stale: true };

  const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    await webpush.sendNotification(subscription, stringPayload);
    return { success: true, stale: false };
  } catch (err) {
    const isStale = err.statusCode === 404 || err.statusCode === 410;
    if (isStale) {
      console.log(`[WebPush] Stale subscription detected (${err.statusCode}): ${subscription.endpoint.slice(0, 45)}...`);
    } else {
      console.error('[WebPush] Error sending push notification:', err.message);
    }
    return { success: false, stale: isStale, error: err.message };
  }
}

/**
 * Send push notification to a user (Staff ID) across all registered devices
 */
export async function sendPushToUser(staffId, { title, body, url, icon, badge, tag, data }) {
  try {
    const staff = await Staff.findOne({ id: staffId });
    const directSubs = await PushSubscription.find({ staffId });

    const allSubsMap = new Map();
    if (staff && Array.isArray(staff.pushSubscriptions)) {
      staff.pushSubscriptions.forEach((s) => allSubsMap.set(s.endpoint, s));
    }
    directSubs.forEach((s) => allSubsMap.set(s.endpoint, s));

    const subscriptions = Array.from(allSubsMap.values());
    if (subscriptions.length === 0) return { success: true, count: 0 };

    const payload = {
      title: title || 'Thenisai Sweets Alert',
      body: body || '',
      url: url || '/#admin/billing/preorders',
      icon: icon || '/images/branding/logo-icon.png',
      badge: badge || '/images/branding/logo-icon.png',
      tag: tag || 'thenisai-alert',
      data: {
        url: url || '/#admin/billing/preorders',
        ...(data || {}),
      },
    };

    const staleEndpoints = [];
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const res = await sendNotificationToSubscription(sub, payload);
        if (res.stale) staleEndpoints.push(sub.endpoint);
      })
    );

    if (staleEndpoints.length > 0) {
      await Promise.allSettled([
        PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } }),
        Staff.updateOne(
          { id: staffId },
          { $pull: { pushSubscriptions: { endpoint: { $in: staleEndpoints } } } }
        ),
      ]);
    }

    return { success: true, count: subscriptions.length - staleEndpoints.length };
  } catch (err) {
    console.error('[WebPush] Error in sendPushToUser:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to staff by roles (e.g. ['admin', 'cashier'])
 */
export async function sendPushToRoles(roles = ['admin', 'cashier'], { title, body, url, icon, badge, tag, data }) {
  try {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    // Find all standalone push subscriptions with matching role or 'all'
    const roleSubs = await PushSubscription.find({
      $or: [
        { role: { $in: [...rolesArray, 'all'] } },
        { role: { $exists: false } },
      ],
    });

    // Also look up staff members matching roles
    const matchingStaff = await Staff.find({
      role: { $in: rolesArray },
      'pushSubscriptions.0': { $exists: true },
    });

    const allSubsMap = new Map();
    roleSubs.forEach((s) => allSubsMap.set(s.endpoint, s));
    matchingStaff.forEach((staff) => {
      (staff.pushSubscriptions || []).forEach((s) => allSubsMap.set(s.endpoint, s));
    });

    const subscriptions = Array.from(allSubsMap.values());
    if (subscriptions.length === 0) {
      console.log(`[WebPush] No push subscribers found for roles: ${rolesArray.join(', ')}`);
      return { success: true, count: 0 };
    }

    const payload = {
      title: title || 'Thenisai Sweets Alert',
      body: body || '',
      url: url || '/#admin/billing/preorders',
      icon: icon || '/images/branding/logo-icon.png',
      badge: badge || '/images/branding/logo-icon.png',
      tag: tag || `thenisai-${Date.now()}`,
      data: {
        url: url || '/#admin/billing/preorders',
        ...(data || {}),
      },
    };

    const staleEndpoints = [];
    let deliveredCount = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const res = await sendNotificationToSubscription(sub, payload);
        if (res.stale) {
          staleEndpoints.push(sub.endpoint);
        } else if (res.success) {
          deliveredCount++;
        }
      })
    );

    if (staleEndpoints.length > 0) {
      await Promise.allSettled([
        PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } }),
        Staff.updateMany(
          {},
          { $pull: { pushSubscriptions: { endpoint: { $in: staleEndpoints } } } }
        ),
      ]);
    }

    console.log(`[WebPush] Broadcast delivered to ${deliveredCount}/${subscriptions.length} devices (pruned ${staleEndpoints.length} stale)`);
    return { success: true, count: deliveredCount };
  } catch (err) {
    console.error('[WebPush] Error in sendPushToRoles:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Pre-Order Specific Notification Trigger
 * Dispatched instantly when a customer creates a pre-order online
 */
export async function sendPreOrderPushToStaff(preOrder) {
  if (!preOrder) return;

  const invNum = preOrder.invoiceNumber || 'PRE-ORD';
  const total = preOrder.grandTotal ? `₹${preOrder.grandTotal}` : '';
  const customer = preOrder.customerName || 'Customer';
  const itemCount = preOrder.totalItems || preOrder.items?.length || 1;

  const title = `🔔 New Pre-Order: ${invNum}`;
  const body = `${customer} placed a pre-order for ${itemCount} items (${total}). Zero-wait pickup requested!`;
  const url = '/#admin/billing/preorders';

  return sendPushToRoles(['admin', 'cashier', 'biller', 'manager'], {
    title,
    body,
    url,
    tag: `preorder-${invNum}`,
    data: {
      type: 'new_preorder',
      preOrderId: preOrder.id,
      invoiceNumber: invNum,
      customerName: customer,
      customerPhone: preOrder.customerPhone,
      grandTotal: preOrder.grandTotal,
      url,
    },
  });
}

