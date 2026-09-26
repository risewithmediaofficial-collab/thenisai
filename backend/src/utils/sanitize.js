/**
 * Strict data whitelisting & sanitization utilities
 * Ensures NO unwanted, arbitrary, or malicious variables reach MongoDB objects.
 */

export function sanitizeCashier(raw = {}) {
  return {
    id: String(raw.id || 'staff-1'),
    name: String(raw.name || 'Staff'),
    username: String(raw.username || 'staff'),
    role: String(raw.role || 'cashier'),
    counter: String(raw.counter || 'Counter Desk'),
  };
}

export function sanitizeBillItem(item = {}) {
  const price = parseFloat(item.price ?? item.unitPrice ?? 0) || 0;
  const quantity = parseFloat(item.quantity ?? 1) || 1;
  const itemTotal = parseFloat(item.itemTotal ?? (price * quantity)) || (price * quantity);

  return {
    id: String(item.id || ''),
    name: String(item.name || 'Sweet Item'),
    englishName: item.englishName ? String(item.englishName) : '',
    tamilName: item.tamilName ? String(item.tamilName) : '',
    price,
    unitPrice: parseFloat(item.unitPrice ?? price) || price,
    quantity,
    weight: String(item.weight || ''),
    unit: String(item.unit || 'kg'),
    skuCode: item.skuCode ? String(item.skuCode) : '',
    hsn: item.hsn ? String(item.hsn) : '',
    itemTotal,
  };
}

export function sanitizeBillCustomer(c = {}) {
  return {
    name: String(c.name || '').trim(),
    phone: String(c.phone || '').trim(),
    email: String(c.email || '').trim(),
  };
}

export function sanitizeBillEditEvent(e = {}) {
  return {
    id: String(e.id || `edit-${Date.now()}`),
    editedAt: Number(e.editedAt || Date.now()),
    dateStr: String(e.dateStr || ''),
    timeStr: String(e.timeStr || ''),
    editedBy: sanitizeCashier(e.editedBy),
    reason: String(e.reason || 'Bill updated'),
    originalGrandTotal: Number(e.originalGrandTotal || 0),
    newGrandTotal: Number(e.newGrandTotal || 0),
    difference: Number(e.difference || 0),
    previousItemCount: Number(e.previousItemCount || 0),
    newItemCount: Number(e.newItemCount || 0),
  };
}

export function sanitizeBill(raw = {}) {
  return {
    id: String(raw.id || `bill-${Date.now()}`),
    invoiceNumber: String(raw.invoiceNumber || ''),
    orderDate: String(raw.orderDate || new Date().toISOString().split('T')[0]),
    orderTime: String(raw.orderTime || new Date().toTimeString().split(' ')[0]),
    items: Array.isArray(raw.items) ? raw.items.map(sanitizeBillItem) : [],
    customer: sanitizeBillCustomer(raw.customer),
    subtotal: parseFloat(raw.subtotal || 0) || 0,
    discount: parseFloat(raw.discount || 0) || 0,
    roundOff: parseFloat(raw.roundOff || 0) || 0,
    grandTotal: parseFloat(raw.grandTotal || 0) || 0,
    paymentMethod: String(raw.paymentMethod || 'cash'),
    splitCash: parseFloat(raw.splitCash || 0) || 0,
    splitUpi: parseFloat(raw.splitUpi || 0) || 0,
    upiUtr: String(raw.upiUtr || ''),
    cashier: sanitizeCashier(raw.cashier),
    source: String(raw.source || 'counter'),
    status: String(raw.status || 'Completed'),
    isEdited: Boolean(raw.isEdited),
    editHistory: Array.isArray(raw.editHistory) ? raw.editHistory.map(sanitizeBillEditEvent) : [],
    syncedAt: raw.syncedAt ? Number(raw.syncedAt) : undefined,
    isOfflineBackup: Boolean(raw.isOfflineBackup),
    createdAt: Number(raw.createdAt || Date.now()),
  };
}

export function sanitizeOrderItem(item = {}) {
  const price = parseFloat(item.price ?? 0) || 0;
  const quantity = parseFloat(item.quantity ?? 1) || 1;
  const itemTotal = parseFloat(item.itemTotal ?? (price * quantity)) || (price * quantity);

  return {
    id: String(item.id || ''),
    name: String(item.name || 'Sweet Item'),
    englishName: item.englishName ? String(item.englishName) : '',
    tamilName: item.tamilName ? String(item.tamilName) : '',
    price,
    quantity,
    weight: String(item.weight || ''),
    unit: String(item.unit || 'kg'),
    itemTotal,
  };
}

