import { Customer, Otp, PreOrder } from '../models/index.js';

export async function sendOtp(req, res) {
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
}

export async function verifyOtp(req, res) {
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
}

export async function authOtp(req, res) {
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
}

export async function getCustomerMe(req, res) {
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
}

export async function wishlistToggle(req, res) {
  const { phone, productId } = req.body;
  if (!phone || !productId) return res.status(400).json({ success: false, message: 'Phone and productId are required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found. Please verify with OTP first.' });
  }

  const cleanId = String(productId).trim();
  const currentList = Array.isArray(customer.wishlist) ? customer.wishlist : [];
  const exists = currentList.includes(cleanId);
  let updatedList;
  if (exists) {
    updatedList = currentList.filter((id) => id !== cleanId);
  } else {
    updatedList = [...currentList, cleanId];
  }

  customer.wishlist = updatedList;
  await customer.save();

  return res.json({
    success: true,
    action: exists ? 'removed' : 'added',
    wishlist: updatedList,
  });
}

export async function wishlistSync(req, res) {
  const { phone, wishlist } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone is required.' });

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  let customer = await Customer.findOne({ phone: cleanPhone });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const cleanIncoming = Array.isArray(wishlist)
    ? wishlist.filter((id) => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim())
    : [];
  const merged = Array.from(new Set([...(customer.wishlist || []), ...cleanIncoming]));
  customer.wishlist = merged;
  await customer.save();

  return res.json({ success: true, wishlist: merged });
}

export async function customerLogin(req, res) {
  try {
    const { phone, password, name } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Mobile number is required.' });

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    const enteredPass = String(password || '').trim();
    let customer = await Customer.findOne({ phone: cleanPhone });
    const token = `cust_${cleanPhone}_${Date.now()}`;

    if (!customer) {
      customer = await Customer.create({
        phone: cleanPhone,
        password: cleanPhone,
        name: name?.trim() || `Customer ${cleanPhone.slice(-4)}`,
        wishlist: [],
        token,
        lastLogin: Date.now(),
      });
      console.log(`[Customer Login] 👤 New account created for +91 ${cleanPhone}`);
    } else {
      const validPass = customer.password || cleanPhone;
      if (enteredPass && enteredPass !== cleanPhone && enteredPass !== validPass) {
        return res.status(400).json({ success: false, message: 'Incorrect password. Your 10-digit mobile number is your password.' });
      }
      customer.password = cleanPhone;
      customer.token = token;
      customer.lastLogin = Date.now();
      if (name?.trim()) customer.name = name.trim();
      await customer.save();
    }

    const preOrders = await PreOrder.find({ customerPhone: cleanPhone }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Login successful',
      customer: {
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        wishlist: customer.wishlist || [],
      },
      token,
      preOrders,
    });
  } catch (err) {
    console.error('[Customer Login] Error:', err);
    res.status(500).json({ success: false, message: 'Login failed: ' + err.message });
  }
}
