import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_FILE_PATH = path.join(__dirname, 'data', 'catalog.json');

function updateCatalogFile(productId, updateFn) {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const idx = list.findIndex((p) => p.id === productId);
        if (idx !== -1) {
          list[idx] = updateFn(list[idx]);
        } else {
          list.push(updateFn({ id: productId }));
        }
        fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
      }
    }
  } catch (err) {
    console.warn('[Catalog File Sync] Warning:', err.message);
  }
}

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
  englishName: String,
  tamilName: String,
  nameTa: String,
  tagline: String,
  description: String,
  price: { type: Number },
  pricePerKg: { type: Number, default: 500 },
  unitPrice: { type: Number },
  unit: { type: String, default: 'kg' },
  itemNumber: Number,
  skuCode: { type: String, default: '' },
  stockKg: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 8 },
  isInactive: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
  batchDate: String,
  batchNote: String,
  batchCode: String,
  image: { type: String, default: '/images/products/palkova_card.jpg' },
  category: { type: String, default: 'Ghee Sweets' },
  hsn: { type: String, default: '2106' },
});

const priceOverrideLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, default: 'COUNTER-DRAFT' },
  cashier: {
    id: String,
    name: String,
    role: String,
    username: String,
    counter: String,
  },
  productId: String,
  productName: String,
  weightOrUnit: String,
  originalRate: Number,
  customRate: Number,
  difference: Number,
  quantity: { type: Number, default: 1 },
  reason: { type: String, default: 'Customer Request / Special Rate' },
  timestamp: { type: Number, default: Date.now },
  dateStr: String,
  timeStr: String,
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
  splitCash: Number,
  splitUpi: Number,
  paymentDetails: mongoose.Schema.Types.Mixed,
  upiUtr: String,
  cashier: {
    id: String,
    name: String,
    username: String,
    role: String,
    counter: String,
  },
  source: { type: String, default: 'counter' },
  status: { type: String, default: 'Completed' },
  isEdited: { type: Boolean, default: false },
  editHistory: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Number, default: Date.now },
});

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: 'Valued Customer' },
  email: String,
  wishlist: [{ type: String }],
  token: String,
  createdAt: { type: Number, default: Date.now },
  lastLogin: { type: Number, default: Date.now },
});

const deletedBillSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNumber: String,
  billData: mongoose.Schema.Types.Mixed,
  deletedBy: {
    id: String,
    name: String,
    username: String,
    role: String,
  },
  deletionReason: { type: String, required: true },
  deletedAt: { type: Number, default: Date.now },
  expiresAt: { type: Number, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 }, // 30 days retention
});

const deletedProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  englishName: String,
  tamilName: String,
  productData: mongoose.Schema.Types.Mixed,
  deletedBy: {
    id: String,
    name: String,
    username: String,
    role: String,
  },
  deletionReason: { type: String, default: 'Product removed from catalog' },
  deletedAt: { type: Number, default: Date.now },
  expiresAt: { type: Number, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 },
});

const purgedProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  purgedAt: { type: Number, default: Date.now },
});

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actionType: { type: String, required: true }, // 'BILL_DELETED' | 'BILL_RESTORED' | 'BILL_PERMANENTLY_PURGED' | 'PRICE_OVERRIDE' | 'PRODUCT_ADDED' | 'PRODUCT_PRICE_UPDATED' | 'PRODUCT_DELETED' | 'PRODUCT_RESTORED' | 'PRODUCT_PERMANENTLY_PURGED' | 'STOCK_TOGGLED'
  performedBy: {
    id: String,
    name: String,
    username: String,
    role: String,
  },
  targetId: String,
  targetName: String,
  details: mongoose.Schema.Types.Mixed,
  reason: String,
  timestamp: { type: Number, default: Date.now },
  dateStr: String,
  timeStr: String,
});