export function sanitizeOrderCustomer(c = {}) {
  return {
    fullName: String(c.fullName || c.name || '').trim(),
    phone: String(c.phone || '').trim(),
    email: String(c.email || '').trim(),
    verifiedViaOtp: Boolean(c.verifiedViaOtp),
  };
}

export function sanitizeShippingAddress(addr = {}) {
  return {
    street: String(addr.street || '').trim(),
    city: String(addr.city || '').trim(),
    pincode: String(addr.pincode || '').trim(),
    state: String(addr.state || 'Tamil Nadu').trim(),
    landmark: String(addr.landmark || '').trim(),
  };
}

export function sanitizeOrder(raw = {}) {
  return {
    id: String(raw.id || `order-${Date.now()}`),
    invoiceNumber: String(raw.invoiceNumber || ''),
    orderDate: String(raw.orderDate || new Date().toISOString().split('T')[0]),
    orderTime: String(raw.orderTime || new Date().toTimeString().split(' ')[0]),
    customer: sanitizeOrderCustomer(raw.customer),
    shippingAddress: sanitizeShippingAddress(raw.shippingAddress),
    items: Array.isArray(raw.items) ? raw.items.map(sanitizeOrderItem) : [],
    subtotal: parseFloat(raw.subtotal || 0) || 0,
    deliveryFee: parseFloat(raw.deliveryFee || 0) || 0,
    grandTotal: parseFloat(raw.grandTotal || 0) || 0,
    paymentMethod: String(raw.paymentMethod || 'cod'),
    upiUtr: String(raw.upiUtr || ''),
    giftNote: String(raw.giftNote || ''),
    source: String(raw.source || 'online'),
    status: String(raw.status || 'New'),
    createdAt: Number(raw.createdAt || Date.now()),
  };
}

export function sanitizePreOrderItem(item = {}) {
  const price = parseFloat(item.price ?? 0) || 0;
  const quantity = parseFloat(item.quantity ?? 1) || 1;
  const itemTotal = parseFloat(item.itemTotal ?? (price * quantity)) || (price * quantity);

  return {
    id: String(item.id || ''),
    name: String(item.name || 'Sweet Item'),
    englishName: item.englishName ? String(item.englishName) : '',
    tamilName: item.tamilName ? String(item.tamilName) : '',
    price,
    quantity,
    weight: String(item.weight || ''),
    unit: String(item.unit || 'kg'),
    itemTotal,
  };
}

export function sanitizePreOrder(raw = {}) {
  return {
    id: String(raw.id || `preorder-${Date.now()}`),
    invoiceNumber: String(raw.invoiceNumber || ''),
    customerName: String(raw.customerName || 'Customer').trim(),
    customerPhone: String(raw.customerPhone || '').trim(),
    items: Array.isArray(raw.items) ? raw.items.map(sanitizePreOrderItem) : [],
    grandTotal: parseFloat(raw.grandTotal || 0) || 0,
    note: String(raw.note || ''),
    totalItems: parseInt(raw.totalItems || (Array.isArray(raw.items) ? raw.items.length : 0), 10),
    status: ['pending', 'accepted', 'billed', 'cancelled'].includes(raw.status) ? raw.status : 'pending',
    acceptedAt: raw.acceptedAt ? Number(raw.acceptedAt) : undefined,
    billedAt: raw.billedAt ? Number(raw.billedAt) : undefined,
    createdAt: Number(raw.createdAt || Date.now()),
  };
}

