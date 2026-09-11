import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thenisai';

app.use(cors());
app.use(express.json());

// Never cache API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ============================================================
// MONGODB SCHEMAS
// ============================================================

const staffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  title: String,
  role: { type: String, enum: ['admin', 'cashier'], required: true },
  counter: String,
});

const inventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: String,
  description: String,
  pricePerKg: { type: Number, default: 500 },
  stockKg: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 8 },
  batchDate: String,
  batchNote: String,
  batchCode: String,
  image: { type: String, default: '/palkova_card.jpg' },
  category: { type: String, default: 'Ghee Sweets' },
  hsn: { type: String, default: '2106' },
});

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,
  expiresAt: Number,
  verified: { type: Boolean, default: false },
  token: String,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: String,
  orderDate: String,
  orderTime: String,
  customer: {
    fullName: String,
    phone: String,
    email: String,
    verifiedViaOtp: Boolean,
  },
  shippingAddress: mongoose.Schema.Types.Mixed,
  items: [mongoose.Schema.Types.Mixed],
  subtotal: Number,
  taxBreakdown: mongoose.Schema.Types.Mixed,
  deliveryFee: Number,
  grandTotal: Number,
  paymentMethod: String,
  upiUtr: String,
  giftNote: String,
  source: { type: String, default: 'online' },
  status: { type: String, default: 'New' },
  createdAt: { type: Number, default: Date.now },
});

const billSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: String,
  orderDate: String,
  orderTime: String,
  items: [mongoose.Schema.Types.Mixed],
  customer: mongoose.Schema.Types.Mixed,
  subtotal: Number,
  taxBreakdown: mongoose.Schema.Types.Mixed,
  grandTotal: Number,
  paymentMethod: String,
  cashier: {
    id: String,
    name: String,
    username: String,
    role: String,
    counter: String,
  },
  source: { type: String, default: 'counter' },
  status: { type: String, default: 'Completed' },
  createdAt: { type: Number, default: Date.now },
});

