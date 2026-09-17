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
const ACTIVITY_LOGS_STORAGE_KEY = 'thenisai_activity_logs_v1';


export const DEFAULT_TAX_SETTINGS = {
  totalGstRate: 0,   // 0% Total GST
  cgstRate: 0,       // 0% Central GST
  sgstRate: 0,       // 0% State GST
  gstin: '33AABCT9988Q1Z5',
  taxEnabled: false,
  lastUpdated: '17 Sep 2026',
};

const DEFAULT_INVENTORY = ALL_BILLING_ITEMS.map((item) => {
  const isKg = item.unit === 'kg';
  const isLitre = item.unit === 'Litre' || item.unit === '1 Litre';
  const isCup = item.unit === 'Cup' || item.unit === '1 Cup';
  const isPc = item.unit === 'Pc' || item.unit === '1 Pc';

  return {
    id: item.id,
    itemNumber: item.itemNumber,
    name: item.name,
    englishName: item.englishName,
    tamilName: item.tamilName,
    stockKg: isKg ? 35 : isLitre ? 25 : isCup ? 100 : isPc ? 80 : 50,
    minThreshold: isKg ? 8 : 10,
    batchDate: 'Today 06:30 AM',
    batchNote: item.description || 'Fresh counter stock',
    unit: item.unit || 'kg',
    price: item.price,
    category: item.category || 'sweets',
    subcategory: item.subcategory || (item.category === 'spices' ? 'Spices (Kara Vagai)' : item.category === 'beverages' ? 'Beverages' : 'Traditional Sweets'),
    hsn: item.hsn || '2106',
  };
});

