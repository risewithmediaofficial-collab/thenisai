import { createContext, useContext, useState, useEffect } from 'react';
import { FREE_DELIVERY_THRESHOLD, SWEETS_CATALOG } from '../data/sweetsData';
import { THENISAI_SWEETS_62 } from '../data/thenisaiSweets62';
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

export const DEFAULT_TAX_SETTINGS = {
  totalGstRate: 5,   // 5% Total GST
  cgstRate: 2.5,     // 2.5% Central GST
  sgstRate: 2.5,     // 2.5% State GST
  gstin: '33AABCT9988Q1Z5',
  taxEnabled: true,
  lastUpdated: '16 Sep 2026',
};

const SWEETS_62_INVENTORY = THENISAI_SWEETS_62.map((item) => ({
  id: item.id,
  name: item.name,
  englishName: item.englishName,
  tamilName: item.tamilName,
  stockKg: item.unit === 'kg' ? 35 : item.unit === 'Litre' ? 25 : 60,
  minThreshold: item.unit === 'kg' ? 8 : 10,
  batchDate: 'Today 06:30 AM',
  batchNote: item.description || 'Fresh kitchen batch',
  unit: item.unit || 'kg',
  price: item.price,
  category: item.category || 'sweets',
  subcategory: item.subcategory || 'Traditional Sweets',
  hsn: item.hsn || '2106',
}));

