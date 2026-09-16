import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ALL_BILLING_ITEMS, GST_RATE } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import SideNavbar from '../Nav/SideNavbar';
import DailyRevenueReport from '../Admin/DailyRevenueReport';
import './BillingCounter.css';

// Predefined categories for fast sweets & beverages POS filtering
const CATEGORIES = [
  { id: 'all', label: `All Sweets (${ALL_BILLING_ITEMS.length})` },
  { id: 'halwa', label: 'Halwa (அல்வா)' },
  { id: 'mysore-pak', label: 'Mysore Pak & Ghee' },
  { id: 'cashew-rolls', label: 'Cashew & Rolls' },
  { id: 'milk-bengali', label: 'Milk & Bengali' },
  { id: 'traditional', label: 'Traditional Sweets' },
  { id: 'pieces-packets', label: 'Pieces & Packets' },
  { id: 'beverages', label: 'Tea & Beverages' },
];

export default function BillingCounter() {
  const { user, logout } = useAuth();
  const {
    inventory,
    orders,
    bills,
    fetchBills,
    acceptOrder,
    updateOrderStatus,
    addCounterSale,
    addInventoryStock,
    openInvoice,
    navigateTo,
  } = useCart();

  // POS Page Navigation: 'register' | 'my-bills' | 'online-orders' | 'daily-sales' | 'inventory'
  const [posTab, setPosTab] = useState(() => {
    const h = window.location.hash.toLowerCase();
    if (h.includes('bills')) return 'my-bills';
    if (h.includes('orders') || h.includes('online')) return 'online-orders';
    if (h.includes('daily') || h.includes('revenue')) return 'daily-sales';
    if (h.includes('stock') || h.includes('inventory')) return 'inventory';
    return 'register';
  });

  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [billPaymentFilter, setBillPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card'
  const [isRefreshingBills, setIsRefreshingBills] = useState(false);

  // Online Orders Dedicated Page state
  const [onlineFilter, setOnlineFilter] = useState('all'); // 'all' | 'New' | 'Accepted' | 'Dispatched'
  const [onlineSearch, setOnlineSearch] = useState('');
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Target item for instant Refill Stock modal from inventory page
  const [refillTargetSweetId, setRefillTargetSweetId] = useState(null);

  // Active POS Bill Items
  const [billItems, setBillItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: 'Walk-in Guest',
    phone: '',
  });
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Inventory Page Search & Category Filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('all');

  // Hold / Recall Bills state
  const [heldBills, setHeldBills] = useState([]);
  const [showHeldDropdown, setShowHeldDropdown] = useState(false);
  const heldDropdownRef = useRef(null);
  const heldPopoverRef = useRef(null);

  // ── Resizable split pane (Products & Bill) ──
  const splitRef = useRef(null);
  const [catalogWidth, setCatalogWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('thenisai_pos_catalog_width');
      return saved ? parseFloat(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    const container = splitRef.current;
    if (!container) return;
    const startX = e.clientX ?? e.touches?.[0]?.clientX;
    if (startX === undefined) return;
    const startW = container.querySelector('.pos-catalog-pane')?.getBoundingClientRect().width || 0;
    const totalW = container.getBoundingClientRect().width;

    setIsDraggingSplit(true);

    const onMove = (ev) => {
      const x = ev.clientX ?? ev.touches?.[0]?.clientX;
      if (x === undefined) return;
      const delta = x - startX;
      const newW = Math.round(Math.min(Math.max(startW + delta, 320), totalW - 380));
      setCatalogWidth(newW);
      try {
        localStorage.setItem('thenisai_pos_catalog_width', String(newW));
      } catch {}
    };

    const onUp = () => {
      setIsDraggingSplit(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const resetResize = () => {
    setCatalogWidth(null);
    try {
      localStorage.removeItem('thenisai_pos_catalog_width');
    } catch {}
  };

  // Inline weight popover state (small popup inside each kg row)
  const [inlineWeightId, setInlineWeightId] = useState(null); // sweet.id of open popover
  const [inlineVal, setInlineVal] = useState('');
  const [inlineUnit, setInlineUnit] = useState('g'); // 'g' | 'kg'
  const inlineInputRef = useRef(null);

  const openInlineWeight = (sweet) => {
    if (inlineWeightId === sweet.id) {
      setInlineWeightId(null); // toggle off
      return;
    }
    setInlineWeightId(sweet.id);
    setInlineVal('');
    setInlineUnit('g');
  };

  const closeInlineWeight = () => setInlineWeightId(null);

  const confirmInlineWeight = (sweet) => {
    const num = parseFloat(inlineVal);
    if (isNaN(num) || num <= 0) return;
    const formatted = inlineUnit === 'kg' ? `${num} kg` : `${num}g`;
    handleAddSweetToBill(sweet, formatted, 1);
    setInlineWeightId(null);
  };

  useEffect(() => {
    if (inlineWeightId && inlineInputRef.current) {
      const t = setTimeout(() => {
        inlineInputRef.current?.focus();
        inlineInputRef.current?.select();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [inlineWeightId]);

  // Legacy aliases (keep handleOpenWeightModal so bill-line click still works if needed)
  const weightInputRef = inlineInputRef;
  const handleOpenWeightModal = openInlineWeight;
  const handleCloseWeightModal = closeInlineWeight;

  // Close held bills dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        heldPopoverRef.current &&
        !heldPopoverRef.current.contains(e.target) &&
        heldDropdownRef.current &&
        !heldDropdownRef.current.contains(e.target)
      ) {
        setShowHeldDropdown(false);
      }
    };
    if (showHeldDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeldDropdown]);

  // Sync hash routing for dedicated pages
  useEffect(() => {
    const handleHashSync = () => {
      const h = window.location.hash.toLowerCase();
      if (!h.startsWith('#billing')) return;
      if (h.includes('bills')) {
        setPosTab('my-bills');
      } else if (h.includes('orders') || h.includes('online')) {
        setPosTab('online-orders');
      } else if (h.includes('daily') || h.includes('revenue') || h.includes('sales')) {
        setPosTab('daily-sales');
      } else {
        setPosTab('register');
      }
    };
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const handleSwitchTab = (newTab) => {
    if (newTab === 'inventory') {
      newTab = 'register';
    }
    setPosTab(newTab);
    if (newTab === 'register') {
      window.location.hash = '#billing';
      setMobileTab('catalog');
    } else if (newTab === 'my-bills') {
      window.location.hash = '#billing/bills';
      handleRefreshShiftBills();
    } else if (newTab === 'online-orders') {
      window.location.hash = '#billing/orders';
    } else if (newTab === 'daily-sales') {
      window.location.hash = '#billing/daily-sales';
      handleRefreshShiftBills();
    }
  };

  // Shift Ledger Filtering for Cashier
  const myShiftBills = (bills || []).filter((b) => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    const uid = user.id || user._id || user.username;
    return (
      b.cashier?.id === uid ||
      b.cashier?.username === user.username ||
      !b.cashier?.username
    );
  });

  const filteredShiftBills = myShiftBills.filter((b) => {
    if (billPaymentFilter !== 'all' && (b.paymentMethod || '').toLowerCase() !== billPaymentFilter) {
      return false;
    }
    if (billSearchTerm.trim()) {
      const term = billSearchTerm.toLowerCase();
      const matchInv = b.invoiceNumber?.toLowerCase().includes(term);
      const matchCust = b.customer?.fullName?.toLowerCase().includes(term);
      const matchPhone = b.customer?.phone?.includes(term);
      if (!matchInv && !matchCust && !matchPhone) return false;
    }
    return true;
  });

  const myShiftTotalRevenue = myShiftBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const myShiftCashTotal = myShiftBills.filter((b) => b.paymentMethod === 'cash').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const myShiftUpiTotal = myShiftBills.filter((b) => b.paymentMethod === 'upi').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const myShiftCardTotal = myShiftBills.filter((b) => b.paymentMethod === 'card').reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  const handleRefreshShiftBills = async () => {
    setIsRefreshingBills(true);
    try {
      await fetchBills(user?.id || user?.username);
    } finally {
      setTimeout(() => setIsRefreshingBills(false), 400);
    }
  };

  // Consolidated sales for Daily Revenue Report in POS
  const allSales = useMemo(() => {
    const map = new Map();
    (bills || []).forEach((b) => {
      const key = b.invoiceNumber || b.id;
      if (key) map.set(key, { ...b, source: b.source || 'counter' });
    });
    (orders || []).forEach((o) => {
      const key = o.invoiceNumber || o.id;
      if (key && !map.has(key)) map.set(key, o);
    });
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [bills, orders]);

  // Stock Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);

  // Mobile UI state: 'catalog' vs 'bill' view, and mobile side-nav drawer
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'bill'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search input ref for keyboard shortcut (F2)
  const searchInputRef = useRef(null);

  // Freeze background screen scroll when popups or drawers are active
  useScrollLock(
    isAddStockOpen ||
    isRefillOpen ||
    isMobileMenuOpen
  );

  // Keyboard shortcuts (F2: search, Enter/F9: finalize bill, Escape: close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsAddStockOpen(false);
        setIsRefillOpen(false);
        setIsMobileMenuOpen(false);
      }
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if ((e.key === 'F9' || e.key === 'F8' || (e.key === 'Enter' && (!isInput || e.ctrlKey))) && billItems.length > 0 && !isAddStockOpen && !isRefillOpen) {
        e.preventDefault();
        handleCompleteSale({ autoPrint: true });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, customerInfo, paymentMode, isAddStockOpen, isRefillOpen]);

  // Incoming online orders
  const pendingOnlineOrders = (orders || []).filter(
    (o) => o.source === 'online' && (o.status === 'New' || o.status === 'Accepted')
  );

  // Dedicated Online Orders Page filters & metrics
  const allOnlineOrders = (orders || []).filter((o) => o.source === 'online');
  const filteredOnlineOrders = allOnlineOrders.filter((ord) => {
    if (onlineFilter !== 'all' && ord.status?.toLowerCase() !== onlineFilter.toLowerCase()) {
      return false;
    }
    if (onlineSearch.trim()) {
      const q = onlineSearch.toLowerCase();
      const matchInv = ord.invoiceNumber?.toLowerCase().includes(q);
      const matchCust = ord.customer?.fullName?.toLowerCase().includes(q);
      const matchPhone = ord.customer?.phone?.includes(q);
      const matchCity = ord.shippingAddress?.city?.toLowerCase().includes(q);
      if (!matchInv && !matchCust && !matchPhone && !matchCity) return false;
    }
    return true;
  });

  const onlineNewCount = allOnlineOrders.filter((o) => o.status === 'New').length;
  const onlineAcceptedCount = allOnlineOrders.filter((o) => o.status === 'Accepted').length;
  const onlineDispatchedCount = allOnlineOrders.filter((o) => o.status === 'Dispatched').length;
  const onlineRevenueTotal = allOnlineOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const handleRefreshOnlineOrders = async () => {
    setIsRefreshingOrders(true);
    setTimeout(() => setIsRefreshingOrders(false), 400);
  };

  // Dedicated Inventory Page metrics
  const lowStockCount = (inventory || []).filter((item) => (item.stockKg || 0) <= (item.minThreshold || 10)).length;
  const totalStockVarieties = (inventory || []).length;

  const handleOpenRefillItem = (itemId) => {
    setRefillTargetSweetId(itemId);
    setIsRefillOpen(true);
  };

  // Filtered inventory stock items for live counter tracker
  const filteredInventory = useMemo(() => {
    return (inventory || []).filter((item) => {
      const cat = (item.category || '').toLowerCase();
      const subcat = (item.subcategory || '').toLowerCase();

      if (invCategoryFilter === 'spices') {
        if (cat !== 'spices' && !subcat.includes('kara')) return false;
      } else if (invCategoryFilter === 'beverages') {
        if (cat !== 'beverages' && !subcat.includes('tea') && !subcat.includes('coffee') && !subcat.includes('malt')) return false;
      } else if (invCategoryFilter === 'sweets') {
        if (cat !== 'sweets') return false;
      }

      if (inventorySearch.trim()) {
        const q = inventorySearch.trim().toLowerCase();
        const matches =
          (item.name || '').toLowerCase().includes(q) ||
          (item.englishName || '').toLowerCase().includes(q) ||
          (item.tamilName || '').includes(inventorySearch.trim()) ||
          (item.id || '').toLowerCase().includes(q) ||
          subcat.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [inventory, invCategoryFilter, inventorySearch]);

  // POS Calculations
  const billSubtotal = billItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const effectiveGstRate = typeof GST_RATE === 'number' && GST_RATE > 0 ? GST_RATE : 0.05;
  const billGst = billItems.length > 0 ? Math.round(billSubtotal * effectiveGstRate * 100) / 100 : 0;
  const billCgst = Math.round((billGst / 2) * 100) / 100;
  const billSgst = Math.round((billGst / 2) * 100) / 100;
  const billGrandTotal = Math.round(billSubtotal + billGst);

  // Helper to compute exact price for any weight (100g, 250g, 500g, 1 kg, cups, or custom typed grams)
  const computeItemPrice = (sweet, weight) => {
    if (!sweet) return 20;
    if (sweet.prices && sweet.prices[weight]) {
      return Number(sweet.prices[weight]);
    }
    const perKg = Number(sweet.price) || 0;
    if (sweet.unit === 'kg' || weight?.includes('g') || weight?.includes('kg')) {
      if (weight === '100g') return Math.round(perKg * 0.1);
      if (weight === '250g') return Math.round(perKg * 0.25);
      if (weight === '500g') return Math.round(perKg * 0.5);
      if (weight === '1kg' || weight === '1 kg') return perKg;

      // Custom grams: e.g. "150g", "350g", "125g"
      if (typeof weight === 'string' && weight.endsWith('g') && !weight.endsWith('kg')) {
        const grams = parseFloat(weight.replace('g', '').trim());
        if (!isNaN(grams) && grams > 0) {
          return Math.round((perKg * grams) / 1000);
        }
      }
      // Custom kgs: e.g. "1.5 kg", "2 kg", "0.75 kg"
      if (typeof weight === 'string' && weight.includes('kg')) {
        const kgs = parseFloat(weight.replace('kg', '').trim());
        if (!isNaN(kgs) && kgs > 0) {
          return Math.round(perKg * kgs);
        }
      }
    }
    if (sweet.prices) {
      return Number(sweet.prices[weight] || sweet.prices['1 Cup'] || sweet.price);
    }
    return Number(sweet.price) || 20;
  };

  // Add product to bill with chosen cup/pc/weight quantity
  const handleAddSweetToBill = (sweet, weight, addQty = 1) => {
    const qty = parseInt(addQty, 10) || 1;
    const isKg = sweet.unit === 'kg' || Boolean(sweet.prices && (sweet.prices['250g'] || sweet.prices['500g']));
    const itemWeight = weight || (isKg ? '250g' : sweet.unit) || '1 Cup';
    const price = computeItemPrice(sweet, itemWeight);

    setBillItems((prev) => {
      const idx = prev.findIndex((i) => i.id === sweet.id && i.weight === itemWeight);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: sweet.id,
            name: sweet.name,
            weight: itemWeight,
            price,
            quantity: qty,
            hsn: sweet.hsn || '2106',
            image: sweet.image,
            unit: sweet.unit || '1 Cup',
          },
        ];
      }
    });
  };

  // Product card click:
  const handleSelectProductCard = (sweet, weight) => {
    const isKg = sweet.unit === 'kg' || Boolean(sweet.prices && (sweet.prices['250g'] || sweet.prices['500g']));
    const itemWeight = weight || (isKg ? '250g' : sweet.unit) || '1 Cup';
    const isSelected = billItems.some((it) => it.id === sweet.id && it.weight === itemWeight);
    if (!isSelected) {
      handleAddSweetToBill(sweet, itemWeight, 1);
    }
  };
  const handleToggleProductSelection = handleSelectProductCard;

  // Direct quantity update in active bill
  const handleSetBillItemQty = (sweetOrId, weight, qty) => {
    const val = parseInt(qty, 10);
    const id = typeof sweetOrId === 'object' ? sweetOrId.id : sweetOrId;
    const sweetObj = typeof sweetOrId === 'object' ? sweetOrId : ALL_BILLING_ITEMS.find((s) => s.id === id);
    const isKg = sweetObj?.unit === 'kg' || Boolean(sweetObj?.prices && (sweetObj?.prices['250g'] || sweetObj?.prices['500g']));
    const itemWeight = weight || (isKg ? '250g' : sweetObj?.unit) || '1 Cup';

    if (isNaN(val) || val <= 0) {
      handleRemoveBillItem(id, itemWeight);
      return;
    }

    const price = (typeof sweetOrId === 'object' && sweetOrId.price) ? Number(sweetOrId.price) : computeItemPrice(sweetObj, itemWeight);

    setBillItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id && i.weight === itemWeight);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: val };
        return updated;
      } else {
        return [
          ...prev,
          {
            id,
            name: sweetObj?.name || id,
            weight: itemWeight,
            price,
            quantity: val,
            hsn: sweetObj?.hsn || '2106',
            image: sweetObj?.image,
            unit: sweetObj?.unit || '1 Cup',
          },
        ];
      }
    });
  };

  // Stepper update (+1 or -1)
  const handleUpdateBillQty = (id, weight, delta) => {
    setBillItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id && it.weight === weight) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveBillItem = (id, weight) => {
    setBillItems((prev) => prev.filter((it) => !(it.id === id && it.weight === weight)));
  };

  const handleClearBill = () => {
    setBillItems([]);
    setCustomerInfo({ fullName: 'Walk-in Guest', phone: '' });
  };

  // Hold active bill
  const handleHoldBill = () => {
    if (billItems.length === 0) return;
    const newHeld = {
      id: Date.now(),
      billItems: [...billItems],
      customerInfo: { ...customerInfo },
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      total: billGrandTotal,
    };
    setHeldBills((prev) => [newHeld, ...prev]);
    handleClearBill();
  };

  // Recall held bill
  const handleRecallBill = (heldId) => {
    const target = heldBills.find((h) => h.id === heldId);
    if (!target) return;

    let updatedHeld = heldBills.filter((h) => h.id !== heldId);

    // If current register has active items, preserve it into held bills so cashier never loses items
    if (billItems.length > 0) {
      const currentAsHeld = {
        id: Date.now(),
        billItems: [...billItems],
        customerInfo: { ...customerInfo },
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        total: billGrandTotal,
      };
      updatedHeld = [currentAsHeld, ...updatedHeld];
    }

    setBillItems(target.billItems);
    setCustomerInfo(target.customerInfo);
    setHeldBills(updatedHeld);
  };

  // Discard a held bill
  const handleDeleteHeldBill = (heldId) => {
    setHeldBills((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Complete counter sale (options: { autoPrint?: boolean })
  const handleCompleteSale = async (options = {}) => {
    if (options && options.preventDefault) options.preventDefault();
    const shouldPrint = typeof options === 'object' && 'autoPrint' in options ? options.autoPrint : true;

    if (billItems.length === 0) return;

    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `POS-${year}-${seq}`;
    const now = new Date();

    const saleData = {
      invoiceNumber,
      orderDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      cashier: {
        id: user?.id || user?._id || 'staff-2',
        name: user?.name || 'Cashier Counter',
        username: user?.username || 'cashier',
        role: user?.role || 'cashier',
        counter: user?.counter || 'Counter Desk 01',
      },
      customer: {
        fullName: customerInfo.fullName.trim() || 'Walk-in Guest',
        phone: customerInfo.phone.trim() || 'Store Counter',
        email: 'counter@thenisai.com',
      },
      shippingAddress: {
        doorNo: 'Store Counter Pick-up',
        street: 'Nattamai Kottai, Near H.P. Petrol Bunk, NH 44',
        landmark: 'Bangalore - Salem Highway Counter Sale',
        city: 'Krishnagiri',
        state: 'Tamil Nadu',
        pincode: '635001',
      },
      items: [...billItems],
      subtotal: billSubtotal,
      taxBreakdown: {
        rate: 5,
        isInterState: false,
        cgst: billCgst,
        sgst: billSgst,
        igst: 0,
        totalTax: billGst,
      },
      deliveryFee: 0,
      grandTotal: billGrandTotal,
      paymentMethod: paymentMode,
      upiUtr: paymentMode === 'upi' ? 'Counter POS UPI QR' : null,
      orderStatus: 'Completed (Paid at Counter)',
    };

    const savedOrder = await addCounterSale(saleData);
    handleClearBill();
    openInvoice(savedOrder || saleData);

    if (shouldPrint) {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  // Filtered and orderwise products based on search and category
  const allProducts = ALL_BILLING_ITEMS;

  const rawFiltered = allProducts.filter((sw, idx) => {
    const itemNum = sw.itemNumber || idx + 1;
    const qRaw = searchQuery.trim();
    const q = qRaw.toLowerCase();

    if (!q) {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'halwa') {
        return sw.subcategory === 'Halwa' || sw.name.toLowerCase().includes('halwa') || (sw.tamilName && sw.tamilName.includes('அல்வா'));
      }
      if (selectedCategory === 'mysore-pak') {
        return sw.subcategory === 'Mysore Pak & Ghee' || sw.name.toLowerCase().includes('mysore') || sw.id === 'ghee';
      }
      if (selectedCategory === 'cashew-rolls') {
        return sw.subcategory === 'Cashew & Rolls' || sw.name.toLowerCase().includes('roll') || sw.name.toLowerCase().includes('cashew') || sw.name.toLowerCase().includes('kaju') || sw.name.toLowerCase().includes('pista');
      }
      if (selectedCategory === 'milk-bengali') {
        return sw.subcategory === 'Milk & Bengali' || sw.name.toLowerCase().includes('milk') || sw.name.toLowerCase().includes('khoa') || sw.name.toLowerCase().includes('peda') || sw.name.toLowerCase().includes('bengali') || sw.name.toLowerCase().includes('ras');
      }
      if (selectedCategory === 'traditional') {
        return sw.subcategory === 'Traditional Sweets' || sw.name.toLowerCase().includes('laddu') || sw.name.toLowerCase().includes('jangiri') || sw.name.toLowerCase().includes('poli') || sw.name.toLowerCase().includes('athirasam');
      }
      if (selectedCategory === 'pieces-packets') {
        return sw.unit === 'Pc' || sw.unit === 'Pkt';
      }
      if (selectedCategory === 'beverages') {
        return sw.category === 'beverages' || sw.category === 'snacks';
      }
      return true;
    }

    // Number-based search (e.g. "1", "2", "#3", "13", or price "20", "25")
    const cleanNumStr = qRaw.replace(/^#/, '').replace(/\.$/, '').trim();
    const isPureNumber = /^\d+$/.test(cleanNumStr);
    if (isPureNumber) {
      const searchNum = parseInt(cleanNumStr, 10);
      if (itemNum === searchNum) return true;
      if (String(itemNum).startsWith(cleanNumStr)) return true;
      if (sw.price === searchNum) return true;
    }

    // Text search (English, Tamil, ID)
    const matchesText =
      sw.name.toLowerCase().includes(q) ||
      (sw.tamilName && sw.tamilName.includes(qRaw)) ||
      (sw.englishName && sw.englishName.toLowerCase().includes(q)) ||
      sw.id.toLowerCase().includes(q);

    return matchesText;
  });

  // Always keep strictly orderwise (sorted by itemNumber 1..13)
  // If user searches a number, exact itemNumber match is prioritized at top
  const filteredSweets = [...rawFiltered].sort((a, b) => {
    const numA = a.itemNumber || 999;
    const numB = b.itemNumber || 999;

    const cleanNum = searchQuery.trim().replace(/^#/, '').replace(/\.$/, '');
    if (/^\d+$/.test(cleanNum)) {
      const targetNum = parseInt(cleanNum, 10);
      if (numA === targetNum) return -1;
      if (numB === targetNum) return 1;
    }
    return numA - numB;
  });

  // Fast Enter key in search box adds the top matched item directly to bill
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSweets.length > 0) {
        const topItem = filteredSweets[0];
        handleAddSweetToBill(topItem, topItem.unit || '1 Cup', 1);
        setSearchQuery('');
      }
    }
  };

  return (
    <div className="billing-pos-root side-layout" data-lenis-prevent="true">
      {/* 1. LEFT SIDE NAVIGATION BAR (No Cluttered Top Navbar) */}
      <SideNavbar
        currentSection={
          posTab === 'register'
            ? 'pos-register'
            : posTab === 'my-bills'
            ? 'pos-bills'
            : posTab === 'online-orders'
            ? 'pos-online'
            : posTab === 'daily-sales'
            ? 'pos-daily-sales'
            : 'pos-inventory'
        }
        onSelectSection={(sec) => {
          if (sec === 'pos-register') handleSwitchTab('register');
          else if (sec === 'pos-bills') handleSwitchTab('my-bills');
          else if (sec === 'pos-online') handleSwitchTab('online-orders');
          else if (sec === 'pos-daily-sales') handleSwitchTab('daily-sales');
          else if (sec === 'pos-inventory') handleSwitchTab('inventory');
        }}
        onOpenRefill={() => {
          setRefillTargetSweetId(null);
          setIsRefillOpen(true);
        }}
        onOpenAddStock={() => setIsAddStockOpen(true)}
        pendingOnlineCount={pendingOnlineOrders.length}
        shiftBillsCount={myShiftBills.length}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. MAIN POS WORKSPACE CONTENT AREA */}
      <div className="pos-content-area" data-lenis-prevent="true">
        {/* Mobile-only compact control strip */}
        <header className="pos-mobile-strip mobile-only">
          <button
            type="button"
            className="pos-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open POS Menu"
          >
            <span className="hamburger-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
          </button>
          <div className="mobile-strip-brand">
            <img src="/logo-icon.png" alt="Thenisai" className="mobile-strip-logo" />
            <div className="mobile-strip-brand-text">
              <strong>THENISAI POS</strong>
              <span>
                {posTab === 'register'
                  ? (user?.counter || 'Terminal 01')
                  : posTab === 'my-bills'
                  ? 'Shift Ledger'
                  : posTab === 'online-orders'
                  ? 'Online Dispatch'
                  : 'Counter Stock'}
              </span>
            </div>
          </div>

          {posTab === 'register' ? (
            <div className="pos-mobile-view-tabs">
              <button
                type="button"
                className={`mobile-view-tab ${mobileTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setMobileTab('catalog')}
              >
                <span>Products</span>
              </button>
              <button
                type="button"
                className={`mobile-view-tab ${mobileTab === 'bill' ? 'active' : ''}`}
                onClick={() => setMobileTab('bill')}
              >
                <span>Bill ({billItems.reduce((s, it) => s + it.quantity, 0)})</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pos-mobile-back-btn"
              onClick={() => handleSwitchTab('register')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Return to POS
            </button>
          )}

          <button
            type="button"
            className={`pos-mobile-bell-btn ${pendingOnlineOrders.length > 0 ? 'has-pending' : ''} ${posTab === 'online-orders' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('online-orders')}
            aria-label="Online Orders"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendingOnlineOrders.length > 0 && (
              <span className="mobile-bell-badge">{pendingOnlineOrders.length}</span>
            )}
          </button>
        </header>

        {/* PAGE 1: POS BILLING REGISTER */}
        {posTab === 'register' && (
          <main
            className={`pos-main-split ${mobileTab === 'catalog' ? 'show-catalog' : 'show-bill'}`}
            ref={splitRef}
            style={catalogWidth ? { gridTemplateColumns: `minmax(320px, ${catalogWidth}px) 8px minmax(380px, 1fr)` } : undefined}
          >
            {/* LEFT COLUMN: BEVERAGE & SNACK CATALOG */}
            <section className="pos-catalog-pane" data-lenis-prevent>
              {/* Quick Toolbar: Search & List/Grid Switcher */}
              <div className="pos-catalog-toolbar">
                <div className="pos-search">
                  <span className="pos-search-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by number or name (1, 2, டீ, Coffee)... (Press F2)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="pos-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Consolidated Held Bills Trigger in Catalog Toolbar */}
                <div className="pos-held-toolbar-wrap">
                  <button
                    ref={heldDropdownRef}
                    type="button"
                    className={`btn-held-trigger toolbar ${showHeldDropdown ? 'active' : ''} ${heldBills.length === 0 ? 'empty' : ''}`}
                    onClick={() => {
                      if (heldBills.length > 0) {
                        setShowHeldDropdown((prev) => !prev);
                      }
                    }}
                    title={heldBills.length > 0 ? "View and recall held customer bills" : "No held bills currently"}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    <span>Held ({heldBills.length})</span>
                    {heldBills.length > 0 && (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: showHeldDropdown ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </button>

                  {/* Held Orders Floating Popover - Anchored to Toolbar Button */}
                  {showHeldDropdown && heldBills.length > 0 && (
                    <div className="held-popover-card toolbar-popover" ref={heldPopoverRef}>
                      <div className="held-popover-header">
                        <div>
                          <strong className="held-popover-title">Held Orders ({heldBills.length})</strong>
                          <div className="held-popover-subtitle">Click Recall to restore bill to register</div>
                        </div>
                        <button
                          type="button"
                          className="held-popover-close-btn"
                          onClick={() => setShowHeldDropdown(false)}
                          aria-label="Close"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="held-popover-list">
                        {heldBills.map((h, i) => (
                          <div key={h.id} className="held-popover-item">
                            <div className="held-popover-info">
                              <div className="held-popover-top">
                                <span className="held-badge">#{i + 1}</span>
                                <strong className="held-amount">₹{h.total}</strong>
                                <span className="held-time">{h.time}</span>
                              </div>
                              <div className="held-popover-desc">
                                <span>{h.billItems.length} {h.billItems.length === 1 ? 'item' : 'items'}</span>
                                {h.customerInfo?.fullName && h.customerInfo.fullName !== 'Walk-in Guest' && (
                                  <>
                                    <span className="dot-sep">·</span>
                                    <span className="held-cust-name">{h.customerInfo.fullName}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="held-popover-actions">
                              <button
                                type="button"
                                className="btn-popover-recall"
                                onClick={() => {
                                  handleRecallBill(h.id);
                                  setShowHeldDropdown(false);
                                }}
                              >
                                Recall
                              </button>
                              <button
                                type="button"
                                className="btn-popover-delete"
                                title="Discard this held bill"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHeldBill(h.id);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-held-trigger toolbar"
                    onClick={() => handleSwitchTab('daily-sales')}
                    title="View Daily Sales & Revenue Settlement"
                    style={{ marginLeft: 8 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Daily Revenue</span>
                  </button>
                </div>
              </div>

              {/* Quick Category Tabs Bar */}
              <div className="pos-category-bar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (searchQuery) setSearchQuery('');
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* LIST VIEW (Fast Clean Table - Names, Type Weight & Stepper) */}
              <div className="pos-sweets-list">
                  {filteredSweets.map((sweet, idx) => {
                    const isKg = sweet.unit === 'kg' || Boolean(sweet.prices && (sweet.prices['250g'] || sweet.prices['500g']));
                    const defaultUnit = isKg
                      ? '250g'
                      : sweet.unit === 'Pc'
                      ? '1 Pc'
                      : sweet.unit === 'Pkt'
                      ? '1 Pkt'
                      : sweet.unit === 'Litre'
                      ? '1 Litre'
                      : sweet.unit || '1 Pc';
                    const itemNum = sweet.itemNumber || idx + 1;
                    const itemsInBillForSweet = billItems.filter((it) => it.id === sweet.id);
                    const isItemInBill = itemsInBillForSweet.length > 0;
                    const qtyInBill = isItemInBill ? itemsInBillForSweet[0].quantity : 0;

                    const isInlineOpen = inlineWeightId === sweet.id;
                    const inlinePrice = isInlineOpen
                      ? (inlineUnit === 'kg'
                          ? Math.round((Number(sweet.price) || 0) * parseFloat(inlineVal || '0'))
                          : Math.round(((Number(sweet.price) || 0) * parseFloat(inlineVal || '0')) / 1000))
                      : 0;

                    return (
                      <div
                        key={sweet.id}
                        className={`pos-list-row ${isItemInBill ? 'in-bill' : ''} ${isInlineOpen ? 'weight-open' : ''}`}
                        onClick={() => {
                          if (isKg) {
                            openInlineWeight(sweet);
                          } else {
                            handleSelectProductCard(sweet, defaultUnit);
                          }
                        }}
                        title={isItemInBill ? `${sweet.name} in active bill` : `Click to add ${sweet.name}`}
                      >
                        {/* ── Main row info ── */}
                        <div className="pos-list-info">
                          <div className="pos-list-title-wrap">
                            <span className="pos-item-num-badge">#{itemNum}</span>
                            <h4 className="pos-list-title">{sweet.name}</h4>
                          </div>
                          <span className="pos-list-rate">
                            ₹{sweet.price}
                            {sweet.unit === 'kg' && <small className="pos-price-unit"> / kg</small>}
                            {(sweet.unit === 'Pkt' || sweet.unit === 'pkt') && <small className="pos-price-unit"> / pkt</small>}
                            {(sweet.unit === 'Pc' || sweet.unit === 'pc') && <small className="pos-price-unit"> / pc</small>}
                            {sweet.unit === 'Litre' && <small className="pos-price-unit"> / Litre</small>}
                            {sweet.unit === '1 Cup' && <small className="pos-price-unit"> / cup</small>}
                          </span>
                        </div>

                        {isKg ? (
                          <div className="pos-list-kg-action" onClick={(e) => e.stopPropagation()}>
                            {/* Add button — shows summary if already in bill */}
                            <button
                              type="button"
                              className={`btn-type-weight ${isItemInBill ? 'active' : ''} ${isInlineOpen ? 'popover-open' : ''}`}
                              onClick={(e) => { e.stopPropagation(); openInlineWeight(sweet); }}
                              title={`Add ${sweet.name} to bill`}
                            >
                              {isInlineOpen ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              )}
                              <span>{isInlineOpen ? 'Close' : 'Add'}</span>
                              {isItemInBill && !isInlineOpen && (
                                <span className="kg-in-bill-summary">
                                  {itemsInBillForSweet.map((it) => `${it.weight}${it.quantity > 1 ? `×${it.quantity}` : ''}`).join(', ')}
                                </span>
                              )}
                            </button>

                            {/* ── Inline weight popover ── */}
                            {isInlineOpen && (
                              <div className="inline-weight-popover" onClick={(e) => e.stopPropagation()}>
                                {/* Unit toggle */}
                                <div className="iwp-unit-row">
                                  <button
                                    type="button"
                                    className={`iwp-unit-btn ${inlineUnit === 'g' ? 'active' : ''}`}
                                    onClick={() => setInlineUnit('g')}
                                  >g</button>
                                  <button
                                    type="button"
                                    className={`iwp-unit-btn ${inlineUnit === 'kg' ? 'active' : ''}`}
                                    onClick={() => setInlineUnit('kg')}
                                  >kg</button>
                                </div>

                                {/* Number input */}
                                <input
                                  ref={inlineInputRef}
                                  type="number"
                                  min="1"
                                  step="1"
                                  className="iwp-input"
                                  value={inlineVal}
                                  placeholder="0"
                                  onChange={(e) => setInlineVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmInlineWeight(sweet);
                                    if (e.key === 'Escape') closeInlineWeight();
                                  }}
                                />

                                {/* Live price preview */}
                                {inlineVal && parseFloat(inlineVal) > 0 && (
                                  <span className="iwp-price">₹{inlinePrice}</span>
                                )}

                                {/* Confirm */}
                                <button
                                  type="button"
                                  className="iwp-confirm-btn"
                                  disabled={!inlineVal || parseFloat(inlineVal) <= 0}
                                  onClick={() => confirmInlineWeight(sweet)}
                                >
                                  Add to Bill
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="pos-catalog-stepper"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="cat-step-btn minus"
                              disabled={qtyInBill === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateBillQty(sweet.id, defaultUnit, -1);
                              }}
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`cat-qty-input ${qtyInBill > 0 ? 'active' : ''}`}
                              value={qtyInBill > 0 ? String(qtyInBill) : ''}
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                const cleaned = raw.replace(/^0+/, '');
                                if (cleaned === '' || raw === '0') {
                                  handleSetBillItemQty(sweet, defaultUnit, 0);
                                } else {
                                  const val = Math.min(999, parseInt(cleaned, 10));
                                  handleSetBillItemQty(sweet, defaultUnit, val);
                                }
                              }}
                              title="Type quantity (0 to remove)"
                            />
                            <button
                              type="button"
                              className="cat-step-btn plus"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSweetToBill(sweet, defaultUnit, 1);
                              }}
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              {/* Floating Mobile Cart Summary Bar */}
              {billItems.length > 0 && (
                <div className="pos-mobile-bottom-bar mobile-only">
                  <button
                    type="button"
                    className="btn-mobile-bill-summary"
                    onClick={() => setMobileTab('bill')}
                  >
                    <div className="summary-left">
                      <span className="cart-badge-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </span>
                      <div className="summary-text">
                        <strong>{billItems.reduce((s, it) => s + it.quantity, 0)} Items Added</strong>
                        <small>{billItems.length} varieties · Tap to pay</small>
                      </div>
                    </div>
                    <div className="summary-right">
                      <span className="summary-amount">₹{billGrandTotal}</span>
                      <span className="summary-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Pay
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </section>

            {/* ── Drag Resizer Handle ── */}
            <div
              className={`pos-resizer-handle ${isDraggingSplit ? 'dragging' : ''}`}
              onMouseDown={startResize}
              onTouchStart={startResize}
              onDoubleClick={resetResize}
              title="Drag to resize Products and Bill panes | Double-click to reset"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize Products and Bill sections"
            >
              <div className="pos-resizer-grip" />
            </div>

            {/* RIGHT COLUMN: ACTIVE POS CASH REGISTER & TERMINAL */}
            <section className="pos-bill-pane" data-lenis-prevent>
              {/* Mobile Return to Products Button */}
              <div className="pos-bill-mobile-back mobile-only">
                <button
                  type="button"
                  className="btn-back-to-catalog"
                  onClick={() => setMobileTab('catalog')}
                >
                  ← Back to Beverage Menu
                </button>
              </div>

              {/* Register Tape Header */}
              <div className="pos-bill-header">
                <div className="pos-bill-header-title-box">
                  <h2 className="bill-title">Current Customer Bill</h2>
                </div>
                <div className="bill-header-actions">
                  {billItems.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="btn-hold-bill"
                        onClick={handleHoldBill}
                        title="Hold current bill temporarily"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        Hold
                      </button>
                      <button
                        type="button"
                        className="btn-clear-bill"
                        onClick={handleClearBill}
                        title="Clear current bill"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Customer Phone & Name Input */}
              <div className="pos-cust-row">
                <div className="cust-input-wrap">
                  <span className="input-prefix" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="Mobile (SMS/WhatsApp Bill)"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))
                    }
                    className="cust-input phone"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Guest Name (Optional)"
                  value={customerInfo.fullName}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="cust-input name"
                />
              </div>

              {/* Active Bill Items List (Independently Scrollable with data-lenis-prevent) */}
              <div className="pos-bill-items" data-lenis-prevent>
                {billItems.length === 0 ? (
                  <div className="pos-empty-bill">
                    <div className="pos-empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="pos-items-table">
                    {billItems.map((item) => {
                      return (
                        <div key={`${item.id}-${item.weight}`} className="pos-bill-line">
                          <div className="pos-line-info">
                            <span className="pos-line-name">{item.name}</span>
                            <div className="pos-line-weight">
                              <span
                                className="line-weight-tag clickable"
                                onClick={() => {
                                  const sweetObj = ALL_BILLING_ITEMS.find((s) => s.id === item.id);
                                  if (sweetObj && (sweetObj.unit === 'kg' || item.weight?.includes('g') || item.weight?.includes('kg'))) {
                                    handleOpenWeightModal(sweetObj, item.weight);
                                  }
                                }}
                                title="Click to change or retype weight"
                              >
                                {item.weight || item.unit || '1 Cup'} ✎
                              </span>
                              <span className="line-rate-info">₹{item.price} × {item.quantity}</span>
                            </div>
                          </div>

                          {/* Stepper with Direct Quantity Input */}
                          <div className="pos-line-stepper">
                            <button
                              type="button"
                              className="line-step-btn"
                              onClick={() => handleUpdateBillQty(item.id, item.weight, -1)}
                              title="Decrease 1"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="line-qty-input"
                              value={item.quantity > 0 ? String(item.quantity) : ''}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                const cleaned = raw.replace(/^0+/, '');
                                if (cleaned === '' || raw === '0') {
                                  handleRemoveBillItem(item.id, item.weight);
                                } else {
                                  const val = Math.min(999, parseInt(cleaned, 10));
                                  handleSetBillItemQty(item, item.weight, val);
                                }
                              }}
                              title="Type exact quantity (0 to remove)"
                            />
                            <button
                              type="button"
                              className="line-step-btn"
                              onClick={() => handleUpdateBillQty(item.id, item.weight, 1)}
                              title="Increase 1"
                            >
                              +
                            </button>
                          </div>

                          <span className="pos-line-price">₹{item.price * item.quantity}</span>

                          <button
                            type="button"
                            className="pos-line-del"
                            onClick={() => handleRemoveBillItem(item.id, item.weight)}
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bill Calculation & Summary (Pinned at Bottom) */}
              <div className="pos-bill-calc">
                <div className="calc-item">
                  <span>Total Items</span>
                  <span className="calc-val-bold">
                    {billItems.reduce((sum, it) => sum + it.quantity, 0)} cups/items ({billItems.length} items)
                  </span>
                </div>
                <div className="calc-item">
                  <span>Subtotal</span>
                  <span>₹{billSubtotal.toFixed(2)}</span>
                </div>
                <div className="calc-item">
                  <span>GST @ 5%</span>
                  <span>₹{billGst.toFixed(2)}</span>
                </div>
                <div className="calc-item total">
                  <span>Total Payable</span>
                  <span className="grand-total-highlight">
                    ₹{billGrandTotal}
                  </span>
                </div>

                {/* Payment Mode Selector */}
                <div className="pos-pay-modes">
                  <button
                    type="button"
                    className={`pay-mode-btn ${paymentMode === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('cash')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`pay-mode-btn ${paymentMode === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('upi')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    className={`pay-mode-btn ${paymentMode === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('card')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Card / POS
                  </button>
                </div>

                {/* Single Unified Action Button: Bill & Print */}
                <div className="pos-bill-actions-single">
                  <button
                    type="button"
                    className="btn-pos-complete"
                    disabled={billItems.length === 0}
                    onClick={() => handleCompleteSale({ autoPrint: true })}
                    title="Settle bill & print thermal slip receipt (Enter / F9)"
                  >
                    <span className="pos-btn-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                    </span>
                    <span className="pos-btn-labels">
                      <strong className="pos-btn-title">Bill &amp; Print</strong>
                      <small className="pos-btn-sub">
                        {billItems.length === 0 ? 'Settle & Print (Enter / F9)' : `₹${billGrandTotal} · Settle & Print Bill`}
                      </small>
                    </span>
                  </button>
                </div>

                <div className="pos-keyboard-hint">
                  <span>Press <strong>Enter</strong> or <strong>F9</strong> to Settle &amp; Print</span>
                </div>
              </div>
            </section>

          </main>
        )}


        {/* PAGE 2: SHIFT INVOICES LEDGER */}
        {posTab === 'my-bills' && (
          <main className="pos-shift-ledger" data-lenis-prevent="true">
            <div className="shift-ledger-header">
              <div className="shift-header-left">
                <span className="shift-eyebrow">TERMINAL SHIFT REPORT</span>
                <h2 className="shift-title">My Counter Invoices</h2>
                <div className="shift-meta-badges">
                  <span className="meta-badge cashier-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Cashier: <strong>{user?.name || 'Counter Staff'}</strong></span>
                  </span>
                  <span className="meta-badge desk-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <span>Terminal: <strong>{user?.counter || 'Counter Desk 01'}</strong></span>
                  </span>
                  <span className="meta-badge date-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                  </span>
                </div>
              </div>

              <div className="shift-header-right">
                <button
                  type="button"
                  className="btn-shift-refresh"
                  onClick={handleRefreshShiftBills}
                  disabled={isRefreshingBills}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  <span>{isRefreshingBills ? 'Syncing...' : 'Refresh Bills'}</span>
                </button>
                <button
                  type="button"
                  className="btn-shift-new-sale"
                  onClick={() => handleSwitchTab('register')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>Return to POS</span>
                </button>
              </div>
            </div>

            {/* Shift KPI Summary Cards */}
            <div className="shift-kpis-grid">
              <div className="shift-kpi-card total">
                <span className="kpi-label">Total Shift Revenue</span>
                <div className="kpi-val">₹{myShiftTotalRevenue.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">{myShiftBills.length} Invoices</span>
              </div>

              <div className="shift-kpi-card cash">
                <span className="kpi-label">Cash Collected</span>
                <div className="kpi-val">₹{myShiftCashTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'cash').length} Cash Bills
                </span>
              </div>

              <div className="shift-kpi-card upi">
                <span className="kpi-label">UPI Collections</span>
                <div className="kpi-val">₹{myShiftUpiTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'upi').length} UPI Transactions
                </span>
              </div>

              <div className="shift-kpi-card card">
                <span className="kpi-label">Card Swipe</span>
                <div className="kpi-val">₹{myShiftCardTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'card').length} EDC Swipes
                </span>
              </div>
            </div>

            {/* Toolbar: Search and Filter */}
            <div className="shift-toolbar">
              <div className="shift-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search invoice no, customer name or phone..."
                  value={billSearchTerm}
                  onChange={(e) => setBillSearchTerm(e.target.value)}
                />
                {billSearchTerm && (
                  <button type="button" className="clear-btn" onClick={() => setBillSearchTerm('')} aria-label="Clear search">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="shift-filter-chips">
                <span className="filter-label">Payment:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'cash', label: 'Cash' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'card', label: 'Card' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-chip ${billPaymentFilter === f.id ? 'active' : ''}`}
                    onClick={() => setBillPaymentFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices List */}
            <div className="shift-table-wrap">
              {filteredShiftBills.length === 0 ? (
                <div className="shift-empty-box">
                  <p>No invoices match the current search or payment filter.</p>
                </div>
              ) : (
                <div className="shift-table-card">
                  <table className="shift-invoices-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Time</th>
                        <th>Customer</th>
                        <th>Items Sold</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShiftBills.map((bill) => (
                        <tr key={bill.id || bill.invoiceNumber}>
                          <td>
                            <span className="shift-inv-badge">{bill.invoiceNumber}</span>
                          </td>
                          <td>
                            <span className="shift-time">{bill.orderTime || 'Just now'}</span>
                          </td>
                          <td>
                            <strong>{bill.customer?.fullName || 'Walk-in Guest'}</strong>
                            <div className="cust-phone-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {bill.customer?.phone || 'Counter'}
                            </div>
                          </td>
                          <td>
                            <div className="shift-items-list">
                              {bill.items?.slice(0, 3).map((it, idx) => {
                                const shortName = (it.name || '').split('—')[0].trim();
                                return (
                                  <span key={idx} className="shift-item-pill">
                                    {shortName} ×{it.quantity}
                                  </span>
                                );
                              })}
                              {bill.items?.length > 3 && (
                                <span className="shift-item-more">+{bill.items.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`payment-pill ${bill.paymentMethod?.toLowerCase()}`}>
                              {bill.paymentMethod === 'upi' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                  </svg>
                                  UPI
                                </>
                              ) : bill.paymentMethod === 'card' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                  </svg>
                                  Card
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <rect x="2" y="6" width="20" height="12" rx="2" />
                                    <circle cx="12" cy="12" r="2" />
                                  </svg>
                                  Cash
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <strong className="shift-amount">₹{bill.grandTotal}</strong>
                          </td>
                          <td>
                            <span className="shift-status-pill">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {bill.orderStatus || bill.status || 'Paid'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-shift-print-inv"
                              onClick={() => openInvoice(bill)}
                            >
                              Print Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ===================================================
            PAGE 3: DEDICATED LIVE ONLINE ORDERS DISPATCH QUEUE
           =================================================== */}
        {posTab === 'online-orders' && (
          <main className="pos-online-page" data-lenis-prevent="true">
            <div className="online-page-header">
              <div className="online-header-left">
                <span className="online-eyebrow">LIVE DISPATCH QUEUE</span>
                <h2 className="online-title">Online Delivery Orders</h2>
                <div className="online-meta-badges">
                  <span className={`meta-badge ${onlineNewCount > 0 ? 'alert' : 'done'}`}>
                    <span><strong>{onlineNewCount} New</strong> awaiting confirmation</span>
                  </span>
                  <span className="meta-badge process">
                    <span><strong>{onlineAcceptedCount} In Packing</strong></span>
                  </span>
                  <span className="meta-badge done">
                    <span><strong>{onlineDispatchedCount} Dispatched</strong></span>
                  </span>
                </div>
              </div>

              <div className="online-header-right">
                <button
                  type="button"
                  className="btn-online-refresh"
                  onClick={handleRefreshOnlineOrders}
                  disabled={isRefreshingOrders}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  <span>{isRefreshingOrders ? 'Syncing...' : 'Refresh Queue'}</span>
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>Return to POS</span>
                </button>
              </div>
            </div>

            {/* Online Orders KPI Strip */}
            <div className="online-kpis-grid">
              <div className="online-kpi-card new">
                <span className="kpi-label">New Incoming Orders</span>
                <div className="kpi-val">{onlineNewCount}</div>
                <span className="kpi-sub">Accept and print order slip</span>
              </div>
              <div className="online-kpi-card packing">
                <span className="kpi-label">Packing / Ready</span>
                <div className="kpi-val">{onlineAcceptedCount}</div>
                <span className="kpi-sub">Ready for courier handover</span>
              </div>
              <div className="online-kpi-card dispatched">
                <span className="kpi-label">Dispatched Today</span>
                <div className="kpi-val">{onlineDispatchedCount}</div>
                <span className="kpi-sub">Sent out for doorstep delivery</span>
              </div>
              <div className="online-kpi-card revenue">
                <span className="kpi-label">Online Orders Revenue</span>
                <div className="kpi-val">₹{onlineRevenueTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">{allOnlineOrders.length} Total Web Orders</span>
              </div>
            </div>

            {/* Filter Chips & Search Toolbar */}
            <div className="online-toolbar">
              <div className="online-filter-chips">
                {[
                  { id: 'all', label: `All Orders (${allOnlineOrders.length})` },
                  { id: 'New', label: `New (${onlineNewCount})` },
                  { id: 'Accepted', label: `Accepted (${onlineAcceptedCount})` },
                  { id: 'Dispatched', label: `Dispatched (${onlineDispatchedCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-chip ${onlineFilter === f.id ? 'active' : ''}`}
                    onClick={() => setOnlineFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="online-search-box">
                <input
                  type="text"
                  placeholder="Search invoice no, customer name, phone, or city..."
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                />
                {onlineSearch && (
                  <button type="button" className="clear-btn" onClick={() => setOnlineSearch('')} aria-label="Clear search">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Orders Cards Grid */}
            <div className="online-cards-container">
              {filteredOnlineOrders.length === 0 ? (
                <div className="online-empty-page-state">
                  <div className="empty-online-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <h3>No Orders Found in this View</h3>
                  <p>
                    {allOnlineOrders.length === 0
                      ? 'No incoming customer orders right now. New orders will appear here automatically.'
                      : 'No orders match your selected filter or search query.'}
                  </p>
                  <button
                    type="button"
                    className="btn-empty-return-pos"
                    onClick={() => handleSwitchTab('register')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Go to POS Billing Counter
                  </button>
                </div>
              ) : (
                <div className="online-orders-cards-grid">
                  {filteredOnlineOrders.map((ord) => (
                    <div key={ord.id} className={`online-full-card status-${ord.status?.toLowerCase()}`}>
                      <div className="online-card-top">
                        <div className="online-id-time">
                          <span className="online-inv-code">{ord.invoiceNumber}</span>
                          <span className="online-time-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {ord.orderTime || ord.orderDate}
                          </span>
                        </div>
                        <span className={`online-status-pill ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="online-cust-info">
                        <div className="cust-primary">
                          <strong>{ord.customer?.fullName || 'Online Customer'}</strong>
                          <span className="cust-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            +91 {ord.customer?.phone}
                          </span>
                        </div>
                        <div className="cust-address-line" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>
                            {ord.shippingAddress?.doorNo ? `${ord.shippingAddress.doorNo}, ` : ''}
                            {ord.shippingAddress?.street ? `${ord.shippingAddress.street}, ` : ''}
                            {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                            {ord.shippingAddress?.pincode ? ` - ${ord.shippingAddress.pincode}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="online-order-items-box">
                        <span className="items-title">Ordered Items:</span>
                        <div className="items-tags">
                          {ord.items?.map((it, idx) => (
                            <span key={idx} className="online-item-tag">
                              {it.name} ({it.weight || '1 Cup'}) × <strong>{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="online-card-bottom">
                        <div className="price-details">
                          <span className="total-amount">₹{ord.grandTotal}</span>
                          <span className="pay-method" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {ord.paymentMethod === 'upi' ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                </svg>
                                UPI Paid
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <circle cx="12" cy="12" r="2" />
                                </svg>
                                Cash on Delivery
                              </>
                            )}
                          </span>
                        </div>

                        <div className="online-action-buttons">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="btn-action-accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Accept Order
                            </button>
                          )}
                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="btn-action-dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                              </svg>
                              Mark Dispatched
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action-print"
                            onClick={() => openInvoice(ord)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* ===================================================
            PAGE 4: DEDICATED COUNTER STOCK & REFILL PAGE
           =================================================== */}
        {posTab === 'inventory' && (
          <main className="pos-inventory-page" data-lenis-prevent="true">
            <div className="inventory-page-header">
              <div>
                <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  LIVE COUNTER INVENTORY
                </span>
                <h2 className="inventory-title">Counter Stock &amp; Refill Tracker</h2>
                <div className="inventory-meta-badges">
                  <span className="meta-badge count" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <strong>{totalStockVarieties} Beverage &amp; Snack Varieties</strong>
                  </span>
                  {lowStockCount > 0 ? (
                    <span className="meta-badge alert" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <strong>{lowStockCount} Items Low Stock</strong>
                    </span>
                  ) : (
                    <span className="meta-badge done" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      All trays adequately stocked
                    </span>
                  )}
                </div>
              </div>

              <div className="inventory-header-right">
                <button
                  type="button"
                  className="btn-inventory-refill"
                  onClick={() => {
                    setRefillTargetSweetId(null);
                    setIsRefillOpen(true);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Refill Trays
                </button>
                <button
                  type="button"
                  className="btn-inventory-add"
                  onClick={() => setIsAddStockOpen(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Stock
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Return to POS
                </button>
              </div>
            </div>

            {/* Inventory KPI Summary */}
            <div className="inventory-kpis-grid">
              <div className="inv-kpi-card total">
                <span className="kpi-label">Active Products</span>
                <div className="kpi-val">{totalStockVarieties}</div>
                <span className="kpi-sub">{totalStockVarieties} Varieties Across All Categories</span>
              </div>
              <div className={`inv-kpi-card ${lowStockCount > 0 ? 'warning' : 'healthy'}`}>
                <span className="kpi-label">Low Stock Alerts</span>
                <div className="kpi-val">{lowStockCount}</div>
                <span className="kpi-sub">
                  {lowStockCount > 0 ? 'Require immediate counter refill' : 'All trays ample'}
                </span>
              </div>
              <div className="inv-kpi-card ready">
                <span className="kpi-label">Healthy Trays</span>
                <div className="kpi-val">{totalStockVarieties - lowStockCount} Ready</div>
                <span className="kpi-sub">Serving walk-in customers</span>
              </div>
            </div>

            {/* Inventory Quick Search & Category Filter Toolbar */}
            <div className="inventory-toolbar">
              <div className="inventory-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search inventory (Murukku, முறுக்கு, Sevu, Tea, Coffee)..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                {inventorySearch && (
                  <button type="button" onClick={() => setInventorySearch('')} className="search-clear-btn" aria-label="Clear">
                    ✕
                  </button>
                )}
              </div>
              <div className="inventory-filter-chips">
                <span className="filter-label">Filter:</span>
                <button
                  type="button"
                  className={`filter-chip ${invCategoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setInvCategoryFilter('all')}
                >
                  All ({inventory.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${invCategoryFilter === 'spices' ? 'active' : ''}`}
                  onClick={() => setInvCategoryFilter('spices')}
                >
                  Spices (Kara Vagai) ({inventory.filter((i) => i.category === 'spices' || (i.subcategory && i.subcategory.includes('Kara'))).length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${invCategoryFilter === 'beverages' ? 'active' : ''}`}
                  onClick={() => setInvCategoryFilter('beverages')}
                >
                  Beverages &amp; Teas
                </button>
                <button
                  type="button"
                  className={`filter-chip ${invCategoryFilter === 'sweets' ? 'active' : ''}`}
                  onClick={() => setInvCategoryFilter('sweets')}
                >
                  Ghee Sweets
                </button>
              </div>
            </div>

            {/* Counter Stock Table */}
            <div className="inventory-table-wrap">
              <div className="inventory-table-card">
                <table className="inventory-stock-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Tray Stock Available</th>
                      <th>Min Alert</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item, idx) => {
                      const itemNum = idx + 1;
                      const isLow = (item.stockKg || 0) <= (item.minThreshold || 10);
                      const unit = item.unit || 'Cup';
                      return (
                        <tr key={item.id} className={isLow ? 'row-low-stock' : ''}>
                          <td>
                            <span className="item-num-badge">#{itemNum}</span>
                          </td>
                          <td>
                            <strong className="item-title">{item.name}</strong>
                            <div className="item-desc-sub">{item.batchNote || 'Fresh counter brew'}</div>
                          </td>
                          <td>
                            <span className="category-pill">{item.subcategory || (item.category === 'spices' ? 'Spices (Kara Vagai)' : item.unit === 'Pc' ? 'Snack' : item.unit === 'kg' ? 'Spices (Kara Vagai)' : 'Beverage')}</span>
                          </td>
                          <td>
                            <strong className="price-tag">₹{item.price}{item.unit === 'kg' ? ' / kg' : item.unit === 'Pkt' ? ' / pkt' : ''}</strong>
                          </td>
                          <td>
                            <div className="stock-level-cell">
                              <span className="stock-value">{item.stockKg} {item.unit === 'kg' ? 'kg' : item.unit === 'Pkt' ? 'Pkts' : item.unit === 'Bottle' ? 'Bottles' : unit + 's'}</span>
                              <div className="stock-progress-bar">
                                <div
                                  className={`progress-fill ${isLow ? 'low' : 'normal'}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(10, ((item.stockKg || 0) / (item.unit === 'kg' ? 50 : 100)) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="min-threshold-sub">{item.minThreshold || 10} {item.unit === 'kg' ? 'kg' : item.unit === 'Pkt' ? 'Pkts' : item.unit === 'Bottle' ? 'Bottles' : unit + 's'}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${isLow ? 'low' : 'ok'}`}>
                              {isLow ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                  LOW STOCK
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  In Stock
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-quick-refill-item"
                              onClick={() => handleOpenRefillItem(item.id)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                              Refill
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 4: DAILY SALES & REVENUE SETTLEMENT */}
        {posTab === 'daily-sales' && (
          <main className="pos-subpage-main" data-lenis-prevent="true">
            <div className="pos-subpage-inner">
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>Return to Billing Register</span>
                </button>
              </div>

              <DailyRevenueReport
                allSales={allSales}
                onOpenInvoice={openInvoice}
                onRefresh={fetchBills}
              />
            </div>
          </main>
        )}
      </div>


      {/* MODALS */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
      />

      <RefillStockModal
        isOpen={isRefillOpen}
        onClose={() => {
          setIsRefillOpen(false);
          setRefillTargetSweetId(null);
        }}
        initialSweetId={refillTargetSweetId}
      />
    </div>
  );
}
