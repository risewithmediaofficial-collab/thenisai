import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// In-memory sessions store
const activeSessions = new Map();

// Helper to read database
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { staff: [], inventory: [], orders: [], bills: [], otps: {} };
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { staff: [], inventory: [], orders: [], bills: [], otps: {} };
  }
}

// Helper to write database safely
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ============================================================
// 1. AUTHENTICATION (ADMIN & CASHIER)
// ============================================================

app.post('/api/auth/login', (req, res) => {
  const { role, username, password, pin } = req.body;
  const db = readDb();

  let matchedStaff = null;

  // Login via username / ID & password
  if (username && password) {
    const inputUname = username.trim().toLowerCase();
    matchedStaff = db.staff.find(
      (s) =>
        (s.username.toLowerCase() === inputUname || s.id.toLowerCase() === inputUname) &&
        s.password === password.trim()
    );
  }

  // If role is explicitly requested, ensure it matches
  if (matchedStaff && role && matchedStaff.role !== role) {
    // Admin can also access cashier POS, but cashier cannot access admin
    if (role === 'admin' && matchedStaff.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin privileges required for this portal.',
      });
    }
  }

  if (!matchedStaff) {
    return res.status(401).json({
      success: false,
      message: 'Invalid User ID / Username or Password. Please try again.',
    });
  }

  // Generate session token
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

  return res.json({
    success: true,
    message: `Welcome, ${matchedStaff.name}`,
    token,
    user: userProfile,
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  const user = activeSessions.get(token);

  if (!user) {
    // Check fallback in db
    const db = readDb();
    const tokenParts = token.split('_');
    const staffId = tokenParts[2];
    const fallbackStaff = db.staff.find((s) => s.id === staffId);
    if (fallbackStaff) {
      const profile = {
        id: fallbackStaff.id,
        username: fallbackStaff.username,
        name: fallbackStaff.name,
        title: fallbackStaff.title,
        role: fallbackStaff.role,
        counter: fallbackStaff.counter,
      };
      activeSessions.set(token, profile);
      return res.json({ success: true, user: profile });
    }
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  return res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================================
// 2. MOBILE NUMBER OTP SYSTEM (ONLINE ORDERING)
// ============================================================

app.post('/api/otp/send', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  // Extract clean 10-digit number
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian mobile number.',
    });
  }

  // Generate 6-digit random OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const db = readDb();
  if (!db.otps) db.otps = {};
  db.otps[cleanPhone] = {
    otp,
    expiresAt,
    verified: false,
    attempts: 0,
    createdAt: Date.now(),
  };
  writeDb(db);

  console.log(`====================================================`);
  console.log(`[Thenisai OTP Gateway] 📱 Mobile: +91 ${cleanPhone}`);
  console.log(`[Thenisai OTP Gateway] 🔑 OTP Code: ${otp} (Valid for 5 mins)`);
  console.log(`====================================================`);

  return res.json({
    success: true,
    message: `Verification code sent to +91 ${cleanPhone}`,
    phone: cleanPhone,
    devOtp: otp, // Returned for effortless demo/testing without real SMS gateway cost
    expiresInSeconds: 300,
  });
});

app.post('/api/otp/verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const cleanOtp = String(otp).trim();

  const db = readDb();
  const record = db.otps ? db.otps[cleanPhone] : null;

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No active OTP found for this number. Please request a new OTP.',
    });
  }

  if (Date.now() > record.expiresAt) {
    delete db.otps[cleanPhone];
    writeDb(db);
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please request a fresh OTP code.',
    });
  }

  if (record.otp !== cleanOtp) {
    record.attempts = (record.attempts || 0) + 1;
    writeDb(db);
    return res.status(400).json({
      success: false,
      message: 'Incorrect OTP entered. Please try again.',
    });
  }

  // Mark phone as verified
  record.verified = true;
  const verificationToken = `vtok_${cleanPhone}_${Date.now()}`;
  record.token = verificationToken;
  writeDb(db);

  console.log(`[OTP Gateway] ✓ Verified phone +91 ${cleanPhone}`);

  return res.json({
    success: true,
    verified: true,
    message: `Mobile number +91 ${cleanPhone} successfully verified.`,
    verificationToken,
    phone: cleanPhone,
  });
});

// ============================================================
// 3. INVENTORY & BATCH MANAGEMENT
// ============================================================

app.get('/api/inventory', (req, res) => {
  const db = readDb();
  res.json({ success: true, inventory: db.inventory || [] });
});

app.post('/api/inventory/stock', (req, res) => {
  const { sweetId, addKg, batchCode, batchNote, isRefill } = req.body;
  const db = readDb();

  const item = db.inventory.find((it) => it.id === sweetId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Sweet item not found.' });
  }

  const prevStock = item.stockKg || 0;
  const added = parseFloat(addKg) || 0;
  item.stockKg = Math.round((prevStock + added) * 10) / 10;

  if (batchCode) item.batchCode = batchCode;
  if (batchNote) item.batchNote = batchNote;
  item.batchDate = 'Just now';

  writeDb(db);

  console.log(
    `[Inventory] ${isRefill ? 'Refilled tray' : 'Inwarded batch'} for ${item.name}: +${added} kg (Now: ${item.stockKg} kg)`
  );

  res.json({
    success: true,
    message: `Added +${added} kg to ${item.name}. New total: ${item.stockKg} kg`,
    sweet: item,
    inventory: db.inventory,
  });
});