const INITIAL_ORDERS = [
  {
    id: 'ord-103',
    invoiceNumber: 'THN-2026-5120',
    orderDate: '16 Sep 2026',
    orderTime: '02:15 PM',
    customer: { fullName: 'Anitha Sundaram', phone: '9845012398', email: 'anitha.s@gmail.com' },
    shippingAddress: { doorNo: '72, 4th Cross', street: 'Koramangala 5th Block', landmark: 'Near Sony World Signal', city: 'Bengaluru', state: 'Karnataka', pincode: '560095' },
    items: [
      { id: '13', name: 'Motichoor Laddu — மோட்டிச்சூர் லட்டு', weight: '500g', price: 340, quantity: 1, image: '/images/products/palkova_card.jpg', hsn: '2106' },
      { id: 'palkova', name: 'Signature Palkova — பாரம்பரிய பால்கோவா', weight: '1kg', price: 680, quantity: 1, image: '/images/products/palkova_card.jpg', hsn: '0402' },
    ],
    subtotal: 1020,
    taxBreakdown: { rate: 5, totalTax: 51, cgst: 25.5, sgst: 25.5, igst: 0, isInterState: false },
    deliveryFee: 0,
    grandTotal: 1071,
    paymentMethod: 'upi',
    upiUtr: '425983719283',
    source: 'online',
    status: 'New',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'ord-102',
    invoiceNumber: 'THN-2026-6418',
    orderDate: '16 Sep 2026',
    orderTime: '11:30 AM',
    customer: { fullName: 'Karthik Raja', phone: '9789012345', email: 'karthik.raja@yahoo.com' },
    shippingAddress: { doorNo: '18/B', street: 'Sipcot Phase 2', landmark: 'Opposite Ashok Leyland', city: 'Hosur', state: 'Tamil Nadu', pincode: '635126' },
    items: [
      { id: 'mysore-pak', name: 'Ghee Mysore Pak — நெய் மைசூர் பாக்', weight: '500g', price: 380, quantity: 2, image: '/images/products/mysore_pak.jpg', hsn: '2106' },
    ],
    subtotal: 760,
    taxBreakdown: { rate: 5, totalTax: 38, cgst: 19, sgst: 19, igst: 0, isInterState: false },
    deliveryFee: 0,
    grandTotal: 798,
    paymentMethod: 'card',
    source: 'online',
    status: 'Accepted',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'ord-101',
    invoiceNumber: 'THN-2026-4821',
    orderDate: '16 Sep 2026',
    orderTime: '09:42 AM',
    customer: { fullName: 'Venkatesh Raman', phone: '9840123456', email: 'venkat@gmail.com' },
    shippingAddress: { doorNo: '45/A', street: 'KK Nagar', landmark: 'Near Temple', city: 'Krishnagiri', state: 'Tamil Nadu', pincode: '635001' },
    items: [
      { id: 'palkova', name: 'Signature Palkova', weight: '500g', price: 340, quantity: 2, image: '/images/products/palkova_card.jpg', hsn: '0402' },
      { id: 'mysore-pak', name: 'Royal Mysore Pak', weight: '250g', price: 190, quantity: 1, image: '/images/products/mysore_pak.jpg', hsn: '2106' },
    ],
    subtotal: 870,
    taxBreakdown: { rate: 5, totalTax: 43.5, cgst: 21.75, sgst: 21.75, igst: 0, isInterState: false },
    deliveryFee: 0,
    grandTotal: 914,
    paymentMethod: 'cod',
    source: 'online',
    status: 'Dispatched',
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'ord-100',
    invoiceNumber: 'THN-2026-3912',
    orderDate: '15 Sep 2026',
    orderTime: '08:15 AM',
    customer: { fullName: 'Lakshmi Narayanan', phone: '9443219876', email: 'lakshmi@outlook.com' },
    shippingAddress: { doorNo: '12', street: 'Anna Nagar West', landmark: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' },
    items: [
      { id: 'kaju-katli', name: 'Kaju Katli — காஜு கத்லி', weight: '1kg', price: 1020, quantity: 1, image: '/images/products/kaju_katli.jpg', hsn: '2106' },
    ],
    subtotal: 1020,
    taxBreakdown: { rate: 5, totalTax: 51, cgst: 25.5, sgst: 25.5, igst: 0, isInterState: false },
    deliveryFee: 0,
    grandTotal: 1071,
    paymentMethod: 'upi',
    upiUtr: '425983719283',
    source: 'online',
    status: 'Delivered',
    createdAt: Date.now() - 86400000,
  },
];

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

export const resolveActiveUser = (explicitUser = null) => {
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
          const isAdminUser = parsed.role === 'admin' || parsed.id === 'staff-1' || parsed.username === 'admin' || parsed.name?.includes('Ramanathan');
          const role = isAdminUser ? 'admin' : (parsed.role || (window.location.hash.toLowerCase().includes('admin') ? 'admin' : 'cashier'));
          const isAdmin = role === 'admin';
          return {
            id: parsed.id || (isAdmin ? 'staff-1' : 'staff-2'),
            username: parsed.username || (isAdmin ? 'admin' : 'cashier'),
            name: (parsed.name && parsed.name !== 'Staff') ? parsed.name : (isAdmin ? 'S. Ramanathan' : 'M. Kannan'),
            role,
            title: parsed.title || (isAdmin ? 'Kitchen Operations Head' : 'Counter Cashier'),
          };
        }
      }
    }
  } catch {}

  const isAdminRoute = typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('admin');
  if (isAdminRoute) {
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
    if (hash.startsWith('#billing')) return 'billing';
    if (hash.startsWith('#admin')) return 'admin';
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

  // Combined Billing Items (Standard 125 + Custom Items)
  const allBillingProducts = useMemo(() => {
    const combined = [...ALL_BILLING_ITEMS];
    customProducts.forEach((cp, idx) => {
      if (!combined.some((it) => it.id === cp.id)) {
        combined.push({
          ...cp,
          itemNumber: cp.itemNumber || (ALL_BILLING_ITEMS.length + idx + 1),
        });
      }
    });
    return combined;
  }, [customProducts]);

  // Inventory state
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.length < DEFAULT_INVENTORY.length) {
            const existingIds = new Set(parsed.map((i) => i.id));
            const missing = DEFAULT_INVENTORY.filter((i) => !existingIds.has(i.id));
            const combined = [...parsed, ...missing];
            try {
              localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(combined));
            } catch {}
            return combined;
          }
          return parsed;
        }
      }
      return DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

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
  useScrollLock(isCartOpen || isCheckoutOpen || Boolean(activeInvoice));

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
      const targetHash = subTab && subTab !== 'orders' ? `#admin/${subTab}` : '#admin';
      window.location.hash = targetHash;
    } else if (view === 'billing') {
      const targetHash = subTab && subTab !== 'register' ? `#billing/${subTab}` : '#billing';
      window.location.hash = targetHash;
    } else {
      // Storefront: Clear any path /admin or /billing back to /
      if (window.location.pathname !== '/') {
        if (window.history.pushState) {
          window.history.pushState(null, '', '/');
        } else {
          window.location.href = '/';
        }
      }
      window.location.hash = '';
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
    try {
      const [invRes, ordRes, billsRes] = await Promise.all([
        api.get('/api/inventory').catch(() => null),
        api.get('/api/orders').catch(() => null),
        api.get('/api/bills').catch(() => null),
      ]);

      if (invRes && invRes.success && Array.isArray(invRes.inventory) && invRes.inventory.length > 0) {
        setInventory(invRes.inventory);

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

      if (ordRes && ordRes.success && Array.isArray(ordRes.orders) && ordRes.orders.length > 0) {
        setOrders(ordRes.orders);
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
        localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(updated.slice(0, 1000)));
      } catch {}
      return updated;
    });

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

    // Locate target bill in bills state
    const targetBill = bills.find((b) => b.id === billIdOrInv || b.invoiceNumber === billIdOrInv);
    if (!targetBill) return false;

    const now = Date.now();
    const deletedRecord = {
      id: targetBill.id,
      invoiceNumber: targetBill.invoiceNumber,
      billData: targetBill,
      deletedBy: activePerformer,
      deletionReason: reason.trim(),
      deletedAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30-day retention
    };

    // 1. Remove from active bills state & cache
    setBills((prev) => {
      const updated = prev.filter((b) => b.id !== targetBill.id && b.invoiceNumber !== targetBill.invoiceNumber);
      try {
        localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Add to Recycle Bin state & cache
    setRecycleBinBills((prev) => {
      const updated = [deletedRecord, ...prev.filter((d) => d.id !== targetBill.id && d.invoiceNumber !== targetBill.invoiceNumber)];
      try {
        localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Record Admin Activity
    await recordActivity({
      actionType: 'BILL_DELETED',
      performedBy: activePerformer,
      targetId: targetBill.invoiceNumber,
      targetName: `Invoice #${targetBill.invoiceNumber} (₹${targetBill.grandTotal})`,
      details: {
        invoiceNumber: targetBill.invoiceNumber,
        grandTotal: targetBill.grandTotal,
        itemsCount: targetBill.items?.length || 0,
        customer: targetBill.customer,
        paymentMethod: targetBill.paymentMethod,
      },
      reason: reason.trim(),
    });

    // 4. Sync with Backend
    try {
      await api.delete(`/api/bills/${targetBill.id}`, { data: { reason: reason.trim(), deletedBy: activePerformer } });
    } catch (err) {
      console.warn('Backend bill deletion failed, saved to local recycle bin:', err);
    }

    return true;
  };

  const restoreBill = async (billIdOrInv, restoredBy = null) => {
    const activePerformer = resolveActiveUser(restoredBy);
    const record = recycleBinBills.find((d) => d.id === billIdOrInv || d.invoiceNumber === billIdOrInv);
    if (!record || !record.billData) return false;

    const restoredBill = record.billData;

    // 1. Move back to active bills
    setBills((prev) => {
      const updated = [restoredBill, ...prev.filter((b) => b.id !== restoredBill.id && b.invoiceNumber !== restoredBill.invoiceNumber)];
      try {
        localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove from recycle bin
    setRecycleBinBills((prev) => {
      const updated = prev.filter((d) => d.id !== record.id && d.invoiceNumber !== record.invoiceNumber);
      try {
        localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Record Admin Activity
    await recordActivity({
      actionType: 'BILL_RESTORED',
      performedBy: activePerformer,
      targetId: record.invoiceNumber,
      targetName: `Invoice #${record.invoiceNumber} (₹${restoredBill.grandTotal})`,
      details: { invoiceNumber: record.invoiceNumber, grandTotal: restoredBill.grandTotal },
      reason: 'Restored from Recycle Bin by Administrator',
    });

    // 4. Sync with Backend
    try {
      await api.post(`/api/recycle-bin/bills/${record.id}/restore`, { restoredBy: activePerformer });
    } catch (err) {
      console.warn('Backend bill restore sync fallback:', err);
    }

    return true;
  };

  const permanentDeleteBill = async (billIdOrInv, purgedBy = null) => {
    const activePerformer = resolveActiveUser(purgedBy);
    const record = recycleBinBills.find((d) => d.id === billIdOrInv || d.invoiceNumber === billIdOrInv);
    if (!record) return false;

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
    });

    // 3. Sync with Backend
    try {
      await api.delete(`/api/recycle-bin/bills/${record.id}/permanent`, { data: { purgedBy: activePerformer } });
    } catch (err) {
      console.warn('Backend permanent bill purge failed:', err);
    }

    return true;
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
        localStorage.setItem(PRODUCT_AVAILABILITY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Update inventory list state so both match in memory and storage
    setInventory((prev) => {
      const updated = prev.map((item) =>
        item.id === productId ? { ...item, isInactive: nextInactive } : item
      );
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
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

    try {
      await api.patch(`/api/inventory/${productId}/availability`, { isInactive: nextInactive });
    } catch (err) {
      console.warn('Backend availability sync failed, saved locally:', err);
    }
  };

  const addNewProduct = async (productData, performedBy = null) => {
    const activePerformer = resolveActiveUser(performedBy);

    const nextItemNum = Math.max(
      ...ALL_BILLING_ITEMS.map((it) => it.itemNumber || 0),
      ...customProducts.map((it) => it.itemNumber || 0),
      0
    ) + 1;

    const newId = productData.id || `custom-${Date.now()}`;
    const unitPrice = parseFloat(productData.price || productData.unitPrice || 500);
    const stockQty = parseFloat(productData.stockKg || productData.stock || 15);

    const newProd = {
      id: newId,
      itemNumber: nextItemNum,
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
      hsn: productData.hsn || '2106',
      image: productData.image || '/images/products/palkova_card.jpg',
      isCustom: true,
      description: productData.description || 'Special preparation',
    };

    setCustomProducts((prev) => {
      const updated = [...prev, newProd];
      try {
        localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setInventory((prev) => {
      const updated = [...prev, {
        id: newProd.id,
        itemNumber: newProd.itemNumber,
        name: newProd.name,
        stockKg: stockQty,
        minThreshold: newProd.minThreshold,
        unit: newProd.unit,
        price: newProd.price,
        category: newProd.category,
        subcategory: newProd.subcategory,
        batchDate: 'Today Just now',
        batchNote: 'New item addition',
        hsn: newProd.hsn,
        isCustom: true,
      }];
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
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

    try {
      await api.post('/api/inventory/products', newProd);
    } catch (err) {
      console.warn('Backend product creation failed, saved locally:', err);
    }

    return newProd;
  };

  const deleteProduct = async (productId, performedBy = null) => {
    const activePerformer = resolveActiveUser(performedBy);
    const item = allBillingProducts.find((it) => it.id === productId);
    const prodName = item ? item.name : productId;

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

    // Also mark in availability map as inactive
    setProductAvailabilityMap((prev) => {
      const updated = { ...prev, [productId]: true };
      try {
        localStorage.setItem(PRODUCT_AVAILABILITY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordActivity({
      actionType: 'PRODUCT_DELETED',
      performedBy: activePerformer,
      targetId: productId,
      targetName: prodName,
      reason: 'Product deleted from catalog',
    });

    try {
      await api.delete(`/api/inventory/products/${productId}`);
    } catch (err) {
      console.warn('Backend product delete failed:', err);
    }
  };

  const updateProductMasterPrice = async (productId, newPrice, performedBy = null) => {
    const numPrice = parseFloat(newPrice);
    if (isNaN(numPrice) || numPrice < 0) return;

    const activePerformer = resolveActiveUser(performedBy);
    const item = allBillingProducts.find((it) => it.id === productId);
    const prodName = item ? item.name : productId;
    const oldPrice = item ? item.price : 0;

    setCustomProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, price: numPrice, unitPrice: numPrice } : p));
      try {
        localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setInventory((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, price: numPrice, unitPrice: numPrice } : p));
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
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

    try {
      await api.patch(`/api/inventory/${productId}/price`, { price: numPrice });
    } catch (err) {
      console.warn('Backend price update failed:', err);
    }
  };


  const addCounterSale = async (saleData) => {
    const fullOrder = {
      ...saleData,
      id: saleData.id || `pos-${Date.now()}`,
      source: 'counter',
      status: 'Completed',
      createdAt: Date.now(),
    };

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
        openCheckout,
        closeCheckout,
        openInvoice,
        // Dynamic Products & Availability
        allBillingProducts,
        customProducts,
        productAvailabilityMap,
        toggleProductAvailability,
        refreshInventory: syncWithBackend,
        addNewProduct,
        deleteProduct,
        updateProductMasterPrice,
        // Price Override Auditing
        priceOverrideLogs,
        recordPriceOverrideLog,
        fetchPriceOverrideLogs,
        // Bill Deletion & 30-Day Recycle Bin
        recycleBinBills,
        deleteBill,
        restoreBill,
        permanentDeleteBill,
        fetchRecycleBinBills,
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