const Staff = mongoose.model('Staff', staffSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Otp = mongoose.model('Otp', otpSchema);
const Order = mongoose.model('Order', orderSchema);
const Bill = mongoose.model('Bill', billSchema);
const Customer = mongoose.model('Customer', customerSchema);
const PriceOverrideLog = mongoose.model('PriceOverrideLog', priceOverrideLogSchema);
const DeletedBill = mongoose.model('DeletedBill', deletedBillSchema);
const DeletedProduct = mongoose.model('DeletedProduct', deletedProductSchema);
const PurgedProduct = mongoose.model('PurgedProduct', purgedProductSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

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
      { id: 'staff-3', username: 'tester', password: 'test123', name: 'Demo Tester', title: 'Sandbox Testing (No Data Impact)', role: 'tester', counter: 'Sandbox Terminal' },
    ]);
    console.log('[Seed] Staff accounts created');
  } else {
    await Staff.updateOne(
      { username: 'tester' },
      { $setOnInsert: { id: 'staff-3', username: 'tester', password: 'test123', name: 'Demo Tester', title: 'Sandbox Testing (No Data Impact)', role: 'tester', counter: 'Sandbox Terminal' } },
      { upsert: true }
    );
  }

  const defaultItems = [
    { id: 'tea', name: 'Tea — டீ', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Fresh tea brew counter', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0902', category: 'Hot Beverages', image: '/images/products/tea.svg' },
    { id: 'coffee', name: 'Coffee — காபி', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Fresh coffee brew counter', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0901', category: 'Hot Beverages', image: '/images/products/coffee.svg' },
    { id: 'filter-coffee', name: 'Filter Coffee — ஃபில்டர் காபி', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Degree filter coffee decoction', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0901', category: 'Hot Beverages', image: '/images/products/filter-coffee.svg' },
    { id: 'milk', name: 'Milk — பால்', stockKg: 80, minThreshold: 10, batchDate: 'Today', batchNote: 'Boiled fresh farm milk', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0401', category: 'Hot Beverages', image: '/images/products/milk.svg' },
    { id: 'horlicks', name: 'Horlicks — ஹார்லிக்ஸ்', stockKg: 60, minThreshold: 10, batchDate: 'Today', batchNote: 'Malt beverage counter', pricePerKg: 25, unitPrice: 25, unit: '1 Cup', hsn: '1901', category: 'Hot Beverages', image: '/images/products/horlicks.svg' },
    { id: 'boost', name: 'Boost — பூஸ்ட்', stockKg: 60, minThreshold: 10, batchDate: 'Today', batchNote: 'Chocolate energy malt', pricePerKg: 25, unitPrice: 25, unit: '1 Cup', hsn: '1901', category: 'Hot Beverages', image: '/images/products/boost.svg' },
    { id: 'badam-milk', name: 'Badam Milk — பாதாம் பால்', stockKg: 50, minThreshold: 10, batchDate: 'Today', batchNote: 'Saffron almond milk', pricePerKg: 25, unitPrice: 25, unit: '1 Cup', hsn: '0401', category: 'Hot Beverages', image: '/images/products/badam-milk.svg' },
    { id: 'ragi-malt', name: 'Ragi Malt — கேழ்வரகு கூழ்', stockKg: 50, minThreshold: 10, batchDate: 'Today', batchNote: 'Traditional ragi brew', pricePerKg: 25, unitPrice: 25, unit: '1 Cup', hsn: '1904', category: 'Hot Beverages', image: '/images/products/ragi-malt.svg' },
    { id: 'lemon-tea', name: 'Lemon Tea — எலுமிச்சை டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Fresh lemon tea brew', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0902', category: 'Hot Beverages', image: '/images/products/lemon-tea.svg' },
    { id: 'sugu-tea', name: 'Sugu Tea — சுக்கு டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Dry ginger medicinal brew', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0902', category: 'Hot Beverages', image: '/images/products/sugu-tea.svg' },
    { id: 'magu-tea', name: 'Magu Tea — மிளகு டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Black pepper herbal brew', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '0902', category: 'Hot Beverages', image: '/images/products/magu-tea.svg' },
    { id: 'ginger-lemon', name: 'Ginger Lemon — இஞ்சி எலுமிச்சை', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Fresh ginger & lemon brew', pricePerKg: 20, unitPrice: 20, unit: '1 Cup', hsn: '2202', category: 'Hot Beverages', image: '/images/products/ginger-lemon.svg' },
    { id: 'vada', name: 'Vada — வடை', stockKg: 80, minThreshold: 15, batchDate: 'Today 07:00 AM', batchNote: 'Hot crispy medu vada', pricePerKg: 20, unitPrice: 20, unit: '1 Pc', hsn: '1905', category: 'Snacks & Savories', image: '/images/products/vada.svg' },
  ];

  for (const it of defaultItems) {
    const isPurged = await PurgedProduct.findOne({ id: it.id });
    const isDeleted = await DeletedProduct.findOne({ id: it.id });
    if (!isPurged && !isDeleted) {
      await Inventory.updateOne({ id: it.id }, { $setOnInsert: it }, { upsert: true });
    }
  }

  // Load from catalog.json if available to keep MongoDB up to date
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
      const catalogItems = JSON.parse(raw);
      if (Array.isArray(catalogItems)) {
        for (const cItem of catalogItems) {
          if (!cItem.id) continue;
          const isPurged = await PurgedProduct.findOne({ id: cItem.id });
          const isDeleted = await DeletedProduct.findOne({ id: cItem.id });
          if (isPurged || isDeleted) continue;
          const setFields = {
            skuCode: cItem.skuCode || (cItem.itemNumber ? String(cItem.itemNumber) : ''),
            price: cItem.price,
            unitPrice: cItem.unitPrice || cItem.price,
            pricePerKg: cItem.pricePerKg || cItem.price,
            unit: cItem.unit || 'kg',
            ...(cItem.isInactive !== undefined ? { isInactive: cItem.isInactive } : {}),
            ...(cItem.name ? { name: cItem.name } : {}),
            ...(cItem.englishName ? { englishName: cItem.englishName } : {}),
            ...(cItem.tamilName ? { tamilName: cItem.tamilName } : {}),
          };
          const insertFields = { ...cItem };
          for (const k of Object.keys(setFields)) {
            delete insertFields[k];
          }
          await Inventory.updateOne(
            { id: cItem.id },
            {
              $set: setFields,
              $setOnInsert: insertFields,
            },
            { upsert: true }
          );
        }
        console.log(`[Seed] Synced ${catalogItems.length} items from catalog.json`);
      }
    }
  } catch (err) {
    console.warn('[Seed] Catalog file sync error:', err.message);
  }

  // Back-fill skuCode for any remaining records that have no SKU code
  await Inventory.updateMany(
    { $or: [{ skuCode: { $exists: false } }, { skuCode: '' }, { skuCode: null }] },
    [{ $set: { skuCode: { $toString: { $ifNull: ['$itemNumber', ''] } } } }]
  );
  console.log('[Seed] Inventory verified/seeded for standard items');
}

function isSandboxRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const user = activeSessions.get(token);
  return user?.role === 'tester' || token.includes('staff-3') || token.includes('viewer');
}

// Sandbox safety middleware: Tester mutations are simulated without touching DB
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.path !== '/api/auth/login' && req.path !== '/api/auth/logout') {
    if (isSandboxRequest(req)) {
      console.log(`[Sandbox] Simulated ${req.method} ${req.path} for Tester (DB write blocked)`);
      if (req.path === '/api/bills' && req.method === 'POST') {
        const fakeBill = { ...req.body, id: `test-bill-${Date.now()}`, isSandbox: true };
        return res.status(201).json({ success: true, isSandbox: true, message: 'Simulated bill creation in Sandbox', bill: fakeBill });
      }
      if (req.path === '/api/orders' && req.method === 'POST') {
        const fakeOrder = { ...req.body, id: `test-ord-${Date.now()}`, isSandbox: true };
        return res.status(201).json({ success: true, isSandbox: true, message: 'Simulated order in Sandbox', order: fakeOrder });
      }
      return res.json({ success: true, isSandbox: true, message: 'Simulated action in Sandbox Mode. Database was not modified.' });
    }
  }
  next();
});

