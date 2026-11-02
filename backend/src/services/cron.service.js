import cron from 'node-cron';
import { PreOrder } from '../models/index.js';
import { sendPushToRoles } from './push.service.js';

let cronTask = null;
let lastReminderOrderIds = new Set();
let lastReminderTimestamp = 0;

/**
 * Check for unacknowledged / pending customer pre-orders
 * and trigger push notifications to billers and admins
 */
export async function checkPendingPreOrdersAndNotify() {
  try {
    // Find all pre-orders that are still pending
    const pendingOrders = await PreOrder.find({ status: 'pending' }).sort({ createdAt: -1 });

    if (!pendingOrders || pendingOrders.length === 0) {
      // Clear tracking if no orders are pending
      lastReminderOrderIds.clear();
      return { success: true, count: 0 };
    }

    const currentPendingIds = new Set(pendingOrders.map((o) => o.id || o.invoiceNumber));
    const now = Date.now();

    // Determine if there are new unacknowledged orders or if 5 minutes have elapsed since last reminder
    const hasNewPending = [...currentPendingIds].some((id) => !lastReminderOrderIds.has(id));
    const isReminderDue = (now - lastReminderTimestamp) > (5 * 60 * 1000); // 5 minutes

    if (!hasNewPending && !isReminderDue) {
      // Don't spam notifications if we've recently notified about the exact same pending set
      return { success: true, count: pendingOrders.length, throttled: true };
    }

    const count = pendingOrders.length;
    const latestOrder = pendingOrders[0];
    const customer = latestOrder.customerName || 'Customer';
    const inv = latestOrder.invoiceNumber || 'PRE-ORD';

    console.log(`[Cron Job] Found ${count} pending pre-orders. Sending push reminder to billers/admins...`);

    const title = count === 1
      ? `⚠️ Pre-Order Awaiting Review: ${inv}`
      : `⚠️ ${count} Pre-Orders Awaiting Biller Action`;

    const body = count === 1
      ? `${customer} is waiting for pickup confirmation (₹${latestOrder.grandTotal}). Tap to open.`
      : `Latest: ${inv} (${customer}). Tap to review and bill in POS.`;

    await sendPushToRoles(['admin', 'cashier', 'biller', 'manager'], {
      title,
      body,
      url: '/#admin/billing/preorders',
      icon: '/images/branding/logo-icon.png',
      badge: '/images/branding/logo-icon.png',
      tag: 'pending-preorders-cron-reminder',
      data: {
        type: 'pending_reminder',
        pendingCount: count,
        latestInvoice: inv,
        url: '/#admin/billing/preorders',
      },
    });

    lastReminderOrderIds = currentPendingIds;
    lastReminderTimestamp = now;

    return { success: true, count, notified: true };
  } catch (err) {
    console.error('[Cron Job] Error in checkPendingPreOrdersAndNotify:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize and start the background cron schedule
 */
export function startCronJobs() {
  if (cronTask) {
    console.log('[Cron Job] Already active');
    return;
  }

  // Run every 2 minutes: "*/2 * * * *"
  cronTask = cron.schedule('*/2 * * * *', async () => {
    console.log(`[Cron Job] [${new Date().toLocaleTimeString()}] Running periodic pending pre-order sweep...`);
    await checkPendingPreOrdersAndNotify();
  });

  console.log('⏰ [Cron Job] Background pre-order monitor active (running every 2 minutes)');
}

/**
 * Stop cron job gracefully
 */
export function stopCronJobs() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('🛑 [Cron Job] Background monitor stopped');
  }
}
