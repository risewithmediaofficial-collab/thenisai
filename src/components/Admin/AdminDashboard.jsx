import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG, ALL_BILLING_ITEMS } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import SideNavbar from '../Nav/SideNavbar';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    bills,
    fetchBills,
    inventory,
    acceptOrder,
    updateOrderStatus,
    addInventoryStock,
    openInvoice,
    navigateTo,
  } = useCart();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'sales'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'New' | 'Accepted' | 'Dispatched' | 'Delivered'
  const [searchTerm, setSearchTerm] = useState('');

  // Sales Tab Filters & States
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesCashierFilter, setSalesCashierFilter] = useState('all');
  const [salesSourceFilter, setSalesSourceFilter] = useState('all'); // 'all' | 'counter' | 'online'
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card'
  const [isSyncingSales, setIsSyncingSales] = useState(false);

  // Stock Modals & Mobile Sidebar State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock scroll on background when modals or mobile drawers are open
  useScrollLock(isAddStockOpen || isRefillOpen || isMobileMenuOpen);

  // Consolidate all sales: counter bills from DB + online orders
  const allSales = useMemo(() => {
    const map = new Map();
    // Add bills from database (/api/bills)
    (bills || []).forEach((b) => {
      const key = b.invoiceNumber || b.id;
      if (key) map.set(key, { ...b, source: b.source || 'counter' });
    });
    // Add orders (online website orders & fallback)
    (orders || []).forEach((o) => {
      const key = o.invoiceNumber || o.id;
      if (key && !map.has(key)) {
        map.set(key, o);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }, [bills, orders]);

  // High-level combined KPIs
  const totalRevenue = allSales.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const onlineOrders = allSales.filter((o) => o.source === 'online');
  const counterSales = allSales.filter((o) => (o.source || 'counter') === 'counter' || o.source === 'walk-in');
  const pendingOrders = onlineOrders.filter((o) => o.status === 'New');
  const lowStockItems = inventory.filter((item) => item.stockKg <= item.minThreshold);

  const counterRevenue = counterSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const onlineRevenue = onlineOrders.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCashRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'cash').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalUpiRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'upi').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCardRevenue = allSales.filter((s) => (s.paymentMethod || '').toLowerCase() === 'card').reduce((sum, s) => sum + (s.grandTotal || 0), 0);

  // Cashier Performance Aggregation
  const cashierSummary = useMemo(() => {
    const map = {};
    allSales.forEach((sale) => {
      if (sale.cashier || (sale.source || 'counter') === 'counter' || sale.source === 'walk-in') {
        const cid = sale.cashier?.username || sale.cashier?.id || 'counter-desk';
        const name = sale.cashier?.name || 'Counter Staff';
        const counter = sale.cashier?.counter || 'Counter Desk';
        if (!map[cid]) {
          map[cid] = {
            id: cid,
            name,
            counter,
            role: sale.cashier?.role || 'cashier',
            billCount: 0,
            totalAmount: 0,
            cash: 0,
            upi: 0,
            card: 0,
          };
        }
        map[cid].billCount += 1;
        const amt = sale.grandTotal || 0;
        map[cid].totalAmount += amt;
        const pm = (sale.paymentMethod || '').toLowerCase();
        if (pm === 'cash') map[cid].cash += amt;
        else if (pm === 'upi') map[cid].upi += amt;
        else if (pm === 'card') map[cid].card += amt;
      }
    });
    return Object.values(map);
  }, [allSales]);

  // Filtered sales for Tab 3
  const filteredSales = allSales.filter((sale) => {
    const sSource = sale.source === 'online' ? 'online' : 'counter';
    if (salesSourceFilter !== 'all' && sSource !== salesSourceFilter) return false;

    const sPayment = (sale.paymentMethod || '').toLowerCase();
    if (salesPaymentFilter !== 'all' && sPayment !== salesPaymentFilter) return false;

    if (salesCashierFilter !== 'all') {
      const cid = sale.cashier?.username || sale.cashier?.id;
      if (cid !== salesCashierFilter) return false;
    }

    if (salesSearchTerm.trim()) {
      const term = salesSearchTerm.toLowerCase();
      const matchInv = sale.invoiceNumber?.toLowerCase().includes(term);
      const matchCust = sale.customer?.fullName?.toLowerCase().includes(term);
      const matchPhone = sale.customer?.phone?.includes(term);
      const matchCashier =
        sale.cashier?.name?.toLowerCase().includes(term) ||
        sale.cashier?.username?.toLowerCase().includes(term);
      if (!matchInv && !matchCust && !matchPhone && !matchCashier) return false;
    }

    return true;
  });

  const handleSyncAllSales = async () => {
    setIsSyncingSales(true);
    try {
      await fetchBills();
    } finally {
      setTimeout(() => setIsSyncingSales(false), 400);
    }
  };

  // Filtered orders list for Tab 1
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      orderFilter === 'all'
        ? true
        : order.status?.toLowerCase() === orderFilter.toLowerCase();

    const matchesSearch =
      searchTerm.trim() === '' ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });



  return (
    <div className="admin-root side-layout">
      {/* 1. Sleek Left Side Navbar */}
      <SideNavbar
        currentSection={`admin-${activeTab}`}
        onSelectSection={(sec) => {
          if (sec === 'admin-orders') setActiveTab('orders');
          else if (sec === 'admin-inventory') setActiveTab('inventory');
          else if (sec === 'admin-sales') {
            setActiveTab('sales');
            handleSyncAllSales();
          }
        }}
        onOpenRefill={() => setIsRefillOpen(true)}
        onOpenAddStock={() => setIsAddStockOpen(true)}
        pendingOnlineCount={pendingOrders.length}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Admin Content Area beside Side Navbar */}
      <div className="admin-content-area">
        {/* Compact Mobile Strip with Hamburger Trigger */}
        <header className="admin-mobile-strip mobile-only">
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Navigation"
          >
            <span className="hamburger-icon">☰</span>
          </button>
          <div className="mobile-strip-brand">
            <strong>THENISAI ADMIN</strong>
            <span>Management & Inventory</span>
          </div>
          <div className="admin-mobile-actions">
            <button
              type="button"
              className="admin-mobile-refill-btn"
              onClick={() => setIsRefillOpen(true)}
              title="Quick Refill"
            >
              🔄 Refill
            </button>
          </div>
        </header>

      <main className="admin-container">
        {/* KPI Cards Grid */}
        <section className="admin-kpi-grid">
          <div className="kpi-card revenue">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <span className="kpi-sub">Online + Store Counter</span>
          </div>

          <div className={`kpi-card pending ${pendingOrders.length > 0 ? 'pulse' : ''}`}>
            <span className="kpi-label">Pending Online Orders</span>
            <div className="kpi-value">{pendingOrders.length}</div>
            <span className="kpi-sub">
              {pendingOrders.length > 0 ? 'Requires immediate packing' : 'All clear'}
            </span>
          </div>

          <div className="kpi-card online">
            <span className="kpi-label">Total Online Orders</span>
            <div className="kpi-value">{onlineOrders.length}</div>
            <span className="kpi-sub">Deliveries across TN</span>
          </div>

          <div className={`kpi-card stock ${lowStockItems.length > 0 ? 'alert' : ''}`}>
            <span className="kpi-label">Low Stock Alerts</span>
            <div className="kpi-value">{lowStockItems.length}</div>
            <span className="kpi-sub">
              {lowStockItems.length > 0 ? `${lowStockItems.map((s) => s.name).join(', ')}` : 'Ample stock available'}
            </span>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>Online Orders</span>
            {pendingOrders.length > 0 && (
              <span className="tab-pill alert">{pendingOrders.length} New</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span>Kitchen Inventory & Batches</span>
            {lowStockItems.length > 0 && (
              <span className="tab-pill warning">{lowStockItems.length} Low</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('sales');
              handleSyncAllSales();
            }}
          >
            <span>All Sales & Billing Log</span>
            <span className="tab-pill">{allSales.length}</span>
          </button>
        </div>

        {/* =========================================
            TAB 1: ONLINE ORDERS PROCESSING
           ========================================= */}
        {activeTab === 'orders' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <div className="filter-chips">
                {['all', 'New', 'Accepted', 'Dispatched', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-chip ${orderFilter === st ? 'active' : ''}`}
                    onClick={() => setOrderFilter(st)}
                  >
                    {st === 'all' ? 'All Orders' : st}
                    {st === 'New' && pendingOrders.length > 0 && ` (${pendingOrders.length})`}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-tab-state">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3>No Orders Found</h3>
                <p>No orders currently match the selected filter.</p>
              </div>
            ) : (
              <div className="orders-cards-list">
                {filteredOrders.map((ord) => (
                  <div key={ord.id} className={`order-admin-card status-${ord.status?.toLowerCase()}`}>
                    <div className="order-admin-card__top">
                      <div className="order-id-group">
                        <span className="order-invoice-no">{ord.invoiceNumber}</span>
                        <span className="order-time-stamp">
                          {ord.orderDate} at {ord.orderTime}
                        </span>
                        <span className={`source-pill ${ord.source}`}>
                          {ord.source === 'online' ? '🌐 Online Delivery' : '🏪 In-Store Walk-in'}
                        </span>
                      </div>

                      <div className="order-status-badge">
                        <span className={`status-tag ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="order-admin-card__grid">
                      {/* Customer & Address */}
                      <div className="order-col customer">
                        <span className="col-heading">Customer & Dispatch Address</span>
                        <div className="customer-name">{ord.customer?.fullName}</div>
                        <div className="customer-contact">
                          <a href={`tel:${ord.customer?.phone}`}>📞 +91 {ord.customer?.phone}</a>
                          {ord.customer?.email && <span> · {ord.customer?.email}</span>}
                        </div>
                        {ord.shippingAddress && (
                          <div className="customer-address">
                            📍 {ord.shippingAddress.doorNo}, {ord.shippingAddress.street},{' '}
                            {ord.shippingAddress.city}, {ord.shippingAddress.state} -{' '}
                            {ord.shippingAddress.pincode}
                          </div>
                        )}
                        {ord.giftNote && (
                          <div className="gift-banner">
                            🎁 <em>"{ord.giftNote}"</em>
                          </div>
                        )}
                      </div>

                      {/* Items Ordered */}
                      <div className="order-col items">
                        <span className="col-heading">Items Ordered</span>
                        <div className="admin-items-list">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="admin-item-row">
                              <span className="it-name">{it.name}</span>
                              <span className="it-weight">({it.weight})</span>
                              <span className="it-qty">× {it.quantity}</span>
                              <span className="it-price">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-bar">
                          <span>Total Amount:</span>
                          <span className="total-amount-highlight">₹{ord.grandTotal}</span>
                          <span className="payment-pill-small">
                            {ord.paymentMethod === 'upi' ? 'Direct UPI' : 'Pay on Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Operations Actions */}
                      <div className="order-col actions">
                        <span className="col-heading">Actions & Processing</span>
                        <div className="admin-actions-group">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="act-btn accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              ✓ Accept Order
                            </button>
                          )}

                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="act-btn dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                              </svg>
                              Mark Dispatched
                            </button>
                          )}

                          {ord.status === 'Dispatched' && (
                            <button
                              type="button"
                              className="act-btn deliver"
                              onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Mark Delivered
                            </button>
                          )}

                          <button
                            type="button"
                            className="act-btn invoice"
                            onClick={() => openInvoice(ord)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                              <path d="M16 8h-8" />
                              <path d="M16 12h-8" />
                              <path d="M10 16h-2" />
                            </svg>
                            View / Print Tax Bill
                          </button>

                          {ord.customer?.phone && (
                            <a
                              href={`https://wa.me/91${ord.customer.phone}?text=Namaste%20${encodeURIComponent(
                                ord.customer.fullName
                              )},%20Thenisai%20Sweets%20has%20confirmed%20your%20order%20${ord.invoiceNumber}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="act-btn whatsapp"
                            >
                              💬 WhatsApp Customer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            TAB 2: KITCHEN INVENTORY & BATCHES
           ========================================= */}
        {activeTab === 'inventory' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <div className="toolbar-info">
                <h3 className="section-title">Fresh Sweet Batches & Daily Stock</h3>
                <p className="section-desc">
                  Inventory is automatically deducted when online or store counter orders are placed.
                </p>
              </div>

              <div className="stock-header-actions">
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
              </div>
            </div>

            <div className="inventory-grid">
              {inventory.map((item) => {
                const isLow = item.stockKg <= item.minThreshold;
                const isCritical = item.stockKg <= item.minThreshold / 2;
                const catalogMatch = (ALL_BILLING_ITEMS || SWEETS_CATALOG).find((s) => s.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`inventory-card ${isCritical ? 'critical' : isLow ? 'low' : 'healthy'}`}
                  >
                    <div className="inv-card__header">
                      {catalogMatch?.image && (
                        <img
                          src={catalogMatch.image}
                          alt={item.name}
                          className="inv-card__thumb"
                        />
                      )}
                      <div>
                        <h4 className="inv-card__title">{item.name}</h4>
                        <span className="inv-card__hsn">HSN: {catalogMatch?.hsn || '2106'}</span>
                      </div>

                      <span className={`stock-status-pill ${isCritical ? 'critical' : isLow ? 'low' : 'healthy'}`}>
                        {isCritical ? 'Critical Low' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    <div className="inv-card__body">
                      <div className="stock-number-row">
                        <span className="stock-number">{item.stockKg}</span>
                        <span className="stock-unit">kg available</span>
                      </div>

                      <div className="stock-progress-track">
                        <div
                          className="stock-progress-bar"
                          style={{
                            width: `${Math.min(100, Math.round((item.stockKg / 50) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="batch-meta">
                        <span>Last Batch: <strong>{item.batchDate}</strong></span>
                        <span>Note: <em>{item.batchNote}</em></span>
                      </div>
                    </div>

                    <div className="inv-card__actions">
                      <span className="quick-add-label">Quick Restock:</span>
                      <div className="quick-add-chips">
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 5, 'Quick +5kg Uruli Batch')}
                        >
                          +5 kg
                        </button>
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 10, 'Quick +10kg Uruli Batch')}
                        >
                          +10 kg
                        </button>
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 25, 'Kitchen Bulk Batch')}
                        >
                          +25 kg
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 3: ALL SALES & BILLING LOG
           ========================================= */}
        {activeTab === 'sales' && (
          <section className="tab-content admin-sales-tab">
            {/* Sales Stats Strip */}
            <div className="tab-toolbar admin-sales-toolbar-top">
              <div>
                <h3 className="section-title">All Sales, Cashier Desks & Invoices</h3>
                <p className="section-desc">
                  Unified audit log of all online delivery orders and counter POS sales stored in database.
                </p>
              </div>

              <button
                type="button"
                className="btn-sync-sales"
                onClick={handleSyncAllSales}
                disabled={isSyncingSales}
              >
                <svg
                  className={isSyncingSales ? 'spin' : ''}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isSyncingSales ? 'Syncing...' : 'Sync Database Bills'}</span>
              </button>
            </div>

            {/* Sales Summary Metrics Strip */}
            <div className="sales-overview-metrics">
              <div className="sales-stat-card total">
                <span className="stat-label">Gross Sales Revenue</span>
                <strong className="stat-val">₹{totalRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{allSales.length} Total Bills</span>
              </div>
              <div className="sales-stat-card counter">
                <span className="stat-label">🏪 Counter Store Sales</span>
                <strong className="stat-val">₹{counterRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{counterSales.length} In-Store Bills</span>
              </div>
              <div className="sales-stat-card online">
                <span className="stat-label">🌐 Online Web Delivery</span>
                <strong className="stat-val">₹{onlineRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{onlineOrders.length} Online Orders</span>
              </div>
              <div className="sales-stat-card payment">
                <span className="stat-label">Payment Modes</span>
                <div className="payment-split-pills">
                  <span>💵 Cash: ₹{totalCashRevenue.toLocaleString('en-IN')}</span>
                  <span>📱 UPI: ₹{totalUpiRevenue.toLocaleString('en-IN')}</span>
                  <span>💳 Card: ₹{totalCardRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Cashier Performance Cards */}
            {cashierSummary.length > 0 && (
              <div className="cashier-performance-section">
                <div className="section-sub-header">
                  <h4 className="sub-title">Staff & Cashier Counter Performance</h4>
                  <span className="sub-note">Click any cashier to filter sales below</span>
                </div>
                <div className="cashier-cards-grid">
                  {cashierSummary.map((c) => {
                    const isSelected = salesCashierFilter === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`cashier-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSalesCashierFilter(isSelected ? 'all' : c.id)}
                      >
                        <div className="cashier-card__header">
                          <div className="cashier-avatar">👤</div>
                          <div>
                            <h5 className="cashier-name">{c.name}</h5>
                            <span className="cashier-meta">{c.counter} · {c.role?.toUpperCase()}</span>
                          </div>
                          <span className={`filter-indicator-badge ${isSelected ? 'active' : ''}`}>
                            {isSelected ? '✓ Filtered' : 'Filter'}
                          </span>
                        </div>
                        <div className="cashier-card__stats">
                          <div>
                            <span className="lbl">Total Collected:</span>
                            <strong className="amt">₹{c.totalAmount.toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            <span className="lbl">Invoices:</span>
                            <strong>{c.billCount}</strong>
                          </div>
                        </div>
                        <div className="cashier-card__footer">
                          <span>💵 ₹{c.cash}</span>
                          <span>📱 ₹{c.upi}</span>
                          <span>💳 ₹{c.card}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Toolbar: Filters & Search */}
            <div className="sales-tab-filters-bar">
              <div className="sales-filter-controls">
                {/* Cashier Filter */}
                <select
                  value={salesCashierFilter}
                  onChange={(e) => setSalesCashierFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Cashiers & Attendants</option>
                  {cashierSummary.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name} ({c.counter})
                    </option>
                  ))}
                </select>

                {/* Channel Filter */}
                <select
                  value={salesSourceFilter}
                  onChange={(e) => setSalesSourceFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Channels (Counter + Online)</option>
                  <option value="counter">🏪 Counter POS Bills</option>
                  <option value="online">🌐 Online Website Orders</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">💵 Cash Only</option>
                  <option value="upi">📱 UPI QR Only</option>
                  <option value="card">💳 Card Swipe Only</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="sales-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search invoice, customer, phone, or cashier..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                />
                {salesSearchTerm && (
                  <button type="button" className="clear-btn" onClick={() => setSalesSearchTerm('')}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sales Table Card */}
            <div className="sales-table-card">
              {filteredSales.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon">🧾</div>
                  <h3>No Sales Records Found</h3>
                  <p>No billing or invoice records match the current filter selection.</p>
                </div>
              ) : (
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date & Time</th>
                      <th>Channel</th>
                      <th>Billed By / Cashier</th>
                      <th>Customer Details</th>
                      <th>Items Sold</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id || sale.invoiceNumber}>
                        <td>
                          <strong>{sale.invoiceNumber}</strong>
                        </td>
                        <td>
                          <div>{sale.orderDate}</div>
                          <small style={{ color: '#64748B' }}>{sale.orderTime}</small>
                        </td>
                        <td>
                          <span className={`source-pill ${sale.source === 'online' ? 'online' : 'counter'}`}>
                            {sale.source === 'online' ? '🌐 Online' : '🏪 Counter POS'}
                          </span>
                        </td>
                        <td>
                          {sale.cashier ? (
                            <div className="cashier-cell">
                              <strong>👤 {sale.cashier.name || sale.cashier.username}</strong>
                              <small>{sale.cashier.counter || 'Counter Desk'}</small>
                            </div>
                          ) : (
                            <span className="cashier-online-tag">
                              {sale.source === 'online' ? '🌐 Web System' : '🏪 Store POS'}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{sale.customer?.fullName || 'Walk-in Guest'}</strong>
                          {sale.customer?.phone && (
                            <div className="sub-phone">📞 {sale.customer.phone}</div>
                          )}
                        </td>
                        <td>
                          <div className="table-items-summary">
                            {sale.items?.length || 0} item(s)
                            <small>({sale.items?.map((it) => `${it.name} (${it.weight})`).join(', ')})</small>
                          </div>
                        </td>
                        <td>
                          <span className={`payment-pill ${sale.paymentMethod?.toLowerCase()}`}>
                            {sale.paymentMethod === 'upi' ? '📱 UPI' : sale.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                          </span>
                        </td>
                        <td>
                          <strong className="sale-amount">₹{sale.grandTotal}</strong>
                        </td>
                        <td>
                          <span className={`status-tag ${sale.status?.toLowerCase() || 'completed'}`}>
                            {sale.status || sale.orderStatus || 'Completed'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-invoice-btn"
                            onClick={() => openInvoice(sale)}
                            title="View / Print Tax Invoice"
                          >
                            Print Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
      </div>

      {/* Universal Stock Modals */}
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
