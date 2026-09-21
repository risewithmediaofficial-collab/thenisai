import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, isSandboxActive } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ALL_BILLING_ITEMS } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import AddProductInlinePanel from '../Inventory/AddProductInlinePanel';
import DeleteBillModal from './DeleteBillModal';
import EditBillModal from './EditBillModal';
import SideNavbar from '../Nav/SideNavbar';
import DailyRevenueReport from '../Admin/DailyRevenueReport';
// Predefined categories for fast sweets, savouries & beverages POS filtering
const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'beverages', label: 'Tea & Fast Sellers (13)' },
  { id: 'sweets', label: 'Sweets (62)' },
  { id: 'spices', label: 'Spices & Kara (50)' },
  { id: 'halwa', label: 'Halwa (அல்வா)' },
  { id: 'mysore-pak', label: 'Mysore Pak & Ghee' },
  { id: 'cashew-rolls', label: 'Cashew & Rolls' },
  { id: 'milk-bengali', label: 'Milk & Bengali' },
  { id: 'traditional', label: 'Traditional Sweets' },
  { id: 'pieces-packets', label: 'Pieces & Packets' },
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
    isOnline,
    taxSettings,
    allBillingProducts,
    customProducts,
    productAvailabilityMap,
    toggleProductAvailability,
    addNewProduct,
    deleteProduct,
    updateProductMasterPrice,
    updateProductDetails,
    updateProductSkuCode,
    deleteBill,
    deleteBills,
  } = useCart();

  const [isAddNewProductOpen, setIsAddNewProductOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState(null); // { item, newPrice, reason }
  const [editingMasterPriceItem, setEditingMasterPriceItem] = useState(null); // { id, name, price }
  const [editingSkuProduct, setEditingSkuProduct] = useState(null); // { id, name, skuCode }
  const [newSkuInput, setNewSkuInput] = useState('');
  const [skuError, setSkuError] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null); // { id, name }
  const [deleteBillModalItem, setDeleteBillModalItem] = useState(null); // bill to delete with reason
  const [selectedShiftBillIds, setSelectedShiftBillIds] = useState([]);
  const [bulkDeleteBills, setBulkDeleteBills] = useState(null);


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

  // Manual / Custom Item (not in inventory)
  const [showManualItemForm, setShowManualItemForm] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemAmount, setManualItemAmount] = useState('');
  const [manualItemQty, setManualItemQty] = useState('1');
  const manualItemNameRef = useRef(null);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phone: '',
  });
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card' | 'split'
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [lastEditedSplit, setLastEditedSplit] = useState('cash'); // 'cash' | 'upi'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Inventory Page Search & Category Filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('all');
  const [invStatusFilter, setInvStatusFilter] = useState('all');
  const [inventoryPage, setInventoryPage] = useState(1);

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

  // Helpers to identify measurable items (weight in kg/g and volume in Litre/ml)
  const isLitreItem = (sweet) => {
    if (!sweet) return false;
    const u = (sweet.unit || '').toLowerCase();
    return u === 'litre' || u === 'liter' || u === 'l' || u === 'ml';
  };

  const isKgItem = (sweet) => {
    if (!sweet) return false;
    const u = (sweet.unit || '').toLowerCase();
    const cat = (sweet.category || '').toLowerCase();
    const id = (sweet.id || '').toLowerCase();
    if (
      cat === 'beverages' ||
      cat === 'snacks' ||
      id.includes('tea') ||
      id.includes('coffee') ||
      id.includes('milk') ||
      id.includes('boost') ||
      id.includes('horlicks') ||
      id === 'vada' ||
      u.includes('cup') ||
      u.includes('pc')
    ) {
      return false;
    }
    return u === 'kg' || Boolean(sweet.prices && (sweet.prices['250g'] || sweet.prices['500g']));
  };

  const isMeasurableItem = (sweet) => isKgItem(sweet) || isLitreItem(sweet);

  // Dedicated helpers for displaying quantity vs kg across inventory and POS
  const getItemUnitDisplay = (prod) => {
    if (!prod) return 'kg';
    const cat = (prod.category || '').toLowerCase();
    const u = (prod.unit || '').trim();
    const id = (prod.id || '').toLowerCase();
    if (cat === 'beverages' || id.includes('tea') || id.includes('coffee') || id.includes('milk') || id.includes('boost') || id.includes('horlicks') || u.toLowerCase().includes('cup')) {
      return '1 Cup';
    }
    if (cat === 'snacks' || id === 'vada' || u.toLowerCase().includes('pc')) {
      return '1 Pc';
    }
    if (u.toLowerCase() === 'litre' || u.toLowerCase() === '1 litre') return '1 Litre';
    if (u.toLowerCase() === 'pkt' || u.toLowerCase() === 'packet') return '1 Pkt';
    return u || 'kg';
  };

  const getItemStockDisplay = (prod, inventoryMap, rawInventory) => {
    if (!prod) return '0';
    const invItem = inventoryMap?.get(prod.id) || rawInventory?.find((i) => i.id === prod.id);
    const stock = invItem ? invItem.stockKg : (prod.stockKg ?? prod.stock ?? 0);
    const cat = (prod.category || '').toLowerCase();
    const u = (prod.unit || '').toLowerCase();
    const id = (prod.id || '').toLowerCase();

    if (cat === 'beverages' || id.includes('tea') || id.includes('coffee') || id.includes('milk') || id.includes('boost') || id.includes('horlicks') || u.includes('cup')) {
      return `${stock} Cups`;
    }
    if (cat === 'snacks' || id === 'vada' || u.includes('pc')) {
      return `${stock} Pcs`;
    }
    if (u.includes('pkt')) {
      return `${stock} Pkts`;
    }
    if (u.includes('bottle') || u.includes('litre') || u.includes('liter') || u === 'l') {
      return `${stock} Litres`;
    }
    return `${stock} kg`;
  };

  // Inline weight/volume popover state (popup inside each kg & litre row)
  const [inlineWeightId, setInlineWeightId] = useState(null); // sweet.id of open popover
  const [editingWeight, setEditingWeight] = useState(null); // original weight if editing existing line
  const [inlineVal, setInlineVal] = useState('');
  const [inlineUnit, setInlineUnit] = useState('g'); // 'g' | 'kg' | 'ml' | 'L' | 'rs'
  const [inlineMode, setInlineMode] = useState(null); // null | 'g' | 'kg' | 'ml' | 'L' | 'rs'
  const inlineInputRef = useRef(null);

  const openInlineWeight = (sweet, existingWeight) => {
    if (inlineWeightId === sweet.id && !existingWeight) {
      setInlineWeightId(null);
      setEditingWeight(null);
      setInlineMode(null);
      setInlineVal('');
      return;
    }
    setInlineWeightId(sweet.id);
    setEditingWeight(existingWeight || null);

    const isLitre = isLitreItem(sweet);
    if (existingWeight) {
      const ew = String(existingWeight).toLowerCase().trim();
      if (ew.includes('ml')) {
        setInlineVal(ew.replace(/[^0-9.]/g, ''));
        setInlineUnit('ml');
        setInlineMode('ml');
      } else if (ew.includes('l') || ew.includes('litre')) {
        setInlineVal(ew.replace(/[^0-9.]/g, ''));
        setInlineUnit('L');
        setInlineMode('L');
      } else if (ew.includes('kg')) {
        setInlineVal(ew.replace(/[^0-9.]/g, ''));
        setInlineUnit('kg');
        setInlineMode('kg');
      } else if (ew.includes('g')) {
        setInlineVal(ew.replace(/[^0-9.]/g, ''));
        setInlineUnit('g');
        setInlineMode('g');
      } else {
        setInlineVal(isLitre ? '1' : '1');
        setInlineUnit(isLitre ? 'L' : 'kg');
        setInlineMode(isLitre ? 'L' : 'kg');
      }
    } else {
      // Directly open in entry mode (image format)
      if (isLitre) {
        setInlineVal('1');
        setInlineUnit('L');
        setInlineMode('L');
      } else {
        setInlineVal('1');
        setInlineUnit('kg');
        setInlineMode('kg');
      }
    }

    setTimeout(() => {
      inlineInputRef.current?.focus();
      const rowEl = document.getElementById(`pos-row-${sweet.id}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  };

  const closeInlineWeight = () => {
    setInlineWeightId(null);
    setEditingWeight(null);
    setInlineMode(null);
    setInlineVal('');
  };

  const handleSelectUnitMode = (mode) => {
    setInlineMode(mode);
    if (mode === 'g') {
      setInlineUnit('g');
      setInlineVal('250');
    } else if (mode === 'kg') {
      setInlineUnit('kg');
      setInlineVal('1');
    } else if (mode === 'ml') {
      setInlineUnit('ml');
      setInlineVal('500');
    } else if (mode === 'L' || mode === 'l') {
      setInlineUnit('L');
      setInlineVal('1');
    } else if (mode === 'rs') {
      setInlineUnit('rs');
      setInlineVal('100');
    }
    setTimeout(() => {
      inlineInputRef.current?.focus();
    }, 60);
  };

  const getRupeePreview = (sweet, amountStr) => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) return '';
    const rate = Number(sweet.price) || 0;
    if (rate <= 0) return '';
    if (isLitreItem(sweet)) {
      const ml = Math.round((amt / rate) * 1000);
      if (ml >= 1000) {
        const l = parseFloat((ml / 1000).toFixed(3));
        return `= ${l}L (${ml}ml)`;
      }
      return `= ${ml}ml`;
    } else {
      const grams = Math.round((amt / rate) * 1000);
      if (grams >= 1000) {
        const kg = parseFloat((grams / 1000).toFixed(3));
        return `= ${kg} kg (${grams}g)`;
      }
      return `= ${grams}g`;
    }
  };

  const handleSwitchInlineUnit = (newUnit) => {
    handleSelectUnitMode(newUnit);
  };

  const confirmInlineWeight = (sweet) => {
    const num = parseFloat(inlineVal);
    if (isNaN(num) || num <= 0) return;
    let formatted;
    let finalPrice = null;

    if (inlineMode === 'rs') {
      const rupeeAmount = Math.round(num);
      const perUnitRate = Number(sweet.price) || 0;
      if (perUnitRate <= 0) return;
      if (isLitreItem(sweet)) {
        const ml = Math.round((rupeeAmount / perUnitRate) * 1000);
        formatted = ml >= 1000 ? `${parseFloat((ml / 1000).toFixed(3))}L` : `${ml}ml`;
      } else {
        const grams = Math.round((rupeeAmount / perUnitRate) * 1000);
        formatted = grams >= 1000 ? `${parseFloat((grams / 1000).toFixed(3))} kg` : `${grams}g`;
      }
      finalPrice = rupeeAmount;
    } else if (isLitreItem(sweet)) {
      formatted = (inlineUnit === 'L' || inlineUnit === 'Litre' || inlineMode === 'L' || inlineMode === 'l') ? `${num}L` : `${num}ml`;
    } else {
      formatted = (inlineUnit === 'kg' || inlineMode === 'kg') ? `${num} kg` : `${num}g`;
    }

    if (editingWeight && editingWeight !== formatted) {
      setBillItems((prev) => {
        const withoutOld = prev.filter((i) => !(i.id === sweet.id && i.weight === editingWeight));
        const price = finalPrice !== null ? finalPrice : computeItemPrice(sweet, formatted);
        const existingIdx = withoutOld.findIndex((i) => i.id === sweet.id && i.weight === formatted);
        if (existingIdx > -1) {
          const updated = [...withoutOld];
          updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1, price };
          return updated;
        }
        return [
          ...withoutOld,
          {
            id: sweet.id,
            name: sweet.name,
            itemNumber: sweet.itemNumber,
            skuCode: sweet.skuCode || (sweet.itemNumber ? String(sweet.itemNumber) : ''),
            weight: formatted,
            price,
            quantity: 1,
            hsn: sweet.hsn || '2106',
            image: sweet.image,
            unit: sweet.unit || '1 Cup',
          },
        ];
      });
    } else {
      handleAddSweetToBill(sweet, formatted, 1, finalPrice);
    }

    setEditingWeight(null);
    setInlineWeightId(null);
    setInlineMode(null);
    setInlineVal('');
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

      // Only handle billing routes inside BillingCounter
      if (!h.startsWith('#billing') && !h.startsWith('#admin/billing') && !h.startsWith('#admin/pos')) return;

      if (h.includes('bills')) {
        setPosTab('my-bills');
      } else if (h.includes('orders') || h.includes('online') || h.includes('dispatch')) {
        setPosTab('online-orders');
      } else if (h.includes('daily') || h.includes('revenue') || h.includes('sales')) {
        setPosTab('daily-sales');
      } else if (h.includes('inventory') || h.includes('stock') || h.includes('products')) {
        setPosTab('inventory');
      } else {
        setPosTab('register');
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const syncBillingHash = (hash) => {
    let target = hash;
    if (user?.role === 'admin' && window.location.hash.toLowerCase().startsWith('#admin')) {
      if (hash === '#billing' || hash.startsWith('#billing/register')) target = '#admin/billing';
      else if (hash.startsWith('#billing/bills') || hash.startsWith('#billing/daily-sales')) target = '#admin/shift-bills';
      else if (hash.startsWith('#billing/orders')) target = '#admin/dispatch';
      else if (hash.startsWith('#billing/inventory')) target = '#admin/inventory';
    }
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
  };

  const handleSwitchTab = (newTab) => {
    setPosTab(newTab);
    const isAdminMode = user?.role === 'admin' && window.location.hash.toLowerCase().startsWith('#admin');
    if (newTab === 'register') {
      syncBillingHash(isAdminMode ? '#admin/billing' : '#billing');
      setMobileTab('catalog');
    } else if (newTab === 'my-bills' || newTab === 'daily-sales') {
      if (isAdminMode) {
        navigateTo('admin', 'shift-bills');
      } else {
        syncBillingHash('#billing/daily-sales');
        handleRefreshShiftBills();
      }
    } else if (newTab === 'online-orders') {
      if (isAdminMode) {
        navigateTo('admin', 'dispatch');
      } else {
        syncBillingHash('#billing/orders');
      }
    } else if (newTab === 'inventory') {
      if (isAdminMode) {
        navigateTo('admin', 'inventory');
        return;
      }
      syncBillingHash('#billing/inventory');
    }
  };

  // Helper to determine if a sale record belongs to Today's shift (strict cashier scoping)
  const isTodaySale = (sale) => {
    if (!sale) return false;
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yr}-${mo}-${da}`;

    const checkMatch = (dVal) => {
      if (!dVal) return false;
      const d = new Date(dVal);
      if (isNaN(d.getTime())) return false;
      const dYr = d.getFullYear();
      const dMo = String(d.getMonth() + 1).padStart(2, '0');
      const dDa = String(d.getDate()).padStart(2, '0');
      return `${dYr}-${dMo}-${dDa}` === todayStr;
    };

    if (sale.createdAt && checkMatch(sale.createdAt)) return true;
    if (sale.orderDate) {
      if (sale.orderDate.includes(todayStr)) return true;
      if (checkMatch(sale.orderDate)) return true;
    }
    return false;
  };

  // Shift Ledger Filtering for Cashier: strictly TODAY's bills for active cashier desk
  const myShiftBills = useMemo(() => {
    return (bills || []).filter((b) => {
      // Strict rule: Cashier UI sees ONLY today's bills
      if (!isTodaySale(b)) return false;
      if (!user || user.role === 'admin') return true;
      const uid = user.id || user._id || user.username;
      return (
        b.cashier?.id === uid ||
        b.cashier?.username === user.username ||
        !b.cashier?.username
      );
    });
  }, [bills, user]);

  // Latest 10 Bills for Quick Editing & Mistakes Correction (strictly today's shift)
  const recentBills = useMemo(() => {
    return [...myShiftBills]
      .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
      .slice(0, 10);
  }, [myShiftBills]);

  // Recent Bills Popover & Edit Modal States
  const [showRecentBillsDropdown, setShowRecentBillsDropdown] = useState(false);
  const [editBillModalItem, setEditBillModalItem] = useState(null);

  const filteredShiftBills = myShiftBills.filter((b) => {
    if (billPaymentFilter !== 'all') {
      const pm = (b.paymentMethod || '').toLowerCase();
      if (billPaymentFilter === 'split') {
        if (pm !== 'split') return false;
      } else if (billPaymentFilter === 'cash') {
        if (pm !== 'cash' && pm !== 'split') return false;
      } else if (billPaymentFilter === 'upi') {
        if (pm !== 'upi' && pm !== 'split') return false;
      } else if (billPaymentFilter === 'card') {
        if (pm !== 'card') return false;
      }
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

  const selectedShiftBills = useMemo(() => {
    const selected = new Set(selectedShiftBillIds);
    return myShiftBills.filter((bill) => selected.has(bill.id || bill.invoiceNumber));
  }, [myShiftBills, selectedShiftBillIds]);

  const allFilteredShiftBillsSelected = filteredShiftBills.length > 0 && filteredShiftBills.every(
    (bill) => selectedShiftBillIds.includes(bill.id || bill.invoiceNumber)
  );

  useEffect(() => {
    const activeIds = new Set(myShiftBills.map((bill) => bill.id || bill.invoiceNumber));
    setSelectedShiftBillIds((previous) => previous.filter((id) => activeIds.has(id)));
  }, [myShiftBills]);

  const toggleShiftBillSelection = (bill) => {
    const id = bill.id || bill.invoiceNumber;
    setSelectedShiftBillIds((previous) => (
      previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]
    ));
  };

  const toggleAllFilteredShiftBills = () => {
    const filteredIds = filteredShiftBills.map((bill) => bill.id || bill.invoiceNumber);
    setSelectedShiftBillIds((previous) => {
      const selected = new Set(previous);
      const shouldSelect = !filteredIds.every((id) => selected.has(id));
      filteredIds.forEach((id) => shouldSelect ? selected.add(id) : selected.delete(id));
      return [...selected];
    });
  };

  const myShiftTotalRevenue = myShiftBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const myShiftCashTotal = myShiftBills.reduce((sum, b) => {
    const pm = (b.paymentMethod || '').toLowerCase();
    if (pm === 'cash') return sum + (b.grandTotal || 0);
    if (pm === 'split') return sum + (b.paymentDetails?.cash ?? b.splitCash ?? 0);
    return sum;
  }, 0);
  const myShiftUpiTotal = myShiftBills.reduce((sum, b) => {
    const pm = (b.paymentMethod || '').toLowerCase();
    if (pm === 'upi') return sum + (b.grandTotal || 0);
    if (pm === 'split') return sum + (b.paymentDetails?.upi ?? b.splitUpi ?? 0);
    return sum;
  }, 0);
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
  // Catalog pane ref to manage scroll on category switch
  const catalogPaneRef = useRef(null);

  // Bill items list ref for inline scrolling & auto-scroll on add
  const billItemsRef = useRef(null);
  const prevBillItemsCount = useRef(billItems.length);

  useEffect(() => {
    if (billItems.length > prevBillItemsCount.current) {
      if (billItemsRef.current) {
        billItemsRef.current.scrollTop = billItemsRef.current.scrollHeight;
      }
    }
    prevBillItemsCount.current = billItems.length;
  }, [billItems.length]);

  useEffect(() => {
    if (catalogPaneRef.current) {
      catalogPaneRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  // Freeze background screen scroll when popups or drawers are active
  useScrollLock(
    isAddStockOpen ||
    isRefillOpen ||
    isMobileMenuOpen
  );

  // Keyboard shortcuts (F2: search/next sale, Enter/F9: finalize bill, Escape: close panels)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
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

  // Index inventory once. The old render searched the full array for every
  // visible product, then repeated that work in the table cells.
  const inventoryById = useMemo(
    () => new Map((inventory || []).map((item) => [item.id, item])),
    [inventory]
  );

  // Filtered inventory products matching all catalog items
  const filteredInventory = useMemo(() => {
    return (allBillingProducts || []).filter((item) => {
      const cat = (item.category || '').toLowerCase();
      const subcat = (item.subcategory || '').toLowerCase();

      if (invCategoryFilter !== 'all') {
        if (invCategoryFilter === 'spices' || invCategoryFilter === 'spices-masalas') {
          if (cat !== 'spices' && cat !== 'spices-masalas' && !subcat.includes('kara') && !subcat.includes('spice')) return false;
        } else if (invCategoryFilter === 'beverages') {
          if (cat !== 'beverages' && !subcat.includes('tea') && !subcat.includes('coffee') && !subcat.includes('malt') && !subcat.includes('snack') && cat !== 'snacks') return false;
        } else if (invCategoryFilter === 'sweets') {
          if (cat !== 'sweets' && !subcat.includes('sweet') && !subcat.includes('halwa') && !subcat.includes('pak') && !subcat.includes('roll') && !subcat.includes('bengali') && !subcat.includes('palkova')) return false;
        } else if (invCategoryFilter === 'savouries') {
          if (cat !== 'savouries' && !subcat.includes('mixture') && !subcat.includes('sev') && !subcat.includes('murukku')) return false;
        } else if (cat !== invCategoryFilter) {
          return false;
        }
      }

      const isInactive = productAvailabilityMap[item.id] !== undefined
        ? Boolean(productAvailabilityMap[item.id])
        : Boolean(item.isInactive || inventoryById.get(item.id)?.isInactive);

      if (invStatusFilter === 'active' && isInactive) return false;
      if (invStatusFilter === 'inactive' && !isInactive) return false;

      if (inventorySearch.trim()) {
        const q = inventorySearch.trim().toLowerCase();
        const matches =
          (item.name || '').toLowerCase().includes(q) ||
          (item.englishName || '').toLowerCase().includes(q) ||
          (item.tamilName || '').includes(inventorySearch.trim()) ||
          (item.id || '').toLowerCase().includes(q) ||
          subcat.includes(q) ||
          String(item.itemNumber || '').includes(q) ||
          (item.skuCode && item.skuCode.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
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
  }, [allBillingProducts, invCategoryFilter, invStatusFilter, inventorySearch, productAvailabilityMap, inventoryById]);

  const INVENTORY_PAGE_SIZE = 25;
  const inventoryPageCount = Math.max(1, Math.ceil(filteredInventory.length / INVENTORY_PAGE_SIZE));
  const safeInventoryPage = Math.min(inventoryPage, inventoryPageCount);
  const inventoryPageStart = (safeInventoryPage - 1) * INVENTORY_PAGE_SIZE;
  const visibleInventory = useMemo(
    () => filteredInventory.slice(inventoryPageStart, inventoryPageStart + INVENTORY_PAGE_SIZE),
    [filteredInventory, inventoryPageStart]
  );

  useEffect(() => {
    setInventoryPage(1);
  }, [invCategoryFilter, invStatusFilter, inventorySearch]);

  const billSubtotal = billItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const billGrandTotal = Math.round(billSubtotal);

  // Helper to compute exact price for any weight or volume (100g, 250g, 500g, 1 kg, 250ml, 500ml, 1L, 2L, or custom typed)
  const computeItemPrice = (sweet, weight) => {
    if (!sweet) return 20;
    const perUnit = Number(sweet.price) || Number(sweet.unitPrice) || 0;

    // Check volume (Litre / ml)
    const isLitre = isLitreItem(sweet) ||
      (typeof weight === 'string' && (weight.toLowerCase().includes('ml') || weight.toLowerCase().includes('litre') || weight.includes('L') || weight.toLowerCase().endsWith('l')));

    if (isLitre) {
      const wLower = typeof weight === 'string' ? weight.toLowerCase().trim() : '';
      if (wLower === '250ml' || wLower === '250 ml') return Math.round(perUnit * 0.25);
      if (wLower === '500ml' || wLower === '500 ml') return Math.round(perUnit * 0.5);
      if (wLower === '1l' || wLower === '1 l' || wLower === '1 litre' || wLower === '1000ml') return perUnit;
      if (wLower === '2l' || wLower === '2 l' || wLower === '2 litre' || wLower === '2000ml') return perUnit * 2;

      // Custom ml: e.g. "350ml", "100ml", "750ml"
      if (wLower.endsWith('ml')) {
        const ml = parseFloat(wLower.replace('ml', '').trim());
        if (!isNaN(ml) && ml > 0) {
          return Math.round((perUnit * ml) / 1000);
        }
      }
      // Custom Litres: e.g. "1.5L", "2.5 Litre", "3L"
      if (wLower.endsWith('l') || wLower.includes('litre') || wLower.includes('liter')) {
        const litres = parseFloat(wLower.replace(/[^0-9.]/g, '').trim());
        if (!isNaN(litres) && litres > 0) {
          return Math.round(perUnit * litres);
        }
      }
      return perUnit;
    }

    // Check weight (kg / g)
    if (sweet.unit === 'kg' || weight?.includes('g') || weight?.includes('kg')) {
      if (weight === '100g') return Math.round(perUnit * 0.1);
      if (weight === '250g') return Math.round(perUnit * 0.25);
      if (weight === '500g') return Math.round(perUnit * 0.5);
      if (weight === '1kg' || weight === '1 kg') return perUnit;
      if (weight === '2kg' || weight === '2 kg') return perUnit * 2;

      // Custom grams: e.g. "150g", "350g", "125g"
      if (typeof weight === 'string' && weight.endsWith('g') && !weight.endsWith('kg')) {
        const grams = parseFloat(weight.replace('g', '').trim());
        if (!isNaN(grams) && grams > 0) {
          return Math.round((perUnit * grams) / 1000);
        }
      }
      // Custom kgs: e.g. "1.5 kg", "2 kg", "0.75 kg"
      if (typeof weight === 'string' && weight.includes('kg')) {
        const kgs = parseFloat(weight.replace('kg', '').trim());
        if (!isNaN(kgs) && kgs > 0) {
          return Math.round(perUnit * kgs);
        }
      }
    }
    if (perUnit > 0) {
      return perUnit;
    }
    if (sweet.prices) {
      return Number(sweet.prices[weight] || sweet.prices['1 Cup'] || sweet.price);
    }
    return Number(sweet.price) || 20;
  };

  // Add product to bill with chosen cup/pc/weight/volume quantity
  const handleAddSweetToBill = (sweet, weight, addQty = 1, overridePrice = null) => {
    const qty = parseInt(addQty, 10) || 1;
    const isKg = isKgItem(sweet);
    const isLitre = isLitreItem(sweet);
    const itemWeight = weight || (isKg ? '250g' : isLitre ? '500ml' : sweet.unit) || '1 Cup';
    const computedPrice = computeItemPrice(sweet, itemWeight);
    const price = overridePrice !== null && !isNaN(overridePrice) ? Number(overridePrice) : computedPrice;

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
            itemNumber: sweet.itemNumber,
            skuCode: sweet.skuCode || (sweet.itemNumber ? String(sweet.itemNumber) : ''),
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
    const isKg = isKgItem(sweet);
    const isLitre = isLitreItem(sweet);
    const itemWeight = weight || (isKg ? '250g' : isLitre ? '500ml' : sweet.unit) || '1 Cup';
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
    const sweetObj = typeof sweetOrId === 'object' ? sweetOrId : (allProducts || ALL_BILLING_ITEMS).find((s) => s.id === id);
    const isKg = isKgItem(sweetObj);
    const isLitre = isLitreItem(sweetObj);
    const itemWeight = weight || (isKg ? '250g' : isLitre ? '500ml' : sweetObj?.unit) || '1 Cup';

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
            itemNumber: sweetObj?.itemNumber,
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

  // Add a custom/manual item (not in inventory) directly to the bill
  const handleAddManualItem = () => {
    const name = manualItemName.trim();
    const amount = parseFloat(manualItemAmount);
    const qty = Math.max(1, parseInt(manualItemQty, 10) || 1);
    if (!name || isNaN(amount) || amount <= 0) return;
    const id = `manual-${Date.now()}`;
    setBillItems((prev) => [
      ...prev,
      {
        id,
        name,
        weight: '1 Pc',
        price: amount,
        quantity: qty,
        hsn: '2106',
        unit: '1 Pc',
        isManual: true,
      },
    ]);
    setManualItemName('');
    setManualItemAmount('');
    setManualItemQty('1');
    setShowManualItemForm(false);
  };

  // Handle Bidirectional Split Calculations (Cash <-> UPI)
  const handleSplitCashChange = (val) => {
    setLastEditedSplit('cash');
    if (val === '') {
      setSplitCash('');
      setSplitUpi(billGrandTotal > 0 ? String(billGrandTotal) : '');
      return;
    }
    const cleanVal = val.replace(/[^0-9.]/g, '');
    setSplitCash(cleanVal);
    const num = parseFloat(cleanVal);
    if (!isNaN(num)) {
      const remaining = Math.max(0, Math.round((billGrandTotal - num) * 100) / 100);
      setSplitUpi(String(remaining));
    }
  };

  const handleSplitUpiChange = (val) => {
    setLastEditedSplit('upi');
    if (val === '') {
      setSplitUpi('');
      setSplitCash(billGrandTotal > 0 ? String(billGrandTotal) : '');
      return;
    }
    const cleanVal = val.replace(/[^0-9.]/g, '');
    setSplitUpi(cleanVal);
    const num = parseFloat(cleanVal);
    if (!isNaN(num)) {
      const remaining = Math.max(0, Math.round((billGrandTotal - num) * 100) / 100);
      setSplitCash(String(remaining));
    }
  };

  // Sync split remainder when bill total updates
  useEffect(() => {
    if (paymentMode === 'split' && billGrandTotal > 0) {
      if (lastEditedSplit === 'cash' && splitCash !== '') {
        const c = parseFloat(splitCash) || 0;
        const rem = Math.max(0, Math.round((billGrandTotal - c) * 100) / 100);
        setSplitUpi(String(rem));
      } else if (lastEditedSplit === 'upi' && splitUpi !== '') {
        const u = parseFloat(splitUpi) || 0;
        const rem = Math.max(0, Math.round((billGrandTotal - u) * 100) / 100);
        setSplitCash(String(rem));
      }
    }
  }, [billGrandTotal, paymentMode]);

  const splitCashNum = parseFloat(splitCash) || 0;
  const splitUpiNum = parseFloat(splitUpi) || 0;
  const totalSplitPaid = Math.round((splitCashNum + splitUpiNum) * 100) / 100;
  const splitDiff = Math.round((billGrandTotal - totalSplitPaid) * 100) / 100;

  const handleSelectSplitMode = () => {
    setPaymentMode('split');
    if (!splitCash && !splitUpi && billGrandTotal > 0) {
      setLastEditedSplit('cash');
    }
  };

  const handleClearBill = () => {
    setBillItems([]);
    setCustomerInfo({ fullName: '', phone: '' });
    setSplitCash('');
    setSplitUpi('');
    setLastEditedSplit('cash');
  };

  // Staff & Admin Price Override handler
  const handleConfirmPriceOverride = async () => {
    if (!editingPriceItem) return;
    const priceNum = parseFloat(editingPriceItem.newPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    const targetItem = editingPriceItem.item;
    const shouldUpdateMaster = editingPriceItem.updateMasterCatalogPrice !== false;

    // 1. Update active bill line item
    setBillItems((prev) =>
      prev.map((it) => {
        if (it.id === targetItem.id && it.weight === targetItem.weight) {
          const orig = it.originalPrice !== undefined ? it.originalPrice : it.price;
          return {
            ...it,
            price: priceNum,
            originalPrice: orig,
            isPriceOverridden: priceNum !== orig,
            overrideReason: editingPriceItem.reason || 'Staff Price Adjustment',
          };
        }
        return it;
      })
    );

    // 2. If shouldUpdateMaster, compute per-unit or per-kg master rate and save permanently across reloads
    if (shouldUpdateMaster && priceNum > 0) {
      let masterUnitRate = priceNum;
      const w = String(targetItem.weight || targetItem.unit || '').toLowerCase().trim();

      if (w.endsWith('kg')) {
        const kgVal = parseFloat(w.replace('kg', '')) || 1;
        masterUnitRate = Math.round(priceNum / kgVal);
      } else if (w.endsWith('g') && !w.endsWith('kg')) {
        const gVal = parseFloat(w.replace('g', '')) || 250;
        masterUnitRate = Math.round((priceNum / gVal) * 1000);
      } else if (w.endsWith('ml')) {
        const mlVal = parseFloat(w.replace('ml', '')) || 500;
        masterUnitRate = Math.round((priceNum / mlVal) * 1000);
      } else if (w.endsWith('l') || w.includes('litre')) {
        const lVal = parseFloat(w.replace(/[^0-9.]/g, '')) || 1;
        masterUnitRate = Math.round(priceNum / lVal);
      }

      await updateProductMasterPrice(targetItem.id, masterUnitRate, user);
    }

    setEditingPriceItem(null);
  };

  const handleConfirmMasterPriceUpdate = async () => {
    if (!editingMasterPriceItem) return;
    const num = parseFloat(editingMasterPriceItem.price);
    const englishName = String(editingMasterPriceItem.englishName || editingMasterPriceItem.name || '').trim();
    const tamilName = String(editingMasterPriceItem.tamilName || '').trim();

    if (!isNaN(num) && num > 0 && englishName) {
      await updateProductDetails(editingMasterPriceItem.id, {
        name: tamilName ? `${englishName} — ${tamilName}` : englishName,
        englishName,
        tamilName,
        category: editingMasterPriceItem.category || 'sweets',
        unit: editingMasterPriceItem.unit || 'kg',
        price: num,
      }, user);
    }
    setEditingMasterPriceItem(null);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteConfirmItem) return;
    try {
      await deleteProduct(deleteConfirmItem.id, user, 'Product deleted from POS Counter');
      setDeleteConfirmItem(null);
    } catch (err) {
      alert(err?.message || 'Failed to delete product.');
    }
  };

  // Hold active bill
  const handleHoldBill = () => {
    if (billItems.length === 0) return;
    const newHeld = {
      id: Date.now(),
      billItems: [...billItems],
      customerInfo: { ...customerInfo },
      paymentMode,
      splitCash,
      splitUpi,
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
        paymentMode,
        splitCash,
        splitUpi,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        total: billGrandTotal,
      };
      updatedHeld = [currentAsHeld, ...updatedHeld];
    }

    setBillItems(target.billItems);
    setCustomerInfo(target.customerInfo);
    if (target.paymentMode) setPaymentMode(target.paymentMode);
    if (target.splitCash !== undefined) setSplitCash(target.splitCash);
    if (target.splitUpi !== undefined) setSplitUpi(target.splitUpi);
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

    // Split validation
    let finalSplitCash = parseFloat(splitCash) || 0;
    let finalSplitUpi = parseFloat(splitUpi) || 0;

    if (paymentMode === 'split') {
      const c = parseFloat(splitCash);
      const u = parseFloat(splitUpi);
      // If neither entered yet, prompt or default cash to billGrandTotal
      if (isNaN(c) && isNaN(u)) {
        alert(`Please enter the Cash or UPI amount for the split payment of ₹${billGrandTotal}.`);
        return;
      }
      finalSplitCash = isNaN(c) ? 0 : c;
      finalSplitUpi = isNaN(u) ? 0 : u;
      const enteredSum = Math.round((finalSplitCash + finalSplitUpi) * 100) / 100;

      if (enteredSum < billGrandTotal) {
        const remaining = Math.round((billGrandTotal - enteredSum) * 100) / 100;
        alert(`Split payment incomplete!\n\nTotal Bill: ₹${billGrandTotal}\nEntered: ₹${enteredSum} (Cash: ₹${finalSplitCash} + UPI: ₹${finalSplitUpi})\n\nRemaining pending: ₹${remaining}\n\nPlease balance the split amount before settling.`);
        return;
      }
    }

    const year = new Date().getFullYear();
    const isSandbox = isSandboxActive() || user?.role === 'tester' || Boolean(user?.isSandbox);
    
    // Calculate sequential bill number starting from 1 for today's billed bills
    const todayKey = new Date().toDateString();
    const todayBills = (bills || []).filter((b) => {
      const bDate = b.createdAt ? new Date(b.createdAt).toDateString() : (b.orderDate ? new Date(b.orderDate).toDateString() : '');
      return bDate === todayKey && !b.isSandbox;
    });

    let nextSeq = 1;
    const existingNums = todayBills
      .map((b) => {
        const match = String(b.invoiceNumber || '').match(/^POS-(\d+)$/i) || String(b.invoiceNumber || '').match(/^(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0 && n < 1000); // Exclude legacy random 4-digit numbers (>= 1000)

    if (existingNums.length > 0) {
      nextSeq = Math.max(...existingNums) + 1;
    } else {
      nextSeq = 1;
    }

    const invoiceNumber = isSandbox ? `TEST-${year}-${nextSeq}` : `POS-${nextSeq}`;
    const now = new Date();

    const saleData = {
      source: 'pos',
      invoiceNumber,
      isSandbox,
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
        fullName: customerInfo.fullName.trim() || 'Walk-in Customer',
        phone: customerInfo.phone.trim() || 'Store Counter',
        email: 'counter@thenisaisweets.com',
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
        rate: 0,
        cgstRate: 0,
        sgstRate: 0,
        gstin: '',
        isInterState: false,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      },
      deliveryFee: 0,
      grandTotal: billGrandTotal,
      paymentMethod: paymentMode,
      splitCash: paymentMode === 'split' ? finalSplitCash : null,
      splitUpi: paymentMode === 'split' ? finalSplitUpi : null,
      paymentDetails: paymentMode === 'split' ? {
        mode: 'split',
        cash: finalSplitCash,
        upi: finalSplitUpi,
        total: billGrandTotal,
        changeDue: Math.max(0, Math.round((finalSplitCash + finalSplitUpi - billGrandTotal) * 100) / 100),
      } : {
        mode: paymentMode,
        total: billGrandTotal,
      },
      upiUtr: paymentMode === 'split'
        ? `Split: Cash ₹${finalSplitCash} + UPI ₹${finalSplitUpi}`
        : paymentMode === 'upi'
        ? 'Counter POS UPI QR'
        : null,
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
  const allProducts = allBillingProducts && allBillingProducts.length > 0 ? allBillingProducts : ALL_BILLING_ITEMS;

  const rawFiltered = allProducts.filter((sw, idx) => {
    const itemNum = sw.itemNumber || idx + 1;
    const qRaw = searchQuery.trim();
    const q = qRaw.toLowerCase();

    if (!q) {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'beverages') {
        return (itemNum >= 1 && itemNum <= 13) || sw.category === 'beverages' || sw.category === 'snacks';
      }
      if (selectedCategory === 'sweets') {
        return (itemNum >= 14 && itemNum <= 75) || sw.category === 'sweets';
      }
      if (selectedCategory === 'spices') {
        return (itemNum >= 76 && itemNum <= 125) || sw.category === 'spices' || sw.subcategory === 'Spices (Kara Vagai)';
      }
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
        return sw.subcategory === 'Milk & Bengali' || sw.name.toLowerCase().includes('milk') || sw.name.toLowerCase().includes('palkova') || sw.name.toLowerCase().includes('palcova') || sw.name.toLowerCase().includes('khoa') || sw.name.toLowerCase().includes('peda') || sw.name.toLowerCase().includes('bengali') || sw.name.toLowerCase().includes('ras');
      }
      if (selectedCategory === 'traditional') {
        return sw.subcategory === 'Traditional Sweets' || sw.name.toLowerCase().includes('laddu') || sw.name.toLowerCase().includes('jangiri') || sw.name.toLowerCase().includes('poli') || sw.name.toLowerCase().includes('athirasam');
      }
      if (selectedCategory === 'pieces-packets') {
        return sw.unit === 'Pc' || sw.unit === 'Pkt';
      }
      return true;
    }

    // Number/SKU-based search (e.g. "1", "42", "#3", or a custom SKU code)
    const cleanNumStr = qRaw.replace(/^#/, '').replace(/\.$/, '').trim();
    // First check exact SKU code match (highest priority for fast lookup by code)
    if (sw.skuCode && sw.skuCode.toLowerCase() === cleanNumStr.toLowerCase()) return true;
    const isPureNumber = /^\d+$/.test(cleanNumStr);
    if (isPureNumber) {
      const searchNum = parseInt(cleanNumStr, 10);
      if (itemNum === searchNum) return true;
      if (String(itemNum).startsWith(cleanNumStr)) return true;
      if (sw.price === searchNum) return true;
    }

    // Text search (English, Tamil, ID, SKU Code, Tagline)
    const matchesText =
      sw.name.toLowerCase().includes(q) ||
      (sw.tamilName && sw.tamilName.includes(qRaw)) ||
      (sw.englishName && sw.englishName.toLowerCase().includes(q)) ||
      (sw.tagline && sw.tagline.toLowerCase().includes(q)) ||
      sw.id.toLowerCase().includes(q) ||
      (sw.skuCode && sw.skuCode.toLowerCase().includes(q));

    return matchesText;
  });

  // Always keep strictly orderwise (sorted by itemNumber 1..13)
  // If user searches a number/SKU, exact SKU match is prioritized at top
  const filteredSweets = [...rawFiltered].sort((a, b) => {
    const getNum = (p) => {
      const sku = String(p?.skuCode ?? '').trim();
      const itemNum = String(p?.itemNumber ?? '').trim();
      const skuMatch = sku.match(/\d+/)?.[0];
      if (skuMatch) return parseInt(skuMatch, 10);
      const itemMatch = itemNum.match(/\d+/)?.[0];
      if (itemMatch) return parseInt(itemMatch, 10);
      return 999999;
    };
    const numA = getNum(a);
    const numB = getNum(b);

    const cleanNum = searchQuery.trim().replace(/^#/, '').replace(/\.$/, '');
    const cleanNumLower = cleanNum.toLowerCase();
    // Exact SKU match always sorts to top
    if (cleanNum && (a.skuCode || '').toLowerCase() === cleanNumLower && (b.skuCode || '').toLowerCase() !== cleanNumLower) return -1;
    if (cleanNum && (b.skuCode || '').toLowerCase() === cleanNumLower && (a.skuCode || '').toLowerCase() !== cleanNumLower) return 1;
    if (/^\d+$/.test(cleanNum)) {
      const targetNum = parseInt(cleanNum, 10);
      if (numA === targetNum) return -1;
      if (numB === targetNum) return 1;
    }
    if (numA !== numB) return numA - numB;
    return String(a.englishName || a.name || '').localeCompare(String(b.englishName || b.name || ''));
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
          (user?.role === 'admin' && !window.location.hash.toLowerCase().startsWith('#billing'))
            ? 'admin-billing'
            : (posTab === 'register'
                ? 'pos-register'
                : posTab === 'my-bills' || posTab === 'daily-sales'
                ? 'pos-daily-sales'
                : posTab === 'online-orders'
                ? 'pos-online'
                : 'pos-inventory')
        }
        onSelectSection={(sec) => {
          if (sec === 'admin-billing' || sec === 'pos-register') {
            if (user?.role === 'admin' && window.location.hash.toLowerCase().startsWith('#admin')) {
              syncBillingHash('#admin/billing');
              handleSwitchTab('register');
            } else {
              handleSwitchTab('register');
            }
          }
          else if (sec === 'admin-shift-bills' || sec === 'admin-daily-revenue') {
            navigateTo('admin', 'shift-bills');
          }
          else if (sec === 'admin-dispatch' || sec === 'admin-orders') {
            navigateTo('admin', 'dispatch');
          }
          else if (sec === 'admin-inventory') {
            navigateTo('admin', 'inventory');
          }
          else if (sec === 'admin-sales') {
            navigateTo('admin', 'sales');
          }
          else if (sec === 'admin-activity-logs' || sec === 'admin-price-logs') {
            navigateTo('admin', 'activity-logs');
          }
          else if (sec === 'admin-recycle-bin') {
            navigateTo('admin', 'recycle-bin');
          }
          else if (sec === 'pos-bills' || sec === 'pos-daily-sales') {
            handleSwitchTab('my-bills');
          }
          else if (sec === 'pos-online') {
            handleSwitchTab('online-orders');
          }
          else if (sec === 'pos-inventory') {
            handleSwitchTab('inventory');
          }
          else if (sec === 'storefront') {
            navigateTo('storefront');
          }
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
      <div
        className={`pos-content-area ${posTab !== 'register' ? 'is-full-page-tab' : ''}`}
        data-lenis-prevent="true"
      >
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
            <img src="/images/branding/logo-icon.png" alt="Thenisai" className="mobile-strip-logo" />
            <div className="mobile-strip-brand-text">
              <strong>THENISAI POS</strong>
              <span>
                {posTab === 'register'
                  ? (user?.counter || 'Terminal 01')
                  : posTab === 'daily-sales' || posTab === 'my-bills'
                  ? 'Shift Ledger'
                  : 'Products & Inventory'}
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
            <section className="pos-catalog-pane" data-lenis-prevent ref={catalogPaneRef}>
              {/* Sticky Top Header: Search Bar & Category Filter Pills */}
              <div className="pos-catalog-sticky-header">
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
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
                                {h.customerInfo?.fullName && h.customerInfo.fullName !== 'Walk-in Guest' && h.customerInfo.fullName !== 'Walk-in Customer' && (
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Bills (10) Popover Trigger — Quick Edit & Mistake Correction */}
                  <div className="recent-bills-trigger-wrap" style={{ position: 'relative', display: 'inline-block', marginLeft: 8 }}>
                    <button
                      type="button"
                      className={`btn-held-trigger toolbar recent ${showRecentBillsDropdown ? 'active' : ''}`}
                      onClick={() => setShowRecentBillsDropdown((v) => !v)}
                      title="View & Edit Latest 10 Bills (சமீபத்திய 10 ரசீதுகள்)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Recent ({recentBills.length})</span>
                      {recentBills.length > 0 && (
                        <span className="badge-count" style={{ background: '#059669', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '9999px', fontWeight: 800 }}>
                          {recentBills.length}
                        </span>
                      )}
                    </button>

                    {/* Popover showing latest 10 bills with Edit, Delete, Print */}
                    {showRecentBillsDropdown && (
                      <div className="recent-bills-popover" data-lenis-prevent="true">
                        <div className="recent-bills-popover-header">
                          <div className="popover-title-row">
                            <span className="popover-badge">RECENT 10 BILLS</span>
                            <span className="popover-count">{recentBills.length} records</span>
                          </div>
                          <p className="popover-sub">
                            Quick-fix billing errors · Edit quantities, items, payment or delete
                          </p>
                          <button
                            type="button"
                            className="btn-popover-close"
                            onClick={() => setShowRecentBillsDropdown(false)}
                            title="Close Popover"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        <div className="recent-bills-list">
                          {recentBills.length === 0 ? (
                            <div className="recent-bills-empty">
                              <p>No bills found for current shift.</p>
                            </div>
                          ) : (
                            recentBills.map((b) => {
                              const pm = (b.paymentMethod || 'cash').toLowerCase();
                              return (
                                <div key={b.id || b.invoiceNumber} className="recent-bill-row">
                                  <div className="rb-left">
                                    <div className="rb-top">
                                      <strong className="rb-inv">#{b.invoiceNumber || b.id}</strong>
                                      <span className={`rb-pm-pill ${pm}`}>{b.paymentMethod || 'Cash'}</span>
                                      {b.isEdited && <span className="rb-edited-tag">Edited</span>}
                                    </div>
                                    <div className="rb-meta">
                                      <span className="rb-cust">{b.customer?.fullName || 'Walk-in'}</span>
                                      <span className="rb-sep">·</span>
                                      <span className="rb-time">{b.orderTime || (b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                                      <span className="rb-sep">·</span>
                                      <span className="rb-items">{b.items?.length || 0} items</span>
                                    </div>
                                  </div>

                                  <div className="rb-right">
                                    <div className="rb-total">₹{(b.grandTotal || 0).toLocaleString('en-IN')}</div>
                                    <div className="rb-actions">
                                      <button
                                        type="button"
                                        className="rb-btn-edit"
                                        onClick={() => {
                                          setShowRecentBillsDropdown(false);
                                          setEditBillModalItem(b);
                                        }}
                                        title="Edit this Bill"
                                      >
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="rb-btn-print"
                                        onClick={() => {
                                          setShowRecentBillsDropdown(false);
                                          openInvoice(b);
                                        }}
                                        title="Print Invoice"
                                      >
                                        Print
                                      </button>
                                      <button
                                        type="button"
                                        className="rb-btn-del"
                                        onClick={() => {
                                          setShowRecentBillsDropdown(false);
                                          setDeleteBillModalItem(b);
                                        }}
                                        title="Delete Bill to 30-Day Recycle Bin"
                                      >
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
            </div>

              {/* LIST VIEW (Fast Clean Table - Names, Type Weight/Volume & Stepper) */}
              <div className="pos-sweets-list">
                  {filteredSweets.map((sweet, idx) => {
                    const isKg = isKgItem(sweet);
                    const isLitre = isLitreItem(sweet);
                    const isMeasurable = isKg || isLitre;
                    const defaultUnit = isKg
                      ? '250g'
                      : isLitre
                      ? '500ml'
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
                      ? (inlineMode === 'rs'
                          ? Math.round(parseFloat(inlineVal || '0'))
                          : (isLitre
                              ? (inlineUnit === 'L' || inlineUnit === 'Litre'
                                  ? Math.round((Number(sweet.price) || 0) * parseFloat(inlineVal || '0'))
                                  : Math.round(((Number(sweet.price) || 0) * parseFloat(inlineVal || '0')) / 1000))
                              : (inlineUnit === 'kg'
                                  ? Math.round((Number(sweet.price) || 0) * parseFloat(inlineVal || '0'))
                                  : Math.round(((Number(sweet.price) || 0) * parseFloat(inlineVal || '0')) / 1000))))
                      : 0;
                    const rsPreview = isInlineOpen && inlineMode === 'rs' ? getRupeePreview(sweet, inlineVal) : '';

                    const isUnavailable = productAvailabilityMap[sweet.id] !== undefined
                      ? Boolean(productAvailabilityMap[sweet.id])
                      : Boolean(sweet.isInactive || inventory?.find((i) => i.id === sweet.id)?.isInactive);

                    if (isUnavailable) {
                      return (
                        <div
                          key={sweet.id}
                          id={`pos-row-${sweet.id}`}
                          className="pos-list-row is-out-of-stock"
                          title={`${sweet.name} — Currently Out of Stock`}
                        >
                          <div className="pos-list-info">
                            <div className="pos-list-title-wrap">
                              <span className="pos-item-num-badge" title="SKU Code">{sweet.skuCode || itemNum}</span>
                              <h4 className="pos-list-title" style={{ textDecoration: 'line-through', opacity: 0.65 }}>
                                {sweet.name}
                              </h4>
                              <span className="pos-out-of-stock-pill">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Out of Stock / இருப்பு இல்லை
                              </span>
                            </div>
                            <span className="pos-list-rate" style={{ opacity: 0.6 }}>₹{sweet.price}</span>
                          </div>

                          <div className="pos-list-stock-action" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn-reactivate-stock"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductAvailability(sweet.id, false, user);
                              }}
                              title="Fresh stock arrived? Click to reactivate item"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Reactivate / இருப்பு வந்தது
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={sweet.id}
                        id={`pos-row-${sweet.id}`}
                        className={`pos-list-row ${isItemInBill ? 'in-bill' : ''} ${isInlineOpen ? 'weight-open' : ''}`}
                        onClick={() => {
                          if (isMeasurable) {
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
                            <span className="pos-item-num-badge" title="SKU Code">{sweet.skuCode || itemNum}</span>
                            <h4 className="pos-list-title">{sweet.name}</h4>
                            <button
                              type="button"
                              className="btn-pos-quick-off"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductAvailability(sweet.id, true, user);
                              }}
                              title="Mark this item Out of Stock / இருப்பு இல்லை"
                            >
                              Off
                            </button>
                          </div>
                          <span className="pos-list-rate">
                            ₹{sweet.price}
                            {((sweet.unit || '').toLowerCase().includes('cup') || (sweet.category || '').toLowerCase() === 'beverages' || (sweet.id || '').includes('tea') || (sweet.id || '').includes('coffee') || (sweet.id || '').includes('milk') || (sweet.id || '').includes('boost') || (sweet.id || '').includes('horlicks')) ? (
                              <small className="pos-price-unit"> / cup</small>
                            ) : ((sweet.unit || '').toLowerCase().includes('pc') || (sweet.category || '').toLowerCase() === 'snacks' || sweet.id === 'vada') ? (
                              <small className="pos-price-unit"> / pc</small>
                            ) : ((sweet.unit || '').toLowerCase() === 'kg' && (sweet.category || '').toLowerCase() !== 'beverages' && (sweet.category || '').toLowerCase() !== 'snacks') ? (
                              <small className="pos-price-unit"> / kg</small>
                            ) : ((sweet.unit || '').toLowerCase() === 'pkt') ? (
                              <small className="pos-price-unit"> / pkt</small>
                            ) : ((sweet.unit || '').toLowerCase() === 'litre') ? (
                              <small className="pos-price-unit"> / Litre</small>
                            ) : (
                              <small className="pos-price-unit"> / {sweet.unit || 'cup'}</small>
                            )}
                          </span>
                        </div>

                        {isMeasurable ? (
                          <div className="pos-list-kg-action" onClick={(e) => e.stopPropagation()}>
                            {/* Add button — shows summary if already in bill */}
                            <button
                              type="button"
                              className={`btn-type-weight ${isItemInBill ? 'active' : ''} ${isInlineOpen ? 'popover-open' : ''}`}
                              onClick={(e) => { e.stopPropagation(); openInlineWeight(sweet); }}
                              title={`Add ${sweet.name} (${isLitre ? 'ml / L' : 'g / kg'}) to bill`}
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

                            {/* ── Inline weight / volume popover ── */}
                            {isInlineOpen && (
                              <div className="inline-weight-popover" onClick={(e) => e.stopPropagation()}>
                                <div className="iwp-step-entry">
                                  {/* Mode switcher tabs (enlarged & touch-friendly) */}
                                  <div className="iwp-entry-header">
                                    <div className="iwp-mode-tabs">
                                      <span className="iwp-mode-tabs-label">MODE:</span>
                                      {isLitre ? (
                                        <>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn ${inlineMode === 'ml' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('ml')}
                                          >
                                            ml
                                          </button>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn ${inlineMode === 'L' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('L')}
                                          >
                                            L
                                          </button>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn mode-rs-tab ${inlineMode === 'rs' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('rs')}
                                          >
                                            ₹ rs
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn ${inlineMode === 'g' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('g')}
                                          >
                                            g
                                          </button>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn ${inlineMode === 'kg' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('kg')}
                                          >
                                            kg
                                          </button>
                                          <button
                                            type="button"
                                            className={`iwp-tab-btn mode-rs-tab ${inlineMode === 'rs' ? 'active' : ''}`}
                                            onClick={() => handleSelectUnitMode('rs')}
                                          >
                                            ₹ rs
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Presets for fast 1-tap selection (when not in direct kg mode) */}
                                  {inlineMode !== 'kg' && (
                                    <div className="iwp-presets">
                                      {inlineMode === 'g' && (
                                        <>
                                          {['100', '250', '500', '750'].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              className={`iwp-preset-pill ${inlineVal === val ? 'active' : ''}`}
                                              onClick={() => setInlineVal(val)}
                                            >
                                              {val}g
                                            </button>
                                          ))}
                                        </>
                                      )}

                                      {inlineMode === 'ml' && (
                                        <>
                                          {['100', '250', '500', '750'].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              className={`iwp-preset-pill ${inlineVal === val ? 'active' : ''}`}
                                              onClick={() => setInlineVal(val)}
                                            >
                                              {val}ml
                                            </button>
                                          ))}
                                        </>
                                      )}
                                      {inlineMode === 'L' && (
                                        <>
                                          {['1', '2', '5'].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              className={`iwp-preset-pill ${inlineVal === val ? 'active' : ''}`}
                                              onClick={() => setInlineVal(val)}
                                            >
                                              {val}L
                                            </button>
                                          ))}
                                        </>
                                      )}
                                      {inlineMode === 'rs' && (
                                        <>
                                          {['50', '100', '150', '200', '500'].map((val) => (
                                            <button
                                              key={val}
                                              type="button"
                                              className={`iwp-preset-pill rs-pill ${inlineVal === val ? 'active' : ''}`}
                                              onClick={() => setInlineVal(val)}
                                            >
                                              ₹{val}
                                            </button>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Custom Input & Controls */}
                                  <div className="iwp-controls-row">
                                    <div className="iwp-input-wrapper">
                                      <span className="iwp-input-affix">
                                        {inlineMode === 'rs' ? '₹' : inlineMode === 'kg' ? 'kg' : inlineMode === 'L' ? 'L' : inlineMode === 'ml' ? 'ml' : 'g'}
                                      </span>
                                      <input
                                        ref={inlineInputRef}
                                        type="number"
                                        min={inlineMode === 'kg' || inlineMode === 'L' ? '0.1' : '1'}
                                        step={inlineMode === 'kg' || inlineMode === 'L' ? '0.1' : '1'}
                                        className="iwp-input"
                                        value={inlineVal}
                                        placeholder={inlineMode === 'rs' ? 'Amount (₹)' : inlineMode === 'kg' ? '1' : inlineMode === 'L' ? '1' : '250'}
                                        onChange={(e) => setInlineVal(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') confirmInlineWeight(sweet);
                                          if (e.key === 'Escape') closeInlineWeight();
                                        }}
                                      />
                                    </div>

                                    {inlineMode === 'rs' ? (
                                      rsPreview ? (
                                        <span className="iwp-rs-preview" title="Calculated quantity for entered amount">
                                          {rsPreview}
                                        </span>
                                      ) : null
                                    ) : (
                                      inlineVal && parseFloat(inlineVal) > 0 && (
                                        <span className="iwp-price">₹{inlinePrice}</span>
                                      )
                                    )}

                                    <button
                                      type="button"
                                      className="iwp-confirm-btn"
                                      disabled={!inlineVal || parseFloat(inlineVal) <= 0}
                                      onClick={() => confirmInlineWeight(sweet)}
                                    >
                                      Add to Bill
                                    </button>
                                  </div>
                                </div>
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
                  placeholder="Walk-in Customer"
                  value={customerInfo.fullName}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="cust-input name"
                />
              </div>

              {/* Active Bill Items List (Inline Scrollable with data-lenis-prevent) */}
              <div className="pos-bill-items" data-lenis-prevent ref={billItemsRef}>
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
                                  const sweetObj = (allProducts || ALL_BILLING_ITEMS).find((s) => s.id === item.id);
                                  if (sweetObj && (isMeasurableItem(sweetObj) || item.weight?.includes('g') || item.weight?.includes('kg') || item.weight?.includes('ml') || item.weight?.includes('L') || item.weight?.includes('l'))) {
                                    handleOpenWeightModal(sweetObj, item.weight);
                                  }
                                }}
                                title="Click to change or retype weight / volume"
                              >
                                {item.weight || item.unit || '1 Cup'}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px', opacity: 0.6 }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </span>
                              <span
                                className="line-rate-info clickable-rate"
                                onClick={() => setEditingPriceItem({ item, newPrice: String(item.price), reason: item.overrideReason || '' })}
                                title="Click to edit/override price (விலை மாற்றவும்)"
                              >
                                ₹{item.price} × {item.quantity}
                                {item.isPriceOverridden && (
                                  <span className="price-overridden-badge" title={`Original: ₹${item.originalPrice} (${item.overrideReason || 'Staff override'})`}>
                                    *CUSTOM
                                  </span>
                                )}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px', opacity: 0.7 }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </span>
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

                          <span
                            className="pos-line-price clickable-rate"
                            onClick={() => setEditingPriceItem({ item, newPrice: String(item.price), reason: item.overrideReason || '' })}
                            title="Click to override rate (விலை மாற்றவும்)"
                          >
                            ₹{item.price * item.quantity}
                          </span>

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

              {/* Custom / Manual Item Entry */}
              <div className="pos-manual-item-wrap">
                {showManualItemForm ? (
                  <div className="pos-manual-item-form">
                    <div className="manual-form-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Custom Item
                    </div>
                    <input
                      ref={manualItemNameRef}
                      type="text"
                      className="manual-input manual-name"
                      placeholder="Item name (e.g. Packing Charge, Special Sweet…)"
                      value={manualItemName}
                      onChange={(e) => setManualItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddManualItem();
                        if (e.key === 'Escape') setShowManualItemForm(false);
                      }}
                      autoFocus
                    />
                    <div className="manual-row-inline">
                      <div className="manual-input-group">
                        <span className="manual-input-prefix">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className="manual-input manual-amount"
                          placeholder="Amount"
                          value={manualItemAmount}
                          onChange={(e) => setManualItemAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddManualItem();
                            if (e.key === 'Escape') setShowManualItemForm(false);
                          }}
                        />
                      </div>
                      <div className="manual-input-group">
                        <span className="manual-input-prefix">Qty</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="manual-input manual-qty"
                          placeholder="1"
                          value={manualItemQty}
                          onChange={(e) => setManualItemQty(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddManualItem();
                            if (e.key === 'Escape') setShowManualItemForm(false);
                          }}
                        />
                      </div>
                    </div>
                    <div className="manual-form-actions">
                      <button
                        type="button"
                        className="manual-cancel-btn"
                        onClick={() => { setShowManualItemForm(false); setManualItemName(''); setManualItemAmount(''); setManualItemQty('1'); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="manual-add-btn"
                        disabled={!manualItemName.trim() || !manualItemAmount || parseFloat(manualItemAmount) <= 0}
                        onClick={handleAddManualItem}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add to Bill
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-add-manual-item"
                    onClick={() => { setShowManualItemForm(true); setTimeout(() => manualItemNameRef.current?.focus(), 60); }}
                    title="Add a custom product not in inventory"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Custom Item
                  </button>
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
                  <button
                    type="button"
                    className={`pay-mode-btn split-pay-btn ${paymentMode === 'split' ? 'active' : ''}`}
                    onClick={handleSelectSplitMode}
                    title="Split payment between Cash and UPI"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="20" y1="4" x2="8.12" y2="15.88" />
                      <line x1="14.47" y1="14.48" x2="20" y2="20" />
                      <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                    Split Pay
                  </button>
                </div>

                {/* Split Payment Interactive Configuration Box */}
                {paymentMode === 'split' && (
                  <div className="pos-split-box">
                    <div className="pos-split-box__header">
                      <div className="split-header-left">
                        <span className="split-icon-badge">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="3" />
                            <circle cx="6" cy="18" r="3" />
                            <line x1="20" y1="4" x2="8.12" y2="15.88" />
                            <line x1="14.47" y1="14.48" x2="20" y2="20" />
                            <line x1="8.12" y1="8.12" x2="12" y2="12" />
                          </svg>
                        </span>
                        <div>
                          <strong className="split-box-title">Split Payment (Cash + UPI)</strong>
                          <span className="split-box-sub">Enter Cash or UPI — other fills remaining</span>
                        </div>
                      </div>
                      <div className="split-presets">
                        <button
                          type="button"
                          className="btn-split-preset"
                          onClick={() => {
                            const half = Math.round((billGrandTotal / 2) * 100) / 100;
                            const other = Math.round((billGrandTotal - half) * 100) / 100;
                            setSplitCash(String(half));
                            setSplitUpi(String(other));
                            setLastEditedSplit('cash');
                          }}
                          title="50% in Cash and 50% in UPI"
                        >
                          50 / 50
                        </button>
                        <button
                          type="button"
                          className="btn-split-preset"
                          onClick={() => {
                            setSplitCash(String(billGrandTotal));
                            setSplitUpi('0');
                            setLastEditedSplit('cash');
                          }}
                          title="Full bill in Cash"
                        >
                          All Cash
                        </button>
                        <button
                          type="button"
                          className="btn-split-preset"
                          onClick={() => {
                            setSplitCash('0');
                            setSplitUpi(String(billGrandTotal));
                            setLastEditedSplit('upi');
                          }}
                          title="Full bill in UPI"
                        >
                          All UPI
                        </button>
                      </div>
                    </div>

                    <div className="pos-split-inputs-grid">
                      {/* Cash Input */}
                      <div className={`split-input-card cash-card ${lastEditedSplit === 'cash' ? 'is-active-input' : ''}`}>
                        <div className="split-card-top">
                          <label htmlFor="split-cash-input" className="split-card-label">
                            <span className="split-card-icon cash">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <circle cx="12" cy="12" r="2" />
                                <path d="M6 12h.01M18 12h.01" />
                              </svg>
                            </span>
                            Cash Amount
                          </label>
                          {lastEditedSplit === 'upi' && splitCash !== '' && (
                            <span className="split-rem-tag">Remaining</span>
                          )}
                        </div>
                        <div className="split-input-wrapper">
                          <span className="split-currency-symbol">₹</span>
                          <input
                            id="split-cash-input"
                            type="text"
                            inputMode="decimal"
                            className="split-num-input"
                            placeholder={billGrandTotal > 0 ? (lastEditedSplit === 'upi' ? splitCash || '0' : '0') : '0'}
                            value={splitCash}
                            onChange={(e) => handleSplitCashChange(e.target.value)}
                            onFocus={() => setLastEditedSplit('cash')}
                          />
                          {splitCash !== '' && (
                            <button
                              type="button"
                              className="split-input-clear"
                              onClick={() => handleSplitCashChange('')}
                              title="Clear Cash"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="split-field-hint">
                          {lastEditedSplit === 'cash' ? (
                            <span>Entered in Cash</span>
                          ) : (
                            <span className="rem-hint">Auto remaining: ₹{splitCash || 0}</span>
                          )}
                        </div>
                      </div>

                      {/* UPI Input */}
                      <div className={`split-input-card upi-card ${lastEditedSplit === 'upi' ? 'is-active-input' : ''}`}>
                        <div className="split-card-top">
                          <label htmlFor="split-upi-input" className="split-card-label">
                            <span className="split-card-icon upi">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                              </svg>
                            </span>
                            UPI / QR Amount
                          </label>
                          {lastEditedSplit === 'cash' && splitUpi !== '' && (
                            <span className="split-rem-tag">Remaining</span>
                          )}
                        </div>
                        <div className="split-input-wrapper">
                          <span className="split-currency-symbol">₹</span>
                          <input
                            id="split-upi-input"
                            type="text"
                            inputMode="decimal"
                            className="split-num-input"
                            placeholder={billGrandTotal > 0 ? (lastEditedSplit === 'cash' ? splitUpi || '0' : '0') : '0'}
                            value={splitUpi}
                            onChange={(e) => handleSplitUpiChange(e.target.value)}
                            onFocus={() => setLastEditedSplit('upi')}
                          />
                          {splitUpi !== '' && (
                            <button
                              type="button"
                              className="split-input-clear"
                              onClick={() => handleSplitUpiChange('')}
                              title="Clear UPI"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="split-field-hint">
                          {lastEditedSplit === 'upi' ? (
                            <span>Entered in UPI</span>
                          ) : (
                            <span className="rem-hint">Auto remaining: ₹{splitUpi || 0}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Validation & Status Banner */}
                    <div className={`pos-split-status-banner ${splitDiff === 0 && billGrandTotal > 0 && (splitCash !== '' || splitUpi !== '') ? 'status-ok' : splitDiff > 0 ? 'status-pending' : 'status-excess'}`}>
                      {splitDiff === 0 && billGrandTotal > 0 && (splitCash !== '' || splitUpi !== '') ? (
                        <div className="split-status-content">
                          <span className="split-status-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          <span className="split-status-text">
                            <strong>Exact Split:</strong> Cash ₹{splitCash || 0} + UPI ₹{splitUpi || 0} = <strong>₹{billGrandTotal}</strong>
                          </span>
                        </div>
                      ) : splitDiff > 0 ? (
                        <div className="split-status-content">
                          <span className="split-status-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </span>
                          <span className="split-status-text">
                            <strong>₹{splitDiff} Remaining:</strong> Collect ₹{splitDiff} more to settle ₹{billGrandTotal} bill
                          </span>
                        </div>
                      ) : (
                        <div className="split-status-content">
                          <span className="split-status-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </span>
                          <span className="split-status-text">
                            <strong>Change to return: ₹{Math.abs(splitDiff)}</strong> (Received ₹{totalSplitPaid} for ₹{billGrandTotal} bill)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                        {billItems.length === 0
                          ? 'Settle & Print (Enter / F9)'
                          : paymentMode === 'split' && splitDiff === 0 && (splitCash !== '' || splitUpi !== '')
                          ? `₹${billGrandTotal} · Split (Cash ₹${splitCash || 0} + UPI ₹${splitUpi || 0})`
                          : `₹${billGrandTotal} · Settle & Print Bill`}
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
        {(posTab === 'my-bills' || posTab === 'daily-sales') && (
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
                  { id: 'split', label: 'Split (Cash+UPI)' },
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '0 0 14px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412' }}>
                {selectedShiftBills.length ? `${selectedShiftBills.length} bill${selectedShiftBills.length === 1 ? '' : 's'} selected` : 'Select bills to delete them together'}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="btn-shift-refresh" onClick={toggleAllFilteredShiftBills} disabled={!filteredShiftBills.length}>
                  {allFilteredShiftBillsSelected ? 'Clear Selection' : 'Select Filtered'}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkDeleteBills(selectedShiftBills)}
                  disabled={!selectedShiftBills.length}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1.5px solid #dc2626',
                    background: 'transparent',
                    color: '#dc2626',
                    cursor: selectedShiftBills.length ? 'pointer' : 'not-allowed',
                    opacity: selectedShiftBills.length ? 1 : 0.5,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  Delete Selected ({selectedShiftBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBulkDeleteBills(myShiftBills)}
                  disabled={!myShiftBills.length}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1.5px solid #991b1b',
                    background: '#991b1b',
                    color: '#fff',
                    cursor: myShiftBills.length ? 'pointer' : 'not-allowed',
                    opacity: myShiftBills.length ? 1 : 0.5,
                    transition: 'background 0.15s',
                  }}
                >
                  Delete All Today ({myShiftBills.length})
                </button>
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
                        <th>
                          <input
                            type="checkbox"
                            checked={allFilteredShiftBillsSelected}
                            onChange={toggleAllFilteredShiftBills}
                            aria-label="Select all visible bills"
                          />
                        </th>
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
                            <input
                              type="checkbox"
                              checked={selectedShiftBillIds.includes(bill.id || bill.invoiceNumber)}
                              onChange={() => toggleShiftBillSelection(bill)}
                              aria-label={`Select invoice ${bill.invoiceNumber || bill.id}`}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span className="shift-inv-badge">{bill.invoiceNumber || bill.id}</span>
                              {bill.isEdited && (
                                <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                                  Edited
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="shift-time">{bill.orderTime || 'Just now'}</span>
                          </td>
                          <td>
                            <strong>{bill.customer?.fullName || 'Walk-in Customer'}</strong>
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
                              {bill.paymentMethod === 'split' ? (
                                <span title={`Cash: ₹${bill.paymentDetails?.cash ?? bill.splitCash ?? 0} | UPI: ₹${bill.paymentDetails?.upi ?? bill.splitUpi ?? 0}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="6" cy="6" r="3" />
                                    <circle cx="6" cy="18" r="3" />
                                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                                  </svg>
                                  Split (₹{bill.paymentDetails?.cash ?? bill.splitCash ?? 0}+₹{bill.paymentDetails?.upi ?? bill.splitUpi ?? 0})
                                </span>
                              ) : bill.paymentMethod === 'upi' ? (
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
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn-shift-print-inv"
                                onClick={() => openInvoice(bill)}
                                title="View &amp; Print Thermal Bill"
                              >
                                Print Bill
                              </button>
                              <button
                                type="button"
                                className="btn-shift-edit-inv"
                                onClick={() => setEditBillModalItem(bill)}
                                title="Edit Bill Items, Quantities &amp; Details"
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-shift-del-inv"
                                onClick={() => setDeleteBillModalItem(bill)}
                                title="Delete invoice (moved to 30-day Admin Recycle Bin with mandatory reason)"
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
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
            <div className="inventory-page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#d4a843', letterSpacing: '0.08em' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  CATALOG &amp; STOCK MASTER
                </span>
                <h2 className="inventory-title" style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Products &amp; Inventory Management
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Master control for adjusting selling prices, masking out-of-stock items, and managing products.
                </p>
              </div>

              <div className="inventory-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-inventory-add-product"
                  onClick={() => setIsAddNewProductOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isAddNewProductOpen ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isAddNewProductOpen ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isAddNewProductOpen ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Close Add Form</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add New Product</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Return to POS</span>
                </button>
              </div>
            </div>

            {/* In-Screen Collapsible Add New Product Master Panel */}
            <AddProductInlinePanel
              isOpen={isAddNewProductOpen}
              onClose={() => setIsAddNewProductOpen(false)}
              onAddProduct={(p) => addNewProduct(p, user)}
            />

            {/* Category Division Chips (Previous Inventory Layout) */}
            <div className="inventory-category-division-chips" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                Categories:
              </span>
              <button
                type="button"
                className={`inv-div-chip ${invCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setInvCategoryFilter('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: invCategoryFilter === 'all' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: invCategoryFilter === 'all' ? '#fef3c7' : '#fff',
                  color: invCategoryFilter === 'all' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>All Products</span>
                <span style={{ fontSize: '11px', background: invCategoryFilter === 'all' ? '#f59e0b' : '#e2e8f0', color: invCategoryFilter === 'all' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${invCategoryFilter === 'beverages' ? 'active' : ''}`}
                onClick={() => setInvCategoryFilter('beverages')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: invCategoryFilter === 'beverages' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: invCategoryFilter === 'beverages' ? '#fef3c7' : '#fff',
                  color: invCategoryFilter === 'beverages' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
                <span>Beverages &amp; Hot Drinks (Cups / Pcs)</span>
                <span style={{ fontSize: '11px', background: invCategoryFilter === 'beverages' ? '#f59e0b' : '#e2e8f0', color: invCategoryFilter === 'beverages' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'beverages' || (p.category || '').toLowerCase() === 'snacks' || (p.unit && p.unit.toLowerCase().includes('cup')) || p.id === 'vada' || (p.id && p.id.includes('tea')) || (p.id && p.id.includes('coffee'))).length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${invCategoryFilter === 'sweets' ? 'active' : ''}`}
                onClick={() => setInvCategoryFilter('sweets')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: invCategoryFilter === 'sweets' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: invCategoryFilter === 'sweets' ? '#fef3c7' : '#fff',
                  color: invCategoryFilter === 'sweets' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M12 8V4" />
                  <path d="M8 4h8" />
                </svg>
                <span>Traditional Sweets (Weight in kg)</span>
                <span style={{ fontSize: '11px', background: invCategoryFilter === 'sweets' ? '#f59e0b' : '#e2e8f0', color: invCategoryFilter === 'sweets' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'sweets' || (!p.category && !p.id?.includes('tea') && !p.id?.includes('coffee'))).length}
                </span>
              </button>
              <button
                type="button"
                className={`inv-div-chip ${invCategoryFilter === 'spices' ? 'active' : ''}`}
                onClick={() => setInvCategoryFilter('spices')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: invCategoryFilter === 'spices' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  background: invCategoryFilter === 'spices' ? '#fef3c7' : '#fff',
                  color: invCategoryFilter === 'spices' ? '#92400e' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span>Spices &amp; Kara Vagai</span>
                <span style={{ fontSize: '11px', background: invCategoryFilter === 'spices' ? '#f59e0b' : '#e2e8f0', color: invCategoryFilter === 'spices' ? '#fff' : '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBillingProducts.filter(p => (p.category || '').toLowerCase() === 'spices' || (p.subcategory || '').toLowerCase().includes('kara')).length}
                </span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="inventory-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div className="inventory-filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={invCategoryFilter}
                  onChange={(e) => setInvCategoryFilter(e.target.value)}
                  className="admin-select-filter"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155', fontWeight: 600 }}
                >
                  <option value="all">All Categories ({allBillingProducts.length})</option>
                  <option value="beverages">Beverages &amp; Hot Drinks (Cups/Pcs)</option>
                  <option value="sweets">Traditional Sweets (kg)</option>
                  <option value="spices">Spices &amp; Kara Vagai</option>
                  <option value="savouries">Savouries &amp; Mixtures</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={invStatusFilter}
                  onChange={(e) => setInvStatusFilter(e.target.value)}
                  className="admin-select-filter"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#334155', fontWeight: 600 }}
                >
                  <option value="all">All Stock Status</option>
                  <option value="active">Active (In Stock Only)</option>
                  <option value="inactive">Masked (Out of Stock Only)</option>
                </select>
              </div>

              <div className="inventory-search-wrap" style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search product by English or Tamil name..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 36px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
                />
                {inventorySearch && (
                  <button
                    type="button"
                    onClick={() => setInventorySearch('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Products Table (8 Columns: SKU, DETAILS, CATEGORY, UNIT, STOCK / QUANTITY, PRICE, AVAILABILITY, ACTIONS) */}
            <div className="inventory-table-wrap">
              {filteredInventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 4px' }}>No Products Found</h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>No catalog items match your search or filter selection.</p>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>PRODUCT DETAILS</th>
                      <th>CATEGORY</th>
                      <th>BILLING UNIT</th>
                      <th>SELLING PRICE</th>
                      <th>COUNTER AVAILABILITY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInventory.map((prod, idx) => {
                      const isInactive = productAvailabilityMap[prod.id] !== undefined
                        ? Boolean(productAvailabilityMap[prod.id])
                        : Boolean(prod.isInactive || inventoryById.get(prod.id)?.isInactive);
                      return (
                        <tr key={prod.id || idx} style={{ opacity: isInactive ? 0.75 : 1 }}>
                          <td>
                            {editingSkuProduct?.id === prod.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
                                <input
                                  type="text"
                                  value={newSkuInput}
                                  onChange={(e) => { setNewSkuInput(e.target.value); setSkuError(''); }}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      const res = await updateProductSkuCode(prod.id, newSkuInput);
                                      if (res?.success) { setEditingSkuProduct(null); } else { setSkuError(res?.message || 'Error'); }
                                    } else if (e.key === 'Escape') { setEditingSkuProduct(null); setSkuError(''); }
                                  }}
                                  autoFocus
                                  style={{ width: '72px', fontSize: '12px', padding: '3px 6px', border: skuError ? '1px solid #ef4444' : '1px solid #6366f1', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                                  placeholder="e.g. 1"
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button type="button" style={{ fontSize: '10px', padding: '2px 6px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={async () => { const res = await updateProductSkuCode(prod.id, newSkuInput); if (res?.success) { setEditingSkuProduct(null); } else { setSkuError(res?.message || 'Error'); } }}
                                  >Save</button>
                                  <button type="button" style={{ fontSize: '10px', padding: '2px 6px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                    onClick={() => { setEditingSkuProduct(null); setSkuError(''); }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </div>
                                {skuError && <span style={{ fontSize: '10px', color: '#ef4444' }}>{skuError}</span>}
                              </div>
                            ) : (
                              <button type="button" className="item-num-badge"
                                onClick={() => { setEditingSkuProduct(prod); setNewSkuInput(prod.skuCode || String(prod.itemNumber || '')); setSkuError(''); }}
                                title="Click to edit SKU/HSN code"
                                style={{ cursor: 'pointer', background: '#ede9fe', color: '#5b21b6', border: '1px dashed #7c3aed', fontFamily: 'monospace', fontWeight: 700 }}
                              >
                                {prod.skuCode || prod.itemNumber || '—'}
                              </button>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                {prod.englishName || prod.name.split('—')[0].trim()}
                              </strong>
                              {(prod.tamilName || (prod.name.includes('—') ? prod.name.split('—')[1].trim() : '')) && (
                                <span style={{ display: 'block', fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                                  {prod.tamilName || (prod.name.includes('—') ? prod.name.split('—')[1].trim() : '')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>
                              {prod.category?.replace('-', ' ') || 'General'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                              {getItemUnitDisplay(prod)}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                ₹{prod.price || prod.unitPrice || 0}
                              </strong>
                              <button
                                type="button"
                                className="btn-inline-price"
                                onClick={() => {
                                  setEditingMasterPriceItem({
                                    id: prod.id,
                                    name: prod.name,
                                    englishName: prod.englishName || (prod.name || '').split('—')[0].trim(),
                                    tamilName: prod.tamilName || ((prod.name || '').includes('—') ? (prod.name || '').split('—')[1].trim() : ''),
                                    category: prod.category || 'sweets',
                                    unit: getItemUnitDisplay(prod),
                                    price: String(prod.price || prod.unitPrice || '')
                                  });
                                }}
                                title="Edit product details"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                                Edit Product
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="stock-toggle-switch"
                              onClick={() => toggleProductAvailability(prod.id, !isInactive, user)}
                              title={isInactive ? 'Click to mark In Stock / Active' : 'Click to mask Out of Stock'}
                            >
                              <div className={`toggle-track ${!isInactive ? 'active' : ''}`}>
                                <div className="toggle-thumb" />
                              </div>
                              <span className={`toggle-label ${!isInactive ? 'active' : 'inactive'}`}>
                                {!isInactive ? 'IN STOCK' : 'OUT OF STOCK'}
                              </span>
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn-delete-prod"
                                onClick={() => setDeleteConfirmItem({ id: prod.id, name: prod.name })}
                                title="Delete Product from Catalog"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {filteredInventory.length > INVENTORY_PAGE_SIZE && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Showing {inventoryPageStart + 1}–{Math.min(inventoryPageStart + INVENTORY_PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length} products
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-inline-price"
                    disabled={safeInventoryPage === 1}
                    onClick={() => setInventoryPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    Page {safeInventoryPage} of {inventoryPageCount}
                  </span>
                  <button
                    type="button"
                    className="btn-inline-price"
                    disabled={safeInventoryPage === inventoryPageCount}
                    onClick={() => setInventoryPage((page) => Math.min(inventoryPageCount, page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* TAB 4: DAILY SALES - merged into TERMINAL SHIFT REPORT above */}
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

      {/* Staff / Admin Price Override Modal */}
      {editingPriceItem && (
        <div className="pos-price-modal-backdrop" onClick={() => setEditingPriceItem(null)}>
          <div className="pos-price-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pos-price-modal-header">
              <div>
                <span className="modal-eyebrow">STAFF &amp; ADMIN PRICE OVERRIDE</span>
                <h3 className="modal-title">{editingPriceItem.item.name}</h3>
                <span className="modal-subtitle">
                  Unit: <strong>{editingPriceItem.item.weight || editingPriceItem.item.unit || 'Standard'}</strong> &bull; Qty: <strong>{editingPriceItem.item.quantity}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setEditingPriceItem(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pos-price-modal-body">
              <div className="price-comparison-grid">
                <div className="comp-card original">
                  <span className="comp-label">Standard Price</span>
                  <div className="comp-val">₹{editingPriceItem.item.originalPrice !== undefined ? editingPriceItem.item.originalPrice : editingPriceItem.item.price}</div>
                  <span className="comp-sub">Per unit rate</span>
                </div>
                <div className="comp-card new">
                  <span className="comp-label">New Custom Rate</span>
                  <div className="comp-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      autoFocus
                      className="custom-price-input"
                      value={editingPriceItem.newPrice}
                      onChange={(e) => setEditingPriceItem({ ...editingPriceItem, newPrice: e.target.value })}
                      placeholder="Enter rate"
                    />
                  </div>
                  <span className="comp-sub">
                    Line Total: ₹{((parseFloat(editingPriceItem.newPrice) || 0) * (editingPriceItem.item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Difference Badge */}
              {(() => {
                const orig = Number(editingPriceItem.item.originalPrice !== undefined ? editingPriceItem.item.originalPrice : editingPriceItem.item.price);
                const cur = parseFloat(editingPriceItem.newPrice);
                if (!isNaN(cur) && orig > 0) {
                  const diff = cur - orig;
                  return (
                    <div className={`price-diff-badge ${diff < 0 ? 'discount' : diff > 0 ? 'markup' : 'neutral'}`}>
                      {diff < 0
                        ? `Discount: ₹${Math.abs(diff)} off standard price (${Math.round((Math.abs(diff) / orig) * 100)}% off)`
                        : diff > 0
                        ? `Markup: +₹${diff} above standard price`
                        : 'Standard catalog rate (No change)'}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Reason Selection */}
              <div className="override-reason-field">
                <label className="override-reason-label">
                  Reason for Price Adjustment (Logged to Admin Activity Audit)
                </label>
                <div className="reason-quick-pills">
                  {['Festival Discount', 'Bulk Order Concession', 'Management Approval', 'Damaged Pack / Clearance', 'Counter Special Rate'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn-reason-pill ${editingPriceItem.reason === preset ? 'active' : ''}`}
                      onClick={() => setEditingPriceItem({ ...editingPriceItem, reason: preset })}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="custom-reason-input"
                  placeholder="Or type custom reason (e.g. Authorized by Manager)..."
                  value={editingPriceItem.reason}
                  onChange={(e) => setEditingPriceItem({ ...editingPriceItem, reason: e.target.value })}
                />
              </div>

              {/* Keep Price for Future Bills & Reloads */}
              <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="update-catalog-checkbox"
                  checked={editingPriceItem.updateMasterCatalogPrice !== false}
                  onChange={(e) => setEditingPriceItem({ ...editingPriceItem, updateMasterCatalogPrice: e.target.checked })}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#d97706', cursor: 'pointer' }}
                />
                <label htmlFor="update-catalog-checkbox" style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', cursor: 'pointer', lineHeight: '1.4' }}>
                  Save this price permanently for all future bills &amp; reloads
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>
                    அனைத்து ரசீதுகளுக்கும் நிலையான விலையாக மாற்றவும் (ரிலோட் செய்தாலும் விலை மாறாது)
                  </span>
                </label>
              </div>
            </div>

            <div className="pos-price-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setEditingPriceItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={handleConfirmPriceOverride}
              >
                Apply Price Override &amp; Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingMasterPriceItem && (
        <div className="pos-price-modal-backdrop" onClick={() => setEditingMasterPriceItem(null)}>
          <div className="pos-price-modal-box master-price-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="pos-price-modal-header">
              <div>
                <span className="modal-eyebrow">EDIT PRODUCT</span>
                <h3 className="modal-title">{editingMasterPriceItem.englishName || editingMasterPriceItem.name}</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setEditingMasterPriceItem(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="pos-price-modal-body" style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Product Name (English)</label>
                <input
                  type="text"
                  value={editingMasterPriceItem.englishName || ''}
                  onChange={(e) => setEditingMasterPriceItem({ ...editingMasterPriceItem, englishName: e.target.value })}
                  className="qty-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Product Name (Tamil)</label>
                <input
                  type="text"
                  value={editingMasterPriceItem.tamilName || ''}
                  onChange={(e) => setEditingMasterPriceItem({ ...editingMasterPriceItem, tamilName: e.target.value })}
                  className="qty-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category</label>
                  <select
                    value={editingMasterPriceItem.category || 'sweets'}
                    onChange={(e) => setEditingMasterPriceItem({ ...editingMasterPriceItem, category: e.target.value })}
                    className="qty-input"
                    style={{ background: '#fff' }}
                  >
                    <option value="sweets">Sweets</option>
                    <option value="beverages">Beverages</option>
                    <option value="spices">Spices</option>
                    <option value="halwa">Halwa</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Unit</label>
                  <select
                    value={editingMasterPriceItem.unit || 'kg'}
                    onChange={(e) => setEditingMasterPriceItem({ ...editingMasterPriceItem, unit: e.target.value })}
                    className="qty-input"
                    style={{ background: '#fff' }}
                  >
                    <option value="kg">kg</option>
                    <option value="Litre">Litre</option>
                    <option value="1 Cup">1 Cup</option>
                    <option value="1 Pc">1 Pc</option>
                    <option value="1 Pkt">1 Pkt</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Selling Price (₹)</label>
                <div className="comp-input-wrap" style={{ marginTop: '8px' }}>
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    autoFocus
                    className="custom-price-input"
                    value={editingMasterPriceItem.price}
                    onChange={(e) => setEditingMasterPriceItem({ ...editingMasterPriceItem, price: e.target.value })}
                    placeholder="e.g. 380"
                  />
                </div>
              </div>
            </div>
            <div className="pos-price-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setEditingMasterPriceItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={handleConfirmMasterPriceUpdate}
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="pos-price-modal-backdrop" onClick={() => setDeleteConfirmItem(null)}>
          <div className="pos-price-modal-box delete-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="pos-price-modal-header">
              <div>
                <span className="modal-eyebrow" style={{ color: '#dc2626' }}>CONFIRM PRODUCT DELETION</span>
                <h3 className="modal-title">Delete {deleteConfirmItem.name}?</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setDeleteConfirmItem(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="pos-price-modal-body">
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                Are you sure you want to delete this product from the inventory and billing catalog? It will be removed from the active items list.
              </p>
            </div>
            <div className="pos-price-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete-confirm"
                onClick={handleConfirmDeleteProduct}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bill Modal (30-day Recycle Bin with Mandatory Reason) */}
      <DeleteBillModal
        isOpen={Boolean(deleteBillModalItem) || Boolean(bulkDeleteBills)}
        bill={bulkDeleteBills || deleteBillModalItem}
        onClose={() => {
          setDeleteBillModalItem(null);
          setBulkDeleteBills(null);
        }}
        onConfirmDelete={async (billOrBills, reason) => {
          const deleteActor = {
            id: user?.id || user?._id || 'staff',
            name: user?.name || 'Counter Staff',
            role: user?.role || 'cashier',
          };

          try {
            if (Array.isArray(billOrBills)) {
              const identifiers = billOrBills.map((bill) => bill.id || bill.invoiceNumber).filter(Boolean);
              await deleteBills(identifiers, reason, deleteActor);
              setSelectedShiftBillIds((previous) => previous.filter((id) => !identifiers.includes(id)));
            } else {
              await deleteBill(billOrBills.id, reason, deleteActor);
            }
            setDeleteBillModalItem(null);
            setBulkDeleteBills(null);
          } catch (err) {
            // deleteBill now throws on backend failure — surface the real error
            alert(err?.message || 'Delete failed. Please check your connection and try again.');
          }
        }}
        user={user}
      />

      {/* Edit Bill Modal (Inventory Adjustment & Audit History) */}
      {editBillModalItem && (
        <EditBillModal
          isOpen={!!editBillModalItem}
          bill={editBillModalItem}
          onClose={() => setEditBillModalItem(null)}
          onSuccess={() => {
            setEditBillModalItem(null);
            fetchBills(user?.id || user?.username);
          }}
          currentUser={user}
        />
      )}
    </div>
  );
}
