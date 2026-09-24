/**
 * THENISAI — Product Unit & Stock Preset Configuration
 * Dynamic unit configuration supporting: kg, pcs, litres, cups, packets
 */

// Precise list of authentic beverage drink IDs sold in Cups
export const BEVERAGE_DRINK_IDS = new Set([
  'tea',
  'coffee',
  'filter-coffee',
  'milk',
  'horlicks',
  'boost',
  'badam-milk',
  'ragi-malt',
  'lemon-tea',
  'sugu-tea',
  'magu-tea',
  'ginger-lemon',
  'buttermilk',
  'rose-milk',
  'badam-cold-milk',
]);

// Precise list of sweets/savouries that are sold by Piece (Pc)
export const PIECE_ITEM_IDS = new Set([
  'vada',
  'suryakala',
  'jamun',
  'sandwich-sweet',
  'basundi',
  'rasmalai',
  'dal-poli',
  'coconut-poli',
  'athirasam',
  'ellu-urundai',
  'gulkand-laddu',
  'ashoka-makkan-peda',
  'ellu-urundai-adai',
]);

// Precise list of packaged products sold by Packet (Pkt)
export const PACKET_ITEM_IDS = new Set([
  'pori-urundai',
  'kara-pori-packet',
  'curd-packet',
]);

// Precise list of liquid/bottle items sold in Litres / Bottles
export const LITRE_BOTTLE_IDS = new Set([
  'ghee',
  'water-500ml',
  'water-1000ml',
  'water-2000ml',
  'bovonto',
]);

/**
 * Check if a product is a beverage drink served in cups (Tea, Coffee, Milk, Badam Milk, etc.)
 * Strictly guards against sweets/savouries that contain "milk" in their name/id (like Baby Milk, Milk Cake, Milk Peda, Thenisai Milk Murukku).
 */
export function isBeverageDrink(item) {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase().trim();
  const cat = String(item.category || '').toLowerCase().trim();
  const u = String(item.unit || '').toLowerCase().trim();
  const name = String(item.name || item.englishName || '').toLowerCase().trim();

  // Exclude milk-based sweets/savouries that are sold by weight (kg)
  if (
    id === 'baby-milk' ||
    id === 'milk-cake' ||
    id === 'milk-peda' ||
    id === 'thenisai-milk-murukku' ||
    id === 'onion-milk-halwa' ||
    name.includes('peda') ||
    name.includes('cake') ||
    name.includes('burfi') ||
    name.includes('murukku') ||
    name.includes('halwa') ||
    name.includes('laddu')
  ) {
    return false;
  }

  if (BEVERAGE_DRINK_IDS.has(id)) return true;
  if (u.includes('cup')) return true;

  if (cat === 'beverages' || cat === 'hot beverages' || cat === 'cold beverages') {
    return true;
  }

  return false;
}

/**
 * Check if a product is sold per Piece (Vada, Suryakala, Poli, etc.)
 */
export function isPieceItem(item) {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase().trim();
  const cat = String(item.category || '').toLowerCase().trim();
  const u = String(item.unit || '').toLowerCase().trim();

  if (PIECE_ITEM_IDS.has(id)) return true;
  if (u === 'pc' || u === '1 pc' || u === 'piece' || u === 'pieces') return true;
  if (cat === 'snacks') return true;

  return false;
}

/**
 * Check if a product is sold per Packet (Curd Packet, Kara Pori Packet, etc.)
 */
export function isPacketItem(item) {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase().trim();
  const u = String(item.unit || '').toLowerCase().trim();

  if (PACKET_ITEM_IDS.has(id)) return true;
  if (u === 'pkt' || u === '1 pkt' || u === 'packet' || u === 'pkts' || u === 'box') return true;

  return false;
}

/**
 * Check if a product is a liquid / volume item (Ghee in Litres, Water bottles, etc.)
 */
export function isLitreProduct(item) {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase().trim();
  const u = String(item.unit || '').toLowerCase().trim();

  if (LITRE_BOTTLE_IDS.has(id)) return true;
  if (u === 'litre' || u === '1 litre' || u === 'l' || u === 'bottle' || u === 'ml') return true;

  return false;
}

/**
 * Check if a product is sold by weight in Kilograms (Sweets, Savouries, Halwas, Karas, etc.)
 */
export function isKgProduct(item) {
  if (!item) return false;
  if (isBeverageDrink(item) || isPieceItem(item) || isPacketItem(item) || isLitreProduct(item)) {
    return false;
  }
  return true;
}

/**
 * Resolve standard default unit for adding product to bill / cart
 */
export function resolveProductDefaultUnit(item) {
  if (!item) return '1 Pc';
  if (isBeverageDrink(item)) return '1 Cup';
  if (isPieceItem(item)) return '1 Pc';
  if (isPacketItem(item)) return '1 Pkt';
  if (isLitreProduct(item)) {
    const u = String(item.unit || '').toLowerCase().trim();
    if (u === 'bottle') return '1 Bottle';
    return '1 Litre';
  }
  if (isKgProduct(item)) return '250g';
  return item.unit || '1 Pc';
}