app.post('/api/auth/login', async (req, res) => {
  const { role, username, password } = req.body;

  let matchedStaff = null;

  if (username && password) {
    const inputUname = username.trim().toLowerCase();
    const inputPass = password.trim();

    // Tester Sandbox Instant Login
    if ((inputUname === 'tester' || inputUname === 'test' || inputUname === 'demo') && (inputPass === 'test123' || inputPass === 'tester123' || inputPass === 'demo123' || inputPass === '0000' || inputPass === 'test')) {
      const token = `thenisai_session_staff-3_${Date.now()}`;
      const userProfile = {
        id: 'staff-3',
        username: 'tester',
        name: 'Demo Tester',
        title: 'Sandbox Testing (No Data Impact)',
        role: 'tester',
        counter: 'Sandbox Terminal',
        isSandbox: true,
      };
      activeSessions.set(token, userProfile);
      console.log('[Auth] User Demo Tester logged in as TESTER (Sandbox Mode)');
      return res.json({ success: true, message: 'Welcome to Sandbox Testing Mode', token, user: userProfile });
    }

    matchedStaff = await Staff.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${inputUname}$`, 'i') } },
        { id: { $regex: new RegExp(`^${inputUname}$`, 'i') } },
      ],
      password: inputPass,
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
// 2B. CUSTOMER ACCOUNT & WISHLIST SYSTEM
// ============================================================

app.post('/api/customer/auth-otp', async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });

  const record = await Otp.findOne({ phone: cleanPhone });
  if (!record) return res.status(400).json({ success: false, message: 'No active OTP found. Please request an OTP first.' });
  if (Date.now() > record.expiresAt) {
    await Otp.deleteOne({ phone: cleanPhone });
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
  }
  if (record.otp !== String(otp).trim()) {
    await Otp.updateOne({ phone: cleanPhone }, { $inc: { attempts: 1 } });
    return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
  }

  const token = `cust_${cleanPhone}_${Date.now()}`;
  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    customer = await Customer.create({
      phone: cleanPhone,
      name: name?.trim() || `Customer ${cleanPhone.slice(-4)}`,
      wishlist: [],
      token,
      lastLogin: Date.now(),
    });
    console.log(`[Customer] 👤 New account created for +91 ${cleanPhone}`);
  } else {
    customer.token = token;
    customer.lastLogin = Date.now();
    if (name?.trim()) customer.name = name.trim();
    await customer.save();
    console.log(`[Customer] ✓ Logged in +91 ${cleanPhone}`);
  }

  await Otp.updateOne({ phone: cleanPhone }, { verified: true, token });

  return res.json({
    success: true,
    message: `Account verified successfully for +91 ${cleanPhone}`,
    customer: {
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      wishlist: customer.wishlist || [],
    },
    token,
  });
});

app.get('/api/customer/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const phone = req.query.phone;
  let customer = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    customer = await Customer.findOne({ token });
  } else if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    customer = await Customer.findOne({ phone: cleanPhone });
  }

  if (!customer) {
    return res.status(401).json({ success: false, message: 'Customer account not found or session expired.' });
  }

  return res.json({
    success: true,
    customer: {
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      wishlist: customer.wishlist || [],
    },
  });
});

app.post('/api/customer/wishlist/toggle', async (req, res) => {
  const { phone, productId } = req.body;
  if (!phone || !productId) return res.status(400).json({ success: false, message: 'Phone and productId are required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found. Please verify with OTP first.' });
  }

  const currentList = customer.wishlist || [];
  const exists = currentList.includes(productId);
  let updatedList;
  if (exists) {
    updatedList = currentList.filter((id) => id !== productId);
  } else {
    updatedList = [...currentList, productId];
  }

  customer.wishlist = updatedList;
  await customer.save();

  return res.json({
    success: true,
    action: exists ? 'removed' : 'added',
    wishlist: updatedList,
  });
});

app.post('/api/customer/wishlist/sync', async (req, res) => {
  const { phone, wishlist } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone is required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const merged = Array.from(new Set([...(customer.wishlist || []), ...(wishlist || [])]));
  customer.wishlist = merged;
  await customer.save();

  return res.json({ success: true, wishlist: merged });
});

// ============================================================
// 3. STAFF ACCOUNT MANAGEMENT (Admin Only)
// ============================================================

// Middleware: verify request is from an authenticated admin
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    let sessionUser = activeSessions.get(token);

    if (!sessionUser) {
      const tokenParts = token.split('_');
      const staffId = tokenParts[2];
      if (staffId) {
        const staff = await Staff.findOne({ id: staffId });
        if (staff) {
          sessionUser = {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            title: staff.title,
            role: staff.role,
            counter: staff.counter,
          };
          activeSessions.set(token, sessionUser);
        }
      }
    }

    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required.' });
    }
    req.adminUser = sessionUser;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authorization check failed.' });
  }
}

// GET all staff accounts
app.get('/api/staff', requireAdmin, async (req, res) => {
  try {
    const staffList = await Staff.find({}, { password: 0 }); // never return password
    return res.json({ success: true, staff: staffList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff list.' });
  }
});

// POST create a new staff account
app.post('/api/staff', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, title, role, counter } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'username, password, name and role are required.' });
    }
    if (!['admin', 'cashier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or cashier.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    const existing = await Staff.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Username "${username}" is already taken.` });
    }

    // Generate a unique staff ID
    const count = await Staff.countDocuments();
    const newId = `staff-${count + 10}-${Date.now().toString(36)}`;

    const newStaff = await Staff.create({
      id: newId,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      name: name.trim(),
      title: title?.trim() || (role === 'admin' ? 'Store Administrator' : 'Counter Cashier'),
      role,
      counter: counter?.trim() || (role === 'cashier' ? 'Counter Desk' : 'Admin Office'),
    });

    console.log(`[Staff] ✓ Created: ${newStaff.name} (${newStaff.role}) by ${req.adminUser.name}`);
    return res.status(201).json({
      success: true,
      message: `Staff account for ${newStaff.name} created successfully.`,
      staff: { id: newStaff.id, username: newStaff.username, name: newStaff.name, title: newStaff.title, role: newStaff.role, counter: newStaff.counter },
    });
  } catch (err) {
    console.error('[Staff] Create error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
});

// PUT update a staff account (admin can update name, title, counter, password, role — but NOT the built-in staff-1 admin account username)
app.put('/api/staff/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, role, counter, password, username } = req.body;

    const staff = await Staff.findOne({ id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    // Protect the primary admin account from role/username changes
    if (staff.id === 'staff-1' && role && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot change the role of the primary admin account.' });
    }

    if (name?.trim()) staff.name = name.trim();
    if (title?.trim()) staff.title = title.trim();
    if (counter?.trim()) staff.counter = counter.trim();
    if (role && ['admin', 'cashier'].includes(role)) staff.role = role;
    if (password?.trim() && password.trim().length >= 4) staff.password = password.trim();
    if (username?.trim() && staff.id !== 'staff-1') {
      // Check uniqueness if username is being changed
      const conflict = await Staff.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }, id: { $ne: id } });
      if (conflict) return res.status(409).json({ success: false, message: `Username "${username}" is already taken.` });
      staff.username = username.trim().toLowerCase();
    }

    await staff.save();
    console.log(`[Staff] ✏️  Updated: ${staff.name} (${staff.role}) by ${req.adminUser.name}`);
    return res.json({
      success: true,
      message: `${staff.name}'s account updated successfully.`,
      staff: { id: staff.id, username: staff.username, name: staff.name, title: staff.title, role: staff.role, counter: staff.counter },
    });
  } catch (err) {
    console.error('[Staff] Update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update staff account.' });
  }
});

