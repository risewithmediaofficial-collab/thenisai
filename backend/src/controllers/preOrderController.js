import mongoose from 'mongoose';
import { PreOrder, Customer, Bill } from '../models/index.js';
import { getNextServerInvoiceNumber } from '../utils/invoiceNumber.js';

function sanitizePreOrderItem(it) {
  if (!it) return null;
  return {
    id: String(it.id || '').trim(),
    name: String(it.name || '').trim(),
    englishName: it.englishName ? String(it.englishName).trim() : undefined,
    tamilName: it.tamilName ? String(it.tamilName).trim() : undefined,
    price: Number(it.price || it.unitPrice || 0),
    quantity: Math.max(1, Number(it.quantity || 1)),
    weight: String(it.weight || it.unit || '1 Pc').trim(),
    unit: String(it.unit || 'kg').trim(),
    itemTotal: Number(it.itemTotal || (Number(it.price || 0) * Number(it.quantity || 1))),
  };
}

export async function createPreOrder(req, res) {
  try {
    const orderData = req.body || {};
    let invoiceNumber = orderData.invoiceNumber;

    const isAutoOrMissing = !invoiceNumber ||
      invoiceNumber.startsWith('preorder-') ||
      (!invoiceNumber.includes('PRE - ORD') && !invoiceNumber.match(/^[A-Z]{2}\d{3}$/));

    if (isAutoOrMissing) {
      invoiceNumber = await getNextServerInvoiceNumber(true);
    } else {
      const exists = (await PreOrder.findOne({ invoiceNumber })) || (await Bill.findOne({ invoiceNumber }));
      if (exists) {
        invoiceNumber = await getNextServerInvoiceNumber(true);
      }
    }

    const cleanPhone = String(orderData.customerPhone || '').replace(/\D/g, '').slice(-10);
    const customerName = String(orderData.customerName || 'Valued Customer').trim();
    const cleanItems = Array.isArray(orderData.items) ? orderData.items.map(sanitizePreOrderItem).filter(Boolean) : [];

    let customerUser = null;
    if (cleanPhone.length === 10) {
      const token = `cust_${cleanPhone}_${Date.now()}`;
      customerUser = await Customer.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $set: {
            name: customerName,
            password: cleanPhone,
            lastLogin: Date.now(),
            token,
          },
          $setOnInsert: {
            phone: cleanPhone,
            wishlist: [],
            createdAt: Date.now(),
          },
        },
        { upsert: true, new: true }
      );
    }

    const preOrder = await PreOrder.create({
      id: orderData.id || `preorder-${Date.now()}`,
      invoiceNumber,
      customerName,
      customerPhone: cleanPhone,
      items: cleanItems,
      grandTotal: Number(orderData.grandTotal || 0),
      note: String(orderData.note || '').trim(),
      totalItems: Number(orderData.totalItems || cleanItems.length),
      status: 'pending',
      createdAt: Date.now(),
    });

    console.log(`[Pre-Order] Created: ${invoiceNumber} for ${customerName} (${cleanPhone}) Total: ₹${preOrder.grandTotal}`);
    res.json({
      success: true,
      preOrder,
      invoiceNumber,
      customer: customerUser ? {
        phone: customerUser.phone,
        name: customerUser.name,
      } : null,
    });
  } catch (err) {
    console.error('[Pre-Order] Error creating pre-order:', err);
    res.status(500).json({ success: false, message: 'Failed to create pre-order: ' + err.message });
  }
}

export async function getPreOrders(req, res) {
  try {
    const { phone, status } = req.query;
    const filter = {};
    if (phone) {
      filter.customerPhone = String(phone).replace(/\D/g, '').slice(-10);
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    const preOrders = await PreOrder.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, preOrders });
  } catch (err) {
    console.error('[Pre-Order] Error fetching preorders:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCustomerPreOrders(req, res) {
  try {
    const cleanPhone = String(req.params.phone).replace(/\D/g, '').slice(-10);
    const preOrders = await PreOrder.find({ customerPhone: cleanPhone }).sort({ createdAt: -1 });
    res.json({ success: true, preOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updatePreOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'billed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid pre-order status.' });
    }

    const update = { status };
    if (status === 'accepted') update.acceptedAt = Date.now();
    if (status === 'billed') update.billedAt = Date.now();

    const queryOr = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      queryOr.push({ _id: id });
    }

    const order = await PreOrder.findOneAndUpdate(
      { $or: queryOr },
      { $set: update },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Pre-order not found' });
    console.log(`[Pre-Order] Status updated: ${order.invoiceNumber} -> ${status}`);
    res.json({ success: true, preOrder: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deletePreOrder(req, res) {
  try {
    const { id } = req.params;
    const queryOr = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      queryOr.push({ _id: id });
    }
    await PreOrder.findOneAndDelete({ $or: queryOr });
    res.json({ success: true, message: 'Pre-order removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
