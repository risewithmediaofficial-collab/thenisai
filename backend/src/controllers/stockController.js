import { Inventory, StockTransferLog } from '../models/index.js';
import { sanitizeStockTransferLog } from '../utils/sanitize.js';

export async function getStockLogs(req, res) {
  try {
    const logs = await StockTransferLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    console.error('[Stock] Error fetching logs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stock logs' });
  }
}

export async function stockInward(req, res) {
  try {
    const { productId, quantity, unit, note = '', managerName = 'Company Manager' } = req.body;
    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId and positive quantity required' });
    }

    const item = await Inventory.findOne({ id: productId });
    const productName = item?.name || productId;

    const update = { $inc: { counterStock: qty, stockKg: qty } };
    const updatedItem = await Inventory.findOneAndUpdate({ id: productId }, update, { new: true, upsert: true });

    const logPayload = sanitizeStockTransferLog({
      id: `stock-log-${Date.now()}`,
      productId,
      productName,
      type: 'GODOWN_INWARD',
      quantity: qty,
      unit: unit || updatedItem.unit || 'kg',
      godownRemaining: 0,
      counterRemaining: updatedItem.counterStock || updatedItem.stockKg || 0,
      performedBy: managerName,
      note: note || `Received from Company Godown`,
      date: new Date().toLocaleDateString('en-IN'),
      createdAt: Date.now(),
    });
    const log = await StockTransferLog.create(logPayload);

    res.json({ success: true, item: updatedItem, log });
  } catch (err) {
    console.error('[Stock] Inward error:', err);
    res.status(500).json({ success: false, message: 'Stock inward failed: ' + err.message });
  }
}

export async function stockDispatch(req, res) {
  try {
    const { productId, quantity, note = '', managerName = 'Company Manager' } = req.body;
    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId and positive quantity required' });
    }

    const item = await Inventory.findOne({ id: productId });
    const productName = item?.name || productId;

    const updatedItem = await Inventory.findOneAndUpdate(
      { id: productId },
      {
        $inc: {
          godownStock: -qty,
          counterStock: qty,
          stockKg: qty,
        },
      },
      { new: true }
    );

    const logPayload = sanitizeStockTransferLog({
      id: `stock-log-${Date.now()}`,
      productId,
      productName,
      type: 'DISPATCH_TO_COUNTER',
      quantity: qty,
      unit: updatedItem?.unit || 'kg',
      godownRemaining: updatedItem?.godownStock || 0,
      counterRemaining: updatedItem?.counterStock || updatedItem?.stockKg || 0,
      performedBy: managerName,
      note: note || 'Dispatched from Godown to Counter',
      date: new Date().toLocaleDateString('en-IN'),
      createdAt: Date.now(),
    });
    const log = await StockTransferLog.create(logPayload);

    res.json({ success: true, item: updatedItem, log });
  } catch (err) {
    console.error('[Stock] Dispatch error:', err);
    res.status(500).json({ success: false, message: 'Stock dispatch failed: ' + err.message });
  }
}

export async function stockReturn(req, res) {
  try {
    const { productId, quantity, reason = 'return', note = '', performedBy = 'Counter Staff' } = req.body;
    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId and positive quantity required' });
    }

    const item = await Inventory.findOne({ id: productId });
    const productName = item?.name || productId;

    const isWastage = reason === 'wastage' || reason === 'spoilage';
    const update = { $inc: { counterStock: -qty, stockKg: -qty } };

    const updatedItem = await Inventory.findOneAndUpdate({ id: productId }, update, { new: true });

    const logPayload = sanitizeStockTransferLog({
      id: `stock-log-${Date.now()}`,
      productId,
      productName,
      type: isWastage ? 'WASTAGE' : 'COUNTER_RETURN',
      quantity: qty,
      unit: updatedItem?.unit || 'kg',
      godownRemaining: 0,
      counterRemaining: updatedItem?.counterStock || updatedItem?.stockKg || 0,
      performedBy,
      note: note || (isWastage ? 'Shop Spoilage / Wastage Write-Off' : 'Returned from Shop to Company Godown'),
      date: new Date().toLocaleDateString('en-IN'),
      createdAt: Date.now(),
    });
    const log = await StockTransferLog.create(logPayload);

    res.json({ success: true, item: updatedItem, log });
  } catch (err) {
    console.error('[Stock] Return error:', err);
    res.status(500).json({ success: false, message: 'Stock return failed: ' + err.message });
  }
}