// DELETE a staff account (cannot delete staff-1 or staff-2 built-in accounts)
app.delete('/api/staff/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'staff-1' || id === 'staff-2') {
      return res.status(403).json({ success: false, message: 'Built-in staff accounts cannot be deleted.' });
    }
    // Also prevent self-deletion
    if (id === req.adminUser.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const staff = await Staff.findOne({ id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    await Staff.deleteOne({ id });
    console.log(`[Staff] 🗑️  Deleted: ${staff.name} (${staff.role}) by ${req.adminUser.name}`);
    return res.json({ success: true, message: `${staff.name}'s account has been removed.` });
  } catch (err) {
    console.error('[Staff] Delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete staff account.' });
  }
});

// ============================================================
// 4. INVENTORY & BATCH MANAGEMENT
// ============================================================

app.get('/api/inventory', async (req, res) => {
  const [purgedList, deletedList] = await Promise.all([
    PurgedProduct.find({}, 'id').lean(),
    DeletedProduct.find({}, 'id').lean(),
  ]);
  const excludedIds = new Set([
    ...purgedList.map((p) => p.id),
    ...deletedList.map((p) => p.id),
  ]);
  const allInv = await Inventory.find({});
  const inventory = allInv.filter((p) => !excludedIds.has(p.id));
  inventory.sort((a, b) => {
    const getNum = (p) => {
      const sku = String(p?.skuCode ?? '').trim();
      const itemNum = String(p?.itemNumber ?? '').trim();
      const skuMatch = sku.match(/\d+/)?.[0];
      if (skuMatch) return parseInt(skuMatch, 10);
      const itemMatch = itemNum.match(/\d+/)?.[0];
      if (itemMatch) return parseInt(itemMatch, 10);
      return 999999;
    };
    const aNum = getNum(a);
    const bNum = getNum(b);
    if (aNum !== bNum) return aNum - bNum;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
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
  try {
    const {
      id: customId,
      name,
      nameTa,
      tagline,
      description,
      price,
      pricePerKg,
      unitPrice,
      unit,
      initialStockKg,
      stockKg,
      minThreshold,
      image,
      category,
      hsn,
      skuCode,
    } = req.body;

    const inventoryList = await Inventory.find({});
    const getNextInventoryCode = () => {
      const used = new Set();
      inventoryList.forEach((item) => {
        const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim();
        if (/^\d+$/.test(raw)) {
          const num = Number(raw);
          if (Number.isInteger(num) && num > 0) used.add(num);
        }
      });
      let nextCode = 1;
      while (used.has(nextCode)) nextCode += 1;
      return String(nextCode);
    };

    const id = customId || name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existing = await Inventory.findOne({ id });
    if (existing) return res.status(400).json({ success: false, message: 'A product with this identifier or name already exists.' });

    const requestedSku = String(skuCode ?? hsn ?? '').trim();
    if (requestedSku) {
      const duplicate = inventoryList.find((item) => {
        const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim().toLowerCase();
        return raw && raw === requestedSku.toLowerCase();
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `SKU code "${requestedSku}" is already added for product "${duplicate.englishName || duplicate.name}". Please use a different SKU number.`,
        });
      }
    }

    const finalPrice = parseFloat(price || unitPrice || pricePerKg) || 500;
    const finalSku = requestedSku || getNextInventoryCode();
    const finalHsn = String(hsn ?? '').trim() || finalSku;

    const newProduct = await Inventory.create({
      id,
      name,
      nameTa: nameTa || '',
      tagline: tagline || 'Traditional specialty',
      description: description || 'Fresh handcrafted item',
      pricePerKg: finalPrice,
      unitPrice: finalPrice,
      unit: unit || 'kg',
      stockKg: parseFloat(stockKg || initialStockKg) || 10,
      minThreshold: parseFloat(minThreshold) || 8,
      skuCode: finalSku,
      isInactive: false,
      isCustom: true,
      batchDate: 'Today',
      batchNote: 'New item addition',
      image: image || '/images/products/palkova_card.jpg',
      category: category || 'Ghee Sweets',
      hsn: finalHsn,
    });

    updateCatalogFile(id, (p) => ({
      ...p,
      id,
      name,
      nameTa: nameTa || '',
      skuCode: finalSku,
      hsn: finalHsn,
      price: finalPrice,
      unitPrice: finalPrice,
      pricePerKg: finalPrice,
      unit: unit || 'kg',
      category: category || 'sweets',
    }));

    const inventory = await Inventory.find({});
    console.log(`[Inventory] Added product '${name}' (${id}) with SKU "${finalSku}" and HSN "${finalHsn}" to catalog.`);
    res.json({ success: true, message: `Added '${name}' to catalog.`, product: newProduct, inventory });
  } catch (err) {
    console.error('[Inventory] Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to add product: ' + err.message });
  }
});

// Toggle stock availability (Off the stock / Inactive masking & reactivation)
app.patch('/api/inventory/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { isInactive } = req.body;

    let item = await Inventory.findOne({ id });
    if (!item) {
      // If not yet in Inventory collection (e.g. from static sweetsData), insert record
      item = await Inventory.create({
        id,
        name: id,
        isInactive: Boolean(isInactive),
      });
    } else {
      item.isInactive = Boolean(isInactive);
      await item.save();
    }

    console.log(`[Inventory] Product ${item.name || id} availability set to: ${item.isInactive ? '🔴 INACTIVE (Out of Stock)' : '🟢 ACTIVE (In Stock)'}`);
    res.json({ success: true, isInactive: item.isInactive, item });
  } catch (err) {
    console.error('[Inventory] Error toggling availability:', err);
    res.status(500).json({ success: false, message: 'Failed to update availability: ' + err.message });
  }
});

