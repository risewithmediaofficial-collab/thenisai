import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG, SPECIAL_BOX, BEVERAGES_AND_SNACKS, ALL_BILLING_ITEMS, GST_RATE } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import './BillingCounter.css';

// Predefined categories for fast POS filtering
const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'beverages', label: '☕ Hot Beverages' },
  { id: 'snacks', label: '🥟 Snacks & Vada' },
  { id: 'palkova', label: 'Palkova & Khoa' },
  { id: 'ghee', label: 'Desi Ghee Delicacies' },
  { id: 'dryfruit', label: 'Dry Fruit Specials' },
  { id: 'boxes', label: 'Gift Boxes' },
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

  // POS Mode: 'register' (Live Counter POS) | 'my-bills' (Cashier Shift Ledger)
  const [posTab, setPosTab] = useState('register');
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [billPaymentFilter, setBillPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card'
  const [isRefreshingBills, setIsRefreshingBills] = useState(false);

  // Active POS Bill Items
  const [billItems, setBillItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: 'Walk-in Guest',
    phone: '',
  });
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Hold / Recall Bills state
  const [heldBills, setHeldBills] = useState([]);

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

  // Loose Weight Scale Modal state
  const [scaleModalSweet, setScaleModalSweet] = useState(null);
  const [customGrams, setCustomGrams] = useState('350');

  // Stock Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);

  // Online orders drawer / tab toggle
  const [showOnlineOrders, setShowOnlineOrders] = useState(false);

  // Mobile UI state: 'catalog' vs 'bill' view, and mobile slide-out menu drawer
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'bill'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search input ref for keyboard shortcut (F2)
  const searchInputRef = useRef(null);

  // Freeze background screen scroll when scale, stock popups, mobile menu, or online orders drawer are active
  useScrollLock(
    Boolean(scaleModalSweet) ||
    isAddStockOpen ||
    isRefillOpen ||
    isMobileMenuOpen ||
    showOnlineOrders
  );

  // Keyboard shortcuts (F2: search, Enter/F9: finalize bill, Escape: close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setScaleModalSweet(null);
        setIsAddStockOpen(false);
        setIsRefillOpen(false);
        setIsMobileMenuOpen(false);
        setShowOnlineOrders(false);
      }
      // Press F9 or Enter to finalize bill immediately (if not typing in customer name/phone/search inputs)
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if ((e.key === 'F9' || (e.key === 'Enter' && (!isInput || e.ctrlKey))) && billItems.length > 0 && !scaleModalSweet && !isAddStockOpen && !isRefillOpen) {
        e.preventDefault();
        handleCompleteSale(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, customerInfo, paymentMode, scaleModalSweet, isAddStockOpen, isRefillOpen]);

  // Incoming online orders that need attention
  const pendingOnlineOrders = orders.filter(
    (o) => o.source === 'online' && (o.status === 'New' || o.status === 'Accepted')
  );

  // POS Calculations
  const billSubtotal = billItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const billGst = Math.round(billSubtotal * GST_RATE * 100) / 100;
  const billCgst = Math.round((billGst / 2) * 100) / 100;
  const billSgst = Math.round((billGst / 2) * 100) / 100;
  const billGrandTotal = Math.round(billSubtotal + billGst);

  // Add standard pack to bill
  const handleAddSweetToBill = (sweet, weight = '500g', addQty = 1) => {
    const price = sweet.prices ? sweet.prices[weight] : sweet.price;

    setBillItems((prev) => {
      const idx = prev.findIndex((i) => i.id === sweet.id && i.weight === weight);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + addQty };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: sweet.id,
            name: sweet.name,
            weight,
            price,
            quantity: addQty,
            hsn: sweet.hsn || '2106',
            image: sweet.image,
          },
        ];
      }
    });
  };

  // Add custom loose weight in grams (e.g. 350g) from scale
  const handleAddCustomWeightToBill = (e) => {
    if (e) e.preventDefault();
    if (!scaleModalSweet) return;

    const grams = parseFloat(customGrams);
    if (isNaN(grams) || grams <= 0) return;

    // Determine rate per gram based on 500g or 1kg price
    const basePrice = scaleModalSweet.prices
      ? scaleModalSweet.prices['500g'] || (scaleModalSweet.prices['1kg'] / 2)
      : scaleModalSweet.price;
    const ratePerGram = basePrice / 500;
    const computedPrice = Math.round(ratePerGram * grams);
    const weightLabel = grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg (Loose)` : `${grams}g (Loose)`;

    setBillItems((prev) => [
      ...prev,
      {
        id: `${scaleModalSweet.id}-${grams}g`,
        name: scaleModalSweet.name,
        weight: weightLabel,
        price: computedPrice,
        quantity: 1,
        hsn: scaleModalSweet.hsn || '2106',
        image: scaleModalSweet.image,
        isCustomWeight: true,
        grams,
      },
    ]);

    setScaleModalSweet(null);
  };

  // Stepper update
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

  // Hold current active bill
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



  // Filtered sweets and beverages based on category and search query
  const allSweetsWithBox = ALL_BILLING_ITEMS || [SPECIAL_BOX, ...SWEETS_CATALOG, ...BEVERAGES_AND_SNACKS];
  const filteredSweets = allSweetsWithBox.filter((sw) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      sw.name.toLowerCase().includes(q) ||
      (sw.tamilName && sw.tamilName.includes(searchQuery.trim())) ||
      (sw.englishName && sw.englishName.toLowerCase().includes(q)) ||
      (sw.tagline && sw.tagline.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'beverages') return sw.category === 'beverages';
    if (selectedCategory === 'snacks') return sw.category === 'snacks';
    if (selectedCategory === 'palkova') return sw.id.includes('palkova');
    if (selectedCategory === 'ghee') return sw.id.includes('mysore') || sw.id.includes('halwa');
    if (selectedCategory === 'dryfruit') return sw.id.includes('kaju') || sw.id.includes('badam');
    if (selectedCategory === 'boxes') return sw.id.includes('box');
    return true;
  });

  return (
    <div className="billing-pos-root">
      {/* ===================================================
          1. TOP POS TERMINAL CONTROL BAR
         =================================================== */}
      <header className="billing-pos-header">
        <div className="pos-header-brand-wrap">
          <div className="pos-brand">
            <h1 className="pos-title">Thenisai Sweets POS</h1>
            <span className="pos-terminal-badge">{user?.counter || 'Counter Desk 01'}</span>
          </div>

          {/* Desktop POS Mode Switcher: Register vs My Shift Bills */}
          <div className="pos-mode-switch-group desktop-only">
            <button
              type="button"
              className={`pos-mode-tab-btn ${posTab === 'register' ? 'active' : ''}`}
              onClick={() => setPosTab('register')}
            >
              <span className="tab-icon">🛒</span>
              <span>New POS Sale</span>
            </button>
            <button
              type="button"
              className={`pos-mode-tab-btn ${posTab === 'my-bills' ? 'active' : ''}`}
              onClick={() => {
                setPosTab('my-bills');
                handleRefreshShiftBills();
              }}
            >
              <span className="tab-icon">🧾</span>
              <span>My Shift Invoices</span>
              <span className="tab-counter-badge">{myShiftBills.length}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (when on Register: Sweets vs Bill) */}
        {posTab === 'register' && (
          <div className="pos-mobile-view-tabs mobile-only">
            <button
              type="button"
              className={`mobile-view-tab ${mobileTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setMobileTab('catalog')}
            >
              <span>🍬 Sweets</span>
            </button>
            <button
              type="button"
              className={`mobile-view-tab ${mobileTab === 'bill' ? 'active' : ''}`}
              onClick={() => setMobileTab('bill')}
            >
              <span>🧾 Bill</span>
              {billItems.length > 0 && (
                <span className="mobile-cart-badge">
                  {billItems.reduce((s, it) => s + it.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Desktop Action Controls */}
        <div className="pos-header-actions desktop-only">
          <div className="staff-logged-badge cashier">
            <span>👤</span>
            <span>{user?.name || 'Cashier Desk'}</span>
          </div>

          {/* Online Orders Alert Pill */}
          <button
            type="button"
            className={`pos-online-alert-btn ${pendingOnlineOrders.length > 0 ? 'has-pending' : ''}`}
            onClick={() => setShowOnlineOrders(!showOnlineOrders)}
          >
            <span className="bell-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span>
              {pendingOnlineOrders.length > 0
                ? `${pendingOnlineOrders.length} Online Delivery Orders`
                : 'Online Queue (All Dispatched)'}
            </span>
            <span className="view-toggle-arrow">{showOnlineOrders ? '▲' : '▼'}</span>
          </button>

          <button
            type="button"
            className="btn-stock-action add"
            onClick={() => setIsAddStockOpen(true)}
            title="Add new kitchen production batches or sweet varieties"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Stock</span>
          </button>

          <button
            type="button"
            className="btn-stock-action refill"
            onClick={() => setIsRefillOpen(true)}
            title="Quick refill of counter display trays"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Refill Stock</span>
          </button>

          <button
            type="button"
            className="btn-staff-logout"
            onClick={() => {
              logout();
              window.location.hash = '';
            }}
            title="Log out of POS Terminal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Header Right: Bell & Menu Bar Hamburger Icon */}
        <div className="pos-mobile-header-right mobile-only">
          <button
            type="button"
            className={`mobile-bell-btn ${pendingOnlineOrders.length > 0 ? 'has-pending' : ''}`}
            onClick={() => setShowOnlineOrders(!showOnlineOrders)}
            aria-label="Online Orders Queue"
            title="View Online Delivery Orders"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendingOnlineOrders.length > 0 && (
              <span className="bell-badge">{pendingOnlineOrders.length}</span>
            )}
          </button>

          <button
            type="button"
            className="pos-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Cashier Menu"
            title="Open Cashier Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===================================================
          2. INCOMING ONLINE ORDERS QUEUE ACCORDION
         =================================================== */}
      <AnimatePresence>
        {showOnlineOrders && (
          <motion.div
            className="pos-online-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="pos-online-drawer__inner">
              <div className="drawer-header">
                <div>
                  <h3 className="drawer-title">🌐 Live Online Kitchen Dispatch Queue</h3>
                  <span className="drawer-sub">Accept, pack, and print bills directly from this counter</span>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setShowOnlineOrders(false)}
                >
                  ✕ Close Queue
                </button>
              </div>

              {pendingOnlineOrders.length === 0 ? (
                <div className="no-pending-msg">
                  ✓ All online delivery orders have been accepted and dispatched from kitchen!
                </div>
              ) : (
                <div className="pos-online-cards">
                  {pendingOnlineOrders.map((ord) => (
                    <div key={ord.id} className="pos-online-card">
                      <div className="pos-ord-top">
                        <span className="pos-ord-inv">{ord.invoiceNumber}</span>
                        <span className="pos-ord-time">{ord.orderTime}</span>
                        <span className={`pos-ord-status ${ord.status.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="pos-ord-cust">
                        <strong>{ord.customer.fullName}</strong> (+91 {ord.customer.phone})
                        <div className="pos-ord-city">📍 {ord.shippingAddress?.city}, {ord.shippingAddress?.state}</div>
                      </div>

                      <div className="pos-ord-items">
                        {ord.items?.map((it, idx) => (
                          <span key={idx} className="pos-ord-item-chip">
                            {it.name} ({it.weight}) × {it.quantity}
                          </span>
                        ))}
                      </div>

                      <div className="pos-ord-bottom">
                        <div className="pos-ord-price">
                          ₹{ord.grandTotal}{' '}
                          <small>({ord.paymentMethod === 'upi' ? 'Paid via UPI' : 'Cash on Delivery'})</small>
                        </div>
                        <div className="pos-ord-btns">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="btn-pos-accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              ✓ Accept Order
                            </button>
                          )}
                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="btn-pos-dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                              </svg>
                              Mark Dispatched
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-pos-print"
                            onClick={() => openInvoice(ord)}
                          >
                            Print Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          3. MAIN TERMINAL WORKSPACE (REGISTER OR SHIFT LEDGER)
         =================================================== */}
      {posTab === 'register' ? (
        <main className={`pos-main-split ${mobileTab === 'catalog' ? 'show-catalog' : 'show-bill'}`}>
          {/* LEFT COLUMN: SWEET CATALOG & QUICK WEIGH / PACK TILES */}
          <section className="pos-catalog-pane">
            {/* Quick Toolbar: Search & Shortcuts */}
            <div className="pos-catalog-toolbar">
              <div className="pos-search">
                <span className="pos-search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search sweet or box... (Press F2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              {/* Held Bills Quick Indicator */}
              {heldBills.length > 0 && (
                <div className="held-bills-banner">
                  <span>⏸ {heldBills.length} Bill(s) on Hold:</span>
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

            {/* Sweet Catalog Tiles Grid */}
            <div className="pos-sweets-grid">
              {filteredSweets.map((sweet) => {
                const isBeverageOrSnack = Boolean(sweet.unit);
                const unitLabel = sweet.unit ? (sweet.unit.toLowerCase().includes('pc') ? 'pcs' : 'cups') : 'kg';
                const sweetStock = inventory.find((it) => it.id === sweet.id);
                const currentStock = sweetStock?.stockKg ?? (sweet.price ? 80 : 20);
                const isOutOfStock = currentStock <= 0.1;
                const isLow = currentStock <= (isBeverageOrSnack ? 15 : 8);

                return (
                  <div
                    key={sweet.id}
                    className={`pos-sweet-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  >
                    <div className="pos-sweet-card__top">
                      <img
                        src={sweet.image}
                        alt={sweet.name}
                        className="pos-sweet-img"
                        loading="lazy"
                      />
                      <div className="pos-sweet-info">
                        <h4 className="pos-sweet-title">{sweet.name}</h4>
                        <span className="pos-sweet-tagline">{sweet.tagline}</span>
                        <div className={`pos-stock-tag ${isLow ? 'low' : ''}`}>
                          {isOutOfStock ? '⚠️ Out of Stock' : `Stock: ${currentStock} ${unitLabel}`}
                        </div>
                      </div>
                    </div>

                    {/* Terminal Weight Quick Buttons & Custom Scale Trigger */}
                    <div className="pos-weight-buttons">
                      {sweet.prices ? (
                        <>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, '250g')}
                          >
                            <span className="pack-label">250g</span>
                            <span className="pack-price">₹{sweet.prices['250g']}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn highlight"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, '500g')}
                          >
                            <span className="pack-label">500g</span>
                            <span className="pack-price">₹{sweet.prices['500g']}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, '1kg')}
                          >
                            <span className="pack-label">1 kg</span>
                            <span className="pack-price">₹{sweet.prices['1kg']}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn scale-btn"
                            disabled={isOutOfStock}
                            onClick={() => {
                              setScaleModalSweet(sweet);
                              setCustomGrams('350');
                            }}
                            title="Weigh loose grams on electronic scale"
                          >
                            <span className="pack-label">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                                <path d="M7 21h10" />
                                <path d="M12 3v18" />
                                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                              </svg>
                              Scale...
                            </span>
                            <span className="pack-price">Custom</span>
                          </button>
                        </>
                      ) : sweet.id === 'assorted-box' ? (
                        <button
                          type="button"
                          className="pos-pack-btn box-btn highlight"
                          disabled={isOutOfStock}
                          onClick={() => handleAddSweetToBill(sweet, 'Standard 4-in-1 Box')}
                        >
                          <span className="pack-label">Royal Gift Box Pack</span>
                          <span className="pack-price">₹{sweet.price}</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="pos-pack-btn highlight"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 1)}
                            title={`Add 1 ${sweet.unit || 'Cup'} to bill`}
                          >
                            <span className="pack-label">+1 {sweet.unit ? (sweet.unit.includes('Pc') ? 'Pc' : 'Cup') : 'Qty'}</span>
                            <span className="pack-price">₹{sweet.price}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 2)}
                            title={`Add 2 ${sweet.unit || 'Cups'} to bill`}
                          >
                            <span className="pack-label">+2 Qty</span>
                            <span className="pack-price">₹{sweet.price * 2}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 3)}
                            title={`Add 3 ${sweet.unit || 'Cups'} to bill`}
                          >
                            <span className="pack-label">+3 Qty</span>
                            <span className="pack-price">₹{sweet.price * 3}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 5)}
                            title={`Add 5 ${sweet.unit || 'Cups'} to bill`}
                          >
                            <span className="pack-label">+5 Qty</span>
                            <span className="pack-price">₹{sweet.price * 5}</span>
                          </button>
                        </>
                      )}
                    </div>
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
                    <span className="cart-badge-icon">🛒</span>
                    <div className="summary-text">
                      <strong>{billItems.reduce((s, it) => s + it.quantity, 0)} Items Added</strong>
                      <small>{billItems.length} varieties · Tap to review</small>
                    </div>
                  </div>
                  <div className="summary-right">
                    <span className="summary-amount">₹{billGrandTotal}</span>
                    <span className="summary-cta">View Bill & Pay ➔</span>
                  </div>
                </button>
              </div>
            )}
        </section>

        {/* RIGHT COLUMN: ACTIVE POS CASH REGISTER & TERMINAL NUMPAD */}
        <section className="pos-bill-pane">
          {/* Mobile Return to Sweets Catalog Button */}
          <div className="pos-bill-mobile-back mobile-only">
            <button
              type="button"
              className="btn-back-to-catalog"
              onClick={() => setMobileTab('catalog')}
            >
              ← Back to Sweets Catalog
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
                    title="Hold current bill temporarily to serve next customer"
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

          {/* Customer Fast Phone & Name Input */}
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

          {/* Active Bill Items Table */}
          <div className="pos-bill-items">
            {billItems.length === 0 ? (
              <div className="pos-empty-bill">
                <div className="pos-empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                    <line x1="8" y1="7" x2="16" y2="7" />
                    <line x1="8" y1="11" x2="16" y2="11" />
                    <line x1="8" y1="15" x2="13" y2="15" />
                  </svg>
                </div>
                <p className="pos-empty-title">Register is Ready</p>
                <p className="pos-empty-sub">
                  Tap any sweet or pack size on the left to add items to this bill.
                </p>
              </div>
            ) : (
              <div className="pos-items-table">
                {billItems.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="pos-bill-line">
                    <div className="pos-line-info">
                      <span className="pos-line-name">{item.name}</span>
                      <span className="pos-line-weight">{item.weight}</span>
                    </div>

                    {/* Stepper */}
                    <div className="pos-line-stepper">
                      <button
                        type="button"
                        className="line-step-btn"
                        onClick={() => handleUpdateBillQty(item.id, item.weight, -1)}
                      >
                        −
                      </button>
                      <span className="line-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="line-step-btn"
                        onClick={() => handleUpdateBillQty(item.id, item.weight, 1)}
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
                ))}
              </div>
            )}
          </div>

          {/* Bill Calculation & Summary */}
          <div className="pos-bill-calc">
            <div className="calc-item">
              <span>Items in Cart</span>
              <span className="calc-val-bold">
                {billItems.reduce((sum, it) => sum + it.quantity, 0)} items ({billItems.length} varieties)
              </span>
            </div>
            <div className="calc-item">
              <span>Subtotal (Taxable)</span>
              <span>₹{billSubtotal.toFixed(2)}</span>
            </div>
            <div className="calc-item">
              <span>GST @ 5% (CGST 2.5% + SGST 2.5%)</span>
              <span>₹{billGst.toFixed(2)}</span>
            </div>
            <div className="calc-item total">
              <span>Total Payable</span>
              <span className="grand-total-highlight" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
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

            {/* Mode Confirmation Cards (Zero Manual Typing Required) */}
            {paymentMode === 'cash' && billGrandTotal > 0 && (
              <div className="pos-mode-summary-card cash">
                <div className="pos-mode-icon-badge">💵</div>
                <div className="pos-mode-info">
                  <strong>Cash Settle · Auto-Calculated</strong>
                  <p>Bill of ₹{billGrandTotal} ready. Click below or press Enter to finalize.</p>
                </div>
                <span className="pos-mode-tag green">Auto Ready</span>
              </div>
            )}

            {paymentMode === 'upi' && (
              <div className="pos-mode-summary-card upi">
                <div className="pos-mode-icon-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2" />
                  </svg>
                </div>
                <div className="pos-mode-info">
                  <strong>Display Dynamic UPI QR</strong>
                  <p>Customer scans with GPay / PhonePe / Paytm to pay ₹{billGrandTotal}.</p>
                </div>
                <span className="pos-mode-tag upi">Scan QR</span>
              </div>
            )}

            {paymentMode === 'card' && (
              <div className="pos-mode-summary-card card">
                <div className="pos-mode-icon-badge">💳</div>
                <div className="pos-mode-info">
                  <strong>Card Swipe / Contactless POS</strong>
                  <p>Charge ₹{billGrandTotal} on external EDC machine, then click below to finalize.</p>
                </div>
                <span className="pos-mode-tag card">POS Ready</span>
              </div>
            )}

            {/* Finalize Bill & Print Button */}
            <button
              type="button"
              disabled={billItems.length === 0}
              className="btn btn-gold pos-complete-btn"
              onClick={handleCompleteSale}
            >
              <span>⚡ Finalize Bill & Print Receipt (₹{billGrandTotal})</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 14h12v8H6z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="pos-keyboard-hint">
              <span>Shortcut: Press <strong>Enter</strong> or <strong>F9</strong> to finalize bill & print</span>
            </div>
          </div>
        </section>
      </main>
      ) : (
        <main className="pos-shift-bills-wrapper">
          {/* Shift Header Strip */}
          <div className="shift-header-strip">
            <div className="shift-header-left">
              <h2 className="shift-view-title">🧾 Cashier Shift Billing Ledger</h2>
              <div className="shift-cashier-meta">
                <span className="meta-badge cashier-badge">
                  👤 Cashier: <strong>{user?.name || 'Cashier Counter'}</strong> ({user?.username || 'cashier'})
                </span>
                <span className="meta-badge counter-badge">
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
                <svg
                  className={isRefreshingBills ? 'spin' : ''}
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isRefreshingBills ? 'Syncing...' : 'Refresh Bills'}</span>
              </button>
              <button
                type="button"
                className="btn-shift-new-sale"
                onClick={() => setPosTab('register')}
              >
                🛒 Return to POS Register
              </button>
            </div>
          </div>

          {/* Shift KPI Summary Cards */}
          <div className="shift-kpis-grid">
            <div className="shift-kpi-card total">
              <span className="kpi-label">Total Shift Revenue</span>
              <div className="kpi-val">₹{myShiftTotalRevenue.toLocaleString('en-IN')}</div>
              <span className="kpi-sub">{myShiftBills.length} Invoices Generated</span>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search invoice no (POS-...), customer name or phone..."
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
                { id: 'all', label: 'All Payments' },
                { id: 'cash', label: '💵 Cash' },
                { id: 'upi', label: '📱 UPI' },
                { id: 'card', label: '💳 Card' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`shift-chip ${billPaymentFilter === f.id ? 'active' : ''}`}
                  onClick={() => setBillPaymentFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Invoices Table / Card */}
          <div className="shift-table-container">
            {filteredShiftBills.length === 0 ? (
              <div className="shift-empty-state">
                <div className="shift-empty-icon">🧾</div>
                <h3>No Invoices Found</h3>
                <p>
                  {myShiftBills.length === 0
                    ? 'No sales recorded on this terminal yet. Click below to start billing customers.'
                    : 'No invoices match the current search or payment filter.'}
                </p>
                {myShiftBills.length === 0 && (
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => setPosTab('register')}
                  >
                    🛒 Open POS Register
                  </button>
                )}
              </div>
            ) : (
              <div className="shift-table-card">
                <table className="shift-invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Time</th>
                      <th>Customer Details</th>
                      <th>Items Sold</th>
                      <th>Payment Mode</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                          <span className="shift-date-sub">{bill.orderDate}</span>
                        </td>
                        <td>
                          <div className="cust-name-row">
                            <strong>{bill.customer?.fullName || 'Walk-in Guest'}</strong>
                          </div>
                          <div className="cust-phone-sub">
                            📞 {bill.customer?.phone || 'Store Counter'}
                          </div>
                        </td>
                        <td>
                          <div className="shift-items-list">
                            {bill.items?.map((it, idx) => (
                              <span key={idx} className="shift-item-pill">
                                {it.name} ({it.weight}) × {it.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`payment-pill ${bill.paymentMethod?.toLowerCase()}`}>
                            {bill.paymentMethod === 'upi' ? '📱 UPI QR' : bill.paymentMethod === 'card' ? '💳 Card POS' : '💵 Cash'}
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
                            title="View & Print Official GST Tax Receipt"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <path d="M6 14h12v8H6z" />
                            </svg>
                            <span>Print Bill</span>
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
          4. LOOSE WEIGHT SCALE POPUP MODAL
         =================================================== */}
      <AnimatePresence>
        {scaleModalSweet && (
          <div className="admin-modal-portal">
            <motion.div
              className="admin-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setScaleModalSweet(null)}
            />

            <motion.div
              className="scale-modal"
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="scale-modal__header">
                <div>
                  <span className="scale-eyebrow">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                      <path d="M7 21h10" />
                      <path d="M12 3v18" />
                      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                    </svg>
                    Counter Weighing Scale
                  </span>
                  <h3 className="scale-title">Weigh Loose: {scaleModalSweet.name}</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setScaleModalSweet(null)}
                >
                  ✕
                </button>
              </div>

              {/* Quick Preset Gram Buttons */}
              <div className="scale-presets">
                <label>Quick Presets:</label>
                <div className="preset-chips">
                  {['100', '150', '200', '350', '600', '750', '1250'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`preset-chip ${customGrams === g ? 'active' : ''}`}
                      onClick={() => setCustomGrams(g)}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Scale Reading in Grams */}
              <form onSubmit={handleAddCustomWeightToBill} className="scale-form">
                <div className="scale-input-group">
                  <label>Scale Reading (in grams):</label>
                  <div className="scale-input-wrap">
                    <input
                      type="number"
                      step="5"
                      min="10"
                      value={customGrams}
                      onChange={(e) => setCustomGrams(e.target.value)}
                      autoFocus
                    />
                    <span className="scale-unit">grams</span>
                  </div>
                </div>

                {/* Price Preview */}
                <div className="scale-price-preview">
                  <span>Computed Cost:</span>
                  <strong className="computed-cost">
                    ₹
                    {Math.round(
                      ((scaleModalSweet.prices?.['500g'] || scaleModalSweet.price) / 500) *
                        (parseFloat(customGrams) || 0)
                    )}
                  </strong>
                </div>

                <div className="scale-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setScaleModalSweet(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold">
                    + Add {customGrams}g to Bill
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================
          5. UNIVERSAL STOCK MODALS (ADD & REFILL)
         =================================================== */}
      <AnimatePresence>
        {isAddStockOpen && (
          <AddStockModal
            isOpen={isAddStockOpen}
            onClose={() => setIsAddStockOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRefillOpen && (
          <RefillStockModal
            isOpen={isRefillOpen}
            onClose={() => setIsRefillOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ===================================================
          6. MOBILE CASHIER MENU DRAWER (Slide-out Navigation)
         =================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="pos-mobile-menu-portal" data-lenis-prevent>
            <motion.div
              className="pos-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              className="pos-mobile-drawer"
              data-lenis-prevent
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="mobile-drawer-header">
                <div className="drawer-user-info">
                  <div className="drawer-user-avatar">👤</div>
                  <div>
                    <h4 className="drawer-user-name">{user?.name || 'Cashier Counter'}</h4>
                    <span className="drawer-user-role">
                      {user?.role === 'admin' ? 'Store Administrator' : 'Terminal Cashier'} · {user?.counter || 'Desk 01'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="mobile-drawer-body">
                {/* Mode Navigation */}
                <div className="drawer-group">
                  <span className="drawer-group-title">POS WORKSPACE</span>
                  <button
                    type="button"
                    className={`drawer-menu-item ${posTab === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setPosTab('register');
                      setMobileTab('catalog');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🛒</span>
                    <div className="item-text">
                      <strong>New POS Counter Sale</strong>
                      <small>Product catalog & active customer bill</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`drawer-menu-item ${posTab === 'my-bills' ? 'active' : ''}`}
                    onClick={() => {
                      setPosTab('my-bills');
                      handleRefreshShiftBills();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🧾</span>
                    <div className="item-text">
                      <strong>My Shift Invoices</strong>
                      <small>{myShiftBills.length} invoices generated</small>
                    </div>
                    <span className="drawer-count-badge">{myShiftBills.length}</span>
                  </button>
                </div>

                {/* Online Orders Queue */}
                <div className="drawer-group">
                  <span className="drawer-group-title">ONLINE DISPATCH</span>
                  <button
                    type="button"
                    className="drawer-menu-item"
                    onClick={() => {
                      setShowOnlineOrders(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🌐</span>
                    <div className="item-text">
                      <strong>Online Delivery Orders</strong>
                      <small>Kitchen dispatch & bill printing</small>
                    </div>
                    {pendingOnlineOrders.length > 0 && (
                      <span className="drawer-alert-badge">{pendingOnlineOrders.length} New</span>
                    )}
                  </button>
                </div>

                {/* Counter Stock */}
                <div className="drawer-group">
                  <span className="drawer-group-title">INVENTORY & TRAYS</span>
                  <button
                    type="button"
                    className="drawer-menu-item"
                    onClick={() => {
                      setIsAddStockOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">➕</span>
                    <div className="item-text">
                      <strong>Add Production Stock</strong>
                      <small>Receive kitchen batches or new sweets</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="drawer-menu-item"
                    onClick={() => {
                      setIsRefillOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🔄</span>
                    <div className="item-text">
                      <strong>Refill Counter Trays</strong>
                      <small>Quickly update display tray weights</small>
                    </div>
                  </button>
                </div>

                {/* General Links */}
                <div className="drawer-group">
                  <span className="drawer-group-title">GENERAL</span>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      className="drawer-menu-item"
                      onClick={() => {
                        window.location.hash = '#admin';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span className="item-icon">👑</span>
                      <div className="item-text">
                        <strong>Admin Dashboard</strong>
                        <small>Full sales analytics & reports</small>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    className="drawer-menu-item"
                    onClick={() => {
                      window.location.hash = '';
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🏪</span>
                    <div className="item-text">
                      <strong>Store Customer Frontpage</strong>
                      <small>Return to customer online store</small>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  className="drawer-logout-btn"
                  onClick={() => {
                    logout();
                    window.location.hash = '';
                  }}
                >
                  <span className="item-icon">🚪</span>
                  <span>Logout Staff Session</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
