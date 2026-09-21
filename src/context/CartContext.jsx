import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { FREE_DELIVERY_THRESHOLD, SWEETS_CATALOG, ALL_BILLING_ITEMS } from '../data/sweetsData';
import { useScrollLock } from '../hooks/useScrollLock';
import api from '../utils/api';

const CartContext = createContext();

const CART_STORAGE_KEY = 'thenisai_cart_items_v1';
const INVOICE_STORAGE_KEY = 'thenisai_last_invoice_v1';
const ORDERS_STORAGE_KEY = 'thenisai_orders_v1';
const INVENTORY_STORAGE_KEY = 'thenisai_inventory_v3';
const BILLS_CACHE_KEY = 'thenisai_bills_cache';
const OFFLINE_LEDGER_KEY = 'thenisai_offline_backup_ledger';
const OFFLINE_QUEUE_KEY = 'thenisai_offline_sync_queue';
const TAX_SETTINGS_STORAGE_KEY = 'thenisai_tax_settings_v1';
const PRODUCT_AVAILABILITY_KEY = 'thenisai_product_availability_v1';
const CUSTOM_PRODUCTS_KEY = 'thenisai_custom_products_v1';
const PRICE_OVERRIDE_LOGS_KEY = 'thenisai_price_override_logs_v1';
const RECYCLE_BIN_STORAGE_KEY = 'thenisai_recycle_bin_bills_v1';
const RECYCLE_BIN_PRODUCTS_STORAGE_KEY = 'thenisai_recycle_bin_products_v1';
const DELETED_PRODUCT_IDS_KEY = 'thenisai_deleted_product_ids_v1';
const ACTIVITY_LOGS_STORAGE_KEY = 'thenisai_activity_logs_v1';
const MASTER_PRICES_KEY = 'thenisai_master_prices_v1';
const CUSTOM_CATEGORIES_KEY = 'thenisai_custom_categories_v1';
const CUSTOM_UNITS_KEY = 'thenisai_custom_units_v1';
const CATEGORY_OVERRIDES_KEY = 'thenisai_category_overrides_v1';
const UNIT_OVERRIDES_KEY = 'thenisai_unit_overrides_v1';

// Default categories (built-in, cannot be deleted by admin)
export const DEFAULT_PRODUCT_CATEGORIES = [
  { value: 'sweets', label: 'Authentic Sweets (இனிப்புகள்)' },
  { value: 'beverages', label: 'Tea & Beverages (டீ & பானங்கள்)' },
  { value: 'spices', label: 'Spices & Kara (கார வகைகள்)' },
  { value: 'halwa', label: 'Halwa Specialties (அல்வா)' },
  { value: 'savouries', label: 'Savouries / Mixtures (கார வகைகள்)' },
  { value: 'ghee-bakery', label: 'Pure Ghee & Bakery' },
  { value: 'traditional-rice-dal', label: 'Traditional Rice & Dals' },
  { value: 'spices-masalas', label: 'Spices & Podi Varieties' },
  { value: 'other', label: 'Other Products' },
];

// Default units (built-in, cannot be deleted by admin)
export const DEFAULT_PRODUCT_UNITS = [
  { value: 'kg', label: 'kg — Weighted in g / kg' },
  { value: 'Litre', label: 'Litre — Volume in ml / L' },
  { value: '1 Cup', label: '1 Cup — Fast seller cup' },
  { value: '1 Pc', label: '1 Pc — Single piece' },
  { value: '1 Pkt', label: '1 Pkt — Packaged packet' },
  { value: 'Bottle', label: 'Bottle (பாட்டில்)' },
  { value: 'box', label: 'Box (பெட்டி)' },
  { value: 'piece', label: 'Piece (எண்ணிக்கை)' },
];


export const DEFAULT_TAX_SETTINGS = {
  totalGstRate: 0,
  cgstRate: 0,
  sgstRate: 0,
  gstin: '',
  taxEnabled: false,
  lastUpdated: '',
};

const DEFAULT_INVENTORY = ALL_BILLING_ITEMS.map((item) => {
  const isCup = item.unit === 'Cup' || item.unit === '1 Cup' || item.category === 'beverages' || item.id?.includes('tea') || item.id?.includes('coffee') || item.id?.includes('milk') || item.id?.includes('boost') || item.id?.includes('horlicks');
  const isPc = item.unit === 'Pc' || item.unit === '1 Pc' || item.category === 'snacks' || item.id === 'vada';
  const isLitre = item.unit === 'Litre' || item.unit === '1 Litre' || item.unit === 'Bottle';
  const isKg = !isCup && !isPc && !isLitre && (item.unit === 'kg' || !item.unit);

  const defaultUnit = isCup ? '1 Cup' : isPc ? '1 Pc' : isLitre ? (item.unit || '1 Litre') : (item.unit || 'kg');

  return {
    id: item.id,
    itemNumber: item.itemNumber,
    skuCode: item.skuCode ? String(item.skuCode) : (item.itemNumber ? String(item.itemNumber) : ''),
    isInactive: Boolean(item.isInactive),
    name: item.name,
    englishName: item.englishName,
    tamilName: item.tamilName,
    stockKg: isKg ? 35 : isLitre ? 25 : isCup ? 100 : isPc ? 80 : 50,
    minThreshold: isKg ? 8 : isCup ? 20 : isPc ? 15 : 10,
    batchDate: 'Today 06:30 AM',
    batchNote: item.description || 'Fresh counter stock',
    unit: defaultUnit,
    price: item.price,
    unitPrice: item.price,
    pricePerKg: item.price,
    category: item.category || 'sweets',
    subcategory: item.subcategory || (item.category === 'spices' ? 'Spices (Kara Vagai)' : item.category === 'beverages' ? 'Beverages' : 'Traditional Sweets'),
    hsn: item.hsn || '2106',
  };
});

const INITIAL_ORDERS = [];

function getWeightInKg(weightStr) {
  if (!weightStr) return 0.5;
  const str = String(weightStr).toLowerCase().trim();
  if (str.includes('cup') || str.includes('pc') || str.includes('box')) return 1.0;
  if (str.includes('250g') || str.includes('250ml') || str.includes('250 ml')) return 0.25;
  if (str.includes('500g') || str.includes('500ml') || str.includes('500 ml')) return 0.5;
  if (str.includes('1kg') || str.includes('1 kg') || str.includes('1l') || str.includes('1 l') || str.includes('1 litre') || str.includes('1000ml')) return 1.0;
  if (str.includes('2l') || str.includes('2 l') || str.includes('2 litre') || str.includes('2000ml')) return 2.0;
  const mlMatch = str.match(/([\d.]+)\s*ml/);
  if (mlMatch) return parseFloat(mlMatch[1]) / 1000;
  const lMatch = str.match(/([\d.]+)\s*(?:l|litre|liter)/);
  if (lMatch) return parseFloat(lMatch[1]);
  const match = str.match(/([\d.]+)\s*kg/);
  if (match) return parseFloat(match[1]);
  return 0.5;
}

export const isSandboxActive = () => {
  try {
    if (typeof window === 'undefined') return false;
    const userJson = sessionStorage.getItem('thenisai_auth_user');
    if (userJson) {
      const u = JSON.parse(userJson);
      if (u?.isSandbox || u?.role === 'tester' || u?.role === 'viewer') return true;
    }
    if (sessionStorage.getItem('thenisai_tester_session_unlocked') === 'true') return true;
    if (sessionStorage.getItem('thenisai_viewer_session_unlocked') === 'true') return true;
  } catch {}
  return false;
};