// Update product master details (name, englishName, tamilName, category, unit, price)
app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, englishName, tamilName, category, unit, price } = req.body;
    const numPrice = price !== undefined ? parseFloat(price) : undefined;

    const normalizedEnglish = typeof englishName === 'string' ? englishName.trim() : (typeof name === 'string' && name.includes('—') ? name.split('—')[0].trim() : undefined);
    const normalizedTamil = typeof tamilName === 'string' ? tamilName.trim() : (typeof name === 'string' && name.includes('—') ? name.split('—')[1].trim() : undefined);
    const normalizedName = typeof name === 'string' && name.trim()
      ? name.trim()
      : (normalizedEnglish ? (normalizedTamil ? `${normalizedEnglish} — ${normalizedTamil}` : normalizedEnglish) : id);

    let item = await Inventory.findOne({ id });
    if (!item) {
      item = await Inventory.create({
        id,
        name: normalizedName,
        englishName: normalizedEnglish,
        tamilName: normalizedTamil,
        category,
        unit,
        price: !isNaN(numPrice) ? numPrice : 0,
        pricePerKg: !isNaN(numPrice) ? numPrice : 0,
        unitPrice: !isNaN(numPrice) ? numPrice : 0,
      });
    } else {
      if (normalizedName !== undefined) item.name = normalizedName;
      if (normalizedEnglish !== undefined) item.englishName = normalizedEnglish;
      if (normalizedTamil !== undefined) item.tamilName = normalizedTamil;
      if (category !== undefined) item.category = category;
      if (unit !== undefined) item.unit = unit;
      if (!isNaN(numPrice)) {
        item.price = numPrice;
        item.pricePerKg = numPrice;
        item.unitPrice = numPrice;
      }
      await item.save();
    }

    updateCatalogFile(id, (p) => {
      const updated = { ...p };
      if (normalizedName !== undefined) updated.name = normalizedName;
      if (normalizedEnglish !== undefined) updated.englishName = normalizedEnglish;
      if (normalizedTamil !== undefined) updated.tamilName = normalizedTamil;
      if (category !== undefined) updated.category = category;
      if (unit !== undefined) updated.unit = unit;
      if (!isNaN(numPrice)) {
        updated.price = numPrice;
        updated.unitPrice = numPrice;
        updated.pricePerKg = numPrice;
      }
      return updated;
    });

    console.log(`[Inventory] Product ${item.name || id} details updated`);
    res.json({ success: true, message: `Product ${item.name} updated successfully`, item });
  } catch (err) {
    console.error('[Inventory] Error updating product details:', err);
    res.status(500).json({ success: false, message: 'Failed to update product details: ' + err.message });
  }
});

// Update master catalog unit price
app.patch('/api/inventory/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price value.' });
    }

    let item = await Inventory.findOne({ id });
    if (!item) {
      item = await Inventory.create({
        id,
        name: id,
        price: numPrice,
        pricePerKg: numPrice,
        unitPrice: numPrice,
      });
    } else {
      item.price = numPrice;
      item.pricePerKg = numPrice;
      item.unitPrice = numPrice;
      await item.save();
    }

    updateCatalogFile(id, (p) => ({ ...p, price: numPrice, unitPrice: numPrice, pricePerKg: numPrice }));

    console.log(`[Inventory] Product ${item.name || id} master price updated to: ₹${numPrice}`);
    res.json({ success: true, message: `Price updated to ₹${numPrice}`, price: numPrice, item });
  } catch (err) {
    console.error('[Inventory] Error updating price:', err);
    res.status(500).json({ success: false, message: 'Failed to update price: ' + err.message });
  }
});

// Update SKU/HSN Code for a product
app.patch('/api/inventory/:id/sku', async (req, res) => {
  try {
    const { id } = req.params;
    const { skuCode } = req.body;
    if (skuCode === undefined || skuCode === null) {
      return res.status(400).json({ success: false, message: 'skuCode is required.' });
    }

    const skuStr = String(skuCode).trim();

    // Ensure SKU code is unique (if not empty)
    if (skuStr !== '') {
      const existing = await Inventory.findOne({ skuCode: skuStr, id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `SKU code "${skuStr}" is already in use by "${existing.name}". Please choose a different code.` });
      }
    }

    let item = await Inventory.findOne({ id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found in inventory.' });
    }

    item.skuCode = skuStr;
    await item.save();

    updateCatalogFile(id, (p) => ({ ...p, skuCode: skuStr }));

    console.log(`[Inventory] Product ${item.name} SKU code updated to: "${skuStr}"`);
    res.json({ success: true, message: `SKU code updated to "${skuStr}"`, skuCode: skuStr, item });
  } catch (err) {
    console.error('[Inventory] Error updating SKU code:', err);
    res.status(500).json({ success: false, message: 'Failed to update SKU code: ' + err.message });
  }
});