/**
 * Resolve display label for unit in catalog list (e.g., '1 Cup', '1 Pc', '1 Pkt', '1 Litre', 'kg')
 */
export function resolveProductUnitDisplay(item) {
  if (!item) return 'kg';
  if (isBeverageDrink(item)) return '1 Cup';
  if (isPieceItem(item)) return '1 Pc';
  if (isPacketItem(item)) return '1 Pkt';
  if (isLitreProduct(item)) {
    const u = String(item.unit || '').toLowerCase().trim();
    if (u === 'bottle') return 'Bottle';
    return '1 Litre';
  }
  return 'kg';
}

/**
 * Resolve correct unit display for an active bill line item.
 * Guarantees beverages show '1 Cup', pieces show '1 Pc', packets show '1 Pkt',
 * and prevents corrupted 'kg' tags from displaying on beverages.
 */
export function resolveBillItemUnit(billItem, sweetObj) {
  const item = sweetObj || billItem;
  if (isBeverageDrink(item)) return '1 Cup';
  if (isPieceItem(item)) return '1 Pc';
  if (isPacketItem(item)) return '1 Pkt';

  const w = String(billItem?.weight || '').trim();
  const wLower = w.toLowerCase();

  // If sweet is a measurable kg sweet, preserve specific gram/kg weights like 250g, 500g, 1kg, 2kg
  if (isKgProduct(item)) {
    if (wLower && wLower !== 'kg' && wLower !== 'standard' && (wLower.includes('g') || wLower.includes('kg'))) {
      return w;
    }
    return '250g';
  }

  if (isLitreProduct(item)) {
    if (wLower && (wLower.includes('ml') || wLower.includes('l') || wLower.includes('bottle') || wLower.includes('litre'))) {
      return w;
    }
    return String(item?.unit || '').toLowerCase() === 'bottle' ? '1 Bottle' : '1 Litre';
  }

  return billItem?.weight || billItem?.unit || '1 Pc';
}

/**
 * Native Unit & Stock Configuration for Admin & Stock Modals
 */
export function getItemStockConfig(item) {
  if (!item) {
    return {
      type: 'kg',
      label: 'kg',
      singular: 'kg',
      step: '0.5',
      min: '0.5',
      presets: ['5', '10', '15', '25', '50', '100'],
      format: (qty) => `${qty} kg`,
      quickPills: ['+5 kg', '+10 kg', '+25 kg', '+50 kg'],
    };
  }

  const u = String(item.unit || '').toLowerCase().trim();

  // 1. Explicit unit checks
  if (isBeverageDrink(item) || u === 'cup' || u === '1 cup') {
    return {
      type: 'cup',
      label: 'Cups',
      singular: 'Cup',
      step: '1',
      min: '1',
      presets: ['20', '50', '100', '150', '200'],
      format: (qty) => `${qty} Cups`,
      quickPills: ['+20 Cups', '+50 Cups', '+100 Cups'],
    };
  }

  if (isPieceItem(item) || u === 'pc' || u === '1 pc' || u === 'piece') {
    return {
      type: 'pcs',
      label: 'Pcs',
      singular: 'Pc',
      step: '1',
      min: '1',
      presets: ['10', '25', '50', '100', '200'],
      format: (qty) => `${qty} Pcs`,
      quickPills: ['+10 Pcs', '+25 Pcs', '+50 Pcs', '+100 Pcs'],
    };
  }

  if (isPacketItem(item) || u === 'pkt' || u === '1 pkt' || u === 'packet' || u === 'box') {
    return {
      type: 'pkt',
      label: 'Pkts',
      singular: 'Pkt',
      step: '1',
      min: '1',
      presets: ['10', '25', '50', '100'],
      format: (qty) => `${qty} Pkts`,
      quickPills: ['+10 Pkts', '+25 Pkts', '+50 Pkts'],
    };
  }

  if (isLitreProduct(item) || u === 'litre' || u === '1 litre' || u === 'l' || u === 'bottle') {
    return {
      type: 'litre',
      label: 'Litres',
      singular: 'Litre',
      step: '0.5',
      min: '0.5',
      presets: ['5', '10', '20', '30', '50'],
      format: (qty) => `${qty} L`,
      quickPills: ['+5 L', '+10 L', '+20 L', '+50 L'],
    };
  }

  // 2. Default: Sweets, Savouries, Halwas, Karas sold by weight in Kilograms (kg)
  return {
    type: 'kg',
    label: 'kg',
    singular: 'kg',
    step: '0.5',
    min: '0.5',
    presets: ['5', '10', '15', '25', '50', '100'],
    format: (qty) => `${qty} kg`,
    quickPills: ['+5 kg', '+10 kg', '+25 kg', '+50 kg'],
  };
}

/**
 * Check if a product has unlimited stock enabled, or if it should default to unlimited stock
 * (such as freshly brewed tea, coffee, hot milk and on-demand beverage varieties).
 */
export function isProductUnlimitedStock(item) {
  if (!item) return false;
  if (typeof item.isUnlimitedStock === 'boolean') {
    return item.isUnlimitedStock;
  }
  // Beverages served in cups default to unlimited stock
  return isBeverageDrink(item);
}
