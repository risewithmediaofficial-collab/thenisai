import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG, SPECIAL_BOX, GST_RATE } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import './BillingCounter.css';

// Predefined categories for fast POS filtering
const CATEGORIES = [
  { id: 'all', label: 'All Sweets' },
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
    acceptOrder,
    updateOrderStatus,
    addCounterSale,
    addInventoryStock,
    openInvoice,
    navigateTo,
  } = useCart();

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

  // Loose Weight Scale Modal state
  const [scaleModalSweet, setScaleModalSweet] = useState(null);
  const [customGrams, setCustomGrams] = useState('350');

  // Stock Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);

  // Online orders drawer / tab toggle
  const [showOnlineOrders, setShowOnlineOrders] = useState(false);

  // Search input ref for keyboard shortcut (F2)
  const searchInputRef = useRef(null);

  // Freeze background screen scroll when scale or stock popups are active
  useScrollLock(Boolean(scaleModalSweet) || isAddStockOpen || isRefillOpen);

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
  const handleAddSweetToBill = (sweet, weight = '500g') => {
    const price = sweet.prices ? sweet.prices[weight] : sweet.price;

    setBillItems((prev) => {
      const idx = prev.findIndex((i) => i.id === sweet.id && i.weight === weight);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: sweet.id,
            name: sweet.name,
            weight,
            price,
            quantity: 1,
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
  const handleCompleteSale = (e) => {
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

    const savedOrder = addCounterSale(saleData);
    handleClearBill();
    openInvoice(savedOrder);
  };



  // Filtered sweets based on category and search query
  const allSweetsWithBox = [SPECIAL_BOX, ...SWEETS_CATALOG];
  const filteredSweets = allSweetsWithBox.filter((sw) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      sw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sw.tagline.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
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
        <div className="pos-brand">
          <h1 className="pos-title">Thenisai Sweets POS Billing</h1>
        </div>

        {/* Action Controls: Online Orders + Refill Tray Stock + Staff Info */}
        <div className="pos-header-actions">
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
          3. MAIN TERMINAL BILLING SPLIT WORKSPACE
         =================================================== */}
      <main className="pos-main-split">
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

          {/* Sweets Grid */}
          <div className="pos-sweets-grid">
            {filteredSweets.map((sweet) => {
              const currentStock = inventory.find((inv) => inv.id === sweet.id)?.stockKg ?? 20;
              const isLow = currentStock <= 8;

              return (
                <div key={sweet.id} className="pos-sweet-card">
                  <div className="pos-sweet-card__top">
                    <img src={sweet.image} alt={sweet.name} className="pos-sweet-img" />
                    <div className="pos-sweet-info">
                      <h4 className="pos-sweet-title">{sweet.name}</h4>
                      <span className="pos-sweet-tagline">{sweet.tagline}</span>
                      <div className={`pos-stock-tag ${isLow ? 'low' : ''}`}>
                        Stock: <strong>{currentStock} kg</strong>
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
                          onClick={() => handleAddSweetToBill(sweet, '250g')}
                        >
                          <span className="pack-label">250g</span>
                          <span className="pack-price">₹{sweet.prices['250g']}</span>
                        </button>
                        <button
                          type="button"
                          className="pos-pack-btn highlight"
                          onClick={() => handleAddSweetToBill(sweet, '500g')}
                        >
                          <span className="pack-label">500g</span>
                          <span className="pack-price">₹{sweet.prices['500g']}</span>
                        </button>
                        <button
                          type="button"
                          className="pos-pack-btn"
                          onClick={() => handleAddSweetToBill(sweet, '1kg')}
                        >
                          <span className="pack-label">1 kg</span>
                          <span className="pack-price">₹{sweet.prices['1kg']}</span>
                        </button>
                        <button
                          type="button"
                          className="pos-pack-btn scale-btn"
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
                            Loose wt
                          </span>
                          <span className="pack-price">Scale</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="pos-pack-btn box-btn"
                        onClick={() => handleAddSweetToBill(sweet, sweet.weight || '1kg')}
                      >
                        <span className="pack-label">{sweet.weight || '1kg Box'}</span>
                        <span className="pack-price">₹{sweet.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: ACTIVE POS CASH REGISTER & TERMINAL NUMPAD */}
        <section className="pos-bill-pane">
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
    </div>
  );
}
