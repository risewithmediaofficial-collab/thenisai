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

  // Catalog View Switcher: 'grid' (Card Tiles) | 'list' (Fast Compact Rows)
  const [catalogLayout, setCatalogLayout] = useState('grid');

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

  // Stock Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);

  // Online orders drawer
  const [showOnlineOrders, setShowOnlineOrders] = useState(false);

  // Mobile UI state: 'catalog' vs 'bill' view, and mobile side-nav drawer
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'bill'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search input ref for keyboard shortcut (F2)
  const searchInputRef = useRef(null);

  // Freeze background screen scroll when popups or drawers are active
  useScrollLock(
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
        setIsAddStockOpen(false);
        setIsRefillOpen(false);
        setIsMobileMenuOpen(false);
        setShowOnlineOrders(false);
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
  const pendingOnlineOrders = orders.filter(
    (o) => o.source === 'online' && (o.status === 'New' || o.status === 'Accepted')
  );

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

  // Filtered products based on search and category
  const allProducts = ALL_BILLING_ITEMS;
  const filteredSweets = allProducts.filter((sw) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      sw.name.toLowerCase().includes(q) ||
      (sw.tamilName && sw.tamilName.includes(searchQuery.trim())) ||
      (sw.englishName && sw.englishName.toLowerCase().includes(q)) ||
      (sw.tagline && sw.tagline.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'tea') return sw.id.includes('tea') || sw.id === 'ginger-lemon';
    if (selectedCategory === 'coffee') return sw.id.includes('coffee');
    if (selectedCategory === 'malt') return sw.id.includes('milk') || sw.id === 'horlicks' || sw.id === 'boost' || sw.id === 'ragi-malt';
    if (selectedCategory === 'beverages') return sw.category === 'beverages';
    if (selectedCategory === 'snacks') return sw.category === 'snacks' || sw.id === 'vada';
    return true;
  });

  return (
    <div className="billing-pos-root side-layout">
      {/* 1. LEFT SIDE NAVIGATION BAR (No Cluttered Top Navbar) */}
      <SideNavbar
        currentSection={posTab === 'register' ? 'pos-register' : 'pos-bills'}
        onSelectSection={(sec) => {
          if (sec === 'pos-register') {
            setPosTab('register');
            setMobileTab('catalog');
          } else if (sec === 'pos-bills') {
            setPosTab('my-bills');
            handleRefreshShiftBills();
          }
        }}
        onOpenRefill={() => setIsRefillOpen(true)}
        onOpenAddStock={() => setIsAddStockOpen(true)}
        onOpenOnlineOrders={() => setShowOnlineOrders(true)}
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
            <span>{user?.counter || 'Terminal 01'}</span>
          </div>

          {posTab === 'register' && (
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
          )}

          <button
            type="button"
            className={`pos-mobile-bell-btn ${pendingOnlineOrders.length > 0 ? 'has-pending' : ''}`}
            onClick={() => setShowOnlineOrders(true)}
            aria-label="Online Orders"
          >
            🔔
            {pendingOnlineOrders.length > 0 && (
              <span className="mobile-bell-badge">{pendingOnlineOrders.length}</span>
            )}
          </button>
        </header>

        {/* Incoming Online Orders Queue Drawer */}
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
                    <h3 className="drawer-title">🌐 Live Online Dispatch Queue</h3>
                    <span className="drawer-sub">Accept and print bills directly at counter</span>
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
                    ✓ All online delivery orders have been accepted and dispatched!
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

        {/* 3. MAIN TERMINAL WORKSPACE (REGISTER OR SHIFT LEDGER) */}
        {posTab === 'register' ? (
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
                    placeholder="Search product (டீ, Coffee, வடை)... (Press F2)"
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

              {/* GRID VIEW */}
              {catalogLayout === 'grid' && (
                <div className="pos-sweets-grid">
                  {filteredSweets.map((sweet) => {
                    const unitName = sweet.unit?.includes('Pc') ? 'Pc' : 'Cup';
                    const sweetStock = inventory.find((it) => it.id === sweet.id);
                    const currentStock = sweetStock?.stockKg ?? 80;
                    const isOutOfStock = currentStock <= 0.1;
                    const isLow = currentStock <= 15;

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
                              {isOutOfStock ? '⚠️ Out of Stock' : `Stock: ${currentStock} ${unitName === 'Pc' ? 'pcs' : 'cups'}`}
                            </div>
                          </div>
                        </div>

                        {/* Quick Cup Quantity Buttons: 1, 2, 3, 5 */}
                        <div className="pos-weight-buttons">
                          <button
                            type="button"
                            className="pos-pack-btn highlight"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 1)}
                            title={`Add 1 ${unitName} to bill`}
                          >
                            <span className="pack-label">+1 {unitName}</span>
                            <span className="pack-price">₹{sweet.price}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 2)}
                            title={`Add 2 ${unitName}s to bill`}
                          >
                            <span className="pack-label">+2 Qty</span>
                            <span className="pack-price">₹{sweet.price * 2}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 3)}
                            title={`Add 3 ${unitName}s to bill`}
                          >
                            <span className="pack-label">+3 Qty</span>
                            <span className="pack-price">₹{sweet.price * 3}</span>
                          </button>
                          <button
                            type="button"
                            className="pos-pack-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 5)}
                            title={`Add 5 ${unitName}s to bill`}
                          >
                            <span className="pack-label">+5 Qty</span>
                            <span className="pack-price">₹{sweet.price * 5}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST VIEW (Fast Compact Table) */}
              {catalogLayout === 'list' && (
                <div className="pos-sweets-list">
                  {filteredSweets.map((sweet) => {
                    const unitName = sweet.unit?.includes('Pc') ? 'Pc' : 'Cup';
                    const sweetStock = inventory.find((it) => it.id === sweet.id);
                    const currentStock = sweetStock?.stockKg ?? 80;
                    const isOutOfStock = currentStock <= 0.1;

                    return (
                      <div key={sweet.id} className={`pos-list-row ${isOutOfStock ? 'out-of-stock' : ''}`}>
                        <img src={sweet.image} alt={sweet.name} className="pos-list-img" loading="lazy" />
                        <div className="pos-list-info">
                          <div className="pos-list-title-wrap">
                            <h4 className="pos-list-title">{sweet.name}</h4>
                            <span className="pos-list-rate">₹{sweet.price} / {unitName}</span>
                          </div>
                          <span className="pos-list-tagline">{sweet.tagline}</span>
                        </div>

                        <div className="pos-list-stock">
                          <span className="stock-count">{currentStock} {unitName === 'Pc' ? 'pcs' : 'cups'}</span>
                        </div>

                        <div className="pos-list-actions">
                          <button
                            type="button"
                            className="pos-list-btn highlight"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 1)}
                            title={`Add 1 ${unitName}`}
                          >
                            +1 {unitName}
                          </button>
                          <button
                            type="button"
                            className="pos-list-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 2)}
                            title={`Add 2 ${unitName}s`}
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            className="pos-list-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 3)}
                            title={`Add 3 ${unitName}s`}
                          >
                            +3
                          </button>
                          <button
                            type="button"
                            className="pos-list-btn"
                            disabled={isOutOfStock}
                            onClick={() => handleAddSweetToBill(sweet, sweet.unit || '1 Cup', 5)}
                            title={`Add 5 ${unitName}s`}
                          >
                            +5
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
        ) : (
          /* ===================================================
              SHIFT INVOICES LEDGER
             =================================================== */
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
      </div>

      {/* MODALS */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
      />

      <RefillStockModal
        isOpen={isRefillOpen}
        onClose={() => setIsRefillOpen(false)}
      />
    </div>
  );
}
