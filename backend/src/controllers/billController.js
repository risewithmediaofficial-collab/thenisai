import mongoose from 'mongoose';
import { Bill, Inventory, Order, PreOrder, DeletedBill, ActivityLog } from '../models/index.js';
import { computeStockDeduction } from '../utils/stockDeduction.js';
import { getNextServerInvoiceNumber } from '../utils/invoiceNumber.js';
import {
  sanitizeBill,
  sanitizeBillItem,
  sanitizeBillCustomer as sanitizeCustomer,
  sanitizeCashier,
  sanitizeBillEditEvent,
} from '../utils/sanitize.js';

// ─── Controller Handlers ────────────────────────────────────────────────────

export async function validateStock(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ ok: true, errors: [] });
    }

    const errors = [];
    for (const item of items) {
      if (!item.id) continue;
      const inv = await Inventory.findOne({ id: item.id });
      if (!inv || inv.isUnlimitedStock) continue;

      const billingUnit = item.weight || item.unit || '';
      const qty = parseFloat(item.quantity) || 1;
      const { deductKg } = computeStockDeduction(billingUnit, qty, inv);

      const available = Math.max(0, inv.stockKg ?? 0);
      if (deductKg > available) {
        errors.push({
          id: item.id,
          name: item.name || inv.name || item.id,
          requested: deductKg,
          available,
          unit: billingUnit || inv.unit || 'kg',
          message: `Only ${available.toFixed(2)} ${inv.unit || 'kg'} available for "${inv.name || item.name}", but ${deductKg.toFixed(2)} ${inv.unit || 'kg'} requested.`,
        });
      }
    }

    return res.json({ ok: errors.length === 0, errors });
  } catch (err) {
    console.error('[Stock Validate] Error:', err);
    return res.status(500).json({ ok: true, errors: [], warning: 'Stock validation failed — proceeding without check.' });
  }
}

