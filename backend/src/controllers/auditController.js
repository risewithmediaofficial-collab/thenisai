import { PriceOverrideLog, ActivityLog } from '../models/index.js';
import { sanitizeCashier, sanitizePriceOverrideLog, sanitizeActivityLog } from '../utils/sanitize.js';

function sanitizePerformer(p) {
  if (!p) return { id: 'staff-1', name: 'S. Ramanathan', username: 'admin', role: 'admin', title: 'Kitchen Operations Head' };
  return {
    id: String(p.id || 'staff-1').trim(),
    name: String(p.name && p.name !== 'Staff' ? p.name : 'S. Ramanathan').trim(),
    username: String(p.username || 'admin').trim(),
    role: String(p.role || 'admin').trim(),
    title: p.title ? String(p.title).trim() : undefined,
  };
}

export async function recordPriceOverride(req, res) {
  try {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    const createdLogs = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    for (const entry of entries) {
      if (!entry.productName && !entry.productId) continue;
      const originalRate = Number(entry.originalRate || entry.originalPrice || 0);
      const customRate = Number(entry.customRate || entry.customPrice || entry.overriddenPrice || 0);

      const payload = sanitizePriceOverrideLog({
        id: entry.id || `ovr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        invoiceNumber: String(entry.invoiceNumber || 'COUNTER-DRAFT').trim(),
        cashier: entry.cashier,
        productId: String(entry.productId || '').trim(),
        productName: String(entry.productName || entry.item || 'Unknown Sweet').trim(),
        weightOrUnit: String(entry.weightOrUnit || entry.weight || 'unit').trim(),
        originalRate,
        customRate,
        difference: Number(entry.difference ?? (customRate - originalRate)),
        quantity: Math.max(1, Number(entry.quantity || 1)),
        reason: String(entry.reason || 'Counter Customer Negotiation / Discount').trim(),
        timestamp: entry.timestamp || Date.now(),
        dateStr: entry.dateStr || dateStr,
        timeStr: entry.timeStr || timeStr,
      });

      const log = await PriceOverrideLog.create(payload);
      createdLogs.push(log);
    }

    console.log(`[Audit] Recorded ${createdLogs.length} price override event(s)`);
    res.json({ success: true, count: createdLogs.length, logs: createdLogs });
  } catch (err) {
    console.error('[Audit] Error recording price override log:', err);
    res.status(500).json({ success: false, message: 'Failed to record audit log: ' + err.message });
  }
}

export async function getPriceOverrides(req, res) {
  try {
    const { cashierId, limit = 500 } = req.query;
    const filter = {};
    if (cashierId && cashierId !== 'all') {
      filter.$or = [
        { 'cashier.id': cashierId },
        { 'cashier.username': cashierId },
        { 'cashier.name': cashierId },
      ];
    }

    const logs = await PriceOverrideLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, logs });
  } catch (err) {
    console.error('[Audit] Error fetching price override logs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
}

export async function getActivities(req, res) {
  try {
    const { limit = 300, type } = req.query;
    const filter = {};
    if (type && type !== 'all') {
      filter.actionType = type;
    }
    const activities = await ActivityLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));

    const sanitized = activities.map((act) => {
      const p = act.performedBy || {};
      if (!p.id || p.name === 'Staff' || p.id === 'staff-1' || p.username === 'admin') {
        const isCashier = act.actionType === 'PRICE_OVERRIDE' && p.role === 'cashier' && p.id !== 'staff-1';
        act.performedBy = isCashier
          ? { id: p.id || 'staff-2', username: p.username || 'cashier', name: p.name && p.name !== 'Staff' ? p.name : 'M. Kannan', role: 'cashier', title: 'Counter Cashier' }
          : { id: 'staff-1', username: 'admin', name: p.name && p.name !== 'Staff' ? p.name : 'S. Ramanathan', role: 'admin', title: 'Kitchen Operations Head' };
      }
      return act;
    });

    res.json({ success: true, activities: sanitized });
  } catch (err) {
    console.error('[Audit] Error fetching activities:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
}

export async function recordActivity(req, res) {
  try {
    const entry = req.body || {};
    const now = new Date();
    const performer = sanitizePerformer(entry.performedBy);

    const payload = sanitizeActivityLog({
      id: entry.id || `act-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: String(entry.actionType || 'GENERIC_ACTIVITY').trim(),
      performedBy: performer,
      targetId: String(entry.targetId || '').trim(),
      targetName: String(entry.targetName || '').trim(),
      details: typeof entry.details === 'object' && entry.details !== null ? entry.details : {},
      reason: String(entry.reason || '').trim(),
      timestamp: entry.timestamp || Date.now(),
      dateStr: entry.dateStr || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: entry.timeStr || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    const created = await ActivityLog.create(payload);
    res.json({ success: true, activity: created });
  } catch (err) {
    console.error('[Audit] Error recording activity:', err);
    res.status(500).json({ success: false, message: 'Failed to record activity' });
  }
}