app.post('/api/inventory/products', (req, res) => {
  const { name, tagline, description, pricePerKg, initialStockKg, image, category } = req.body;
  const db = readDb();

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const existing = db.inventory.find((it) => it.id === id);
  if (existing) {
    return res.status(400).json({ success: false, message: 'A sweet with this name already exists.' });
  }

  const newProduct = {
    id,
    name,
    tagline: tagline || 'Traditional specialty',
    description: description || 'Fresh handcrafted sweet',
    pricePerKg: parseFloat(pricePerKg) || 500,
    stockKg: parseFloat(initialStockKg) || 10,
    minThreshold: 8,
    batchDate: 'Today',
    batchNote: 'New kitchen batch',
    image: image || '/palkova_card.jpg',
    category: category || 'Ghee Sweets',
    hsn: '2106',
  };

  db.inventory.push(newProduct);
  writeDb(db);

  res.json({
    success: true,
    message: `Added new sweet '${name}' to catalog.`,
    product: newProduct,
    inventory: db.inventory,
  });
});

// ============================================================
// 4. ORDERS & INVOICES (ONLINE & COUNTER)
// ============================================================

app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json({ success: true, orders: db.orders || [] });
});

app.post('/api/orders', (req, res) => {
  const {
    customer,
    shippingAddress,
    items,
    subtotal,
    taxBreakdown,
    deliveryFee,
    grandTotal,
    paymentMethod,
    upiUtr,
    giftNote,
  } = req.body;

  const db = readDb();

  // Validate OTP verification for online orders
  const cleanPhone = customer?.phone ? String(customer.phone).replace(/\D/g, '').slice(-10) : '';
  const otpRecord = db.otps ? db.otps[cleanPhone] : null;

  if (!customer?.verifiedViaOtp && (!otpRecord || !otpRecord.verified)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number must be verified with OTP before placing an online order.',
    });
  }

  const now = new Date();
  const year = now.getFullYear();
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `THN-${year}-${randomSeq}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    invoiceNumber,
    orderDate: now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    orderTime: now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    customer: {
      fullName: customer.fullName,
      phone: cleanPhone,
      email: customer.email,
      verifiedViaOtp: true,
    },
    shippingAddress,
    items: items || [],
    subtotal: subtotal || 0,
    taxBreakdown: taxBreakdown || { rate: 5, totalTax: 0, cgst: 0, sgst: 0, igst: 0, isInterState: false },
    deliveryFee: deliveryFee || 0,
    grandTotal: grandTotal || 0,
    paymentMethod: paymentMethod || 'cod',
    upiUtr: upiUtr || '',
    giftNote: giftNote || '',
    source: 'online',
    status: 'New',
    createdAt: Date.now(),
  };

  // Deduct inventory
  if (items && Array.isArray(items)) {
    items.forEach((item) => {
      const inv = db.inventory.find((i) => i.id === item.id);
      if (inv) {
        let weightKg = 0.5;
        const w = String(item.weight).toLowerCase();
        if (w.includes('250g')) weightKg = 0.25;
        else if (w.includes('500g')) weightKg = 0.5;
        else if (w.includes('1kg') || w.includes('1 kg')) weightKg = 1.0;
        else if (w.includes('kg')) weightKg = parseFloat(w) || 0.5;

        const totalKg = weightKg * (item.quantity || 1);
        inv.stockKg = Math.max(0, Math.round((inv.stockKg - totalKg) * 10) / 10);
      }
    });
  }

  db.orders.unshift(newOrder);
  writeDb(db);

  console.log(`[Order] New online order placed: ${invoiceNumber} by ${customer.fullName} (+91 ${cleanPhone})`);

  res.json({
    success: true,
    message: 'Online order confirmed and recorded successfully!',
    order: newOrder,
  });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const db = readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.status = status;
  writeDb(db);

  console.log(`[Order Status] Order ${order.invoiceNumber} status updated to: ${status}`);

  res.json({ success: true, message: `Status updated to ${status}`, order });
});

// In-store POS bills
app.post('/api/bills', (req, res) => {
  const billData = req.body;
  const db = readDb();

  const now = new Date();
  const year = now.getFullYear();
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = billData.invoiceNumber || `THN-POS-${year}-${randomSeq}`;

  const finalBill = {
    ...billData,
    id: `bill-${Date.now()}`,
    invoiceNumber,
    createdAt: Date.now(),
    source: 'counter',
  };

  // Deduct inventory for counter sales
  if (finalBill.items && Array.isArray(finalBill.items)) {
    finalBill.items.forEach((item) => {
      const inv = db.inventory.find((i) => i.id === item.id);
      if (inv) {
        let weightKg = 0.5;
        const w = String(item.weight).toLowerCase();
        if (w.includes('250g')) weightKg = 0.25;
        else if (w.includes('500g')) weightKg = 0.5;
        else if (w.includes('1kg') || w.includes('1 kg')) weightKg = 1.0;
        else if (w.includes('kg')) weightKg = parseFloat(w) || 0.5;

        const totalKg = weightKg * (item.quantity || 1);
        inv.stockKg = Math.max(0, Math.round((inv.stockKg - totalKg) * 10) / 10);
      }
    });
  }

  if (!db.bills) db.bills = [];
  db.bills.unshift(finalBill);
  writeDb(db);

  console.log(`[POS Billing] New Bill Generated: ${invoiceNumber} Total: ₹${finalBill.grandTotal}`);

  res.json({ success: true, bill: finalBill });
});

app.get('/api/bills', (req, res) => {
  const db = readDb();
  res.json({ success: true, bills: db.bills || [] });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Thenisai Sweets Backend Engine',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`✨ THENISAI SWEETS BACKEND SERVER RUNNING`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