// Delete product from catalog & move to 30-Day Recycle Bin
app.delete('/api/inventory/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let reason = req.body?.reason || req.query?.reason || 'Product removed from catalog';
    if (typeof reason === 'string') reason = reason.trim();
    let deletedBy = req.body?.deletedBy;
    if (!deletedBy && req.query?.deletedBy) {
      try { deletedBy = JSON.parse(req.query.deletedBy); } catch {}
    }

    const orQuery = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) orQuery.push({ _id: id });

    let existing = await Inventory.findOne({ $or: orQuery });
    let productData = existing ? (existing.toObject ? existing.toObject() : existing) : (req.body?.productData || null);

    if (!productData && fs.existsSync(CATALOG_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          productData = list.find((p) => p.id === id || String(p._id) === String(id));
        }
      } catch {}
    }

    const prodName = productData?.name || id;
    const activeDeletedBy = (deletedBy && deletedBy.id) ? deletedBy : {
      id: deletedBy?.id || 'staff-1',
      username: deletedBy?.username || 'admin',
      name: (deletedBy?.name && deletedBy.name !== 'Staff') ? deletedBy.name : 'S. Ramanathan',
      role: deletedBy?.role || 'admin',
    };

    // Store in 30-Day Recycle Bin
    const deletedRecord = await DeletedProduct.findOneAndUpdate(
      { id },
      {
        id,
        name: prodName,
        englishName: productData?.englishName || '',
        tamilName: productData?.tamilName || '',
        productData: productData || { id, name: prodName },
        deletedBy: activeDeletedBy,
        deletionReason: reason,
        deletedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      { upsert: true, new: true }
    );

    // Remove from active inventory completely
    await Inventory.deleteMany({ $or: orQuery });

    // Remove from catalog file
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

    // Log Activity for Admin Audit Trail
    const now = new Date();
    await ActivityLog.create({
      id: `act-delprod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'PRODUCT_DELETED',
      performedBy: activeDeletedBy,
      targetId: id,
      targetName: prodName,
      details: { productId: id, name: prodName },
      reason,
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    console.log(`[Inventory] Moved product ${id} (${prodName}) to Recycle Bin`);
    res.json({ success: true, message: `Product ${prodName} moved to 30-day Recycle Bin.`, deletedProduct: deletedRecord });
  } catch (err) {
    console.error('[Inventory] Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product: ' + err.message });
  }
});

// ============================================================
// 3B. PRICE OVERRIDE AUDIT LOGGING (FOR ADMIN VISIBILITY)
// ============================================================

app.post('/api/audit/price-override', async (req, res) => {
  try {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    const createdLogs = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    for (const entry of entries) {
      if (!entry.productName && !entry.productId) continue;
      const log = await PriceOverrideLog.create({
        id: entry.id || `ovr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        invoiceNumber: entry.invoiceNumber || 'COUNTER-DRAFT',
        cashier: entry.cashier || { name: 'Counter Staff', role: 'cashier', counter: 'Desk 01' },
        productId: entry.productId || '',
        productName: entry.productName || entry.item || 'Unknown Sweet',
        weightOrUnit: entry.weightOrUnit || entry.weight || 'unit',
        originalRate: Number(entry.originalRate || entry.originalPrice || 0),
        customRate: Number(entry.customRate || entry.customPrice || entry.overriddenPrice || 0),
        difference: Number(entry.difference ?? (Number(entry.customRate || entry.customPrice || 0) - Number(entry.originalRate || entry.originalPrice || 0))),
        quantity: Number(entry.quantity || 1),
        reason: entry.reason || 'Counter Customer Negotiation / Discount',
        timestamp: entry.timestamp || Date.now(),
        dateStr: entry.dateStr || dateStr,
        timeStr: entry.timeStr || timeStr,
      });
      createdLogs.push(log);
    }

    console.log(`[Audit] Recorded ${createdLogs.length} price override event(s)`);
    res.json({ success: true, count: createdLogs.length, logs: createdLogs });
  } catch (err) {
    console.error('[Audit] Error recording price override log:', err);
    res.status(500).json({ success: false, message: 'Failed to record audit log: ' + err.message });
  }
});

app.get('/api/audit/price-overrides', async (req, res) => {
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
    let invoiceNumber = billData.invoiceNumber;
    if (!invoiceNumber) {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayBillCount = await Bill.countDocuments({ createdAt: { $gte: startOfDay } });
      invoiceNumber = `POS-${todayBillCount + 1}`;
    }

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

// ─── Edit Bill (With Inventory Reconciliation & Full Audit History) ─────────
app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items,
      customer,
      paymentMethod,
      paymentDetails,
      splitCash,
      splitUpi,
      subtotal,
      grandTotal,
      taxBreakdown,
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
    const originalSubtotal = Number(bill.subtotal || 0);
    const updatedGrandTotal = grandTotal !== undefined ? Number(grandTotal) : originalGrandTotal;

    // Helper for weight deduction
    const getItemWeightKg = (item) => {
      const w = String(item.weight || item.unit || '').toLowerCase();
      if (w.includes('250g')) return 0.25;
      if (w.includes('500g')) return 0.5;
      if (w.includes('1kg')) return 1.0;
      if (w.includes('kg')) return parseFloat(w) || 0.5;
      if (w.includes('litre')) return 1.0;
      return 0.1; // Default for cups/pieces
    };

    // 1. Reconcile inventory stock differences
    if (items && Array.isArray(items)) {
      // Restore previous inventory
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
      // Deduct new inventory
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

    const activeEditor = (editedBy && editedBy.name) ? editedBy : {
      id: 'staff-2',
      name: 'Counter Cashier',
      role: 'cashier',
      counter: 'Counter Desk 01',
    };

    const editEvent = {
      id: `edit-${Date.now()}`,
      editedAt: Date.now(),
      dateStr,
      timeStr,
      editedBy: activeEditor,
      reason: editReason?.trim() || 'Billing Correction',
      originalGrandTotal,
      newGrandTotal: updatedGrandTotal,
      difference: Math.round((updatedGrandTotal - originalGrandTotal) * 100) / 100,
      previousItemCount: previousItems.length,
      newItemCount: (items || []).length,
    };

    const currentHistory = Array.isArray(bill.editHistory) ? bill.editHistory : [];
    bill.editHistory = [...currentHistory, editEvent];
    bill.isEdited = true;

    if (items) bill.items = items;
    if (customer) bill.customer = customer;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    if (paymentDetails) bill.paymentDetails = paymentDetails;
    if (splitCash !== undefined) bill.splitCash = splitCash;
    if (splitUpi !== undefined) bill.splitUpi = splitUpi;
    if (subtotal !== undefined) bill.subtotal = Number(subtotal);
    if (grandTotal !== undefined) bill.grandTotal = updatedGrandTotal;
    if (taxBreakdown) bill.taxBreakdown = taxBreakdown;

    await bill.save();

    // Log Activity for Audit Trail
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
        itemCount: (items || []).length,
      },
      reason: editReason?.trim() || 'Billing correction',
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
});

// ─── Delete Bill (Move to 30-Day Recycle Bin) ──────────────────────────────
app.delete('/api/bills/:id', async (req, res) => {
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
    let fromOrderCollection = false;

    if (!bill) {
      bill = await Order.findOne({ $or: queryOr });
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found in active bills.' });
      }
      fromOrderCollection = true;
    }

    const billObj = bill.toObject ? bill.toObject() : bill;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const activeDeletedBy = (deletedBy && deletedBy.id) ? deletedBy : {
      id: deletedBy?.id || (deletedBy?.role === 'cashier' ? 'staff-2' : 'staff-1'),
      username: deletedBy?.username || (deletedBy?.role === 'cashier' ? 'cashier' : 'admin'),
      name: (deletedBy?.name && deletedBy.name !== 'Staff') ? deletedBy.name : (deletedBy?.role === 'cashier' ? 'M. Kannan' : 'S. Ramanathan'),
      role: deletedBy?.role || 'admin',
    };

    // Store in Recycle Bin with 30 days retention
    const deletedRecord = await DeletedBill.create({
      id: billObj.id || billObj.invoiceNumber,
      invoiceNumber: billObj.invoiceNumber || billObj.id,
      billData: billObj,
      deletedBy: activeDeletedBy,
      deletionReason: reason.trim(),
      deletedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Remove from both active bills AND orders collections
    await Bill.deleteMany({ $or: queryOr });
    await Order.deleteMany({ $or: queryOr });

    // Log Activity for Admin
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
        customer: billObj.customer,
        paymentMethod: billObj.paymentMethod,
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
});

// ─── Recycle Bin: Fetch deleted bills (Auto-purges expired > 30 days) ───────
app.get('/api/recycle-bin/bills', async (req, res) => {
  try {
    const now = Date.now();
    // Auto purge expired items older than 30 days
    await DeletedBill.deleteMany({ expiresAt: { $lt: now } });

    const deletedBills = await DeletedBill.find({}).sort({ deletedAt: -1 });
    res.json({ success: true, deletedBills });
  } catch (err) {
    console.error('[Recycle Bin] Error fetching deleted bills:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch recycle bin' });
  }
});

