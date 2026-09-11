import { createContext, useContext, useState, useEffect } from 'react';
import { FREE_DELIVERY_THRESHOLD, SWEETS_CATALOG } from '../data/sweetsData';
import { useScrollLock } from '../hooks/useScrollLock';
import api from '../utils/api';

const CartContext = createContext();

const CART_STORAGE_KEY = 'thenisai_cart_items_v1';
const INVOICE_STORAGE_KEY = 'thenisai_last_invoice_v1';
const ORDERS_STORAGE_KEY = 'thenisai_orders_v1';
const INVENTORY_STORAGE_KEY = 'thenisai_inventory_v1';

const DEFAULT_INVENTORY = [
  { id: 'palkova', name: 'Signature Palkova', stockKg: 42.5, minThreshold: 10, batchDate: 'Today 06:00 AM', batchNote: 'Fresh Uruli Batch 1' },
  { id: 'milk-peda', name: 'Milk Peda', stockKg: 28.0, minThreshold: 8, batchDate: 'Today 07:00 AM', batchNote: 'Morning batch' },
  { id: 'mysore-pak', name: 'Royal Mysore Pak', stockKg: 35.0, minThreshold: 10, batchDate: 'Today 06:30 AM', batchNote: 'Desi Ghee batch' },
  { id: 'kaju-katli', name: 'Kaju Katli', stockKg: 22.0, minThreshold: 6, batchDate: 'Yesterday Evening', batchNote: 'Whole Cashew batch' },
  { id: 'badam-halwa', name: 'Badam Halwa', stockKg: 18.5, minThreshold: 5, batchDate: 'Today 07:30 AM', batchNote: 'Kashmiri Saffron batch' },
  { id: 'jangiri', name: 'Jangiri', stockKg: 15.0, minThreshold: 5, batchDate: 'Today 08:00 AM', batchNote: 'Fresh crispy batch' },
  { id: 'gulab-jamun', name: 'Gulab Jamun', stockKg: 25.0, minThreshold: 8, batchDate: 'Today 07:00 AM', batchNote: 'Cardamom syrup batch' },
  { id: 'assorted-box', name: 'Thenisai Royal Assorted Box', stockKg: 20.0, minThreshold: 5, batchDate: 'Today', batchNote: 'Gift boxes packed' },
];

const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    invoiceNumber: 'THN-2026-4821',
    orderDate: '10 Sep 2026',
    orderTime: '09:42 AM',
    customer: { fullName: 'Venkatesh Raman', phone: '9840123456', email: 'venkat@gmail.com' },
    shippingAddress: { doorNo: '45/A', street: 'KK Nagar', landmark: 'Near Temple', city: 'Madurai', state: 'Tamil Nadu', pincode: '625020' },
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
    status: 'New',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'ord-100',
    invoiceNumber: 'THN-2026-3912',
    orderDate: '10 Sep 2026',
    orderTime: '08:15 AM',
    customer: { fullName: 'Lakshmi Narayanan', phone: '9443219876', email: 'lakshmi@outlook.com' },
    shippingAddress: { doorNo: '12', street: 'Anna Nagar West', landmark: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' },
    items: [
      { id: 'kaju-katli', name: 'Kaju Katli', weight: '1kg', price: 1020, quantity: 1, image: '/kaju_katli.jpg', hsn: '2106' },
    ],
    subtotal: 1020,
    taxBreakdown: { rate: 5, totalTax: 51, cgst: 25.5, sgst: 25.5, igst: 0, isInterState: false },
    deliveryFee: 0,
    grandTotal: 1071,
    paymentMethod: 'upi',
    upiUtr: '425983719283',
    source: 'online',
    status: 'Accepted',
    createdAt: Date.now() - 7200000,
  },
];

function getWeightInKg(weightStr) {
  if (!weightStr) return 0.5;
  const str = String(weightStr).toLowerCase();
  if (str.includes('250g')) return 0.25;
  if (str.includes('500g')) return 0.5;
  if (str.includes('1kg') || str.includes('1 kg')) return 1.0;
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

    if (hash === '#admin' || pathname.endsWith('/admin') || viewParam === 'admin') return 'admin';
    if (hash === '#billing' || pathname.endsWith('/billing') || viewParam === 'billing') return 'billing';
    return 'storefront';
  };

  const [currentView, setCurrentView] = useState(resolveViewFromUrl);

  // Orders state
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Inventory state
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  // POS Counter Bills state
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem('thenisai_bills_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else if (view === 'billing') {
      window.location.hash = '#billing';
    } else {
      if (window.location.hash === '#admin' || window.location.hash === '#billing') {
        window.history.pushState(null, '', window.location.pathname);
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
              localStorage.setItem('thenisai_bills_cache', JSON.stringify(billsRes.bills));
            } catch {}
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
          localStorage.setItem('thenisai_bills_cache', JSON.stringify(res.bills));
        } catch {}
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

    setOrders((prev) => [fullOrder, ...prev]);
    setBills((prev) => [fullOrder, ...prev]);
    deductStockForItems(saleData.items);

    // Persist to backend bills endpoint
    try {
      const res = await api.post('/api/bills', fullOrder);
      if (res && res.success && res.bill) {
        setBills((prev) => [res.bill, ...prev.filter((b) => b.id !== fullOrder.id && b.id !== res.bill.id)]);
        return res.bill;
      }
    } catch (err) {
      console.warn('Backend bill save fallback to local:', err);
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
