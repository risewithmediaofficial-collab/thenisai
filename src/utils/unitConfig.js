/**
 * THENISAI — Product Unit & Stock Preset Configuration
 * Dynamic unit configuration supporting: kg, pcs, litres, cups, packets
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
  const cat = String(item.category || '').toLowerCase().trim();
  const id = String(item.id || '').toLowerCase().trim();
  const name = String(item.name || item.englishName || '').toLowerCase().trim();

  // 1. Explicit unit check from item metadata (Highest priority)
  if (u === 'kg') {
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

  if (u === 'cup' || u === '1 cup') {
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

  if (u === 'pc' || u === '1 pc' || u === 'piece') {
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

  if (u === 'litre' || u === '1 litre' || u === 'l' || u === 'bottle') {
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

  if (u === 'pkt' || u === '1 pkt' || u === 'packet' || u === 'box') {
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

  // 2. Specific Beverage / Drink detection (Cups)
  if (
    cat.includes('beverage') ||
    id.includes('tea') ||
    id.includes('coffee') ||
    id.includes('milk') ||
    id.includes('boost') ||
    id.includes('horlicks') ||
    id.includes('malt') ||
    name.includes('tea') ||
    name.includes('coffee') ||
    name.includes('lemon') ||
    name.includes('sukku') ||
    name.includes('kashayam')
  ) {
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

  // 3. Savoury Snacks sold per piece (Vada, Samosa, Puff, Cutlet, Bajji, Bonda)
  if (
    id === 'vada' ||
    id.includes('samosa') ||
    name.includes('vada') ||
    name.includes('samosa') ||
    name.includes('cutlet') ||
    name.includes('puff') ||
    name.includes('bonda') ||
    name.includes('bajji') ||
    name.includes('bun')
  ) {
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

  // 4. Pure Ghee Bottles & Cooking Oils (Liquids in Litres)
  // Ensure sweets made with ghee (Ghee Mysore Pak, Ghee Halwa, etc.) are excluded!
  const isSweetMadeWithGhee =
    name.includes('mysore pak') ||
    name.includes('pak') ||
    name.includes('halwa') ||
    name.includes('laddu') ||
    name.includes('peda') ||
    name.includes('burfi') ||
    name.includes('palkova') ||
    cat.includes('sweet');

  if (!isSweetMadeWithGhee && (
    id.includes('ghee_bottle') ||
    id.includes('pure_ghee') ||
    id.includes('oil') ||
    name === 'ghee' ||
    name === 'pure ghee' ||
    name.includes('cooking oil') ||
    name.includes('sesame oil')
  )) {
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

  // 5. Packaged Podi / Masala / Snacks in packets
  if (
    cat.includes('podi') ||
    cat.includes('masala') ||
    name.includes('packet') ||
    name.includes('chips') ||
    name.includes('murukku packet')
  ) {
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

  // 6. Default: Sweets, Savouries, Halwa, Karas sold by weight in Kilograms (kg)
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