// ─── Recycle Bin: Bulk Restore Bills back to active sales ────────────────────
app.post('/api/recycle-bin/bills/bulk-restore', async (req, res) => {
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

    const billsToInsert = records.map((r) => {
      const b = r.billData ? (r.billData.toObject ? r.billData.toObject() : r.billData) : null;
      if (b && b._id) delete b._id;
      return b;
    }).filter(Boolean);

    if (billsToInsert.length > 0) {
      for (const billData of billsToInsert) {
        await Bill.updateOne({ invoiceNumber: billData.invoiceNumber }, { $set: billData }, { upsert: true });
      }
    }

    const recordDbIds = records.map((r) => r._id);
    await DeletedBill.deleteMany({ _id: { $in: recordDbIds } });

    const activeRestoredBy = (restoredBy && restoredBy.id) ? restoredBy : {
      id: restoredBy?.id || 'staff-1',
      username: restoredBy?.username || 'admin',
      name: (restoredBy?.name && restoredBy.name !== 'Staff') ? restoredBy.name : 'S. Ramanathan',
      role: restoredBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Bulk Permanent Purge Bills ────────────────────────────────
app.delete('/api/recycle-bin/bills/bulk-permanent', async (req, res) => {
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

    const activePurgedBy = (purgedBy && purgedBy.id) ? purgedBy : {
      id: purgedBy?.id || 'staff-1',
      username: purgedBy?.username || 'admin',
      name: (purgedBy?.name && purgedBy.name !== 'Staff') ? purgedBy.name : 'S. Ramanathan',
      role: purgedBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Restore Bill back to active sales ──────────────────────────
app.post('/api/recycle-bin/bills/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { restoredBy } = req.body || {};

    const billQuery = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) billQuery.push({ _id: id });
    const deletedRecord = await DeletedBill.findOne({ $or: billQuery });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Deleted bill not found in Recycle Bin.' });
    }

    const billData = deletedRecord.billData;
    // Re-insert into active bills collection
    await Bill.create(billData);
    // Remove from recycle bin
    await DeletedBill.deleteOne({ _id: deletedRecord._id });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const activeRestoredBy = (restoredBy && restoredBy.id) ? restoredBy : {
      id: restoredBy?.id || 'staff-1',
      username: restoredBy?.username || 'admin',
      name: (restoredBy?.name && restoredBy.name !== 'Staff') ? restoredBy.name : 'S. Ramanathan',
      role: restoredBy?.role || 'admin',
    };

    // Log Activity for Admin
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
      dateStr,
      timeStr,
    });

    console.log(`[Recycle Bin] Restored bill ${billData.invoiceNumber} to active bills.`);
    res.json({ success: true, message: `Invoice #${billData.invoiceNumber} successfully restored!`, bill: billData });
  } catch (err) {
    console.error('[Recycle Bin] Error restoring bill:', err);
    res.status(500).json({ success: false, message: 'Failed to restore bill: ' + err.message });
  }
});

