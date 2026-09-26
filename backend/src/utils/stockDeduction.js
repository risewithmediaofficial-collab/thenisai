/**
 * Compute the quantity to deduct from stockKg for a billed item.
 * Maps any billing unit to the stored base unit (stockKg is always in kg/count).
 *
 * @param {string} billingUnit  The unit/weight string on the bill line item (e.g. '250g', '1kg', '1 Cup', '1 Pc')
 * @param {number} qty          How many of that unit are in this line
 * @param {Object} invItem      The inventory document (used for isUnlimitedStock and unit type)
 * @returns {{ deductKg: number, isUnlimited: boolean }}
 */
export function computeStockDeduction(billingUnit, qty, invItem) {
  const isUnlimited = Boolean(invItem?.isUnlimitedStock);
  if (isUnlimited) return { deductKg: 0, isUnlimited: true };

  const q = Math.max(0, parseFloat(qty) || 1);
  const u = String(billingUnit || '').toLowerCase().trim();

  // Weight-based (kg) — most sweets & savouries
  if (u === '100g') return { deductKg: 0.1 * q, isUnlimited: false };
  if (u === '200g') return { deductKg: 0.2 * q, isUnlimited: false };
  if (u === '250g') return { deductKg: 0.25 * q, isUnlimited: false };
  if (u === '500g') return { deductKg: 0.5 * q, isUnlimited: false };
  if (u === '750g') return { deductKg: 0.75 * q, isUnlimited: false };
  if (u === '1kg' || u === '1 kg') return { deductKg: 1.0 * q, isUnlimited: false };
  if (u === '2kg' || u === '2 kg') return { deductKg: 2.0 * q, isUnlimited: false };
  if (u === '5kg' || u === '5 kg') return { deductKg: 5.0 * q, isUnlimited: false };
  if (u.endsWith('kg')) { const v = parseFloat(u); if (!isNaN(v)) return { deductKg: v * q, isUnlimited: false }; }
  if (u.endsWith('g')) { const v = parseFloat(u); if (!isNaN(v)) return { deductKg: (v / 1000) * q, isUnlimited: false }; }

  // Liquid-based (litre / ml)
  if (u === '500ml') return { deductKg: 0.5 * q, isUnlimited: false };
  if (u === '1 litre' || u === '1litre' || u === 'litre' || u === '1l' || u === '1 l') return { deductKg: 1.0 * q, isUnlimited: false };
  if (u === '2 litre' || u === '2l') return { deductKg: 2.0 * q, isUnlimited: false };
  if (u.endsWith('ml')) { const v = parseFloat(u); if (!isNaN(v)) return { deductKg: (v / 1000) * q, isUnlimited: false }; }
  if (u.endsWith('l') || u.includes('litre')) { const v = parseFloat(u); if (!isNaN(v)) return { deductKg: v * q, isUnlimited: false }; }

  // Cup / beverage — deduct 1 unit from counterStock (treated as 1 cup)
  if (u === '1 cup' || u === 'cup' || u === '1cup') return { deductKg: 1 * q, isUnlimited: false };

  // Piece / individual items
  if (u === '1 pc' || u === 'pc' || u === '1pc' || u === '1 piece' || u === 'piece') return { deductKg: 0.1 * q, isUnlimited: false };

  // Packet / box
  if (u === '1 pkt' || u === 'pkt' || u === '1pkt' || u === 'packet' || u === '1 packet') return { deductKg: 0.25 * q, isUnlimited: false };
  if (u === 'box' || u === '1 box') return { deductKg: 0.5 * q, isUnlimited: false };
  if (u === 'bottle' || u === '1 bottle') return { deductKg: 1.0 * q, isUnlimited: false };
  if (u === 'dozen' || u === '12 pcs') return { deductKg: 1.2 * q, isUnlimited: false };

  // Unknown unit: default 0.5 kg per unit
  return { deductKg: 0.5 * q, isUnlimited: false };
}