export const resolveActiveUser = (explicitUser = null) => {
  if (isSandboxActive()) {
    return {
      id: 'staff-3',
      username: 'tester',
      name: 'Demo Tester',
      role: 'tester',
      title: 'Sandbox Testing (No Data Impact)',
    };
  }
  if (explicitUser && (explicitUser.name || explicitUser.id || explicitUser.username)) {
    const isAdminUser = explicitUser.role === 'admin' || explicitUser.id === 'staff-1' || explicitUser.username === 'admin' || explicitUser.name?.includes('Ramanathan');
    const role = isAdminUser ? 'admin' : (explicitUser.role || (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('admin') ? 'admin' : 'cashier'));
    const isAdmin = role === 'admin';
    return {
      id: explicitUser.id || (isAdmin ? 'staff-1' : 'staff-2'),
      username: explicitUser.username || (isAdmin ? 'admin' : 'cashier'),
      name: (explicitUser.name && explicitUser.name !== 'Staff') ? explicitUser.name : (isAdmin ? 'S. Ramanathan' : 'M. Kannan'),
      role,
      title: explicitUser.title || (isAdmin ? 'Kitchen Operations Head' : 'Counter Cashier'),
    };
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = sessionStorage.getItem('thenisai_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.name || parsed.username || parsed.id)) {
          const isAdminUnlocked = sessionStorage.getItem('thenisai_admin_session_unlocked') === 'true';
          const isBillingUnlocked = sessionStorage.getItem('thenisai_billing_session_unlocked') === 'true';

          if (parsed.role === 'admin' && isAdminUnlocked) {
            return {
              id: parsed.id || 'staff-1',
              username: parsed.username || 'admin',
              name: parsed.name || 'S. Ramanathan',
              role: 'admin',
              title: parsed.title || 'Kitchen Operations Head',
            };
          }
          if (parsed.role === 'cashier' && isBillingUnlocked) {
            return {
              id: parsed.id || 'staff-2',
              username: parsed.username || 'cashier',
              name: parsed.name || 'M. Kannan',
              role: 'cashier',
              title: parsed.title || 'Counter Cashier',
            };
          }
        }
      }
    }
  } catch {}

  const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : '';
  if (hash.startsWith('#billing')) {
    return {
      id: 'staff-2',
      username: 'cashier',
      name: 'M. Kannan',
      role: 'cashier',
      title: 'Counter Cashier',
    };
  }

  if (hash.startsWith('#admin')) {
    return {
      id: 'staff-1',
      username: 'admin',
      name: 'S. Ramanathan',
      role: 'admin',
      title: 'Kitchen Operations Head',
    };
  }

  return {
    id: 'staff-2',
    username: 'cashier',
    name: 'M. Kannan',
    role: 'cashier',
    title: 'Counter Cashier',
  };
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // activeInvoice must be null on page landing so it never auto-pops up
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [cartNotification, setCartNotification] = useState(null);

  // Clear any stale invoice from previous sessions on mount
  useEffect(() => {
    try {
      localStorage.removeItem(INVOICE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // View routing: 'storefront' | 'admin' | 'billing'
  const resolveViewFromUrl = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const viewParam = search.get('view')?.toLowerCase();

    // 1. Query parameter override
    if (viewParam === 'admin') return 'admin';
    if (viewParam === 'billing') return 'billing';
    if (viewParam === 'storefront' || viewParam === 'store') return 'storefront';

    // 2. Hash routing has HIGHEST priority in SPA
    if (hash.startsWith('#billing')) {
      return 'billing';
    }

    if (hash === '#inventory' || hash.startsWith('#inventory')) {
      window.location.hash = '#admin/inventory';
      return 'admin';
    }

    const adminShortcuts = {
      '#orders': '#admin/dispatch',
      '#dispatch': '#admin/dispatch',
      '#inventory': '#admin/inventory',
      '#sales': '#admin/sales',
      '#daily-revenue': '#admin/shift-bills',
      '#shift-bills': '#admin/shift-bills',
      '#activity-logs': '#admin/activity-logs',
      '#recycle-bin': '#admin/recycle-bin',
    };
    if (adminShortcuts[hash]) {
      window.location.hash = adminShortcuts[hash];
      return 'admin';
    }
    if (hash.startsWith('#admin')) return 'admin';
    if (hash.startsWith('#sales') || hash.startsWith('#daily-revenue') || hash.startsWith('#activity-logs') || hash.startsWith('#recycle-bin') || hash.startsWith('#orders') || hash.startsWith('#dispatch') || hash.startsWith('#shift-bills')) {
      return 'admin';
    }
    if (hash === '#storefront' || hash === '#store' || hash === '#home') return 'storefront';

    // 3. Fallback to pathname (only when no hash specified)
    if (pathname.endsWith('/billing') || pathname === '/billing') return 'billing';
    if (pathname.endsWith('/admin') || pathname === '/admin') return 'admin';

    return 'storefront';
  };

  const [currentView, setCurrentView] = useState(resolveViewFromUrl);

  // Orders state — strictly online delivery orders
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep strictly online orders (strip out counter POS bills)
          const onlineOnly = parsed.filter(
            (o) => o.source === 'online' || (!o.id?.toLowerCase().startsWith('pos-') && !o.invoiceNumber?.toLowerCase().startsWith('pos-'))
          );
          if (onlineOnly.length !== parsed.length) {
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(onlineOnly));
          }
          return onlineOnly.length > 0 ? onlineOnly : INITIAL_ORDERS;
        }
      }
      return INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // GST & Tax Settings (Configured dynamically by Admin)
  const [taxSettings, setTaxSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(TAX_SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_TAX_SETTINGS, ...JSON.parse(saved) } : DEFAULT_TAX_SETTINGS;
    } catch {
      return DEFAULT_TAX_SETTINGS;
    }
  });

  const updateTaxSettings = (newSettings) => {
    setTaxSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        lastUpdated: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      localStorage.setItem(TAX_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Custom Products added by Admin / Staff
  const [customProducts, setCustomProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Product Availability Map: { [productId]: boolean } (true = Inactive / Out of Stock / Masked)
  const [productAvailabilityMap, setProductAvailabilityMap] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCT_AVAILABILITY_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      // Reconcile with cached inventory if available
      const invSaved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (invSaved) {
        const invParsed = JSON.parse(invSaved);
        if (Array.isArray(invParsed)) {
          invParsed.forEach((item) => {
            if (item && item.id && item.isInactive !== undefined) {
              parsed[item.id] = Boolean(item.isInactive);
            }
          });
        }
      }
      return parsed;
    } catch {
      return {};
    }
  });

  // Price Override Audit Logs (Admin visibility)
  const [priceOverrideLogs, setPriceOverrideLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(PRICE_OVERRIDE_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 30-Day Recycle Bin for Deleted Bills
  const [recycleBinBills, setRecycleBinBills] = useState(() => {
    try {
      const saved = localStorage.getItem(RECYCLE_BIN_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const now = Date.now();
      // Auto-purge any items older than 30 days
      return Array.isArray(parsed) ? parsed.filter((b) => !b.expiresAt || b.expiresAt >= now) : [];
    } catch {
      return [];
    }
  });

  // 30-Day Recycle Bin for Deleted Products
  const [recycleBinProducts, setRecycleBinProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const now = Date.now();
      return Array.isArray(parsed) ? parsed.filter((p) => !p.expiresAt || p.expiresAt >= now) : [];
    } catch {
      return [];
    }
  });

  // Track deleted product IDs to guarantee deleted items never return upon page refresh
  const [deletedProductIds, setDeletedProductIds] = useState(() => {
    try {
      const saved = localStorage.getItem(DELETED_PRODUCT_IDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unified Admin Activity Logs (Sanitized to guarantee performer ID & name attribution)
  const [activityLogs, setActivityLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => {
        if (!item.performedBy || item.performedBy.name === 'Staff' || !item.performedBy.id || item.performedBy.id === 'staff-1' || item.performedBy.username === 'admin') {
          const isCashierAction = item.actionType === 'PRICE_OVERRIDE' && item.performedBy?.role === 'cashier' && item.performedBy?.id !== 'staff-1';
          return {
            ...item,
            performedBy: isCashierAction
              ? { id: item.performedBy?.id || 'staff-2', username: item.performedBy?.username || 'cashier', name: item.performedBy?.name || 'M. Kannan', role: 'cashier', title: 'Counter Cashier' }
              : { id: 'staff-1', username: 'admin', name: (item.performedBy?.name && item.performedBy.name !== 'Staff') ? item.performedBy.name : 'S. Ramanathan', role: 'admin', title: 'Kitchen Operations Head' },
          };
        }
        return item;
      });
    } catch {
      return [];
    }
  });


  // Inventory state (guarded so deleted products never get resurrected)
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      const delIdsRaw = localStorage.getItem(DELETED_PRODUCT_IDS_KEY);
      const deletedIds = new Set(delIdsRaw ? JSON.parse(delIdsRaw) : []);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((i) => !deletedIds.has(i.id));
          if (filtered.length < DEFAULT_INVENTORY.length) {
            const existingIds = new Set(filtered.map((i) => i.id));
            const missing = DEFAULT_INVENTORY.filter((i) => !existingIds.has(i.id) && !deletedIds.has(i.id));
            const combined = [...filtered, ...missing];
            try {
              localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(combined));
            } catch {}
            return combined;
          }
          return filtered;
        }
      }
      return DEFAULT_INVENTORY.filter((i) => !deletedIds.has(i.id));
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  // Persistent Master Selling Prices (product id -> unit selling price)
  const [masterPrices, setMasterPrices] = useState(() => {
    try {
      const saved = localStorage.getItem(MASTER_PRICES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Admin-managed custom product categories (persisted to localStorage)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Admin-managed custom product units (persisted to localStorage)
  const [customUnits, setCustomUnits] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_UNITS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Category and Unit overrides (for editing built-in category/unit display names)
  const [categoryOverrides, setCategoryOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_OVERRIDES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [unitOverrides, setUnitOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(UNIT_OVERRIDES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Combined allCategories with overrides applied
  const allCategories = useMemo(() => {
    const base = DEFAULT_PRODUCT_CATEGORIES.map((c) => ({
      ...c,
      label: categoryOverrides[c.value] || c.label,
    }));
    return [...base, ...customCategories];
  }, [categoryOverrides, customCategories]);

  // Combined allUnits with overrides applied
  const allUnits = useMemo(() => {
    const base = DEFAULT_PRODUCT_UNITS.map((u) => ({
      ...u,
      label: unitOverrides[u.value] || u.label,
    }));
    return [...base, ...customUnits];
  }, [unitOverrides, customUnits]);

  const addCustomCategory = (cat) => {
    // cat: { value: string, label: string }
    setCustomCategories((prev) => {
      if (prev.some((c) => c.value === cat.value)) return prev;
      const updated = [...prev, cat];
      try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateCategory = (oldValue, updatedCat) => {
    const isBuiltIn = DEFAULT_PRODUCT_CATEGORIES.some((c) => c.value === oldValue);
    if (isBuiltIn) {
      setCategoryOverrides((prev) => {
        const updated = { ...prev, [oldValue]: updatedCat.label };
        try { localStorage.setItem(CATEGORY_OVERRIDES_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    } else {
      setCustomCategories((prev) => {
        const updated = prev.map((c) => (c.value === oldValue ? { ...c, ...updatedCat } : c));
        try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  const removeCustomCategory = (value) => {
    setCustomCategories((prev) => {
      const updated = prev.filter((c) => c.value !== value);
      try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    setCategoryOverrides((prev) => {
      if (prev[value]) {
        const copy = { ...prev };
        delete copy[value];
        try { localStorage.setItem(CATEGORY_OVERRIDES_KEY, JSON.stringify(copy)); } catch {}
        return copy;
      }
      return prev;
    });
  };

  const addCustomUnit = (unit) => {
    // unit: { value: string, label: string }
    setCustomUnits((prev) => {
      if (prev.some((u) => u.value === unit.value)) return prev;
      const updated = [...prev, unit];
      try { localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateUnit = (oldValue, updatedUnit) => {
    const isBuiltIn = DEFAULT_PRODUCT_UNITS.some((u) => u.value === oldValue);
    if (isBuiltIn) {
      setUnitOverrides((prev) => {
        const updated = { ...prev, [oldValue]: updatedUnit.label };
        try { localStorage.setItem(UNIT_OVERRIDES_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    } else {
      setCustomUnits((prev) => {
        const updated = prev.map((u) => (u.value === oldValue ? { ...u, ...updatedUnit } : u));
        try { localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  const removeCustomUnit = (value) => {
    setCustomUnits((prev) => {
      const updated = prev.filter((u) => u.value !== value);
      try { localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    setUnitOverrides((prev) => {
      if (prev[value]) {
        const copy = { ...prev };
        delete copy[value];
        try { localStorage.setItem(UNIT_OVERRIDES_KEY, JSON.stringify(copy)); } catch {}
        return copy;
      }
      return prev;
    });
  };

  // Combined Billing Items (Standard catalog + Custom Items, filtered against deleted products)
  const allBillingProducts = useMemo(() => {
    const deletedSet = new Set([
      ...(Array.isArray(deletedProductIds) ? deletedProductIds : []),
      ...recycleBinProducts.map((p) => p.id),
    ]);

    // Start from the static catalog, excluding deleted items
    const combined = ALL_BILLING_ITEMS.filter((item) => !deletedSet.has(item.id));

    // Append any custom products not already in the static list and not deleted
    customProducts.forEach((cp, idx) => {
      if (!deletedSet.has(cp.id) && !combined.some((it) => it.id === cp.id)) {
        combined.push({
          ...cp,
          itemNumber: cp.itemNumber || (ALL_BILLING_ITEMS.length + idx + 1),
        });
      }
    });

    // Also include any custom/backend inventory products not in combined and not deleted
    (inventory || []).forEach((invItem, idx) => {
      if (!deletedSet.has(invItem.id) && !combined.some((it) => it.id === invItem.id)) {
        combined.push({
          ...invItem,
          itemNumber: invItem.itemNumber || (ALL_BILLING_ITEMS.length + customProducts.length + idx + 1),
        });
      }
    });

    // Overlay updated prices: check masterPrices first, then inventory record, then original item price
    const mapped = combined.map((item) => {
      const explicitPrice = masterPrices[item.id];
      const invRecord = inventory.find((i) => i.id === item.id) || customProducts.find((cp) => cp.id === item.id);
      const invPrice = invRecord
        ? [invRecord.price, invRecord.unitPrice, invRecord.pricePerKg].find(
            (p) => typeof p === 'number' && !isNaN(p) && p > 0
          )
        : null;

      const livePrice =
        explicitPrice && explicitPrice > 0
          ? explicitPrice
          : invPrice && invPrice > 0
            ? invPrice
            : item.price;

      const backendEnglish = invRecord?.englishName || (typeof invRecord?.name === 'string' && invRecord.name.includes('—') ? invRecord.name.split('—')[0].trim() : '') || item.englishName || item.name;
      const backendTamil = invRecord?.tamilName || (typeof invRecord?.name === 'string' && invRecord.name.includes('—') ? invRecord.name.split('—')[1].trim() : '') || item.tamilName || '';
      const mergedName = backendEnglish || item.englishName || item.name;
      const mergedTamilName = backendTamil || '';
      const mergedDisplayName = mergedTamilName ? `${mergedName} — ${mergedTamilName}` : mergedName;
      const mergedCategory = invRecord?.category || item.category || 'sweets';
      const mergedUnit = invRecord?.unit || item.unit || 'kg';

      return {
        ...item,
        name: mergedDisplayName,
        englishName: mergedName,
        tamilName: mergedTamilName,
        category: mergedCategory,
        unit: mergedUnit,
        price: livePrice,
        unitPrice: livePrice,
        pricePerKg: mergedUnit === 'kg' ? livePrice : item.pricePerKg || livePrice,
        skuCode: invRecord?.skuCode ?? item.skuCode ?? (item.itemNumber ? String(item.itemNumber) : ''),
        prices: mergedUnit === 'kg' ? {
          '100g': Math.round(livePrice * 0.1),
          '250g': Math.round(livePrice * 0.25),
          '500g': Math.round(livePrice * 0.5),
          '1kg': livePrice,
          '2kg': livePrice * 2,
        } : (item.prices ? { ...item.prices, [mergedUnit || '1 Cup']: livePrice } : undefined),
      };
    });

    // Sort numerically by SKU code / itemNumber so items appear in proper order (1, 2, 3... 12, 13...)
    return mapped.sort((a, b) => {
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
      return String(a.englishName || a.name || '').localeCompare(String(b.englishName || b.name || ''));
    });
  }, [customProducts, inventory, masterPrices, deletedProductIds, recycleBinProducts]);

  // POS Counter Bills state
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem(BILLS_CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Offline Resilience State ──────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflinePending, setHasOfflinePending] = useState(() => {
    try {
      const q = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      return q.length > 0;
    } catch { return false; }
  });
  const [offlinePendingCount, setOfflinePendingCount] = useState(() => {
    try {
      const q = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      return q.length;
    } catch { return 0; }
  });

  // ==========================================
  // SCREEN SCROLL LOCK WHEN MODALS/DRAWER OPEN
  // ==========================================
  useScrollLock(isCartOpen || isCheckoutOpen);

  // Sync URL changes (hash, popstate, direct links)
  useEffect(() => {
    const onUrlChange = () => {
      setCurrentView(resolveViewFromUrl());
    };
    window.addEventListener('hashchange', onUrlChange);
    window.addEventListener('popstate', onUrlChange);
    return () => {
      window.removeEventListener('hashchange', onUrlChange);
      window.removeEventListener('popstate', onUrlChange);
    };
  }, []);

  // ── Online / Offline event listeners ─────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync pending offline bills when connectivity restores
      setTimeout(() => syncOfflineBillsInternal(), 2000);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal: flush offline queue to backend ──────────────────────────────
  const syncOfflineBillsInternal = async () => {
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (!queue.length) return { synced: 0, failed: 0 };

      const res = await api.post('/api/bills/sync-batch', { bills: queue });
      if (res && res.success) {
        // Remove successfully synced items from queue
        const failedIds = new Set((res.failed || []).map(b => b.id));
        const remaining = queue.filter(b => failedIds.has(b.id));
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
        setHasOfflinePending(remaining.length > 0);
        setOfflinePendingCount(remaining.length);

        // Refresh bills from backend
        const billsRes = await api.get('/api/bills').catch(() => null);
        if (billsRes && billsRes.success && Array.isArray(billsRes.bills)) {
          setBills(billsRes.bills);
          localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(billsRes.bills));
        }
        return { synced: (res.synced || queue.length - remaining.length), failed: remaining.length };
      }
    } catch (err) {
      console.warn('Offline sync failed (backend still down?):', err);
    }
    return { synced: 0, failed: 0 };
  };

  // ── Public: sync offline bills (called from UI) ───────────────────────────
  const syncOfflineBills = async () => {
    return await syncOfflineBillsInternal();
  };

  const navigateTo = (view, subTab = '') => {
    setCurrentView(view);
    if (view === 'admin') {
      const adminRouteMap = {
        orders: '#admin/dispatch',
        dispatch: '#admin/dispatch',
        inventory: '#admin/inventory',
        sales: '#admin/sales',
        'daily-revenue': '#admin/shift-bills',
        'shift-bills': '#admin/shift-bills',
        'activity-logs': '#admin/activity-logs',
        'recycle-bin': '#admin/recycle-bin',
        staff: '#admin/staff',
        billing: '#admin/billing',
        pos: '#admin/billing',
        register: '#admin/billing',
      };
      const targetHash = subTab ? (adminRouteMap[subTab] || `#admin/${subTab}`) : '#admin/inventory';
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } else if (view === 'billing') {
      const billingRouteMap = {
        register: '#billing',
        inventory: '#billing/inventory',
        'daily-sales': '#billing/daily-sales',
        bills: '#billing/daily-sales',
        orders: '#billing/orders',
        online: '#billing/orders',
        dispatch: '#billing/orders',
      };
      const targetHash = subTab ? (billingRouteMap[subTab] || `#billing/${subTab}`) : '#billing';
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } else {
      // Storefront: Clear any path /admin or /billing back to /
      if (window.location.pathname !== '/') {
        if (window.history.pushState) {
          window.history.pushState(null, '', '/');
        } else {
          window.location.href = '/';
        }
      }
      if (window.location.hash !== '') {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  // Multi-tab synchronization for product availability and inventory
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('thenisai_inventory_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'AVAILABILITY_CHANGED') {
            const { productId, isInactive } = event.data;
            setProductAvailabilityMap((prev) => ({ ...prev, [productId]: isInactive }));
            setInventory((prev) =>
              prev.map((item) => (item.id === productId ? { ...item, isInactive } : item))
            );
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === PRODUCT_AVAILABILITY_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setProductAvailabilityMap(parsed);
          }
        } catch {}
      }
      if (e.key === INVENTORY_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setInventory(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch initial data from backend on mount and sync availability
  const syncWithBackend = useCallback(async () => {
    if (isSandboxActive()) {
      return; // In sandbox mode, maintain in-memory simulated state without overwriting from backend
    }
    try {
      const [invRes, ordRes, billsRes, recBillsRes, recProdsRes] = await Promise.all([
        api.get('/api/inventory').catch(() => null),
        api.get('/api/orders').catch(() => null),
        api.get('/api/bills').catch(() => null),
        api.get('/api/recycle-bin/bills').catch(() => null),
        api.get('/api/recycle-bin/products').catch(() => null),
      ]);

      if (recBillsRes && recBillsRes.success && Array.isArray(recBillsRes.deletedBills)) {
        setRecycleBinBills(recBillsRes.deletedBills);
        try {
          localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(recBillsRes.deletedBills));
        } catch {}
      }

      let activeDeletedIds = new Set(
        JSON.parse(localStorage.getItem(DELETED_PRODUCT_IDS_KEY) || '[]')
      );

      if (recProdsRes && recProdsRes.success && Array.isArray(recProdsRes.deletedProducts)) {
        setRecycleBinProducts(recProdsRes.deletedProducts);
        try {
          localStorage.setItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY, JSON.stringify(recProdsRes.deletedProducts));
        } catch {}
        recProdsRes.deletedProducts.forEach((p) => activeDeletedIds.add(p.id));
        const updatedDelList = Array.from(activeDeletedIds);
        setDeletedProductIds(updatedDelList);
        try {
          localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updatedDelList));
        } catch {}
      }

      if (invRes && invRes.success && Array.isArray(invRes.inventory) && invRes.inventory.length > 0) {
        setInventory((prev) => {
          const backendMap = new Map(invRes.inventory.map((item) => [item.id, item]));
          const rawBaseList = prev && prev.length > 0 ? prev : DEFAULT_INVENTORY;
          // Filter out deleted items from baseList
          const baseList = rawBaseList.filter((item) => !activeDeletedIds.has(item.id));

          let savedMaster = {};
          try {
            savedMaster = JSON.parse(localStorage.getItem(MASTER_PRICES_KEY) || '{}');
          } catch {}

          const merged = baseList.map((item) => {
            const bItem = backendMap.get(item.id);
            if (!bItem) return item;

            const backendEnglish = bItem.englishName || (typeof bItem.name === 'string' && bItem.name.includes('—') ? bItem.name.split('—')[0].trim() : '') || item.englishName || item.name;
            const backendTamil = bItem.tamilName || (typeof bItem.name === 'string' && bItem.name.includes('—') ? bItem.name.split('—')[1].trim() : '') || item.tamilName || '';
            const normalizedName = backendTamil ? `${backendEnglish} — ${backendTamil}` : backendEnglish;
            const bPrice = [bItem.price, bItem.unitPrice, bItem.pricePerKg].find(
              (p) => typeof p === 'number' && !isNaN(p) && p > 0
            );

            // User-set price in masterPrices has highest precedence
            const userPrice = savedMaster[item.id];
            const finalPrice = (userPrice && userPrice > 0) ? userPrice : (bPrice || item.price);

            return {
              ...item,
              ...bItem,
              name: normalizedName,
              englishName: backendEnglish,
              tamilName: backendTamil,
              price: finalPrice,
              unitPrice: finalPrice,
              pricePerKg: item.unit === 'kg' ? finalPrice : item.pricePerKg || finalPrice,
              skuCode: bItem.skuCode || item.skuCode || (item.itemNumber ? String(item.itemNumber) : ''),
              stockKg: bItem.stockKg !== undefined ? bItem.stockKg : item.stockKg,
              isInactive: bItem.isInactive !== undefined ? bItem.isInactive : item.isInactive,
            };
          });

          // Also include any new backend products not already in baseList and not deleted
          invRes.inventory.forEach((bItem) => {
            if (!activeDeletedIds.has(bItem.id) && !merged.some((m) => m.id === bItem.id)) {
              const backendEnglish = bItem.englishName || (typeof bItem.name === 'string' && bItem.name.includes('—') ? bItem.name.split('—')[0].trim() : '') || bItem.name || 'Product';
              const backendTamil = bItem.tamilName || (typeof bItem.name === 'string' && bItem.name.includes('—') ? bItem.name.split('—')[1].trim() : '') || '';
              const normalizedName = backendTamil ? `${backendEnglish} — ${backendTamil}` : backendEnglish;
              const bPrice = [bItem.price, bItem.unitPrice, bItem.pricePerKg].find(
                (p) => typeof p === 'number' && !isNaN(p) && p > 0
              );
              const userPrice = savedMaster[bItem.id];
              const finalPrice = (userPrice && userPrice > 0) ? userPrice : (bPrice || 20);

              merged.push({
                ...bItem,
                name: normalizedName,
                englishName: backendEnglish,
                tamilName: backendTamil,
                price: finalPrice,
                unitPrice: finalPrice,
                pricePerKg: bItem.unit === 'kg' ? finalPrice : bItem.pricePerKg || finalPrice,
                skuCode: bItem.skuCode || (bItem.itemNumber ? String(bItem.itemNumber) : ''),
              });
            }
          });

          try {
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });

        // Also synchronize masterPrices with any valid positive prices from backend
        // Do NOT overwrite an explicit local price set by staff/admin
        setMasterPrices((prev) => {
          const updated = { ...prev };
          invRes.inventory.forEach((bItem) => {
            const bPrice = [bItem.price, bItem.unitPrice, bItem.pricePerKg].find(
              (p) => typeof p === 'number' && !isNaN(p) && p > 0
            );
            if (bPrice && (!updated[bItem.id] || updated[bItem.id] <= 0)) {
              updated[bItem.id] = bPrice;
            }
          });
          try {
            localStorage.setItem(MASTER_PRICES_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // Synchronize productAvailabilityMap with backend truth!
        setProductAvailabilityMap((prev) => {
          const updated = { ...prev };
          invRes.inventory.forEach((item) => {
            if (item && item.id) {
              updated[item.id] = Boolean(item.isInactive);
            }
          });
          try {
            localStorage.setItem(PRODUCT_AVAILABILITY_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      if (ordRes && ordRes.success && Array.isArray(ordRes.orders)) {
        setOrders(ordRes.orders);
        try {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordRes.orders));
        } catch {}
      }

      if (billsRes && billsRes.success && Array.isArray(billsRes.bills)) {
        setBills(billsRes.bills);
        try {
          localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(billsRes.bills));
        } catch {}
      }
    } catch (err) {
      console.warn('Backend sync fallback to local storage:', err);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();

    const handleFocus = () => syncWithBackend();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncWithBackend();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('hashchange', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('hashchange', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncWithBackend]);

  // Fetch bills with optional cashier filter
  const fetchBills = async (cashierId) => {
    try {
      const endpoint = cashierId && cashierId !== 'all'
        ? `/api/bills?cashierId=${encodeURIComponent(cashierId)}`
        : '/api/bills';
      const res = await api.get(endpoint);
      if (res.success && Array.isArray(res.bills)) {
        setBills(res.bills);
        try {
          localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(res.bills));
        } catch { }
        return res.bills;
      }
    } catch (err) {
      console.warn('Failed to fetch bills from backend:', err);
    }
    return bills;
  };

  // Deduct inventory helper
  const deductStockForItems = (itemsList) => {
    setInventory((prev) => {
      const updated = [...prev];
      itemsList.forEach((item) => {
        const targetIdx = updated.findIndex((inv) => inv.id === item.id);
        if (targetIdx > -1) {
          const weightKg = getWeightInKg(item.weight);
          const totalDeduction = weightKg * item.quantity;
          const newStock = Math.max(0, Math.round((updated[targetIdx].stockKg - totalDeduction) * 100) / 100);
          updated[targetIdx] = {
            ...updated[targetIdx],
            stockKg: newStock,
          };
        }
      });
      return updated;
    });
  };

  // Orders Actions
  const placeOnlineOrder = async (orderData) => {
    const fullOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      source: 'online',
      status: 'New',
      createdAt: Date.now(),
    };

    setOrders((prev) => [fullOrder, ...prev]);
    deductStockForItems(orderData.items);
    setActiveInvoice(fullOrder);

    // Persist to backend
    try {
      const backendRes = await api.post('/api/orders', orderData);
      if (backendRes && backendRes.success && backendRes.order) {
        const savedOrder = backendRes.order;
        setOrders((prev) => [savedOrder, ...prev.filter((o) => o.id !== fullOrder.id && o.id !== savedOrder.id)]);
        setActiveInvoice(savedOrder);
        return savedOrder;
      }
    } catch (err) {
      console.warn('Backend order save fallback to local:', err);
    }

    return fullOrder;
  };

  const recordPriceOverrideLog = async (entry) => {
    const now = new Date();
    const fullLog = {
      ...entry,
      id: entry.id || `ovr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: entry.timestamp || Date.now(),
      dateStr: entry.dateStr || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: entry.timeStr || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setPriceOverrideLogs((prev) => {
      const updated = [fullLog, ...prev];
      try {
        localStorage.setItem(PRICE_OVERRIDE_LOGS_KEY, JSON.stringify(updated.slice(0, 1000)));
      } catch {}
      return updated;
    });

    try {
      await api.post('/api/audit/price-override', fullLog);
    } catch (err) {
      console.warn('Backend price override audit sync failed, saved locally:', err);
    }
    return fullLog;
  };

  const fetchPriceOverrideLogs = async (cashierId) => {
    try {
      const endpoint = cashierId && cashierId !== 'all'
        ? `/api/audit/price-overrides?cashierId=${encodeURIComponent(cashierId)}`
        : '/api/audit/price-overrides';
      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.logs)) {
        setPriceOverrideLogs(res.logs);
        try {
          localStorage.setItem(PRICE_OVERRIDE_LOGS_KEY, JSON.stringify(res.logs));
        } catch {}
        return res.logs;
      }
    } catch (err) {
      console.warn('Failed to fetch price override logs from backend:', err);
    }
    return priceOverrideLogs;
  };

  const recordActivity = async (entry) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const performer = resolveActiveUser(entry.performedBy);

    const fullEntry = {
      id: entry.id || `act-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: entry.actionType || 'ACTIVITY',
      performedBy: performer,
      targetId: entry.targetId || '',
      targetName: entry.targetName || '',
      details: entry.details || {},
      reason: entry.reason || '',
      timestamp: entry.timestamp || Date.now(),
      dateStr: entry.dateStr || dateStr,
      timeStr: entry.timeStr || timeStr,
    };

    setActivityLogs((prev) => {
      const updated = [fullEntry, ...prev.filter((a) => a.id !== fullEntry.id)];
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(updated.slice(0, 1000)));
        }
      } catch {}
      return updated;
    });

    if (isSandboxActive()) {
      return fullEntry;
    }

    try {
      await api.post('/api/audit/activity', fullEntry);
    } catch (err) {
      console.warn('Backend activity sync fallback locally:', err);
    }

    return fullEntry;
  };

  const fetchActivityLogs = async (type = 'all') => {
    try {
      const endpoint = type && type !== 'all' ? `/api/audit/activities?type=${encodeURIComponent(type)}` : '/api/audit/activities';
      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.activities)) {
        const sanitized = res.activities.map((item) => {
          if (!item.performedBy || item.performedBy.name === 'Staff' || !item.performedBy.id || item.performedBy.id === 'staff-1' || item.performedBy.username === 'admin') {
            const isCashierAction = item.actionType === 'PRICE_OVERRIDE' && item.performedBy?.role === 'cashier' && item.performedBy?.id !== 'staff-1';
            return {
              ...item,
              performedBy: isCashierAction
                ? { id: item.performedBy?.id || 'staff-2', username: item.performedBy?.username || 'cashier', name: item.performedBy?.name || 'M. Kannan', role: 'cashier', title: 'Counter Cashier' }
                : { id: 'staff-1', username: 'admin', name: (item.performedBy?.name && item.performedBy.name !== 'Staff') ? item.performedBy.name : 'S. Ramanathan', role: 'admin', title: 'Kitchen Operations Head' },
            };
          }
          return item;
        });
        setActivityLogs(sanitized);
        try {
          localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(sanitized));
        } catch {}
        return sanitized;
      }
    } catch (err) {
      console.warn('Backend fetch activities failed:', err);
    }
    return activityLogs;
  };

  const fetchRecycleBinBills = async () => {
    try {
      const res = await api.get('/api/recycle-bin/bills');
      if (res && res.success && Array.isArray(res.deletedBills)) {
        setRecycleBinBills(res.deletedBills);
        try {
          localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(res.deletedBills));
        } catch {}
        return res.deletedBills;
      }
    } catch (err) {
      console.warn('Backend fetch recycle bin failed:', err);
    }
    return recycleBinBills;
  };

  const deleteBill = async (billIdOrInv, reason, deletedBy = null) => {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory deletion reason is required.');
    }

    const activePerformer = resolveActiveUser(deletedBy);

    // Locate target bill in bills state or orders state
    const targetBill = bills.find((b) =>
      b.id === billIdOrInv ||
      b.invoiceNumber === billIdOrInv ||
      b._id === billIdOrInv ||
      String(b._id) === String(billIdOrInv)
    ) || orders.find((b) =>
      b.id === billIdOrInv ||
      b.invoiceNumber === billIdOrInv ||
      b._id === billIdOrInv ||
      String(b._id) === String(billIdOrInv)
    );

    // Target identifier to send to backend API
    const targetId = targetBill ? (targetBill.invoiceNumber || targetBill.id || targetBill._id) : billIdOrInv;

    const now = Date.now();
    let deletedRecord = targetBill ? {
      id: targetBill.id || targetBill.invoiceNumber,
      invoiceNumber: targetBill.invoiceNumber || targetBill.id,
      billData: targetBill,
      deletedBy: activePerformer,
      deletionReason: reason.trim(),
      deletedAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30-day retention
    } : {
      id: targetId,
      invoiceNumber: targetId,
      billData: { id: targetId, invoiceNumber: targetId, grandTotal: 0 },
      deletedBy: activePerformer,
      deletionReason: reason.trim(),
      deletedAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    };

    if (isSandboxActive()) {
      // Sandbox: delete from local in-memory only, never touch real DB or localStorage
      setBills((prev) => prev.filter((b) => b.id !== targetId && b.invoiceNumber !== targetId && b._id !== targetId && String(b._id) !== String(targetId)));
      setOrders((prev) => prev.filter((o) => o.id !== targetId && o.invoiceNumber !== targetId && o._id !== targetId && String(o._id) !== String(targetId)));
      return true;
    }

    // ── BACKEND-FIRST: call the database BEFORE updating UI state ────────────
    // This ensures that if the API fails, we do NOT show a false "deleted" state.
    // A page refresh will always show the true database state.
    try {
      const res = await api.delete(`/api/bills/${encodeURIComponent(targetId)}`, {
        data: { reason: reason.trim(), deletedBy: activePerformer },
      });
      if (!res || !res.success) {
        // Backend rejected the deletion — propagate error to caller
        throw new Error(res?.message || 'Server rejected the delete request.');
      }
      if (res.deletedRecord) {
        deletedRecord = res.deletedRecord;
      }
    } catch (err) {
      // Re-throw so DeleteBillModal / caller can show the user a real error message
      throw new Error(err?.message || 'Failed to delete bill. Please try again.');
    }
    // ────────────────────────────────────────────────────────────────────────

    // 1. API succeeded → now safe to remove from active bills & orders state
    const matchesTarget = (item) => {
      if (!item) return false;
      const tIdStr = String(targetId);
      const bIdStr = String(billIdOrInv);
      return (
        item.id === targetId ||
        item.invoiceNumber === targetId ||
        item._id === targetId ||
        String(item._id) === tIdStr ||
        item.id === billIdOrInv ||
        item.invoiceNumber === billIdOrInv ||
        item._id === billIdOrInv ||
        String(item._id) === bIdStr ||
        (targetBill && (item.id === targetBill.id || item.invoiceNumber === targetBill.invoiceNumber || item._id === targetBill._id))
      );
    };

    setBills((prev) => {
      const updated = prev.filter((b) => !matchesTarget(b));
      try {
        localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setOrders((prev) => {
      const updated = prev.filter((o) => !matchesTarget(o));
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Add to local Recycle Bin state & cache (backend already has it in DeletedBill collection)
    setRecycleBinBills((prev) => {
      const updated = [deletedRecord, ...prev.filter((d) => !matchesTarget(d) && d.id !== deletedRecord.id && d.invoiceNumber !== deletedRecord.invoiceNumber)];
      try {
        localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Refresh recycle bin in background for fresh ground truth
    fetchRecycleBinBills().catch(() => {});

    // 3. Record Admin Activity (best-effort, non-blocking)
    recordActivity({
      actionType: 'BILL_DELETED',
      performedBy: activePerformer,
      targetId: deletedRecord.invoiceNumber || targetId,
      targetName: `Invoice #${deletedRecord.invoiceNumber || targetId} (₹${deletedRecord.billData?.grandTotal || 0})`,
      details: {
        invoiceNumber: deletedRecord.invoiceNumber || targetId,
        grandTotal: deletedRecord.billData?.grandTotal || 0,
        itemsCount: deletedRecord.billData?.items?.length || 0,
        customer: deletedRecord.billData?.customer,
        paymentMethod: deletedRecord.billData?.paymentMethod,
      },
      reason: reason.trim(),
    }).catch((e) => console.warn('[Activity] deleteBill log failed:', e));

    return true;
  };

  // Delete a selected set of bills through the same audited, recoverable
  // single-bill flow. Sequential processing avoids stock/audit race conditions.
  const deleteBills = async (billIdsOrInvoices, reason, deletedBy = null) => {
    if (!Array.isArray(billIdsOrInvoices) || billIdsOrInvoices.length === 0) {
      throw new Error('Select at least one bill to delete.');
    }
    const identifiers = [...new Set(billIdsOrInvoices.filter(Boolean))];
    const deleted = [];
    const failed = [];
    for (const identifier of identifiers) {
      try {
        const wasDeleted = await deleteBill(identifier, reason, deletedBy);
        if (wasDeleted) deleted.push(identifier);
        else failed.push(identifier);
      } catch {
        failed.push(identifier);
      }
    }
    return { deleted, failed };
  };

  const editBill = async (billIdOrInv, updatedFields, reason = '', editedBy = null) => {
    const activePerformer = resolveActiveUser(editedBy);
    const targetBill = bills.find((b) => b.id === billIdOrInv || b.invoiceNumber === billIdOrInv);
    if (!targetBill) return { success: false, message: 'Bill not found' };

    const originalGrandTotal = Number(targetBill.grandTotal || 0);
    const newGrandTotal = updatedFields.grandTotal !== undefined ? Number(updatedFields.grandTotal) : originalGrandTotal;

    // ── BACKEND-FIRST: persist to database before updating UI ──────────────
    let persistedBill = null;
    try {
      const res = await api.put(`/api/bills/${targetBill.id || targetBill.invoiceNumber}`, {
        ...updatedFields,
        editReason: reason?.trim() || 'Billing correction',
        editedBy: activePerformer,
      });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected the bill edit.');
      }
      persistedBill = res.bill; // Use the actual DB record as the source of truth
    } catch (err) {
      throw new Error(err?.message || 'Failed to update bill. Please try again.');
    }
    // ────────────────────────────────────────────────────────────────────────

    // API succeeded → update UI state with the persisted DB record
    const billToApply = persistedBill || {
      ...targetBill,
      ...updatedFields,
      isEdited: true,
    };

    setBills((prev) => {
      const updated = prev.map((b) =>
        b.id === targetBill.id || b.invoiceNumber === targetBill.invoiceNumber ? billToApply : b
      );
      try {
        localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Record Activity Log (best-effort, non-blocking)
    recordActivity({
      actionType: 'BILL_EDITED',
      performedBy: activePerformer,
      targetId: targetBill.invoiceNumber,
      targetName: `Invoice #${targetBill.invoiceNumber}`,
      details: {
        invoiceNumber: targetBill.invoiceNumber,
        originalGrandTotal,
        newGrandTotal,
        difference: Math.round((newGrandTotal - originalGrandTotal) * 100) / 100,
      },
      reason: reason?.trim() || 'Billing correction',
    }).catch((e) => console.warn('[Activity] editBill log failed:', e));

    return { success: true, bill: billToApply };
  };

  const restoreBill = async (billIdOrInv, restoredBy = null) => {
    const activePerformer = resolveActiveUser(restoredBy);
    const record = recycleBinBills.find((d) => d.id === billIdOrInv || d.invoiceNumber === billIdOrInv);
    if (!record || !record.billData) return false;

    const restoredBill = record.billData;

    // ── BACKEND-FIRST: persist restore to database before updating UI ───────
    try {
      const res = await api.post(`/api/recycle-bin/bills/${record.id}/restore`, { restoredBy: activePerformer });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected the restore request.');
      }
    } catch (err) {
      throw new Error(err?.message || 'Failed to restore bill. Please try again.');
    }
    // ────────────────────────────────────────────────────────────────────────

    // API succeeded → move back to active bills state & localStorage
    setBills((prev) => {
      const updated = [restoredBill, ...prev.filter((b) => b.id !== restoredBill.id && b.invoiceNumber !== restoredBill.invoiceNumber)];
      try {
        localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Remove from recycle bin state & localStorage
    setRecycleBinBills((prev) => {
      const updated = prev.filter((d) => d.id !== record.id && d.invoiceNumber !== record.invoiceNumber);
      try {
        localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Record Admin Activity (best-effort, non-blocking)
    recordActivity({
      actionType: 'BILL_RESTORED',
      performedBy: activePerformer,
      targetId: record.invoiceNumber,
      targetName: `Invoice #${record.invoiceNumber} (₹${restoredBill.grandTotal})`,
      details: { invoiceNumber: record.invoiceNumber, grandTotal: restoredBill.grandTotal },
      reason: 'Restored from Recycle Bin by Administrator',
    }).catch((e) => console.warn('[Activity] restoreBill log failed:', e));

    return true;
  };

  const permanentDeleteBill = async (billIdOrInv, purgedBy = null) => {
    const activePerformer = resolveActiveUser(purgedBy);
    const record = recycleBinBills.find((d) => d.id === billIdOrInv || d.invoiceNumber === billIdOrInv);
    if (!record) return false;

    // ── BACKEND-FIRST: purge from database before updating local UI ───────
    try {
      const res = await api.delete(`/api/recycle-bin/bills/${record.id}/permanent`, {
        data: { purgedBy: activePerformer },
      });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected permanent deletion.');
      }
    } catch (err) {
      throw new Error(err?.message || 'Failed to permanently purge bill. Please try again.');
    }
    // ───────────────────────────────────────────────────────────────────────

    // 1. Remove permanently from recycle bin
    setRecycleBinBills((prev) => {
      const updated = prev.filter((d) => d.id !== record.id && d.invoiceNumber !== record.invoiceNumber);
      try {
        localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Record Admin Activity
    await recordActivity({
      actionType: 'BILL_PERMANENTLY_PURGED',
      performedBy: activePerformer,
      targetId: record.invoiceNumber,
      targetName: `Invoice #${record.invoiceNumber}`,
      details: { invoiceNumber: record.invoiceNumber },
      reason: 'Permanently deleted by Administrator',
    }).catch(() => {});

    return true;
  };

  const permanentDeleteBills = async (billIdsOrInvoices, purgedBy = null) => {
    if (!Array.isArray(billIdsOrInvoices) || billIdsOrInvoices.length === 0) {
      throw new Error('Select at least one bill to purge.');
    }
    const identifiers = [...new Set(billIdsOrInvoices.filter(Boolean))];
    const purged = [];
    const failed = [];
    for (const id of identifiers) {
      try {
        const ok = await permanentDeleteBill(id, purgedBy);
        if (ok) purged.push(id);
        else failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { purged, failed };
  };

  const restoreBills = async (billIdsOrInvoices, restoredBy = null) => {
    if (!Array.isArray(billIdsOrInvoices) || billIdsOrInvoices.length === 0) {
      throw new Error('Select at least one bill to restore.');
    }
    const identifiers = [...new Set(billIdsOrInvoices.filter(Boolean))];
    const restored = [];
    const failed = [];
    for (const id of identifiers) {
      try {
        const ok = await restoreBill(id, restoredBy);
        if (ok) restored.push(id);
        else failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { restored, failed };
  };

  const toggleProductAvailability = async (productId, explicitStateOrUser = null, maybeUser = null) => {
    let nextInactive;
    let userObj = null;

    if (typeof explicitStateOrUser === 'boolean') {
      nextInactive = explicitStateOrUser;
      userObj = maybeUser;
    } else if (typeof explicitStateOrUser === 'object' && explicitStateOrUser !== null) {
      userObj = explicitStateOrUser;
      const currentInactive = productAvailabilityMap[productId] !== undefined
        ? Boolean(productAvailabilityMap[productId])
        : Boolean(inventory.find((i) => i.id === productId)?.isInactive);
      nextInactive = !currentInactive;
    } else {
      userObj = maybeUser;
      const currentInactive = productAvailabilityMap[productId] !== undefined
        ? Boolean(productAvailabilityMap[productId])
        : Boolean(inventory.find((i) => i.id === productId)?.isInactive);
      nextInactive = !currentInactive;
    }

    const activePerformer = resolveActiveUser(userObj);

    // 1. Update availability map in state and localStorage
    setProductAvailabilityMap((prev) => {
      const updated = { ...prev, [productId]: nextInactive };
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(PRODUCT_AVAILABILITY_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    // 2. Update inventory list state so both match in memory and storage
    setInventory((prev) => {
      const updated = prev.map((item) =>
        item.id === productId ? { ...item, isInactive: nextInactive } : item
      );
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    // 3. Broadcast to all open tabs/windows in real time
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('thenisai_inventory_channel');
        bc.postMessage({ type: 'AVAILABILITY_CHANGED', productId, isInactive: nextInactive });
        bc.close();
      }
    } catch {}

    const item = allBillingProducts.find((it) => it.id === productId);
    const prodName = item ? item.name : productId;

    recordActivity({
      actionType: 'STOCK_TOGGLED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: prodName,
      details: { isInactive: nextInactive },
      reason: nextInactive ? 'Marked Out of Stock / இருப்பு இல்லை' : 'Reactivated / இருப்பு வந்தது',
    });

    if (isSandboxActive()) {
      // In sandbox mode, keep in memory only without mutating persistent storage or backend
      return;
    }

    try {
      await api.patch(`/api/inventory/${productId}/availability`, { isInactive: nextInactive });
    } catch (err) {
      console.warn('Backend availability sync failed, saved locally:', err);
    }
  };

  const getActiveProductsForSku = () => {
    const deletedSet = new Set([
      ...(Array.isArray(deletedProductIds) ? deletedProductIds : []),
      ...recycleBinProducts.map((p) => p.id),
    ]);

    const active = [];
    const seenIds = new Set();

    // 1. Static items not deleted
    ALL_BILLING_ITEMS.forEach((item) => {
      if (!deletedSet.has(item.id) && !seenIds.has(item.id)) {
        active.push(item);
        seenIds.add(item.id);
      }
    });

    // 2. Custom products not deleted
    customProducts.forEach((item) => {
      if (!deletedSet.has(item.id) && !seenIds.has(item.id)) {
        active.push(item);
        seenIds.add(item.id);
      }
    });

    // 3. Inventory items not deleted
    inventory.forEach((item) => {
      if (!deletedSet.has(item.id) && !seenIds.has(item.id)) {
        active.push(item);
        seenIds.add(item.id);
      }
    });

    return active;
  };

  const getNextAvailableSkuCode = () => {
    const usedNumbers = new Set();
    const activeProducts = getActiveProductsForSku();

    activeProducts.forEach((item) => {
      const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim();
      const parentNum = Number(raw);
      if (raw && Number.isInteger(parentNum) && parentNum > 0) {
        usedNumbers.add(parentNum);
      }
    });

    // Fill gaps: find lowest positive integer NOT currently in use
    // This means deleted SKUs become available again automatically
    let nextSku = 1;
    while (usedNumbers.has(nextSku)) {
      nextSku += 1;
    }

    return String(nextSku);
  };

  const getAvailableSkuCodes = (limit = 10) => {
    const usedNumbers = new Set();
    const activeProducts = getActiveProductsForSku();

    activeProducts.forEach((item) => {
      const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim();
      const parentNum = Number(raw);
      if (raw && Number.isInteger(parentNum) && parentNum > 0) {
        usedNumbers.add(parentNum);
      }
    });

    const available = [];
    let candidate = 1;
    while (available.length < limit) {
      if (!usedNumbers.has(candidate)) {
        available.push(candidate);
      }
      candidate += 1;
    }
    return available;
  };

  const resolveUniqueSkuCode = (requestedCode) => {
    const cleaned = String(requestedCode ?? '').trim();
    if (!cleaned) return getNextAvailableSkuCode();
    if (!/^\d+$/.test(cleaned)) return getNextAvailableSkuCode();

    const numeric = Number(cleaned);
    if (!Number.isInteger(numeric) || numeric <= 0) return getNextAvailableSkuCode();

    const activeProducts = getActiveProductsForSku();
    const taken = activeProducts.some((item) => {
      const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim();
      return raw && /^\d+$/.test(raw) && Number(raw) === numeric;
    });

    return taken ? getNextAvailableSkuCode() : cleaned;
  };

  const addNewProduct = async (productData, performedBy = null) => {
    const activePerformer = resolveActiveUser(performedBy);

    const requestedSku = String(productData.skuCode || productData.hsn || '').trim();
    if (requestedSku) {
      const activeProducts = getActiveProductsForSku();
      const duplicate = activeProducts.find((item) => {
        const raw = String(item?.skuCode ?? item?.itemNumber ?? '').trim();
        return raw && raw.toLowerCase() === requestedSku.toLowerCase();
      });
      if (duplicate) {
        const dupName = duplicate.englishName || duplicate.name.split('—')[0].trim();
        throw new Error(`SKU #${requestedSku} is already added for product "${dupName}". Please use a different SKU number.`);
      }
    }

    const generatedSku = requestedSku || getNextAvailableSkuCode();
    const nextItemNum = Number(generatedSku) || Number(getNextAvailableSkuCode());
    const generatedHsn = String(productData.hsn ?? '').trim() || generatedSku;

    const newId = productData.id || `custom-${Date.now()}`;
    const unitPrice = parseFloat(productData.price || productData.unitPrice || 500);
    const stockQty = parseFloat(productData.stockKg || productData.stock || 15);

    const newProd = {
      id: newId,
      itemNumber: nextItemNum,
      skuCode: generatedSku,
      name: productData.name,
      englishName: productData.englishName || productData.name.split('—')[0].trim(),
      tamilName: productData.tamilName || (productData.name.includes('—') ? productData.name.split('—')[1].trim() : ''),
      price: unitPrice,
      unitPrice,
      pricePerKg: unitPrice,
      unit: productData.unit || 'kg',
      category: productData.category || 'sweets',
      subcategory: productData.subcategory || 'Special Sweets',
      stockKg: stockQty,
      minThreshold: parseFloat(productData.minThreshold || 8),
      hsn: generatedHsn,
      image: productData.image || '/images/products/palkova_card.jpg',
      isCustom: true,
      description: productData.description || 'Special preparation',
    };

    setCustomProducts((prev) => {
      const updated = [...prev, newProd];
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    setInventory((prev) => {
      const updated = [...prev, {
        id: newProd.id,
        itemNumber: newProd.itemNumber,
        skuCode: generatedSku,
        name: newProd.name,
        stockKg: stockQty,
        minThreshold: newProd.minThreshold,
        unit: newProd.unit,
        price: newProd.price,
        category: newProd.category,
        subcategory: newProd.subcategory,
        batchDate: 'Today Just now',
        batchNote: 'New item addition',
        hsn: generatedHsn,
        isCustom: true,
      }];
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    setDeletedProductIds((prev) => {
      const updated = prev.filter(
        (id) =>
          id !== newProd.id &&
          id !== productData.id &&
          id !== (productData.nameEn || '').toLowerCase().replace(/[^a-z0-9]/g, '-') &&
          id !== (productData.englishName || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
      );
      try {
        localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_ADDED',
      performedBy: activePerformer,
      targetId: newProd.id,
      targetName: newProd.name,
      details: { price: newProd.price, category: newProd.category, unit: newProd.unit, stock: stockQty },
      reason: 'New product added to catalog',
    });

    if (isSandboxActive()) {
      // In sandbox mode, keep in memory only without mutating persistent storage or backend
      return newProd;
    }

    try {
      const res = await api.post('/api/inventory/products', newProd);
      if (res && res.success) {
        if (Array.isArray(res.inventory)) {
          setInventory(res.inventory);
          try {
            if (!isSandboxActive()) {
              localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(res.inventory));
            }
          } catch {}
        }
        if (res.product) {
          setCustomProducts((prev) => {
            const idx = prev.findIndex((p) => p.id === newProd.id);
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...res.product, skuCode: String(res.product.skuCode || copy[idx].skuCode) };
              try {
                if (!isSandboxActive()) {
                  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(copy));
                }
              } catch {}
              return copy;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('Backend product creation failed, saved locally:', err);
    }

    return newProd;
  };

  const fetchRecycleBinProducts = async () => {
    try {
      const res = await api.get('/api/recycle-bin/products');
      if (res && res.success && Array.isArray(res.deletedProducts)) {
        setRecycleBinProducts(res.deletedProducts);
        try {
          localStorage.setItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY, JSON.stringify(res.deletedProducts));
        } catch {}
        setDeletedProductIds((prev) => {
          const combined = Array.from(new Set([...prev, ...res.deletedProducts.map((p) => p.id)]));
          try {
            localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(combined));
          } catch {}
          return combined;
        });
        return res.deletedProducts;
      }
    } catch (err) {
      console.warn('Backend fetch recycle bin products failed:', err);
    }
    return recycleBinProducts;
  };

  const deleteProduct = async (productId, performedBy = null, reason = 'Product removed from catalog') => {
    const activePerformer = resolveActiveUser(performedBy);
    const item = allBillingProducts.find((it) => it.id === productId) || inventory.find((it) => it.id === productId);
    const prodName = item ? item.name : productId;

    if (isSandboxActive()) {
      setCustomProducts((prev) => prev.filter((p) => p.id !== productId));
      setInventory((prev) => prev.filter((p) => p.id !== productId));
      setDeletedProductIds((prev) => [...prev, productId]);
      return true;
    }

    // BACKEND-FIRST: Call backend delete (which moves product into DeletedProduct collection)
    let deletedProductRecord = null;
    try {
      const res = await api.delete(`/api/inventory/products/${productId}`, {
        data: { reason: reason || 'Product removed from catalog', deletedBy: activePerformer },
      });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected product deletion.');
      }
      deletedProductRecord = res.deletedProduct;
    } catch (err) {
      throw new Error(err?.message || 'Failed to delete product from database.');
    }

    // 1. Mark in deletedProductIds (so static catalog and DEFAULT_INVENTORY never resurrect it)
    setDeletedProductIds((prev) => {
      const updated = Array.from(new Set([...prev, productId]));
      try {
        localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove from customProducts & inventory
    setCustomProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setInventory((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Add to local Recycle Bin state
    const fallbackRecord = {
      id: productId,
      name: prodName,
      englishName: item?.englishName || '',
      tamilName: item?.tamilName || '',
      productData: item || { id: productId, name: prodName },
      deletedBy: activePerformer,
      deletionReason: reason,
      deletedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    const recToAdd = deletedProductRecord || fallbackRecord;

    setRecycleBinProducts((prev) => {
      const updated = [recToAdd, ...prev.filter((p) => p.id !== productId)];
      try {
        localStorage.setItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_DELETED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: prodName,
      reason,
    });

    return true;
  };

  const restoreProduct = async (productId, restoredBy = null) => {
    const activePerformer = resolveActiveUser(restoredBy);
    const record = recycleBinProducts.find((p) => p.id === productId);
    if (!record) throw new Error('Product not found in Recycle Bin.');

    if (isSandboxActive()) {
      setRecycleBinProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeletedProductIds((prev) => prev.filter((id) => id !== productId));
      if (record.productData) {
        setInventory((prev) => [...prev, record.productData]);
      }
      return true;
    }

    // BACKEND-FIRST: Call restore endpoint
    let restoredData = null;
    try {
      const res = await api.post(`/api/recycle-bin/products/${productId}/restore`, {
        restoredBy: activePerformer,
      });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected product restoration.');
      }
      restoredData = res.product;
    } catch (err) {
      throw new Error(err?.message || 'Failed to restore product.');
    }

    // Remove from Recycle Bin state & localStorage
    setRecycleBinProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Remove from deletedProductIds
    setDeletedProductIds((prev) => {
      const updated = prev.filter((id) => id !== productId);
      try {
        localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Restore to inventory state
    const toRestore = restoredData || record.productData || { id: productId, name: record.name };
    setInventory((prev) => {
      const exists = prev.some((p) => p.id === productId);
      const updated = exists ? prev.map((p) => (p.id === productId ? { ...p, ...toRestore } : p)) : [...prev, toRestore];
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_RESTORED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: record.name,
      reason: 'Restored from Recycle Bin by Administrator',
    });

    return true;
  };

  const permanentDeleteProduct = async (productId, purgedBy = null) => {
    const activePerformer = resolveActiveUser(purgedBy);
    const record = recycleBinProducts.find((p) => p.id === productId);

    if (isSandboxActive()) {
      setRecycleBinProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeletedProductIds((prev) => {
        const updated = prev.filter((id) => id !== productId);
        try { localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      return true;
    }

    // BACKEND-FIRST: Expunge from database
    try {
      const res = await api.delete(`/api/recycle-bin/products/${productId}/permanent`, {
        data: { purgedBy: activePerformer },
      });
      if (!res || !res.success) {
        throw new Error(res?.message || 'Server rejected product purge.');
      }
    } catch (err) {
      throw new Error(err?.message || 'Failed to permanently delete product.');
    }

    // Remove from Recycle Bin
    setRecycleBinProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(RECYCLE_BIN_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also remove from deletedProductIds so it is completely expunged and reusable
    setDeletedProductIds((prev) => {
      const updated = prev.filter((id) => id !== productId);
      try {
        localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_PERMANENTLY_PURGED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: record?.name || productId,
      reason: 'Permanently deleted by Administrator',
    });

    return true;
  };

  const permanentDeleteProducts = async (productIds, purgedBy = null) => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Select at least one product to purge.');
    }
    const identifiers = [...new Set(productIds.filter(Boolean))];
    const purged = [];
    const failed = [];
    for (const id of identifiers) {
      try {
        const ok = await permanentDeleteProduct(id, purgedBy);
        if (ok) purged.push(id);
        else failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { purged, failed };
  };

  const restoreProducts = async (productIds, restoredBy = null) => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Select at least one product to restore.');
    }
    const identifiers = [...new Set(productIds.filter(Boolean))];
    const restored = [];
    const failed = [];
    for (const id of identifiers) {
      try {
        const ok = await restoreProduct(id, restoredBy);
        if (ok) restored.push(id);
        else failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    return { restored, failed };
  };

  const updateProductMasterPrice = async (productId, newPrice, performedBy = null) => {
    const numPrice = parseFloat(newPrice);
    if (isNaN(numPrice) || numPrice <= 0) return;

    const activePerformer = resolveActiveUser(performedBy);
    const item = (allBillingProducts || ALL_BILLING_ITEMS).find((it) => it.id === productId);
    const prodName = item ? item.name : productId;
    const oldPrice = item ? item.price : 0;

    // 1. Immediately update persistent masterPrices map
    setMasterPrices((prev) => {
      const updated = { ...prev, [productId]: numPrice };
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(MASTER_PRICES_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    // 2. Update customProducts state if applicable
    setCustomProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, price: numPrice, unitPrice: numPrice, pricePerKg: numPrice } : p));
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    // 3. Upsert into inventory array
    setInventory((prev) => {
      const exists = prev.some((p) => p.id === productId);
      let updated;
      if (exists) {
        updated = prev.map((p) => (p.id === productId ? { ...p, price: numPrice, unitPrice: numPrice, pricePerKg: numPrice } : p));
      } else {
        const base = ALL_BILLING_ITEMS.find((it) => it.id === productId) || {};
        updated = [...prev, { ...base, id: productId, name: prodName, price: numPrice, unitPrice: numPrice, pricePerKg: numPrice }];
      }
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_PRICE_UPDATED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: prodName,
      details: { oldPrice, newPrice: numPrice },
      reason: `Master catalog price changed: ₹${oldPrice} → ₹${numPrice}`,
    });

    if (isSandboxActive()) {
      // In sandbox mode, keep in memory only
      return;
    }

    try {
      await api.patch(`/api/inventory/${productId}/price`, { price: numPrice });
    } catch (err) {
      console.warn('Backend price update failed:', err);
    }
  };

  const updateProductDetails = async (productId, updates, performedBy = null) => {
    const nameEn = String(updates.englishName ?? updates.name ?? '').trim();
    const nameTa = String(updates.tamilName ?? '').trim();
    const nextCategory = updates.category || 'sweets';
    const nextUnit = updates.unit || 'kg';
    const nextPrice = parseFloat(updates.price ?? updates.unitPrice ?? 0);

    if (!nameEn || Number.isNaN(nextPrice) || nextPrice <= 0) {
      return { success: false, message: 'Please enter a valid product name and price.' };
    }

    const activePerformer = resolveActiveUser(performedBy);
    const displayName = nameTa ? `${nameEn} — ${nameTa}` : nameEn;
    const item = (allBillingProducts || []).find((it) => it.id === productId);
    const oldName = item ? item.name : nameEn;
    const oldPrice = item ? item.price : 0;

    setCustomProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? {
        ...p,
        name: displayName,
        englishName: nameEn,
        tamilName: nameTa,
        category: nextCategory,
        unit: nextUnit,
        price: nextPrice,
        unitPrice: nextPrice,
        pricePerKg: nextPrice,
        description: updates.description || p.description || 'Updated product details',
      } : p));
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    setInventory((prev) => {
      const existing = prev.some((p) => p.id === productId);
      const updated = existing
        ? prev.map((p) => (p.id === productId ? {
            ...p,
            name: displayName,
            englishName: nameEn,
            tamilName: nameTa,
            category: nextCategory,
            unit: nextUnit,
            price: nextPrice,
            unitPrice: nextPrice,
            pricePerKg: nextPrice,
            description: updates.description || p.description || 'Updated product details',
          } : p))
        : [
            ...prev,
            {
              id: productId,
              name: displayName,
              englishName: nameEn,
              tamilName: nameTa,
              category: nextCategory,
              unit: nextUnit,
              price: nextPrice,
              unitPrice: nextPrice,
              pricePerKg: nextPrice,
              stockKg: 0,
              minThreshold: 0,
              description: updates.description || 'Updated product details',
              isCustom: true,
            },
          ];
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    setMasterPrices((prev) => {
      const updated = { ...prev, [productId]: nextPrice };
      try {
        if (!isSandboxActive()) {
          localStorage.setItem(MASTER_PRICES_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_UPDATED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: oldName,
      details: {
        oldName,
        newName: displayName,
        oldPrice,
        newPrice: nextPrice,
        category: nextCategory,
        unit: nextUnit,
      },
      reason: 'Product details updated from admin inventory',
    });

    if (isSandboxActive()) {
      return { success: true };
    }

    try {
      await api.patch(`/api/inventory/${productId}`, {
        name: displayName,
        englishName: nameEn,
        tamilName: nameTa,
        category: nextCategory,
        unit: nextUnit,
        price: nextPrice,
      });
      return { success: true };
    } catch (err) {
      console.warn('Backend product update failed:', err);
      return { success: true, warning: true };
    }
  };

  const updateProductSkuCode = async (productId, newSkuCode) => {
    const skuStr = String(newSkuCode ?? '').trim();
    if (!skuStr) {
      return { success: false, message: 'SKU code is required.' };
    }

    const duplicate = (allBillingProducts || inventory || []).find(
      (item) => item.id !== productId && String(item.skuCode ?? item.itemNumber ?? '').trim().toLowerCase() === skuStr.toLowerCase()
    );
    if (duplicate) {
      const dupName = duplicate.englishName || duplicate.name.split('—')[0].trim();
      return {
        success: false,
        message: `SKU #${skuStr} is already added for product "${dupName}". Please use a different SKU number.`,
      };
    }

    if (isSandboxActive()) {
      setInventory((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, skuCode: skuStr } : p))
      );
      return { success: true };
    }

    try {
      const result = await api.patch(`/api/inventory/${productId}/sku`, { skuCode: skuStr });

      if (result.success) {
        setInventory((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, skuCode: skuStr } : p))
        );
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (err) {
      console.warn('[SKU] Failed to update SKU code:', err);
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const addCounterSale = async (saleData) => {
    const fullOrder = {
      ...saleData,
      id: saleData.id || `pos-${Date.now()}`,
      source: 'counter',
      status: 'Completed',
      createdAt: Date.now(),
      isSandbox: isSandboxActive(),
    };

    if (isSandboxActive()) {
      // Counter sales in Sandbox: keep in memory only; DO NOT write to real database or real offline ledger
      setBills((prev) => [fullOrder, ...prev]);
      deductStockForItems(saleData.items);
      return fullOrder;
    }

    // Auto-detect and record Price Override audit logs for any price-overridden items
    if (Array.isArray(saleData.items)) {
      saleData.items.forEach((item) => {
        if (item.isPriceOverridden || (item.originalPrice !== undefined && Number(item.originalPrice) !== Number(item.price))) {
          const orig = Number(item.originalPrice ?? item.price);
          const current = Number(item.price);
          recordPriceOverrideLog({
            invoiceNumber: fullOrder.invoiceNumber,
            cashier: fullOrder.cashier,
            productId: item.id,
            productName: item.name,
            weightOrUnit: item.weight || item.unit || 'unit',
            originalRate: orig,
            customRate: current,
            difference: current - orig,
            quantity: item.quantity || 1,
            reason: item.overrideReason || 'Staff Counter Price Adjustment',
            timestamp: Date.now(),
          });
        }
      });
    }

    // Counter sales strictly belong in bills (Shift Bills & Daily Revenue), NOT in online orders
    setBills((prev) => [fullOrder, ...prev]);
    deductStockForItems(saleData.items);

    // Save to offline ledger immediately (always — serves as local backup)
    try {
      const ledger = JSON.parse(localStorage.getItem(OFFLINE_LEDGER_KEY) || '[]');
      ledger.unshift(fullOrder);
      localStorage.setItem(OFFLINE_LEDGER_KEY, JSON.stringify(ledger.slice(0, 1000)));
    } catch { /* ignore storage errors */ }

    // Persist to backend bills endpoint
    try {
      const res = await api.post('/api/bills', fullOrder);
      if (res && res.success && res.bill) {
        setBills((prev) => [res.bill, ...prev.filter((b) => b.id !== fullOrder.id && b.id !== res.bill.id)]);
        return res.bill;
      }
    } catch (err) {
      console.warn('Backend bill save failed — queuing for offline sync:', err);
      // Backend is down → add to offline sync queue
      try {
        const offlineBill = { ...fullOrder, isOfflineBackup: true, offlineQueuedAt: Date.now() };
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        // De-duplicate by id
        const deduped = queue.filter(b => b.id !== offlineBill.id);
        deduped.unshift(offlineBill);
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(deduped));
        setHasOfflinePending(true);
        setOfflinePendingCount(deduped.length);
      } catch { /* ignore */ }
    }

    return fullOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: newStatus } : ord
      )
    );
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      console.warn('Failed to update status on backend:', err);
    }
  };

  const acceptOrder = (orderId) => {
    updateOrderStatus(orderId, 'Accepted');
  };

  // Inventory Actions
  const addInventoryStock = async (sweetId, additionalKg, batchNote = '') => {
    const kgToAdd = parseFloat(additionalKg) || 0;
    const now = new Date();
    const timeStr = `Today ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    setInventory((prev) => {
      const idx = prev.findIndex((item) => item.id === sweetId);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          stockKg: Math.round((updated[idx].stockKg + kgToAdd) * 100) / 100,
          batchDate: timeStr,
          batchNote: batchNote.trim() || updated[idx].batchNote,
        };
        return updated;
      } else {
        const catalogItem = SWEETS_CATALOG.find((s) => s.id === sweetId);
        return [
          ...prev,
          {
            id: sweetId,
            name: catalogItem?.name || sweetId,
            stockKg: kgToAdd,
            minThreshold: 8,
            batchDate: timeStr,
            batchNote: batchNote || 'Fresh batch',
          },
        ];
      }
    });

    if (isSandboxActive()) {
      return;
    }

    try {
      await api.post('/api/inventory/stock', {
        sweetId,
        additionalKg: kgToAdd,
        batchNote,
      });
    } catch (err) {
      console.warn('Backend inventory stock update failed:', err);
    }
  };

  const adjustInventoryStock = async (sweetId, newKg) => {
    const val = Math.max(0, parseFloat(newKg) || 0);
    setInventory((prev) =>
      prev.map((item) =>
        item.id === sweetId ? { ...item, stockKg: Math.round(val * 100) / 100 } : item
      )
    );

    if (isSandboxActive()) {
      return;
    }

    try {
      await api.post('/api/inventory/stock', {
        sweetId,
        newKg: val,
      });
    } catch (err) {
      console.warn('Backend inventory adjust failed:', err);
    }
  };

  const addNewProductStock = async (newProduct) => {
    const now = new Date();
    const timeStr = `Today ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    const newId = newProduct.id || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const initialKg = Math.max(0, parseFloat(newProduct.stockKg) || 10);

    setInventory((prev) => {
      const exists = prev.some((it) => it.id === newId);
      if (exists) {
        return prev.map((it) =>
          it.id === newId
            ? {
              ...it,
              stockKg: Math.round((it.stockKg + initialKg) * 100) / 100,
              batchDate: timeStr,
              batchNote: newProduct.batchNote || it.batchNote,
            }
            : it
        );
      }
      return [
        ...prev,
        {
          id: newId,
          name: newProduct.name,
          stockKg: initialKg,
          minThreshold: parseFloat(newProduct.minThreshold) || 8,
          batchDate: timeStr,
          batchNote: newProduct.batchNote || 'New item arrival',
        },
      ];
    });

    if (isSandboxActive()) {
      return;
    }

    try {
      await api.post('/api/inventory/products', {
        ...newProduct,
        id: newId,
        stockKg: initialKg,
      });
    } catch (err) {
      console.warn('Backend new product stock creation failed:', err);
    }
  };

  // Cart actions
  const addToCart = (product, weight = '500g', price = null, quantity = 1) => {
    const itemPrice = price ?? (product.prices ? product.prices[weight] : product.price);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.weight === weight
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            weight,
            price: itemPrice,
            quantity,
            image: product.image,
            hsn: product.hsn || '2106',
          },
        ];
      }
    });

    setCartNotification({
      name: product.name,
      weight,
      quantity,
    });
    setTimeout(() => setCartNotification(null), 3000);
  };

  const updateQuantity = (id, weight, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id && item.weight === weight) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (id, weight) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.weight === weight))
    );
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const resetLocalDataExceptInventory = useCallback(() => {
    const preservedKeys = new Set([INVENTORY_STORAGE_KEY, PRODUCT_AVAILABILITY_KEY]);
    const removedKeys = [];

    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (!preservedKeys.has(key)) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      });
    }

    setCart([]);
    setOrders([]);
    setBills([]);
    setRecycleBinBills([]);
    setActivityLogs([]);
    setPriceOverrideLogs([]);
    setCustomProducts([]);
    setTaxSettings(DEFAULT_TAX_SETTINGS);
    setMasterPrices({});
    setHasOfflinePending(false);
    setOfflinePendingCount(0);

    const inventorySnapshot = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]');
    const availabilityMap = Array.isArray(inventorySnapshot)
      ? inventorySnapshot.reduce((acc, item) => {
          if (item && item.id) acc[item.id] = Boolean(item.isInactive);
          return acc;
        }, {})
      : {};
    setProductAvailabilityMap(availabilityMap);
    try {
      localStorage.setItem(PRODUCT_AVAILABILITY_KEY, JSON.stringify(availabilityMap));
    } catch {}

    if (typeof window !== 'undefined') {
      window.__thenisaiResetLocalDataExceptInventory = () => resetLocalDataExceptInventory();
    }

    return { removedKeys, preservedKeys: Array.from(preservedKeys) };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__thenisaiResetLocalDataExceptInventory = () => resetLocalDataExceptInventory();
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.__thenisaiResetLocalDataExceptInventory;
      }
    };
  }, [resetLocalDataExceptInventory]);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
  };

  const openInvoice = (invoiceData) => {
    setActiveInvoice(invoiceData);
  };

  const closeInvoice = () => {
    setActiveInvoice(null);
    try {
      localStorage.removeItem(INVOICE_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  // Pending online orders count
  const pendingOrdersCount = orders.filter(
    (o) => o.source === 'online' && (o.status === 'New' || o.status === 'Accepted')
  ).length;

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        activeInvoice,
        cartNotification,
        currentView,
        navigateTo,
        orders,
        bills,
        fetchBills,
        inventory,
        pendingOrdersCount,
        taxSettings,
        updateTaxSettings,
        // Offline resilience
        isOnline,
        hasOfflinePending,
        offlinePendingCount,
        syncOfflineBills,
        placeOnlineOrder,
        addCounterSale,
        acceptOrder,
        updateOrderStatus,
        addInventoryStock,
        addNewProductStock,
        adjustInventoryStock,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        resetLocalDataExceptInventory,
        openCheckout,
        closeCheckout,
        openInvoice,
        closeInvoice,
        // Dynamic Products & Availability
        allBillingProducts,
        customProducts,
        productAvailabilityMap,
        toggleProductAvailability,
        refreshInventory: syncWithBackend,
        addNewProduct,
        addNewProductDetails: addNewProduct,
        getNextAvailableSkuCode,
        getAvailableSkuCodes,
        resolveUniqueSkuCode,
        updateProductDetails,
        updateProduct: updateProductDetails,
        deleteProduct,
        updateProductMasterPrice,
        updateProductSkuCode,
        masterPrices,
        // Admin-managed custom Categories & Units
        allCategories,
        allUnits,
        customCategories,
        customUnits,
        addCustomCategory,
        updateCategory,
        removeCustomCategory,
        addCustomUnit,
        updateUnit,
        removeCustomUnit,
        // Price Override Auditing
        priceOverrideLogs,
        recordPriceOverrideLog,
        fetchPriceOverrideLogs,
        // Bill Deletion & 30-Day Recycle Bin
        recycleBinBills,
        deleteBill,
        deleteBills,
        editBill,
        restoreBill,
        restoreBills,
        permanentDeleteBill,
        permanentDeleteBills,
        fetchRecycleBinBills,
        // Product Deletion & 30-Day Recycle Bin
        recycleBinProducts,
        restoreProduct,
        restoreProducts,
        permanentDeleteProduct,
        permanentDeleteProducts,
        fetchRecycleBinProducts,
        // Unified Activity Audit Trail
        activityLogs,
        recordActivity,
        fetchActivityLogs,
        subtotal,
        totalItems,
        freeDeliveryRemaining,
        isFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