export function sanitizeProduct(p = {}) {
  const finalPrice = parseFloat(p.price ?? p.unitPrice ?? p.pricePerKg ?? 0) || 0;
  return {
    id: String(p.id || ''),
    name: String(p.name || '').trim(),
    englishName: p.englishName ? String(p.englishName).trim() : '',
    tamilName: p.tamilName ? String(p.tamilName).trim() : '',
    nameTa: p.nameTa ? String(p.nameTa).trim() : '',
    tagline: p.tagline ? String(p.tagline).trim() : '',
    description: p.description ? String(p.description).trim() : '',
    price: finalPrice,
    pricePerKg: parseFloat(p.pricePerKg ?? finalPrice) || finalPrice,
    unitPrice: parseFloat(p.unitPrice ?? finalPrice) || finalPrice,
    unit: String(p.unit || 'kg').trim(),
    itemNumber: p.itemNumber ? Number(p.itemNumber) : undefined,
    skuCode: String(p.skuCode || '').trim(),
    stockKg: parseFloat(p.stockKg ?? 0) || 0,
    godownStock: parseFloat(p.godownStock ?? 0) || 0,
    counterStock: parseFloat(p.counterStock ?? 0) || 0,
    minThreshold: parseFloat(p.minThreshold ?? 8) || 8,
    isInactive: Boolean(p.isInactive),
    isCustom: Boolean(p.isCustom),
    batchDate: String(p.batchDate || ''),
    batchNote: String(p.batchNote || ''),
    batchCode: String(p.batchCode || ''),
    image: String(p.image || '/images/products/palkova_card.jpg'),
    category: String(p.category || 'Ghee Sweets').trim(),
    hsn: String(p.hsn || '').trim(),
    isUnlimitedStock: Boolean(p.isUnlimitedStock),
  };
}

export function sanitizeExpense(e = {}) {
  return {
    id: String(e.id || `exp-${Date.now()}`),
    amount: Math.max(0, parseFloat(e.amount || 0) || 0),
    purpose: String(e.purpose || '').trim(),
    category: String(e.category || 'General').trim(),
    date: String(e.date || new Date().toLocaleDateString('en-IN')),
    cashier: sanitizeCashier(e.cashier),
    note: String(e.note || '').trim(),
    createdAt: Number(e.createdAt || Date.now()),
  };
}

export function sanitizeStockTransferLog(l = {}) {
  return {
    id: String(l.id || `stock-log-${Date.now()}`),
    productId: String(l.productId || ''),
    productName: String(l.productName || ''),
    type: ['GODOWN_INWARD', 'DISPATCH_TO_COUNTER', 'COUNTER_RETURN', 'WASTAGE'].includes(l.type) ? l.type : 'GODOWN_INWARD',
    quantity: parseFloat(l.quantity || 0) || 0,
    unit: String(l.unit || 'kg'),
    godownRemaining: parseFloat(l.godownRemaining || 0) || 0,
    counterRemaining: parseFloat(l.counterRemaining || 0) || 0,
    performedBy: String(l.performedBy || 'Company Manager'),
    note: String(l.note || ''),
    date: String(l.date || new Date().toLocaleDateString('en-IN')),
    createdAt: Number(l.createdAt || Date.now()),
  };
}

export function sanitizePriceOverrideLog(l = {}) {
  return {
    id: String(l.id || `ovr-${Date.now()}`),
    invoiceNumber: String(l.invoiceNumber || 'COUNTER-DRAFT'),
    cashier: sanitizeCashier(l.cashier),
    productId: String(l.productId || ''),
    productName: String(l.productName || ''),
    weightOrUnit: String(l.weightOrUnit || ''),
    originalRate: parseFloat(l.originalRate || 0) || 0,
    customRate: parseFloat(l.customRate || 0) || 0,
    difference: parseFloat(l.difference || 0) || 0,
    quantity: parseFloat(l.quantity || 1) || 1,
    reason: String(l.reason || 'Customer Request / Special Rate'),
    timestamp: Number(l.timestamp || Date.now()),
    dateStr: String(l.dateStr || ''),
    timeStr: String(l.timeStr || ''),
  };
}

export function sanitizeActivityLog(l = {}) {
  const cleanDetails = {};
  if (l.details && typeof l.details === 'object') {
    for (const [k, v] of Object.entries(l.details)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        cleanDetails[k] = v;
      }
    }
  }

  return {
    id: String(l.id || `act-${Date.now()}`),
    actionType: String(l.actionType || 'UNKNOWN_ACTION'),
    performedBy: sanitizeCashier(l.performedBy),
    targetId: String(l.targetId || ''),
    targetName: String(l.targetName || ''),
    details: cleanDetails,
    reason: String(l.reason || ''),
    timestamp: Number(l.timestamp || Date.now()),
    dateStr: String(l.dateStr || ''),
    timeStr: String(l.timeStr || ''),
  };
}
