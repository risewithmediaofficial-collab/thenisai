import mongoose from 'mongoose';
import fs from 'fs';
import { DeletedBill, Bill, DeletedProduct, Inventory, PurgedProduct, ActivityLog } from '../models/index.js';
import { CATALOG_FILE_PATH } from '../utils/catalogSync.js';
import { sanitizeBill, sanitizeProduct, sanitizeCashier } from '../utils/sanitize.js';

function sanitizePerformer(p) {
  return sanitizeCashier(p);
}

// ─── BILLS RECYCLE BIN ───────────────────────────────────────────────────────

export async function getDeletedBills(req, res) {
  try {
    const now = Date.now();
    await DeletedBill.deleteMany({ expiresAt: { $lt: now } });
    const deletedBills = await DeletedBill.find({}).sort({ deletedAt: -1 });
    res.json({ success: true, deletedBills });
  } catch (err) {
    console.error('[Recycle Bin] Error fetching deleted bills:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch recycle bin' });
  }
}

export async function restoreBill(req, res) {
  try {
    const { id } = req.params;
    const { restoredBy } = req.body || {};

    const billQuery = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) billQuery.push({ _id: id });
    const deletedRecord = await DeletedBill.findOne({ $or: billQuery });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Deleted bill not found in Recycle Bin.' });
    }

    const rawBill = deletedRecord.billData ? (deletedRecord.billData.toObject ? deletedRecord.billData.toObject() : deletedRecord.billData) : {};
    const billData = sanitizeBill(rawBill);

    await Bill.updateOne({ invoiceNumber: billData.invoiceNumber }, { $set: billData }, { upsert: true });
    await DeletedBill.deleteOne({ _id: deletedRecord._id });

    const now = new Date();
    const activeRestoredBy = sanitizePerformer(restoredBy);

    await ActivityLog.create({
      id: `act-rst-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_RESTORED',
      performedBy: activeRestoredBy,
      targetId: billData.invoiceNumber,
      targetName: `Invoice #${billData.invoiceNumber} (₹${billData.grandTotal})`,
      details: {
        invoiceNumber: billData.invoiceNumber,
        grandTotal: billData.grandTotal,
      },
      reason: 'Restored from Recycle Bin by Administrator',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });

    console.log(`[Recycle Bin] Restored bill ${billData.invoiceNumber} to active bills.`);
    res.json({ success: true, message: `Invoice #${billData.invoiceNumber} successfully restored!`, bill: billData });
  } catch (err) {
    console.error('[Recycle Bin] Error restoring bill:', err);
    res.status(500).json({ success: false, message: 'Failed to restore bill: ' + err.message });
  }
}

export async function bulkRestoreBills(req, res) {
  try {
    const { ids, restoredBy } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No bill IDs provided.' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const stringIds = ids.map(String);

    const orConditions = [
      { id: { $in: stringIds } },
      { invoiceNumber: { $in: stringIds } },
    ];
    if (objectIds.length > 0) {
      orConditions.push({ _id: { $in: objectIds } });
    }

    const records = await DeletedBill.find({ $or: orConditions });
    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching records in Recycle Bin.' });
    }

    for (const r of records) {
      const raw = r.billData ? (r.billData.toObject ? r.billData.toObject() : r.billData) : null;
      if (raw) {
        const b = sanitizeBill(raw);
        await Bill.updateOne({ invoiceNumber: b.invoiceNumber }, { $set: b }, { upsert: true });
      }
    }

    const recordDbIds = records.map((r) => r._id);
    await DeletedBill.deleteMany({ _id: { $in: recordDbIds } });

    const activeRestoredBy = sanitizePerformer(restoredBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-rstbulk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_RESTORED',
      performedBy: activeRestoredBy,
      targetId: `${records.length} bills`,
      targetName: `${records.length} Invoices Restored`,
      details: { count: records.length },
      reason: 'Restored from Recycle Bin by Administrator (Bulk)',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Bulk restored ${records.length} bills.`);
    res.json({ success: true, message: `${records.length} bills successfully restored!`, count: records.length });
  } catch (err) {
    console.error('[Recycle Bin] Error bulk restoring bills:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk restore bills: ' + err.message });
  }
}

export async function permanentDeleteBill(req, res) {
  try {
    const { id } = req.params;
    const { purgedBy } = req.body || {};

    const billQuery = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) billQuery.push({ _id: id });
    const deletedRecord = await DeletedBill.findOneAndDelete({ $or: billQuery });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found in Recycle Bin.' });
    }

    const activePurgedBy = sanitizePerformer(purgedBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-prg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_PERMANENTLY_PURGED',
      performedBy: activePurgedBy,
      targetId: deletedRecord.invoiceNumber,
      targetName: `Invoice #${deletedRecord.invoiceNumber}`,
      details: { invoiceNumber: deletedRecord.invoiceNumber },
      reason: 'Permanently deleted by Administrator',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Permanently deleted invoice #${deletedRecord.invoiceNumber}`);
    res.json({ success: true, message: `Invoice #${deletedRecord.invoiceNumber} permanently removed.` });
  } catch (err) {
    console.error('[Recycle Bin] Error permanently deleting bill:', err);
    res.status(500).json({ success: false, message: 'Failed to permanently delete bill' });
  }
}

