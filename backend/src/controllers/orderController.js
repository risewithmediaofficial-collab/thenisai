import { Order, Otp, Inventory } from '../models/index.js';

function sanitizeOrderItem(it) {
  if (!it) return null;
  return {
    id: String(it.id || '').trim(),
    name: String(it.name || '').trim(),
    englishName: it.englishName ? String(it.englishName).trim() : undefined,
    tamilName: it.tamilName ? String(it.tamilName).trim() : undefined,
    price: Number(it.price || 0),
    quantity: Math.max(1, Number(it.quantity || 1)),
    weight: String(it.weight || it.unit || '500g').trim(),
    unit: String(it.unit || 'kg').trim(),
    itemTotal: Number(it.itemTotal || (Number(it.price || 0) * Number(it.quantity || 1))),
  };
}

function sanitizeShippingAddress(addr) {
  if (!addr) return { street: '', city: '', pincode: '', state: '', landmark: '' };
  return {
    street: String(addr.street || addr.address || '').trim(),
    city: String(addr.city || '').trim(),
    pincode: String(addr.pincode || addr.postalCode || '').trim(),
    state: String(addr.state || 'Tamil Nadu').trim(),
    landmark: String(addr.landmark || '').trim(),
  };
}

export async function getOrders(req, res) {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('[Order] Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
}

export async function createOrder(req, res) {
  try {
    const { customer, shippingAddress, items, subtotal, deliveryFee, grandTotal, paymentMethod, upiUtr, giftNote } = req.body;

    const cleanPhone = customer?.phone ? String(customer.phone).replace(/\D/g, '').slice(-10) : '';
    const otpRecord = await Otp.findOne({ phone: cleanPhone });

    if (!customer?.verifiedViaOtp && (!otpRecord || !otpRecord.verified)) {
      return res.status(400).json({ success: false, message: 'Mobile number must be verified with OTP before placing an order.' });
    }

    const now = new Date();
    const invoiceNumber = `THN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanItems = Array.isArray(items) ? items.map(sanitizeOrderItem).filter(Boolean) : [];
    const cleanCustomer = {
      fullName: String(customer?.fullName || customer?.name || 'Customer').trim(),
      phone: cleanPhone,
      email: String(customer?.email || '').trim(),
      verifiedViaOtp: true,
    };
    const cleanAddress = sanitizeShippingAddress(shippingAddress);

    const newOrder = await Order.create({
      id: `ord-${Date.now()}`,
      invoiceNumber,
      orderDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      customer: cleanCustomer,
      shippingAddress: cleanAddress,
      items: cleanItems,
      subtotal: Number(subtotal || 0),
      deliveryFee: Number(deliveryFee || 0),
      grandTotal: Number(grandTotal || 0),
      paymentMethod: String(paymentMethod || 'cod').toLowerCase(),
      upiUtr: String(upiUtr || '').trim(),
      giftNote: String(giftNote || '').trim(),
      source: 'online',
      status: 'New',
      createdAt: Date.now(),
    });

    // Deduct inventory
    for (const item of cleanItems) {
      const inv = await Inventory.findOne({ id: item.id });
      if (inv && !inv.isUnlimitedStock) {
        const w = String(item.weight).toLowerCase();
        let weightKg = 0.5;
        if (w.includes('250g')) weightKg = 0.25;
        else if (w.includes('500g')) weightKg = 0.5;
        else if (w.includes('1kg')) weightKg = 1.0;
        else if (w.includes('kg')) weightKg = parseFloat(w) || 0.5;
        inv.stockKg = Math.max(0, Math.round((inv.stockKg - weightKg * item.quantity) * 10) / 10);
        await inv.save();
      }
    }

    console.log(`[Order] ${invoiceNumber} placed by ${cleanCustomer.fullName} (+91 ${cleanPhone})`);
    res.json({ success: true, message: 'Online order confirmed!', order: newOrder });
  } catch (err) {
    console.error('[Order] Error creating order:', err);
    res.status(500).json({ success: false, message: 'Failed to create order: ' + err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['New', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const cleanStatus = allowed.includes(status) ? status : 'Confirmed';

    const order = await Order.findOneAndUpdate({ id: req.params.id }, { status: cleanStatus }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    console.log(`[Order] ${order.invoiceNumber} → ${cleanStatus}`);
    res.json({ success: true, message: `Status updated to ${cleanStatus}`, order });
  } catch (err) {
    console.error('[Order] Error updating status:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
}