const Staff = mongoose.model('Staff', staffSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Otp = mongoose.model('Otp', otpSchema);
const Order = mongoose.model('Order', orderSchema);
const Bill = mongoose.model('Bill', billSchema);

// In-memory sessions store
const activeSessions = new Map();

// ============================================================
// SEED DEFAULT DATA (runs once if collections are empty)
// ============================================================
async function seedIfEmpty() {
  const staffCount = await Staff.countDocuments();
  if (staffCount === 0) {
    await Staff.insertMany([
      { id: 'staff-1', username: 'admin', password: 'admin123', name: 'S. Ramanathan', title: 'Kitchen Operations Head', role: 'admin', counter: 'Operations Central' },
      { id: 'staff-2', username: 'cashier', password: 'cashier123', name: 'M. Kannan', title: 'Counter Cashier', role: 'cashier', counter: 'Counter Desk 01' },
    ]);
    console.log('[Seed] Staff accounts created');
  }

  const invCount = await Inventory.countDocuments();
  if (invCount === 0) {
    await Inventory.insertMany([
      { id: 'palkova', name: 'Signature Palkova', stockKg: 42.5, minThreshold: 10, batchDate: 'Today 06:00 AM', batchNote: 'Fresh Uruli Batch 1', pricePerKg: 680, hsn: '0402', category: 'Milk & Khoa' },
      { id: 'milk-peda', name: 'Milk Peda', stockKg: 28.0, minThreshold: 8, batchDate: 'Today 07:00 AM', batchNote: 'Morning batch', pricePerKg: 640, hsn: '0402', category: 'Milk & Khoa' },
      { id: 'mysore-pak', name: 'Royal Mysore Pak', stockKg: 35.0, minThreshold: 10, batchDate: 'Today 06:30 AM', batchNote: 'Desi Ghee batch', pricePerKg: 760, hsn: '2106', category: 'Ghee Sweets' },
      { id: 'kaju-katli', name: 'Kaju Katli', stockKg: 22.0, minThreshold: 6, batchDate: 'Yesterday Evening', batchNote: 'Whole Cashew batch', pricePerKg: 1100, hsn: '2106', category: 'Cashew & Nut' },
      { id: 'badam-halwa', name: 'Badam Halwa', stockKg: 18.5, minThreshold: 5, batchDate: 'Today 07:30 AM', batchNote: 'Kashmiri Saffron batch', pricePerKg: 1160, hsn: '2106', category: 'Halwa & Soft' },
      { id: 'jangiri', name: 'Jangiri', stockKg: 15.0, minThreshold: 5, batchDate: 'Today 08:00 AM', batchNote: 'Fresh crispy batch', pricePerKg: 560, hsn: '2106', category: 'Ghee Sweets' },
      { id: 'gulab-jamun', name: 'Gulab Jamun', stockKg: 25.0, minThreshold: 8, batchDate: 'Today 07:00 AM', batchNote: 'Cardamom syrup batch', pricePerKg: 600, hsn: '2106', category: 'Milk & Khoa' },
      { id: 'assorted-box', name: 'Thenisai Royal Assorted Box', stockKg: 20.0, minThreshold: 5, batchDate: 'Today', batchNote: 'Gift boxes packed', pricePerKg: 850, hsn: '2106', category: 'Special Festival Box' },
    ]);
    console.log('[Seed] Inventory items created');
  }
}

// ============================================================
// 1. AUTHENTICATION (ADMIN & CASHIER)
// ============================================================

app.post('/api/auth/login', async (req, res) => {
  const { role, username, password } = req.body;

  let matchedStaff = null;

  if (username && password) {
    const inputUname = username.trim().toLowerCase();
    matchedStaff = await Staff.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${inputUname}$`, 'i') } },
        { id: { $regex: new RegExp(`^${inputUname}$`, 'i') } },
      ],
      password: password.trim(),
    });
  }

  if (matchedStaff && role && matchedStaff.role !== role) {
    if (role === 'admin' && matchedStaff.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin privileges required.' });
    }
  }

  if (!matchedStaff) {
    return res.status(401).json({ success: false, message: 'Invalid User ID / Username or Password. Please try again.' });
  }

  const token = `thenisai_session_${matchedStaff.id}_${Date.now()}`;
  const userProfile = {
    id: matchedStaff.id,
    username: matchedStaff.username,
    name: matchedStaff.name,
    title: matchedStaff.title,
    role: matchedStaff.role,
    counter: matchedStaff.counter,
  };

  activeSessions.set(token, userProfile);
  console.log(`[Auth] User ${matchedStaff.name} logged in as ${matchedStaff.role.toUpperCase()}`);

  return res.json({ success: true, message: `Welcome, ${matchedStaff.name}`, token, user: userProfile });
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  let user = activeSessions.get(token);

  if (!user) {
    const tokenParts = token.split('_');
    const staffId = tokenParts[2];
    const fallbackStaff = await Staff.findOne({ id: staffId });
    if (fallbackStaff) {
      user = { id: fallbackStaff.id, username: fallbackStaff.username, name: fallbackStaff.name, title: fallbackStaff.title, role: fallbackStaff.role, counter: fallbackStaff.counter };
      activeSessions.set(token, user);
      return res.json({ success: true, user });
    }
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  return res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeSessions.delete(authHeader.split(' ')[1]);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================================
// 2. MOBILE NUMBER OTP SYSTEM (ONLINE ORDERING)
// ============================================================

app.post('/api/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  await Otp.findOneAndUpdate(
    { phone: cleanPhone },
    { otp, expiresAt, verified: false, attempts: 0, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  console.log(`[OTP] 📱 +91 ${cleanPhone} → OTP: ${otp}`);

  return res.json({ success: true, message: `Verification code sent to +91 ${cleanPhone}`, phone: cleanPhone, devOtp: otp, expiresInSeconds: 300 });
});

app.post('/api/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const record = await Otp.findOne({ phone: cleanPhone });

  if (!record) return res.status(400).json({ success: false, message: 'No active OTP for this number. Please request a new OTP.' });
  if (Date.now() > record.expiresAt) {
    await Otp.deleteOne({ phone: cleanPhone });
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a fresh OTP.' });
  }
  if (record.otp !== String(otp).trim()) {
    await Otp.updateOne({ phone: cleanPhone }, { $inc: { attempts: 1 } });
    return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
  }

  const verificationToken = `vtok_${cleanPhone}_${Date.now()}`;
  await Otp.updateOne({ phone: cleanPhone }, { verified: true, token: verificationToken });
  console.log(`[OTP] ✓ Verified +91 ${cleanPhone}`);

  return res.json({ success: true, verified: true, message: `Mobile +91 ${cleanPhone} successfully verified.`, verificationToken, phone: cleanPhone });
});

// ============================================================
// 3. INVENTORY & BATCH MANAGEMENT
// ============================================================

app.get('/api/inventory', async (req, res) => {
  const inventory = await Inventory.find({});
  res.json({ success: true, inventory });
});

app.post('/api/inventory/stock', async (req, res) => {
  const { sweetId, addKg, batchCode, batchNote, isRefill } = req.body;
  const item = await Inventory.findOne({ id: sweetId });
  if (!item) return res.status(404).json({ success: false, message: 'Sweet item not found.' });

  const added = parseFloat(addKg) || 0;
  item.stockKg = Math.round((item.stockKg + added) * 10) / 10;
  if (batchCode) item.batchCode = batchCode;
  if (batchNote) item.batchNote = batchNote;
  item.batchDate = 'Just now';
  await item.save();

  const inventory = await Inventory.find({});
  console.log(`[Inventory] ${isRefill ? 'Refilled' : 'Inwarded'} ${item.name}: +${added} kg → ${item.stockKg} kg`);
  res.json({ success: true, message: `Added +${added} kg to ${item.name}. New total: ${item.stockKg} kg`, sweet: item, inventory });
});

app.post('/api/inventory/products', async (req, res) => {
  const { name, tagline, description, pricePerKg, initialStockKg, image, category } = req.body;
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const existing = await Inventory.findOne({ id });
  if (existing) return res.status(400).json({ success: false, message: 'A sweet with this name already exists.' });

  const newProduct = await Inventory.create({
    id, name,
    tagline: tagline || 'Traditional specialty',
    description: description || 'Fresh handcrafted sweet',
    pricePerKg: parseFloat(pricePerKg) || 500,
    stockKg: parseFloat(initialStockKg) || 10,
    minThreshold: 8,
    batchDate: 'Today', batchNote: 'New kitchen batch',
    image: image || '/palkova_card.jpg',
    category: category || 'Ghee Sweets',
    hsn: '2106',
  });

  const inventory = await Inventory.find({});
  res.json({ success: true, message: `Added '${name}' to catalog.`, product: newProduct, inventory });
});

// ============================================================
// 4. ORDERS & INVOICES
// ============================================================

app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

app.post('/api/orders', async (req, res) => {
  const { customer, shippingAddress, items, subtotal, taxBreakdown, deliveryFee, grandTotal, paymentMethod, upiUtr, giftNote } = req.body;

  const cleanPhone = customer?.phone ? String(customer.phone).replace(/\D/g, '').slice(-10) : '';
  const otpRecord = await Otp.findOne({ phone: cleanPhone });

  if (!customer?.verifiedViaOtp && (!otpRecord || !otpRecord.verified)) {
    return res.status(400).json({ success: false, message: 'Mobile number must be verified with OTP before placing an order.' });
  }

  const now = new Date();
  const invoiceNumber = `THN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = await Order.create({
    id: `ord-${Date.now()}`,
    invoiceNumber,
    orderDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    orderTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    customer: { fullName: customer.fullName, phone: cleanPhone, email: customer.email, verifiedViaOtp: true },
    shippingAddress, items: items || [],
    subtotal: subtotal || 0, taxBreakdown: taxBreakdown || {},
    deliveryFee: deliveryFee || 0, grandTotal: grandTotal || 0,
    paymentMethod: paymentMethod || 'cod',
    upiUtr: upiUtr || '', giftNote: giftNote || '',
    source: 'online', status: 'New', createdAt: Date.now(),
  });

  // Deduct inventory
  if (items && Array.isArray(items)) {
    for (const item of items) {
      const inv = await Inventory.findOne({ id: item.id });
      if (inv) {
        const w = String(item.weight).toLowerCase();
        let weightKg = 0.5;
        if (w.includes('250g')) weightKg = 0.25;
        else if (w.includes('500g')) weightKg = 0.5;
        else if (w.includes('1kg')) weightKg = 1.0;
        else if (w.includes('kg')) weightKg = parseFloat(w) || 0.5;
        inv.stockKg = Math.max(0, Math.round((inv.stockKg - weightKg * (item.quantity || 1)) * 10) / 10);
        await inv.save();
      }
    }
  }

  console.log(`[Order] ${invoiceNumber} placed by ${customer.fullName} (+91 ${cleanPhone})`);
  res.json({ success: true, message: 'Online order confirmed!', order: newOrder });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const order = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  console.log(`[Order] ${order.invoiceNumber} → ${status}`);
  res.json({ success: true, message: `Status updated to ${status}`, order });
});

// ============================================================
// 5. POS COUNTER BILLING
// ============================================================

app.post('/api/bills', async (req, res) => {
  try {
    const billData = req.body;
    const now = new Date();
    const invoiceNumber = billData.invoiceNumber || `POS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalBill = await Bill.create({
      ...billData,
      id: billData.id || `bill-${Date.now()}`,
      invoiceNumber,
      orderDate: billData.orderDate || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderTime: billData.orderTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      cashier: billData.cashier || {
        id: 'staff-2',
        username: 'cashier',
        name: 'M. Kannan',
        role: 'cashier',
        counter: 'Counter Desk 01',
      },
      createdAt: Date.now(),
      source: 'counter',
      status: 'Completed',
    });

    // Deduct inventory
    if (finalBill.items && Array.isArray(finalBill.items)) {
      for (const item of finalBill.items) {
        const inv = await Inventory.findOne({ id: item.id });
        if (inv) {
          const w = String(item.weight).toLowerCase();
          let weightKg = 0.5;
          if (w.includes('250g')) weightKg = 0.25;
          else if (w.includes('500g')) weightKg = 0.5;
          else if (w.includes('1kg')) weightKg = 1.0;
          else if (w.includes('kg')) weightKg = parseFloat(w) || 0.5;
          inv.stockKg = Math.max(0, Math.round((inv.stockKg - weightKg * (item.quantity || 1)) * 10) / 10);
          await inv.save();
        }
      }
    }

    console.log(`[POS Billing] Bill: ${invoiceNumber} Total: ₹${finalBill.grandTotal} by ${finalBill.cashier?.name || 'Staff'}`);
    res.json({ success: true, bill: finalBill });
  } catch (err) {
    console.error('[POS Billing] Error creating bill:', err);
    res.status(500).json({ success: false, message: 'Failed to create bill: ' + err.message });
  }
});

app.get('/api/bills', async (req, res) => {
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
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Thenisai Sweets Backend Engine',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      inventory: '/api/inventory',
      orders: '/api/orders',
      bills: '/api/bills',
    },
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Thenisai Sweets Backend Engine',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// CONNECT TO MONGODB & START SERVER
// ============================================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected: ${MONGODB_URI}`);
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`✨ THENISAI SWEETS BACKEND SERVER RUNNING`);
      console.log(`📍 Port: http://localhost:${PORT}`);
      console.log(`🍃 MongoDB: ${MONGODB_URI}`);
      console.log(`📡 Health: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
