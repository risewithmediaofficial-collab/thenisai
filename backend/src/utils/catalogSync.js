import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Staff, Inventory, PurgedProduct, DeletedProduct } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const CATALOG_FILE_PATH = path.resolve(__dirname, '../../data/catalog.json');

export function updateCatalogFile(productId, updateFn) {
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

export async function seedIfEmpty() {
  const staffCount = await Staff.countDocuments();
  if (staffCount === 0) {
    await Staff.insertMany([
      { id: 'staff-1', username: 'admin', password: 'admin123', name: 'S. Ramanathan', title: 'Kitchen Operations Head', role: 'admin', counter: 'Operations Central' },
      { id: 'staff-2', username: 'cashier', password: 'cashier123', name: 'M. Kannan', title: 'Counter Cashier', role: 'cashier', counter: 'Counter Desk 01' },
      { id: 'staff-manager', username: 'manager', password: 'manager123', name: 'Company Manager', title: 'Central Godown & Stock Head', role: 'company_manager', counter: 'Central Godown' },
      { id: 'staff-3', username: 'tester', password: 'test123', name: 'Demo Tester', title: 'Sandbox Testing (No Data Impact)', role: 'tester', counter: 'Sandbox Terminal' },
    ]);
    console.log('[Seed] Staff accounts created');
  } else {
    await Staff.updateOne(
      { username: 'manager' },
      { $setOnInsert: { id: 'staff-manager', username: 'manager', password: 'manager123', name: 'Company Manager', title: 'Central Godown & Stock Head', role: 'company_manager', counter: 'Central Godown' } },
      { upsert: true }
    );
    await Staff.updateOne(
      { username: 'tester' },
      { $setOnInsert: { id: 'staff-3', username: 'tester', password: 'test123', name: 'Demo Tester', title: 'Sandbox Testing (No Data Impact)', role: 'tester', counter: 'Sandbox Terminal' } },
      { upsert: true }
    );
  }

  // Load catalog exclusively from catalog.json if available to keep MongoDB up to date
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
            category: cItem.category || 'sweets',
            ...(cItem.isUnlimitedStock !== undefined ? { isUnlimitedStock: Boolean(cItem.isUnlimitedStock) } : {}),
            ...(cItem.isInactive !== undefined ? { isInactive: cItem.isInactive } : {}),
            ...(cItem.name ? { name: cItem.name } : {}),
            ...(cItem.englishName ? { englishName: cItem.englishName } : {}),
            ...(cItem.tamilName ? { tamilName: cItem.tamilName } : {}),
            ...(cItem.image ? { image: cItem.image } : {}),
            ...(cItem.hsn ? { hsn: cItem.hsn } : {}),
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