const DEFAULT_INVENTORY = [
  ...SWEETS_62_INVENTORY,
  { id: 'tea', name: 'Tea — டீ', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Fresh hot brew counter', unit: 'Cup', category: 'beverages', subcategory: 'Teas', price: 20 },
  { id: 'coffee', name: 'Coffee — காபி', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Fresh brew counter', unit: 'Cup', category: 'beverages', subcategory: 'Coffees', price: 20 },
  { id: 'filter-coffee', name: 'Filter Coffee — ஃபில்டர் காபி', stockKg: 100, minThreshold: 15, batchDate: 'Today', batchNote: 'Degree filter coffee decoction', unit: 'Cup', category: 'beverages', subcategory: 'Coffees', price: 20 },
  { id: 'milk', name: 'Milk — பால்', stockKg: 80, minThreshold: 10, batchDate: 'Today', batchNote: 'Boiled fresh farm milk', unit: 'Cup', category: 'beverages', subcategory: 'Milk & Malts', price: 20 },
  { id: 'horlicks', name: 'Horlicks — ஹார்லிக்ஸ்', stockKg: 60, minThreshold: 10, batchDate: 'Today', batchNote: 'Malt beverage counter', unit: 'Cup', category: 'beverages', subcategory: 'Milk & Malts', price: 25 },
  { id: 'boost', name: 'Boost — பூஸ்ட்', stockKg: 60, minThreshold: 10, batchDate: 'Today', batchNote: 'Chocolate energy malt', unit: 'Cup', category: 'beverages', subcategory: 'Milk & Malts', price: 25 },
  { id: 'badam-milk', name: 'Badam Milk — பாதாம் பால்', stockKg: 50, minThreshold: 10, batchDate: 'Today', batchNote: 'Saffron almond milk', unit: 'Cup', category: 'beverages', subcategory: 'Milk & Malts', price: 25 },
  { id: 'ragi-malt', name: 'Ragi Malt — கேழ்வரகு கூழ்', stockKg: 50, minThreshold: 10, batchDate: 'Today', batchNote: 'Fresh traditional ragi brew', unit: 'Cup', category: 'beverages', subcategory: 'Milk & Malts', price: 25 },
  { id: 'lemon-tea', name: 'Lemon Tea — எலுமிச்சை டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Fresh citrus infusion', unit: 'Cup', category: 'beverages', subcategory: 'Teas', price: 20 },
  { id: 'sugu-tea', name: 'Sugu Tea — சுக்கு டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Dry ginger medicinal brew', unit: 'Cup', category: 'beverages', subcategory: 'Teas', price: 20 },
  { id: 'magu-tea', name: 'Magu Tea — மிளகு டீ', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Black pepper herbal brew', unit: 'Cup', category: 'beverages', subcategory: 'Teas', price: 20 },
  { id: 'ginger-lemon', name: 'Ginger Lemon — இஞ்சி எலுமிச்சை', stockKg: 70, minThreshold: 10, batchDate: 'Today', batchNote: 'Fresh crushed ginger & lemon', unit: 'Cup', category: 'beverages', subcategory: 'Teas', price: 20 },
  { id: 'vada', name: 'Vada — வடை', stockKg: 80, minThreshold: 15, batchDate: 'Today 07:00 AM', batchNote: 'Crispy warm medu vada', unit: 'Pc', category: 'snacks', subcategory: 'Snacks (Vada)', price: 20 },
];

const INITIAL_ORDERS = [
  {
    id: 'ord-103',
    invoiceNumber: 'THN-2026-5120',
    orderDate: '16 Sep 2026',
    orderTime: '02:15 PM',
    customer: { fullName: 'Anitha Sundaram', phone: '9845012398', email: 'anitha.s@gmail.com' },
    shippingAddress: { doorNo: '72, 4th Cross', street: 'Koramangala 5th Block', landmark: 'Near Sony World Signal', city: 'Bengaluru', state: 'Karnataka', pincode: '560095' },
    items: [
      { id: '13', name: 'Motichoor Laddu — மோட்டிச்சூர் லட்டு', weight: '500g', price: 340, quantity: 1, image: '/palkova_card.jpg', hsn: '2106' },
      { id: 'palkova', name: 'Signature Palkova — பாரம்பரிய பால்கோவா', weight: '1kg', price: 680, quantity: 1, image: '/palkova_card.jpg', hsn: '0402' },
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
      { id: 'mysore-pak', name: 'Ghee Mysore Pak — நெய் மைசூர் பாக்', weight: '500g', price: 380, quantity: 2, image: '/mysore_pak.jpg', hsn: '2106' },
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
      { id: 'palkova', name: 'Signature Palkova', weight: '500g', price: 340, quantity: 2, image: '/palkova_card.jpg', hsn: '0402' },
      { id: 'mysore-pak', name: 'Royal Mysore Pak', weight: '250g', price: 190, quantity: 1, image: '/mysore_pak.jpg', hsn: '2106' },
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
      { id: 'kaju-katli', name: 'Kaju Katli — காஜு கத்லி', weight: '1kg', price: 1020, quantity: 1, image: '/kaju_katli.jpg', hsn: '2106' },
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

  // Inventory state (Exclusively the 13 products)
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validOnly = parsed.filter((p) => DEFAULT_INVENTORY.some((d) => d.id === p.id));
          const missing = DEFAULT_INVENTORY.filter((d) => !validOnly.some((p) => p.id === d.id));
          const finalInv = [...validOnly, ...missing];
          if (finalInv.length > 0) {
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(finalInv));
            return finalInv;
          }
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

  // Fetch initial data from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function syncWithBackend() {
      try {
        const [invRes, ordRes, billsRes] = await Promise.all([
          api.get('/api/inventory').catch(() => null),
          api.get('/api/orders').catch(() => null),
          api.get('/api/bills').catch(() => null),
        ]);
        if (isMounted) {
          if (invRes && invRes.success && Array.isArray(invRes.inventory) && invRes.inventory.length > 0) {
            setInventory(invRes.inventory);
          }
          if (ordRes && ordRes.success && Array.isArray(ordRes.orders) && ordRes.orders.length > 0) {
            setOrders(ordRes.orders);
          }
          if (billsRes && billsRes.success && Array.isArray(billsRes.bills)) {
            setBills(billsRes.bills);
            try {
              localStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(billsRes.bills));
            } catch { }
          }
        }
      } catch (err) {
        console.warn('Backend sync fallback to local storage:', err);
      }
    }
    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const addCounterSale = async (saleData) => {
    const fullOrder = {
      ...saleData,
      id: saleData.id || `pos-${Date.now()}`,
      source: 'counter',
      status: 'Completed',
      createdAt: Date.now(),
    };

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
        closeInvoice,
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
