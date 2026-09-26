import mongoose from 'mongoose';
import fs from 'fs';
import { Inventory, PurgedProduct, DeletedProduct, ActivityLog } from '../models/index.js';
import { updateCatalogFile, CATALOG_FILE_PATH } from '../utils/catalogSync.js';
import { sanitizeProduct } from '../utils/sanitize.js';

export async function getInventory(req, res) {
  try {
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
  } catch (err) {
    console.error('[Inventory] Error fetching inventory:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
}

export async function addStock(req, res) {
  try {
    const { sweetId, addKg, batchCode, batchNote, isRefill } = req.body;
    const item = await Inventory.findOne({ id: sweetId });
    if (!item) return res.status(404).json({ success: false, message: 'Sweet item not found.' });

    const added = parseFloat(addKg) || 0;
    item.stockKg = Math.round((item.stockKg + added) * 10) / 10;
    if (batchCode) item.batchCode = String(batchCode).trim();
    if (batchNote) item.batchNote = String(batchNote).trim();
    item.batchDate = 'Just now';
    await item.save();

    const inventory = await Inventory.find({});
    console.log(`[Inventory] ${isRefill ? 'Refilled' : 'Inwarded'} ${item.name}: +${added} kg → ${item.stockKg} kg`);
    res.json({ success: true, message: `Added +${added} kg to ${item.name}. New total: ${item.stockKg} kg`, sweet: item, inventory });
  } catch (err) {
    console.error('[Inventory] Stock update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update stock: ' + err.message });
  }
}

export async function addProduct(req, res) {
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
      isUnlimitedStock,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

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

    const cleanName = String(name).trim();
    const id = (customId && String(customId).trim()) || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');

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
      name: cleanName,
      nameTa: nameTa ? String(nameTa).trim() : '',
      tagline: tagline ? String(tagline).trim() : 'Traditional specialty',
      description: description ? String(description).trim() : 'Fresh handcrafted item',
      price: finalPrice,
      pricePerKg: finalPrice,
      unitPrice: finalPrice,
      unit: unit ? String(unit).trim() : 'kg',
      stockKg: parseFloat(stockKg || initialStockKg) || 10,
      counterStock: parseFloat(stockKg || initialStockKg) || 10,
      godownStock: 0,
      minThreshold: parseFloat(minThreshold) || 8,
      skuCode: finalSku,
      isInactive: false,
      isCustom: true,
      batchDate: 'Today',
      batchNote: 'New item addition',
      image: image ? String(image).trim() : '/images/products/palkova_card.jpg',
      category: category ? String(category).trim() : 'Ghee Sweets',
      hsn: finalHsn,
      isUnlimitedStock: Boolean(isUnlimitedStock),
    });

    updateCatalogFile(id, (p) => ({
      ...p,
      id,
      name: cleanName,
      nameTa: nameTa ? String(nameTa).trim() : '',
      skuCode: finalSku,
      hsn: finalHsn,
      price: finalPrice,
      unitPrice: finalPrice,
      pricePerKg: finalPrice,
      unit: unit ? String(unit).trim() : 'kg',
      category: category ? String(category).trim() : 'sweets',
      isUnlimitedStock: Boolean(isUnlimitedStock),
    }));

    const inventory = await Inventory.find({});
    console.log(`[Inventory] Added product '${cleanName}' (${id}) with SKU "${finalSku}"`);
    res.json({ success: true, message: `Added '${cleanName}' to catalog.`, product: newProduct, inventory });
  } catch (err) {
    console.error('[Inventory] Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to add product: ' + err.message });
  }
}

export async function updateAvailability(req, res) {
  try {
    const { id } = req.params;
    const { isInactive } = req.body;

    let item = await Inventory.findOne({ id });
    if (!item) {
      item = await Inventory.create({
        id,
        name: id,
        isInactive: Boolean(isInactive),
      });
    } else {
      item.isInactive = Boolean(isInactive);
      await item.save();
    }

    console.log(`[Inventory] Product ${item.name || id} availability set to: ${item.isInactive ? '🔴 INACTIVE' : '🟢 ACTIVE'}`);
    res.json({ success: true, isInactive: item.isInactive, item });
  } catch (err) {
    console.error('[Inventory] Error toggling availability:', err);
    res.status(500).json({ success: false, message: 'Failed to update availability: ' + err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, englishName, tamilName, category, unit, price, isUnlimitedStock } = req.body;
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
        category: category ? String(category).trim() : undefined,
        unit: unit ? String(unit).trim() : undefined,
        price: !isNaN(numPrice) ? numPrice : 0,
        pricePerKg: !isNaN(numPrice) ? numPrice : 0,
        unitPrice: !isNaN(numPrice) ? numPrice : 0,
        isUnlimitedStock: typeof isUnlimitedStock === 'boolean' ? isUnlimitedStock : false,
      });
    } else {
      if (normalizedName !== undefined) item.name = normalizedName;
      if (normalizedEnglish !== undefined) item.englishName = normalizedEnglish;
      if (normalizedTamil !== undefined) item.tamilName = normalizedTamil;
      if (category !== undefined) item.category = String(category).trim();
      if (unit !== undefined) item.unit = String(unit).trim();
      if (typeof isUnlimitedStock === 'boolean') item.isUnlimitedStock = isUnlimitedStock;
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
      if (category !== undefined) updated.category = String(category).trim();
      if (unit !== undefined) updated.unit = String(unit).trim();
      if (typeof isUnlimitedStock === 'boolean') updated.isUnlimitedStock = isUnlimitedStock;
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
}

export async function updateUnlimitedStock(req, res) {
  try {
    const { id } = req.params;
    const { isUnlimitedStock } = req.body;
    let item = await Inventory.findOne({ id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const nextVal = typeof isUnlimitedStock === 'boolean' ? isUnlimitedStock : !item.isUnlimitedStock;
    item.isUnlimitedStock = nextVal;
    await item.save();

    updateCatalogFile(id, (p) => ({
      ...p,
      isUnlimitedStock: nextVal,
    }));

    console.log(`[Inventory] Product ${item.name || id} unlimited stock set to: ${nextVal}`);
    res.json({ success: true, message: `Product ${item.name} unlimited stock set to ${nextVal}`, item });
  } catch (err) {
    console.error('[Inventory] Error setting unlimited stock:', err);
    res.status(500).json({ success: false, message: 'Failed to update unlimited stock: ' + err.message });
  }
}

export async function updatePrice(req, res) {
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
}

export async function updateSku(req, res) {
  try {
    const { id } = req.params;
    const { skuCode } = req.body;
    if (skuCode === undefined || skuCode === null) {
      return res.status(400).json({ success: false, message: 'skuCode is required.' });
    }

    const skuStr = String(skuCode).trim();

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
}

export async function deleteProduct(req, res) {
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
    const activeDeletedBy = {
      id: String(deletedBy?.id || 'staff-1'),
      username: String(deletedBy?.username || 'admin'),
      name: String(deletedBy?.name && deletedBy.name !== 'Staff' ? deletedBy.name : 'S. Ramanathan'),
      role: String(deletedBy?.role || 'admin'),
    };

    const sanitizedData = sanitizeProduct(productData || { id, name: prodName });

    const deletedRecord = await DeletedProduct.findOneAndUpdate(
      { id },
      {
        id,
        name: prodName,
        englishName: productData?.englishName || '',
        tamilName: productData?.tamilName || '',
        productData: sanitizedData,
        deletedBy: activeDeletedBy,
        deletionReason: reason,
        deletedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      { upsert: true, new: true }
    );

    await Inventory.deleteMany({ $or: orQuery });

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
}