// ─── Recycle Bin: Permanent Purge ───────────────────────────────────────────
app.delete('/api/recycle-bin/bills/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;
    const { purgedBy } = req.body || {};

    const billQuery = [{ id }, { invoiceNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) billQuery.push({ _id: id });
    const deletedRecord = await DeletedBill.findOneAndDelete({ $or: billQuery });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found in Recycle Bin.' });
    }

    const activePurgedBy = (purgedBy && purgedBy.id) ? purgedBy : {
      id: purgedBy?.id || 'staff-1',
      username: purgedBy?.username || 'admin',
      name: (purgedBy?.name && purgedBy.name !== 'Staff') ? purgedBy.name : 'S. Ramanathan',
      role: purgedBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Fetch Deleted Products (30 Days) ─────────────────────────
app.get('/api/recycle-bin/products', async (req, res) => {
  try {
    const now = Date.now();
    await DeletedProduct.deleteMany({ expiresAt: { $lt: now } });
    const deletedProducts = await DeletedProduct.find({}).sort({ deletedAt: -1 });
    res.json({ success: true, deletedProducts });
  } catch (err) {
    console.error('[Recycle Bin] Error fetching deleted products:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deleted products: ' + err.message });
  }
});

// ─── Recycle Bin: Bulk Restore Products ────────────────────────────────────
app.post('/api/recycle-bin/products/bulk-restore', async (req, res) => {
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
      const prodData = record.productData ? (record.productData.toObject ? record.productData.toObject() : record.productData) : { id: record.id, name: record.name };
      delete prodData._id;
      await Inventory.updateOne({ id: record.id }, { $set: prodData }, { upsert: true });
    }

    const recordDbIds = records.map((r) => r._id);
    await DeletedProduct.deleteMany({ _id: { $in: recordDbIds } });
    await PurgedProduct.deleteMany({ $or: orConditions });

    const activeRestoredBy = (restoredBy && restoredBy.id) ? restoredBy : {
      id: restoredBy?.id || 'staff-1',
      username: restoredBy?.username || 'admin',
      name: (restoredBy?.name && restoredBy.name !== 'Staff') ? restoredBy.name : 'S. Ramanathan',
      role: restoredBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Bulk Permanent Purge Products ────────────────────────────
app.delete('/api/recycle-bin/products/bulk-permanent', async (req, res) => {
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

    // Expunge completely from active Inventory collection as well
    await Inventory.deleteMany({ $or: orConditions });

    // Expunge completely from catalog.json
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

    // Record as permanently purged so seeder / sync NEVER resurrects them
    for (const pid of stringIds) {
      await PurgedProduct.updateOne({ id: pid }, { $set: { id: pid, purgedAt: Date.now() } }, { upsert: true });
    }

    const activePurgedBy = (purgedBy && purgedBy.id) ? purgedBy : {
      id: purgedBy?.id || 'staff-1',
      username: purgedBy?.username || 'admin',
      name: (purgedBy?.name && purgedBy.name !== 'Staff') ? purgedBy.name : 'S. Ramanathan',
      role: purgedBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Restore Product ──────────────────────────────────────────
app.post('/api/recycle-bin/products/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { restoredBy } = req.body || {};

    const prodQuery = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) prodQuery.push({ _id: id });
    const deletedRecord = await DeletedProduct.findOne({ $or: prodQuery });
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found in Recycle Bin.' });
    }

    const prodData = deletedRecord.productData ? (deletedRecord.productData.toObject ? deletedRecord.productData.toObject() : deletedRecord.productData) : { id: deletedRecord.id, name: deletedRecord.name };
    delete prodData._id;

    // Restore to active Inventory
    await Inventory.updateOne({ id: deletedRecord.id }, { $set: prodData }, { upsert: true });

    // Restore to catalog file if available
    try {
      if (fs.existsSync(CATALOG_FILE_PATH)) {
        const raw = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && !list.some((p) => p.id === deletedRecord.id)) {
          list.push(prodData);
          fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
        }
      }
    } catch {}

    // Remove from Recycle Bin and Purged list
    await DeletedProduct.deleteOne({ _id: deletedRecord._id });
    await PurgedProduct.deleteOne({ id: deletedRecord.id });

    const activeRestoredBy = (restoredBy && restoredBy.id) ? restoredBy : {
      id: restoredBy?.id || 'staff-1',
      username: restoredBy?.username || 'admin',
      name: (restoredBy?.name && restoredBy.name !== 'Staff') ? restoredBy.name : 'S. Ramanathan',
      role: restoredBy?.role || 'admin',
    };

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
});

// ─── Recycle Bin: Permanent Purge Product ──────────────────────────────────
app.delete('/api/recycle-bin/products/:id/permanent', async (req, res) => {
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

    // Completely expunge from active Inventory as well
    await Inventory.deleteMany({ $or: prodQuery });

    // Completely expunge from catalog.json
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

    // Record as permanently purged so seeder / sync NEVER resurrects it
    await PurgedProduct.updateOne({ id }, { $set: { id, purgedAt: Date.now() } }, { upsert: true });

    const activePurgedBy = (purgedBy && purgedBy.id) ? purgedBy : {
      id: purgedBy?.id || 'staff-1',
      username: purgedBy?.username || 'admin',
      name: (purgedBy?.name && purgedBy.name !== 'Staff') ? purgedBy.name : 'S. Ramanathan',
      role: purgedBy?.role || 'admin',
    };

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
});

// ─── Generic Admin Activity Logging ─────────────────────────────────────────
app.get('/api/audit/activities', async (req, res) => {
  try {
    const { limit = 300, type } = req.query;
    const filter = {};
    if (type && type !== 'all') {
      filter.actionType = type;
    }
    const activities = await ActivityLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));

    // Normalize and sanitize any legacy records where performedBy was generic 'Staff' or missing id
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
});

app.post('/api/audit/activity', async (req, res) => {
  try {
    const entry = req.body;
    const now = new Date();
    let performer = entry.performedBy;
    if (!performer || performer.name === 'Staff' || !performer.id || performer.id === 'staff-1' || performer.username === 'admin') {
      const isCashier = entry.actionType === 'PRICE_OVERRIDE' && performer?.role === 'cashier' && performer?.id !== 'staff-1';
      performer = isCashier
        ? { id: performer?.id || 'staff-2', username: performer?.username || 'cashier', name: (performer?.name && performer.name !== 'Staff') ? performer.name : 'M. Kannan', role: 'cashier', title: 'Counter Cashier' }
        : { id: 'staff-1', username: 'admin', name: (performer?.name && performer.name !== 'Staff') ? performer.name : 'S. Ramanathan', role: 'admin', title: 'Kitchen Operations Head' };
    }

    const created = await ActivityLog.create({
      id: entry.id || `act-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: entry.actionType || 'GENERIC_ACTIVITY',
      performedBy: performer,
      targetId: entry.targetId || '',
      targetName: entry.targetName || '',
      details: entry.details || {},
      reason: entry.reason || '',
      timestamp: entry.timestamp || Date.now(),
      dateStr: entry.dateStr || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: entry.timeStr || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    res.json({ success: true, activity: created });
  } catch (err) {
    console.error('[Audit] Error recording activity:', err);
    res.status(500).json({ success: false, message: 'Failed to record activity' });
  }
});


// ─── Offline Batch Sync ──────────────────────────────────────────────────────
app.post('/api/bills/sync-batch', async (req, res) => {
  try {
    const { bills: incomingBills } = req.body;
    if (!Array.isArray(incomingBills) || incomingBills.length === 0) {
      return res.status(400).json({ success: false, message: 'No bills provided for sync.' });
    }

    const synced = [];
    const skipped = [];
    const failed = [];

    for (const billData of incomingBills) {
      try {
        // De-duplicate: check if bill already exists by id or invoiceNumber
        const exists = await Bill.findOne({
          $or: [
            { id: billData.id },
            { invoiceNumber: billData.invoiceNumber },
          ],
        });

        if (exists) {
          skipped.push({ id: billData.id, invoiceNumber: billData.invoiceNumber, reason: 'already_exists' });
          continue;
        }

        const now = new Date();
        const invoiceNumber = billData.invoiceNumber || `SYNC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const savedBill = await Bill.create({
          ...billData,
          invoiceNumber,
          id: billData.id || `sync-${Date.now()}`,
          syncedAt: Date.now(),
          isOfflineBackup: billData.isOfflineBackup || true,
          source: 'counter',
          status: 'Completed',
        });

        synced.push(savedBill.id);

        // Deduct inventory for synced bills
        if (savedBill.items && Array.isArray(savedBill.items)) {
          for (const item of savedBill.items) {
            const inv = await Inventory.findOne({ id: item.id });
            if (inv) {
              const w = String(item.weight || '').toLowerCase();
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
      } catch (itemErr) {
        console.error(`[Sync-Batch] Failed for bill ${billData.id}:`, itemErr.message);
        failed.push({ id: billData.id, error: itemErr.message });
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
});



app.get('/google9b5b47e16db557a3.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google9b5b47e16db557a3.html');
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