export async function getNextInvoiceNumber(req, res) {
  try {
    const isPreOrder = req.query.isPreOrder === 'true' || req.query.preorder === 'true';
    const nextInvoice = await getNextServerInvoiceNumber(isPreOrder);
    res.json({ success: true, nextInvoiceNumber: nextInvoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function resetSequence(req, res) {
  try {
    const { archiveToRecycleBin = true, resetBy } = req.body || {};
    const adminUser = resetBy || { name: 'Admin', role: 'admin' };

    const activeBills = await Bill.find({});
    let archivedCount = 0;

    if (archiveToRecycleBin && activeBills.length > 0) {
      const docsToArchive = activeBills.map((b) => {
        const raw = b.toObject ? b.toObject() : b;
        const cleanBill = sanitizeBill(raw);
        return {
          id: `del-${cleanBill.invoiceNumber}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          invoiceNumber: cleanBill.invoiceNumber,
          billData: cleanBill,
          deletedBy: sanitizeCashier(adminUser),
          deletionReason: 'Admin Reset Bill Sequence to AA001',
          deletedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
      });
      await DeletedBill.insertMany(docsToArchive);
      archivedCount = docsToArchive.length;
    }

    const deleteResult = await Bill.deleteMany({});

    try {
      await Order.deleteMany({});
    } catch {}

    try {
      await ActivityLog.create({
        id: `activity-${Date.now()}`,
        actionType: 'BILL_RESET',
        performedBy: {
          id: adminUser.id || 'staff-1',
          name: adminUser.name || 'Admin',
          username: adminUser.username || 'admin',
          role: adminUser.role || 'admin',
        },
        targetId: 'ALL_BILLS',
        targetName: 'Reset Bill Sequence to AA001',
        details: { clearedCount: deleteResult.deletedCount, archivedCount },
        reason: 'Admin reset bill sequence starting from AA001',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e) {
      console.warn('[ActivityLog] Could not log bill reset:', e.message);
    }

    console.log(`[Admin] Bill sequence reset to AA001 by ${adminUser.name}. Cleared ${deleteResult.deletedCount} bills.`);

    res.json({
      success: true,
      message: 'Bill sequence successfully reset. Next invoice starts from AA001.',
      nextInvoiceNumber: 'AA001',
      clearedCount: deleteResult.deletedCount,
      archivedCount,
    });
  } catch (err) {
    console.error('[Admin] Error resetting bill sequence:', err);
    res.status(500).json({ success: false, message: 'Failed to reset bill sequence: ' + err.message });
  }
}

export async function createBill(req, res) {
  try {
    const now = new Date();
    const billData = req.body || {};
    let invoiceNumber = billData.invoiceNumber;
    const existingBillWithNumber = invoiceNumber
      ? (await Bill.findOne({ invoiceNumber }) || await PreOrder.findOne({ invoiceNumber }))
      : null;

    if (!invoiceNumber || existingBillWithNumber) {
      invoiceNumber = await getNextServerInvoiceNumber(false);
    }

    const oversellErrors = [];
    const rawItems = Array.isArray(billData.items) ? billData.items : [];
    for (const item of rawItems) {
      if (!item.id) continue;
      const inv = await Inventory.findOne({ id: item.id });
      if (!inv || inv.isUnlimitedStock) continue;

      const billingUnit = item.weight || item.unit || '';
      const qty = parseFloat(item.quantity) || 1;
      const { deductKg } = computeStockDeduction(billingUnit, qty, inv);
      const available = Math.max(0, inv.stockKg ?? 0);

      if (deductKg > available) {
        oversellErrors.push({
          id: item.id,
          name: item.name || inv.name || item.id,
          requested: deductKg,
          available,
          unit: billingUnit || inv.unit || 'kg',
          message: `Insufficient stock for "${inv.name || item.name}": only ${available.toFixed(2)} ${inv.unit || 'kg'} available, but ${deductKg.toFixed(2)} ${inv.unit || 'kg'} required.`,
        });
      }
    }

    if (oversellErrors.length > 0) {
      return res.status(409).json({
        success: false,
        code: 'INSUFFICIENT_STOCK',
        message: 'Some items have insufficient stock. Please adjust quantities before billing.',
        errors: oversellErrors,
      });
    }

    // Filter only required variables for DB persistence
    const cleanItems = rawItems.map(sanitizeBillItem).filter(Boolean);
    const cleanCustomer = sanitizeCustomer(billData.customer);
    const cleanCashier = sanitizeCashier(billData.cashier);

    const finalBill = await Bill.create({
      id: billData.id || `bill-${Date.now()}`,
      invoiceNumber,
      orderDate: billData.orderDate || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderTime: billData.orderTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: cleanItems,
      customer: cleanCustomer,
      subtotal: Number(billData.subtotal || 0),
      discount: Number(billData.discount || 0),
      roundOff: Number(billData.roundOff || 0),
      grandTotal: Number(billData.grandTotal || 0),
      paymentMethod: String(billData.paymentMethod || 'cash').toLowerCase(),
      splitCash: Number(billData.splitCash || 0),
      splitUpi: Number(billData.splitUpi || 0),
      upiUtr: String(billData.upiUtr || '').trim(),
      cashier: cleanCashier,
      source: 'counter',
      status: 'Completed',
      isEdited: false,
      editHistory: [],
      isOfflineBackup: Boolean(billData.isOfflineBackup),
      createdAt: Date.now(),
    });

    // Deduct stock
    for (const item of cleanItems) {
      if (!item.id) continue;
      const inv = await Inventory.findOne({ id: item.id });
      if (!inv || inv.isUnlimitedStock) continue;

      const billingUnit = item.weight || item.unit || '';
      const qty = parseFloat(item.quantity) || 1;
      const { deductKg } = computeStockDeduction(billingUnit, qty, inv);

      inv.stockKg = Math.max(0, Math.round((inv.stockKg - deductKg) * 1000) / 1000);
      if (typeof inv.counterStock === 'number') {
        inv.counterStock = Math.max(0, Math.round((inv.counterStock - deductKg) * 1000) / 1000);
      }
      await inv.save();
    }

    console.log(`[POS Billing] Bill: ${invoiceNumber} Total: ₹${finalBill.grandTotal} by ${finalBill.cashier?.name}`);
    res.json({ success: true, bill: finalBill });
  } catch (err) {
    console.error('[POS Billing] Error creating bill:', err);
    res.status(500).json({ success: false, message: 'Failed to create bill: ' + err.message });
  }
}

export async function getBills(req, res) {
  try {
    const { cashierId, limit = 500 } = req.query;
    const filter = {};

    if (cashierId && cashierId !== 'all') {
      filter.$or = [
        { 'cashier.id': cashierId },
        { 'cashier.username': cashierId },
      ];
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, bills });
  } catch (err) {
    console.error('[POS Billing] Error fetching bills:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bills' });
  }
}

export async function updateBill(req, res) {
  try {
    const { id } = req.params;
    const {
      items,
      customer,
      paymentMethod,
      splitCash,
      splitUpi,
      subtotal,
      discount,
      roundOff,
      grandTotal,
      editReason,
      editedBy,
    } = req.body;

    const bill = await Bill.findOne({
      $or: [{ id }, { invoiceNumber: id }],
    });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found in database.' });
    }

    const previousItems = Array.isArray(bill.items) ? bill.items : [];
    const originalGrandTotal = Number(bill.grandTotal || 0);
    const updatedGrandTotal = grandTotal !== undefined ? Number(grandTotal) : originalGrandTotal;

    const getItemWeightKg = (item) => {
      const w = String(item.weight || item.unit || '').toLowerCase();
      if (w.includes('250g')) return 0.25;
      if (w.includes('500g')) return 0.5;
      if (w.includes('1kg')) return 1.0;
      if (w.includes('kg')) return parseFloat(w) || 0.5;
      if (w.includes('litre')) return 1.0;
      return 0.1;
    };

    if (items && Array.isArray(items)) {
      for (const prevItem of previousItems) {
        if (!prevItem.id) continue;
        const inv = await Inventory.findOne({ id: prevItem.id });
        if (inv) {
          const wt = getItemWeightKg(prevItem);
          const restoreAmt = wt * (Number(prevItem.quantity) || 1);
          inv.stockKg = Math.round((inv.stockKg + restoreAmt) * 10) / 10;
          await inv.save();
        }
      }
      for (const newItem of items) {
        if (!newItem.id) continue;
        const inv = await Inventory.findOne({ id: newItem.id });
        if (inv) {
          const wt = getItemWeightKg(newItem);
          const deductAmt = wt * (Number(newItem.quantity) || 1);
          inv.stockKg = Math.max(0, Math.round((inv.stockKg - deductAmt) * 10) / 10);
          await inv.save();
        }
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const activeEditor = sanitizeCashier(editedBy);

    const editEvent = {
      id: `edit-${Date.now()}`,
      editedAt: Date.now(),
      dateStr,
      timeStr,
      editedBy: activeEditor,
      reason: String(editReason || 'Billing Correction').trim(),
      originalGrandTotal,
      newGrandTotal: updatedGrandTotal,
      difference: Math.round((updatedGrandTotal - originalGrandTotal) * 100) / 100,
      previousItemCount: previousItems.length,
      newItemCount: (items || []).length,
    };

    bill.editHistory.push(editEvent);
    bill.isEdited = true;

    if (items) bill.items = items.map(sanitizeBillItem).filter(Boolean);
    if (customer) bill.customer = sanitizeCustomer(customer);
    if (paymentMethod) bill.paymentMethod = String(paymentMethod).toLowerCase();
    if (splitCash !== undefined) bill.splitCash = Number(splitCash);
    if (splitUpi !== undefined) bill.splitUpi = Number(splitUpi);
    if (subtotal !== undefined) bill.subtotal = Number(subtotal);
    if (discount !== undefined) bill.discount = Number(discount);
    if (roundOff !== undefined) bill.roundOff = Number(roundOff);
    if (grandTotal !== undefined) bill.grandTotal = updatedGrandTotal;

    await bill.save();

    await ActivityLog.create({
      id: `act-edit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_EDITED',
      performedBy: activeEditor,
      targetId: bill.invoiceNumber,
      targetName: `Invoice ${bill.invoiceNumber}`,
      details: {
        originalGrandTotal,
        newGrandTotal: updatedGrandTotal,
        difference: editEvent.difference,
        itemCount: bill.items.length,
      },
      reason: editReason || 'Billing correction',
      timestamp: Date.now(),
      dateStr,
      timeStr,
    });

    console.log(`[POS Billing] Invoice ${bill.invoiceNumber} edited by ${activeEditor.name}: ₹${originalGrandTotal} → ₹${updatedGrandTotal}`);
    res.json({
      success: true,
      bill,
      message: `Invoice ${bill.invoiceNumber} updated successfully.`,
    });
  } catch (err) {
    console.error('[POS Billing] Error updating bill:', err);
    res.status(500).json({ success: false, message: 'Failed to update bill: ' + err.message });
  }
}

export async function deleteBill(req, res) {
  try {
    const { id } = req.params;
    let reason = req.body?.reason || req.query?.reason || req.headers['x-deletion-reason'];
    if (typeof reason === 'string') reason = reason.trim();
    let deletedBy = req.body?.deletedBy;
    if (!deletedBy && req.query?.deletedBy) {
      try { deletedBy = JSON.parse(req.query.deletedBy); } catch {}
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A mandatory deletion reason is required.' });
    }

    const queryOr = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      queryOr.push({ _id: id });
    }

    let bill = await Bill.findOne({ $or: queryOr });
    if (!bill) {
      bill = await Order.findOne({ $or: queryOr });
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found in active bills.' });
      }
    }

    const billObj = bill.toObject ? bill.toObject() : bill;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const activeDeletedBy = sanitizeCashier(deletedBy);

    const cleanBill = sanitizeBill(billObj);

    const deletedRecord = await DeletedBill.create({
      id: cleanBill.id || cleanBill.invoiceNumber,
      invoiceNumber: cleanBill.invoiceNumber || cleanBill.id,
      billData: cleanBill,
      deletedBy: activeDeletedBy,
      deletionReason: reason.trim(),
      deletedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    await Bill.deleteMany({ $or: queryOr });
    await Order.deleteMany({ $or: queryOr });

    await ActivityLog.create({
      id: `act-del-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'BILL_DELETED',
      performedBy: activeDeletedBy,
      targetId: billObj.invoiceNumber || billObj.id,
      targetName: `Invoice #${billObj.invoiceNumber || billObj.id} (₹${billObj.grandTotal})`,
      details: {
        invoiceNumber: billObj.invoiceNumber || billObj.id,
        grandTotal: billObj.grandTotal,
        itemsCount: billObj.items?.length || 0,
      },
      reason: reason.trim(),
      timestamp: Date.now(),
      dateStr,
      timeStr,
    });

    console.log(`[Recycle Bin] Bill ${billObj.invoiceNumber} moved to recycle bin. Reason: ${reason}`);
    res.json({ success: true, message: `Invoice #${billObj.invoiceNumber} moved to Admin Recycle Bin (30-day retention).`, deletedRecord });
  } catch (err) {
    console.error('[Recycle Bin] Error deleting bill:', err);
    res.status(500).json({ success: false, message: 'Failed to delete bill: ' + err.message });
  }
}

export async function syncBatch(req, res) {
  try {
    const { bills: incomingBills } = req.body;
    if (!Array.isArray(incomingBills) || incomingBills.length === 0) {
      return res.status(400).json({ success: false, message: 'No bills provided for sync.' });
    }

    const synced = [];
    const skipped = [];
    const failed = [];

    for (const rawBill of incomingBills) {
      try {
        const exists = await Bill.findOne({
          $or: [
            { id: rawBill.id },
            { invoiceNumber: rawBill.invoiceNumber },
          ],
        });

        if (exists) {
          skipped.push({ id: rawBill.id, invoiceNumber: rawBill.invoiceNumber, reason: 'already_exists' });
          continue;
        }

        const now = new Date();
        const invoiceNumber = rawBill.invoiceNumber || `SYNC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const cleanItems = Array.isArray(rawBill.items) ? rawBill.items.map(sanitizeBillItem).filter(Boolean) : [];
        const cleanCustomer = sanitizeCustomer(rawBill.customer);
        const cleanCashier = sanitizeCashier(rawBill.cashier);

        const savedBill = await Bill.create({
          id: rawBill.id || `sync-${Date.now()}`,
          invoiceNumber,
          orderDate: rawBill.orderDate || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          orderTime: rawBill.orderTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          items: cleanItems,
          customer: cleanCustomer,
          subtotal: Number(rawBill.subtotal || 0),
          discount: Number(rawBill.discount || 0),
          roundOff: Number(rawBill.roundOff || 0),
          grandTotal: Number(rawBill.grandTotal || 0),
          paymentMethod: String(rawBill.paymentMethod || 'cash').toLowerCase(),
          splitCash: Number(rawBill.splitCash || 0),
          splitUpi: Number(rawBill.splitUpi || 0),
          upiUtr: String(rawBill.upiUtr || '').trim(),
          cashier: cleanCashier,
          source: 'counter',
          status: 'Completed',
          syncedAt: Date.now(),
          isOfflineBackup: true,
          createdAt: rawBill.createdAt || Date.now(),
        });

        synced.push(savedBill.id);

        for (const item of cleanItems) {
          if (!item.id) continue;
          const inv = await Inventory.findOne({ id: item.id });
          if (!inv || inv.isUnlimitedStock) continue;
          const billingUnit = item.weight || item.unit || '';
          const qty = parseFloat(item.quantity) || 1;
          const { deductKg } = computeStockDeduction(billingUnit, qty, inv);
          inv.stockKg = Math.max(0, Math.round((inv.stockKg - deductKg) * 1000) / 1000);
          if (typeof inv.counterStock === 'number') {
            inv.counterStock = Math.max(0, Math.round((inv.counterStock - deductKg) * 1000) / 1000);
          }
          await inv.save();
        }
      } catch (itemErr) {
        console.error(`[Sync-Batch] Failed for bill ${rawBill.id}:`, itemErr.message);
        failed.push({ id: rawBill.id, error: itemErr.message });
      }
    }

    console.log(`[Sync-Batch] Synced: ${synced.length}, Skipped: ${skipped.length}, Failed: ${failed.length}`);
    res.json({
      success: true,
      message: `Sync complete: ${synced.length} saved, ${skipped.length} already existed, ${failed.length} failed.`,
      synced: synced.length,
      skippedCount: skipped.length,
      failed,
    });
  } catch (err) {
    console.error('[Sync-Batch] Fatal error:', err);
    res.status(500).json({ success: false, message: 'Batch sync failed: ' + err.message });
  }
}
