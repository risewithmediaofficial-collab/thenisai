import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ALL_BILLING_ITEMS, GST_RATE } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import SideNavbar from '../Nav/SideNavbar';
import './BillingCounter.css';

// Predefined categories for fast tea & beverages POS filtering
const CATEGORIES = [
  { id: 'all', label: 'All Items (13)' },
  { id: 'tea', label: '🍵 Teas' },
  { id: 'coffee', label: '☕ Coffees' },
  { id: 'malt', label: '🥛 Milk & Malts' },
  { id: 'beverages', label: '🥤 All Beverages' },
  { id: 'snacks', label: '🥟 Snacks (Vada)' },
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

  // POS Page Navigation: 'register' | 'my-bills' | 'online-orders' | 'inventory'
  const [posTab, setPosTab] = useState(() => {
    const h = window.location.hash.toLowerCase();
    if (h.includes('bills')) return 'my-bills';
    if (h.includes('orders') || h.includes('online')) return 'online-orders';
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

  // Catalog View Switcher: 'grid' (Card Tiles) | 'list' (Fast Compact Rows)
  const [catalogLayout, setCatalogLayout] = useState('grid');

  // Hold / Recall Bills state
  const [heldBills, setHeldBills] = useState([]);

  // Sync hash routing for dedicated pages
  useEffect(() => {
    const handleHashSync = () => {
      const h = window.location.hash.toLowerCase();
      if (!h.startsWith('#billing')) return;
      if (h.includes('bills')) {
        setPosTab('my-bills');
      } else if (h.includes('orders') || h.includes('online')) {
        setPosTab('online-orders');
      } else if (h.includes('stock') || h.includes('inventory')) {
        setPosTab('inventory');
      } else {
        setPosTab('register');
      }
    };
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const handleSwitchTab = (newTab) => {
    setPosTab(newTab);
    if (newTab === 'register') {
      window.location.hash = '#billing';
      setMobileTab('catalog');
    } else if (newTab === 'my-bills') {
      window.location.hash = '#billing/bills';
      handleRefreshShiftBills();
    } else if (newTab === 'online-orders') {
      window.location.hash = '#billing/orders';
    } else if (newTab === 'inventory') {
      window.location.hash = '#billing/inventory';
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
      if ((e.key === 'F9' || (e.key === 'Enter' && (!isInput || e.ctrlKey))) && billItems.length > 0 && !isAddStockOpen && !isRefillOpen) {
        e.preventDefault();
        handleCompleteSale(e);
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

  // POS Calculations
  const billSubtotal = billItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const billGst = Math.round(billSubtotal * GST_RATE * 100) / 100;
  const billCgst = Math.round((billGst / 2) * 100) / 100;
  const billSgst = Math.round((billGst / 2) * 100) / 100;
  const billGrandTotal = Math.round(billSubtotal + billGst);

  // Add product to bill with chosen cup/pc quantity
  const handleAddSweetToBill = (sweet, weight = '1 Cup', addQty = 1) => {
    const qty = parseInt(addQty, 10) || 1;
    const itemWeight = weight || sweet.unit || '1 Cup';
    const price = sweet.prices
      ? sweet.prices[itemWeight] || sweet.prices['1 Cup'] || sweet.price
      : sweet.price;

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
            hsn: sweet.hsn || '0902',
            image: sweet.image,
            unit: sweet.unit || '1 Cup',
          },
        ];
      }
    });
  };

  // Direct quantity update in active bill (e.g. typing 3, 5, 10 cups)
  const handleSetBillItemQty = (id, weight, qty) => {
    const val = parseInt(qty, 10);
    if (isNaN(val) || val <= 0) {
      handleRemoveBillItem(id, weight);
      return;
    }
    setBillItems((prev) =>
      prev.map((it) => (it.id === id && it.weight === weight ? { ...it, quantity: val } : it))
    );
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
    setBillItems(target.billItems);
    setCustomerInfo(target.customerInfo);
    setHeldBills((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Complete counter sale & print bill
  const handleCompleteSale = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
        street: '123 Sweet Street',
        landmark: 'Terminal #01 Counter Sale',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
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
  };

  // Filtered and orderwise products based on search and category
  const allProducts = ALL_BILLING_ITEMS;

  const rawFiltered = allProducts.filter((sw, idx) => {
    const itemNum = sw.itemNumber || idx + 1;
    const qRaw = searchQuery.trim();
    const q = qRaw.toLowerCase();

    if (!q) {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'tea') return sw.id.includes('tea') || sw.id === 'ginger-lemon';
      if (selectedCategory === 'coffee') return sw.id.includes('coffee');
      if (selectedCategory === 'malt') return sw.id.includes('milk') || sw.id === 'horlicks' || sw.id === 'boost' || sw.id === 'ragi-malt';
      if (selectedCategory === 'beverages') return sw.category === 'beverages';
      if (selectedCategory === 'snacks') return sw.category === 'snacks' || sw.id === 'vada';
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
    <div className="billing-pos-root side-layout">
      {/* 1. LEFT SIDE NAVIGATION BAR (No Cluttered Top Navbar) */}
      <SideNavbar
        currentSection={
          posTab === 'register'
            ? 'pos-register'
            : posTab === 'my-bills'
            ? 'pos-bills'
            : posTab === 'online-orders'
            ? 'pos-online'
            : 'pos-inventory'
        }
        onSelectSection={(sec) => {
          if (sec === 'pos-register') handleSwitchTab('register');
          else if (sec === 'pos-bills') handleSwitchTab('my-bills');
          else if (sec === 'pos-online') handleSwitchTab('online-orders');
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
      <div className="pos-content-area">
        {/* Mobile-only compact control strip */}
        <header className="pos-mobile-strip mobile-only">
          <button
            type="button"
            className="pos-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open POS Menu"
          >
            <span className="hamburger-icon">☰</span>
          </button>
          <div className="mobile-strip-brand">
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
              🛒 Return to POS
            </button>
          )}

          <button
            type="button"
            className={`pos-mobile-bell-btn ${pendingOnlineOrders.length > 0 ? 'has-pending' : ''} ${posTab === 'online-orders' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('online-orders')}
            aria-label="Online Orders"
          >
            🔔
            {pendingOnlineOrders.length > 0 && (
              <span className="mobile-bell-badge">{pendingOnlineOrders.length}</span>
            )}
          </button>
        </header>

        {/* PAGE 1: POS BILLING REGISTER */}
        {posTab === 'register' && (
          <main className={`pos-main-split ${mobileTab === 'catalog' ? 'show-catalog' : 'show-bill'}`}>
            {/* LEFT COLUMN: BEVERAGE & SNACK CATALOG */}
            <section className="pos-catalog-pane">
              {/* Quick Toolbar: Search & List/Grid Switcher */}
              <div className="pos-catalog-toolbar">
                <div className="pos-search">
                  <span className="pos-search-icon">🔍</span>
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
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* View Layout Switcher: Grid vs List */}
                <div className="pos-layout-toggle-group">
                  <button
                    type="button"
                    className={`layout-toggle-btn ${catalogLayout === 'grid' ? 'active' : ''}`}
                    onClick={() => setCatalogLayout('grid')}
                    title="Grid View (Card Tiles)"
                  >
                    <span className="toggle-icon">⊞</span>
                    <span className="toggle-label">Grid</span>
                  </button>
                  <button
                    type="button"
                    className={`layout-toggle-btn ${catalogLayout === 'list' ? 'active' : ''}`}
                    onClick={() => setCatalogLayout('list')}
                    title="List View (Compact Fast Table)"
                  >
                    <span className="toggle-icon">☰</span>
                    <span className="toggle-label">List</span>
                  </button>
                </div>

                {/* Held Bills Quick Indicator */}
                {heldBills.length > 0 && (
                  <div className="held-bills-banner">
                    <span>⏸ {heldBills.length} Held:</span>
                    {heldBills.map((h, i) => (
                      <button
                        key={h.id}
                        type="button"
                        className="btn-recall-held"
                        onClick={() => handleRecallBill(h.id)}
                      >
                        Recall #{i + 1} (₹{h.total})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Category Tabs Bar */}
              <div className="pos-category-bar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* GRID VIEW (Clean Cards - Names & Stepper Only) */}
              {catalogLayout === 'grid' && (
                <div className="pos-sweets-grid clean">
                  {filteredSweets.map((sweet, idx) => {
                    const defaultUnit = sweet.unit || '1 Cup';
                    const itemNum = sweet.itemNumber || idx + 1;
                    const billItem = billItems.find((it) => it.id === sweet.id);
                    const qtyInBill = billItem ? billItem.quantity : 0;

                    return (
                      <div
                        key={sweet.id}
                        className={`pos-sweet-card clean-card ${qtyInBill > 0 ? 'in-bill' : ''}`}
                      >
                        <div
                          className="pos-card-info"
                          onClick={() => handleAddSweetToBill(sweet, defaultUnit, 1)}
                          title="Click to add 1"
                        >
                          <div className="pos-card-title-wrap">
                            <span className="pos-item-num-badge">#{itemNum}</span>
                            <h4 className="pos-sweet-title">{sweet.name}</h4>
                          </div>
                          <span className="pos-sweet-price">₹{sweet.price}</span>
                        </div>

                        <div className="pos-catalog-stepper">
                          <button
                            type="button"
                            className="cat-step-btn minus"
                            disabled={qtyInBill === 0}
                            onClick={() => handleUpdateBillQty(sweet.id, defaultUnit, -1)}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            className={`cat-qty-input ${qtyInBill > 0 ? 'active' : ''}`}
                            value={qtyInBill}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0) {
                                handleSetBillItemQty(sweet.id, defaultUnit, val);
                              }
                            }}
                            title="Cups in bill"
                          />
                          <button
                            type="button"
                            className="cat-step-btn plus"
                            onClick={() => handleAddSweetToBill(sweet, defaultUnit, 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST VIEW (Fast Clean Table - Names & Stepper Only) */}
              {catalogLayout === 'list' && (
                <div className="pos-sweets-list">
                  {filteredSweets.map((sweet, idx) => {
                    const defaultUnit = sweet.unit || '1 Cup';
                    const itemNum = sweet.itemNumber || idx + 1;
                    const billItem = billItems.find((it) => it.id === sweet.id);
                    const qtyInBill = billItem ? billItem.quantity : 0;

                    return (
                      <div
                        key={sweet.id}
                        className={`pos-list-row ${qtyInBill > 0 ? 'in-bill' : ''}`}
                      >
                        <div
                          className="pos-list-info"
                          onClick={() => handleAddSweetToBill(sweet, defaultUnit, 1)}
                          title="Click to add 1"
                        >
                          <div className="pos-list-title-wrap">
                            <span className="pos-item-num-badge">#{itemNum}</span>
                            <h4 className="pos-list-title">{sweet.name}</h4>
                          </div>
                          <span className="pos-list-rate">₹{sweet.price}</span>
                        </div>

                        <div className="pos-catalog-stepper">
                          <button
                            type="button"
                            className="cat-step-btn minus"
                            disabled={qtyInBill === 0}
                            onClick={() => handleUpdateBillQty(sweet.id, defaultUnit, -1)}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            className={`cat-qty-input ${qtyInBill > 0 ? 'active' : ''}`}
                            value={qtyInBill}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0) {
                                handleSetBillItemQty(sweet.id, defaultUnit, val);
                              }
                            }}
                            title="Cups in bill"
                          />
                          <button
                            type="button"
                            className="cat-step-btn plus"
                            onClick={() => handleAddSweetToBill(sweet, defaultUnit, 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Mobile Cart Summary Bar */}
              {billItems.length > 0 && (
                <div className="pos-mobile-bottom-bar mobile-only">
                  <button
                    type="button"
                    className="btn-mobile-bill-summary"
                    onClick={() => setMobileTab('bill')}
                  >
                    <div className="summary-left">
                      <span className="cart-badge-icon">🛒</span>
                      <div className="summary-text">
                        <strong>{billItems.reduce((s, it) => s + it.quantity, 0)} Items Added</strong>
                        <small>{billItems.length} varieties · Tap to pay</small>
                      </div>
                    </div>
                    <div className="summary-right">
                      <span className="summary-amount">₹{billGrandTotal}</span>
                      <span className="summary-cta">Pay ➔</span>
                    </div>
                  </button>
                </div>
              )}
            </section>

            {/* RIGHT COLUMN: ACTIVE POS CASH REGISTER & TERMINAL */}
            <section className="pos-bill-pane">
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
                <div>
                  <span className="bill-sub">Active Counter Register</span>
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
                        ⏸ Hold
                      </button>
                      <button
                        type="button"
                        className="btn-clear-bill"
                        onClick={handleClearBill}
                        title="Clear current bill"
                      >
                        ✕ Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Customer Phone & Name Input */}
              <div className="pos-cust-row">
                <div className="cust-input-wrap">
                  <span className="input-prefix">📞 +91</span>
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
                    <div className="pos-empty-icon">☕</div>
                    <p className="pos-empty-title">Register is Ready</p>
                    <p className="pos-empty-sub">
                      Tap any tea, coffee, or snack on the left to add cups to this bill.
                    </p>
                  </div>
                ) : (
                  <div className="pos-items-table">
                    {billItems.map((item) => {
                      const unitLabel = item.weight?.includes('Pc') ? 'Pcs' : 'Cups';
                      return (
                        <div key={`${item.id}-${item.weight}`} className="pos-bill-line">
                          <div className="pos-line-info">
                            <span className="pos-line-name">{item.name}</span>
                            <span className="pos-line-weight">
                              ₹{item.price} × {item.quantity} {unitLabel}
                            </span>
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
                              type="number"
                              min="1"
                              max="999"
                              className="line-qty-input"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val > 0) {
                                  handleSetBillItemQty(item.id, item.weight, val);
                                }
                              }}
                              title="Type exact quantity"
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
                          >
                            ✕
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
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`pay-mode-btn ${paymentMode === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('upi')}
                  >
                    📱 UPI / QR
                  </button>
                  <button
                    type="button"
                    className={`pay-mode-btn ${paymentMode === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('card')}
                  >
                    💳 Card / POS
                  </button>
                </div>

                {/* Settle & Print Button */}
                <button
                  type="button"
                  className="btn-complete-sale"
                  disabled={billItems.length === 0}
                  onClick={handleCompleteSale}
                >
                  <span className="btn-sale-icon">🖨️</span>
                  <span className="btn-sale-text">
                    {billItems.length === 0
                      ? 'Add Items to Settle Bill'
                      : `Settle ₹${billGrandTotal} & Print 2 Bills (Enter)`}
                  </span>
                </button>
              </div>
            </section>
          </main>
        )}

        {/* PAGE 2: SHIFT INVOICES LEDGER */}
        {posTab === 'my-bills' && (
          <main className="pos-shift-ledger">
            <div className="shift-ledger-header">
              <div>
                <span className="shift-eyebrow">TERMINAL SHIFT REPORT</span>
                <h2 className="shift-title">My Counter Invoices</h2>
                <div className="shift-meta-badges">
                  <span className="meta-badge cashier-badge">
                    👤 Cashier: <strong>{user?.name || 'Counter Staff'}</strong>
                  </span>
                  <span className="meta-badge desk-badge">
                    📍 Terminal: <strong>{user?.counter || 'Counter Desk 01'}</strong>
                  </span>
                  <span className="meta-badge date-badge">
                    📅 Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
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
                  <span>{isRefreshingBills ? 'Syncing...' : 'Refresh Bills'}</span>
                </button>
                <button
                  type="button"
                  className="btn-shift-new-sale"
                  onClick={() => setPosTab('register')}
                >
                  🛒 Return to POS
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
                <span className="kpi-label">💵 Cash Collected</span>
                <div className="kpi-val">₹{myShiftCashTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'cash').length} Cash Bills
                </span>
              </div>

              <div className="shift-kpi-card upi">
                <span className="kpi-label">📱 UPI Collections</span>
                <div className="kpi-val">₹{myShiftUpiTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'upi').length} UPI Transactions
                </span>
              </div>

              <div className="shift-kpi-card card">
                <span className="kpi-label">💳 Card Swipe</span>
                <div className="kpi-val">₹{myShiftCardTotal.toLocaleString('en-IN')}</div>
                <span className="kpi-sub">
                  {myShiftBills.filter((b) => b.paymentMethod === 'card').length} EDC Swipes
                </span>
              </div>
            </div>

            {/* Toolbar: Search and Filter */}
            <div className="shift-toolbar">
              <div className="shift-search-box">
                <input
                  type="text"
                  placeholder="Search invoice no, customer name or phone..."
                  value={billSearchTerm}
                  onChange={(e) => setBillSearchTerm(e.target.value)}
                />
                {billSearchTerm && (
                  <button type="button" className="clear-btn" onClick={() => setBillSearchTerm('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className="shift-filter-chips">
                <span className="filter-label">Payment:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'cash', label: '💵 Cash' },
                  { id: 'upi', label: '📱 UPI' },
                  { id: 'card', label: '💳 Card' },
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
                            <div className="cust-phone-sub">📞 {bill.customer?.phone || 'Counter'}</div>
                          </td>
                          <td>
                            <div className="shift-items-list">
                              {bill.items?.map((it, idx) => (
                                <span key={idx} className="shift-item-pill">
                                  {it.name} × {it.quantity}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`payment-pill ${bill.paymentMethod?.toLowerCase()}`}>
                              {bill.paymentMethod === 'upi' ? '📱 UPI' : bill.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                            </span>
                          </td>
                          <td>
                            <strong className="shift-amount">₹{bill.grandTotal}</strong>
                          </td>
                          <td>
                            <span className="shift-status-pill">
                              ✓ {bill.orderStatus || bill.status || 'Paid'}
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
          <main className="pos-online-page">
            <div className="online-page-header">
              <div>
                <span className="online-eyebrow">🌐 LIVE DISPATCH QUEUE</span>
                <h2 className="online-title">Online Delivery Orders</h2>
                <div className="online-meta-badges">
                  <span className={`meta-badge ${onlineNewCount > 0 ? 'alert' : 'done'}`}>
                    🔥 <strong>{onlineNewCount} New</strong> awaiting confirmation
                  </span>
                  <span className="meta-badge process">
                    ⚡ <strong>{onlineAcceptedCount} In Packing</strong>
                  </span>
                  <span className="meta-badge done">
                    🚚 <strong>{onlineDispatchedCount} Dispatched</strong>
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
                  <span>{isRefreshingOrders ? 'Syncing...' : '🔄 Refresh Queue'}</span>
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                >
                  🛒 Return to POS
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
                  { id: 'New', label: `🔥 New (${onlineNewCount})` },
                  { id: 'Accepted', label: `⚡ Accepted (${onlineAcceptedCount})` },
                  { id: 'Dispatched', label: `🚚 Dispatched (${onlineDispatchedCount})` },
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
                  <button type="button" className="clear-btn" onClick={() => setOnlineSearch('')}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Orders Cards Grid */}
            <div className="online-cards-container">
              {filteredOnlineOrders.length === 0 ? (
                <div className="online-empty-page-state">
                  <div className="empty-online-icon">📦</div>
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
                    🛒 Go to POS Billing Counter
                  </button>
                </div>
              ) : (
                <div className="online-orders-cards-grid">
                  {filteredOnlineOrders.map((ord) => (
                    <div key={ord.id} className={`online-full-card status-${ord.status?.toLowerCase()}`}>
                      <div className="online-card-top">
                        <div className="online-id-time">
                          <span className="online-inv-code">{ord.invoiceNumber}</span>
                          <span className="online-time-stamp">⏱ {ord.orderTime || ord.orderDate}</span>
                        </div>
                        <span className={`online-status-pill ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="online-cust-info">
                        <div className="cust-primary">
                          <strong>{ord.customer?.fullName || 'Online Customer'}</strong>
                          <span className="cust-phone">📞 +91 {ord.customer?.phone}</span>
                        </div>
                        <div className="cust-address-line">
                          📍 {ord.shippingAddress?.doorNo ? `${ord.shippingAddress.doorNo}, ` : ''}
                          {ord.shippingAddress?.street ? `${ord.shippingAddress.street}, ` : ''}
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                          {ord.shippingAddress?.pincode ? ` - ${ord.shippingAddress.pincode}` : ''}
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
                          <span className="pay-method">
                            {ord.paymentMethod === 'upi' ? '📱 UPI Paid' : '💵 Cash on Delivery'}
                          </span>
                        </div>

                        <div className="online-action-buttons">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="btn-action-accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              ✓ Accept Order
                            </button>
                          )}
                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="btn-action-dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              🚚 Mark Dispatched
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action-print"
                            onClick={() => openInvoice(ord)}
                          >
                            🖨️ Print Bill
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
          <main className="pos-inventory-page">
            <div className="inventory-page-header">
              <div>
                <span className="inventory-eyebrow">📊 LIVE COUNTER INVENTORY</span>
                <h2 className="inventory-title">Counter Stock & Refill Tracker</h2>
                <div className="inventory-meta-badges">
                  <span className="meta-badge count">
                    📦 <strong>{totalStockVarieties} Beverage & Snack Varieties</strong>
                  </span>
                  {lowStockCount > 0 ? (
                    <span className="meta-badge alert">
                      ⚠️ <strong>{lowStockCount} Items Low Stock</strong>
                    </span>
                  ) : (
                    <span className="meta-badge done">
                      ✓ All trays adequately stocked
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
                  🔄 Refill Trays
                </button>
                <button
                  type="button"
                  className="btn-inventory-add"
                  onClick={() => setIsAddStockOpen(true)}
                >
                  ➕ Add New Stock
                </button>
                <button
                  type="button"
                  className="btn-return-pos"
                  onClick={() => handleSwitchTab('register')}
                >
                  🛒 Return to POS
                </button>
              </div>
            </div>

            {/* Inventory KPI Summary */}
            <div className="inventory-kpis-grid">
              <div className="inv-kpi-card total">
                <span className="kpi-label">Active Products</span>
                <div className="kpi-val">{totalStockVarieties}</div>
                <span className="kpi-sub">Strictly 13 Teas, Malts & Snacks</span>
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
                    {inventory.map((item, idx) => {
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
                            <span className="category-pill">{item.unit === 'Pc' ? 'Snack' : 'Beverage'}</span>
                          </td>
                          <td>
                            <strong className="price-tag">₹{item.price || (item.unit === 'Pc' ? 20 : item.id.includes('malt') || item.id.includes('boost') || item.id.includes('horlicks') || item.id.includes('badam') ? 25 : 20)}</strong>
                          </td>
                          <td>
                            <div className="stock-level-cell">
                              <span className="stock-value">{item.stockKg} {unit}s</span>
                              <div className="stock-progress-bar">
                                <div
                                  className={`progress-fill ${isLow ? 'low' : 'normal'}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(10, ((item.stockKg || 0) / 100) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="min-threshold-sub">{item.minThreshold || 10} {unit}s</span>
                          </td>
                          <td>
                            <span className={`status-badge ${isLow ? 'low' : 'ok'}`}>
                              {isLow ? '⚠️ LOW STOCK' : '✓ In Stock'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-quick-refill-item"
                              onClick={() => handleOpenRefillItem(item.id)}
                            >
                              🔄 Refill
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