export async function bulkPermanentDeleteBills(req, res) {
  try {
    const { ids, purgedBy } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No bill IDs provided.' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const stringIds = ids.map(String);

    const orConditions = [
      { id: { $in: stringIds } },
      { invoiceNumber: { $in: stringIds } },
    ];
    if (objectIds.length > 0) {
      orConditions.push({ _id: { $in: objectIds } });
    }

    const deleteResult = await DeletedBill.deleteMany({ $or: orConditions });
    const activePurgedBy = sanitizePerformer(purgedBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-prgbulk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_PERMANENTLY_PURGED',
      performedBy: activePurgedBy,
      targetId: `${ids.length} bills`,
      targetName: `${ids.length} Invoices Purged`,
      details: { count: ids.length, deletedCount: deleteResult.deletedCount },
      reason: 'Permanently deleted by Administrator (Bulk)',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Bulk permanently deleted ${deleteResult.deletedCount} invoices.`);
    res.json({ success: true, message: `${deleteResult.deletedCount} invoices permanently purged.`, count: deleteResult.deletedCount });
  } catch (err) {
    console.error('[Recycle Bin] Error bulk permanently deleting bills:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk purge bills: ' + err.message });
  }
}

// ─── PRODUCTS RECYCLE BIN ───────────────────────────────────────────────────

export async function getDeletedProducts(req, res) {
  try {
    const now = Date.now();
    await DeletedProduct.deleteMany({ expiresAt: { $lt: now } });
    const deletedProducts = await DeletedProduct.find({}).sort({ deletedAt: -1 });
    res.json({ success: true, deletedProducts });
  } catch (err) {
    console.error('[Recycle Bin] Error fetching deleted products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deleted products: ' + err.message });
  }
}

export async function bulkRestoreProducts(req, res) {
  try {
    const { ids, restoredBy } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No product IDs provided.' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const stringIds = ids.map(String);

    const orConditions = [{ id: { $in: stringIds } }];
    if (objectIds.length > 0) {
      orConditions.push({ _id: { $in: objectIds } });
    }

    const records = await DeletedProduct.find({ $or: orConditions });
    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching records in Recycle Bin.' });
    }

    for (const record of records) {
      const raw = record.productData ? (record.productData.toObject ? record.productData.toObject() : record.productData) : { id: record.id, name: record.name };
      const prodData = sanitizeProduct(raw);
      await Inventory.updateOne({ id: record.id }, { $set: prodData }, { upsert: true });
    }

    const recordDbIds = records.map((r) => r._id);
    await DeletedProduct.deleteMany({ _id: { $in: recordDbIds } });
    await PurgedProduct.deleteMany({ $or: orConditions });

    const activeRestoredBy = sanitizePerformer(restoredBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-rstprodbulk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'PRODUCT_RESTORED',
      performedBy: activeRestoredBy,
      targetId: `${records.length} products`,
      targetName: `${records.length} Products Restored`,
      details: { count: records.length },
      reason: 'Restored from Recycle Bin by Administrator (Bulk)',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Bulk restored ${records.length} products.`);
    res.json({ success: true, message: `${records.length} products successfully restored!`, count: records.length });
  } catch (err) {
    console.error('[Recycle Bin] Error bulk restoring products:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk restore products: ' + err.message });
  }
}

export async function bulkPermanentDeleteProducts(req, res) {
  try {
    const { ids, purgedBy } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No product IDs provided.' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const stringIds = ids.map(String);

    const orConditions = [{ id: { $in: stringIds } }];
    if (objectIds.length > 0) {
      orConditions.push({ _id: { $in: objectIds } });
    }

    const deleteResult = await DeletedProduct.deleteMany({ $or: orConditions });
    await Inventory.deleteMany({ $or: orConditions });

    try {
      if (fs.existsSync(CATALOG_FILE_PATH)) {
        const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const idSet = new Set([...stringIds, ...objectIds.map(String)]);
          const filtered = list.filter((p) => !idSet.has(String(p.id)) && !idSet.has(String(p._id)));
          fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
        }
      }
    } catch {}

    for (const pid of stringIds) {
      await PurgedProduct.updateOne({ id: pid }, { $set: { id: pid, purgedAt: Date.now() } }, { upsert: true });
    }

    const activePurgedBy = sanitizePerformer(purgedBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-prgprodbulk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'PRODUCT_PERMANENTLY_PURGED',
      performedBy: activePurgedBy,
      targetId: `${ids.length} products`,
      targetName: `${ids.length} Products Purged`,
      details: { count: ids.length, deletedCount: deleteResult.deletedCount },
      reason: 'Permanently deleted by Administrator (Bulk)',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Bulk permanently deleted ${deleteResult.deletedCount} products.`);
    res.json({ success: true, message: `${deleteResult.deletedCount} products permanently purged.`, count: deleteResult.deletedCount });
  } catch (err) {
    console.error('[Recycle Bin] Error bulk permanently deleting products:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk purge products: ' + err.message });
  }
}

export async function restoreProduct(req, res) {
  try {
    const { id } = req.params;
    const { restoredBy } = req.body || {};

    const prodQuery = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) prodQuery.push({ _id: id });
    const deletedRecord = await DeletedProduct.findOne({ $or: prodQuery });
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found in Recycle Bin.' });
    }

    const raw = deletedRecord.productData ? (deletedRecord.productData.toObject ? deletedRecord.productData.toObject() : deletedRecord.productData) : { id: deletedRecord.id, name: deletedRecord.name };
    const prodData = sanitizeProduct(raw);

    await Inventory.updateOne({ id: deletedRecord.id }, { $set: prodData }, { upsert: true });

    try {
      if (fs.existsSync(CATALOG_FILE_PATH)) {
        const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          if (!list.some((p) => p.id === deletedRecord.id)) {
            list.push(prodData);
            fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
          }
        }
      }
    } catch {}

    await DeletedProduct.deleteOne({ _id: deletedRecord._id });
    await PurgedProduct.deleteOne({ id: deletedRecord.id });

    const activeRestoredBy = sanitizePerformer(restoredBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-rstprod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'PRODUCT_RESTORED',
      performedBy: activeRestoredBy,
      targetId: deletedRecord.id,
      targetName: deletedRecord.name,
      details: { productId: deletedRecord.id, name: deletedRecord.name },
      reason: 'Restored from Recycle Bin by Administrator',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Restored product ${deletedRecord.id} (${deletedRecord.name})`);
    res.json({ success: true, message: `Product ${deletedRecord.name} restored successfully.`, product: prodData });
  } catch (err) {
    console.error('[Recycle Bin] Error restoring product:', err);
    res.status(500).json({ success: false, message: 'Failed to restore product: ' + err.message });
  }
}

export async function permanentDeleteProduct(req, res) {
  try {
    const { id } = req.params;
    let purgedBy = req.body?.purgedBy;
    if (!purgedBy && req.query?.purgedBy) {
      try { purgedBy = JSON.parse(req.query.purgedBy); } catch {}
    }

    const prodQuery = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) prodQuery.push({ _id: id });
    const deletedRecord = await DeletedProduct.findOneAndDelete({ $or: prodQuery });
    const prodName = deletedRecord?.name || id;

    await Inventory.deleteMany({ $or: prodQuery });

    try {
      if (fs.existsSync(CATALOG_FILE_PATH)) {
        const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((p) => p.id !== id && String(p._id) !== String(id));
          fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
        }
      }
    } catch {}

    await PurgedProduct.updateOne({ id }, { $set: { id, purgedAt: Date.now() } }, { upsert: true });

    const activePurgedBy = sanitizePerformer(purgedBy);
    const now = new Date();

    await ActivityLog.create({
      id: `act-prgprod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'PRODUCT_PERMANENTLY_PURGED',
      performedBy: activePurgedBy,
      targetId: id,
      targetName: prodName,
      details: { productId: id },
      reason: 'Permanently deleted by Administrator',
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Recycle Bin] Permanently purged product ${id}`);
    res.json({ success: true, message: `Product ${prodName} permanently purged.` });
  } catch (err) {
    console.error('[Recycle Bin] Error purging product:', err);
    res.status(500).json({ success: false, message: 'Failed to purge product: ' + err.message });
  }
}
