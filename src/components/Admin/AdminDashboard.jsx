import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { exportBillsToExcel, exportDailyRevenueToExcel } from '../../utils/excelBackup';
import SideNavbar from '../Nav/SideNavbar';
import DailyRevenueReport from './DailyRevenueReport';
import GstSettingsModal from './GstSettingsModal';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    bills,
    fetchBills,
    acceptOrder,
    updateOrderStatus,
    openInvoice,
    navigateTo,
    taxSettings,
  } = useCart();

  const [isGstModalOpen, setIsGstModalOpen] = useState(false);

  const resolveAdminTabFromHash = () => {
    const h = window.location.hash.toLowerCase();
    if (h.includes('daily') || h.includes('revenue')) return 'daily-revenue';
    if (h.includes('sales') || h.includes('ledger')) return 'sales';
    return 'orders';
  };

  const [activeTab, setActiveTab] = useState(resolveAdminTabFromHash);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'New' | 'Accepted' | 'Dispatched' | 'Delivered'
  const [searchTerm, setSearchTerm] = useState('');

  // Sync hash routing for admin tabs on back/forward/direct link
  useEffect(() => {
    const handleAdminHashSync = () => {
      const h = window.location.hash.toLowerCase();
      if (!h.startsWith('#admin')) return;
      setActiveTab(resolveAdminTabFromHash());
    };
    window.addEventListener('hashchange', handleAdminHashSync);
    return () => window.removeEventListener('hashchange', handleAdminHashSync);
  }, []);

  const handleSwitchAdminTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      window.location.hash = '#admin/orders';
    } else if (tab === 'sales') {
      window.location.hash = '#admin/sales';
      handleSyncAllSales();
    } else if (tab === 'daily-revenue') {
      window.location.hash = '#admin/daily-revenue';
      handleSyncAllSales();
    }
  };

  // Sales Tab Filters & States
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesCashierFilter, setSalesCashierFilter] = useState('all');
  const [salesSourceFilter, setSalesSourceFilter] = useState('all'); // 'all' | 'counter' | 'online'
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card'
  const [isSyncingSales, setIsSyncingSales] = useState(false);

  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock scroll on background when mobile drawer is open
  useScrollLock(isMobileMenuOpen);

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

  // Filtered orders list for Tab 1 (Strictly Online Delivery Orders)
  const filteredOrders = useMemo(() => {
    const onlineOnly = (orders || []).filter(
      (order) => order.source === 'online' || (!order.id?.toLowerCase().startsWith('pos-') && !order.invoiceNumber?.toLowerCase().startsWith('pos-'))
    );

    return onlineOnly.filter((order) => {
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
  }, [orders, orderFilter, searchTerm]);



  return (
    <div className="admin-root side-layout" data-lenis-prevent="true">
      {/* 1. Sleek Left Side Navbar */}
      <SideNavbar
        currentSection={`admin-${activeTab}`}
        onSelectSection={(sec) => {
          if (sec === 'admin-orders') handleSwitchAdminTab('orders');
          else if (sec === 'admin-sales') handleSwitchAdminTab('sales');
          else if (sec === 'admin-daily-revenue') handleSwitchAdminTab('daily-revenue');
          else if (sec === 'pos-register') navigateTo('billing', 'register');
          else if (sec === 'pos-bills' || sec === 'pos-daily-sales') navigateTo('billing', 'daily-sales');
          else if (sec === 'pos-online') navigateTo('billing', 'orders');
          else if (sec === 'storefront') navigateTo('storefront');
        }}
        onOpenGstSettings={() => setIsGstModalOpen(true)}
        pendingOnlineCount={pendingOrders.length}
        shiftBillsCount={counterSales.length}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Admin Content Area beside Side Navbar */}
      <div className="admin-content-area" data-lenis-prevent="true">
        {/* Compact Mobile Strip with Hamburger Trigger */}
        <header className="admin-mobile-strip mobile-only">
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Navigation"
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
              <strong>THENISAI ADMIN</strong>
              <span>Orders &amp; Sales Portal</span>
            </div>
          </div>
        </header>

      <main className="admin-container" data-lenis-prevent="true">
        {/* Admin Top Operations & GST Settings Bar */}
        <div className="admin-operations-bar">
          <div className="admin-ops-title-group">
            <h1 className="admin-portal-title">ADMIN MANAGEMENT PORTAL</h1>
            <p className="admin-portal-sub">
              Logged in as <strong>{user?.name || 'Administrator'}</strong> · Krishnagiri Store Operations
            </p>
          </div>

          <div className="admin-ops-actions">
            <button
              type="button"
              className="admin-gst-config-btn"
              onClick={() => setIsGstModalOpen(true)}
              title="Configure GST %, CGST %, SGST %, and Shop GSTIN"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gst-config-icon">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="gst-config-label">GST Rates:</span>
              <span className="gst-config-badge">
                {taxSettings?.totalGstRate ?? 5}% GST (CGST {taxSettings?.cgstRate ?? 2.5}% + SGST {taxSettings?.sgstRate ?? 2.5}%)
              </span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <section className="admin-kpi-grid">
          <div
            className="kpi-card revenue"
            onClick={() => handleSwitchAdminTab('daily-revenue')}
            title="Click to view Daily Sales & Revenue Breakdown"
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-label">Total Revenue</span>
              <span style={{ fontSize: '10px', color: '#d4a843', fontWeight: 700, letterSpacing: '0.08em' }}>VIEW DAILY ↗</span>
            </div>
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

          <div className="kpi-card sales">
            <span className="kpi-label">Counter Invoices</span>
            <div className="kpi-value">{counterSales.length}</div>
            <span className="kpi-sub">In-Store Register Bills</span>
          </div>
        </section>

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
                          {ord.source === 'online' ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              Online Delivery
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                              </svg>
                              In-Store Walk-in
                            </>
                          )}
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
                          <a href={`tel:${ord.customer?.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            +91 {ord.customer?.phone}
                          </a>
                          {ord.customer?.email && <span> · {ord.customer?.email}</span>}
                        </div>
                        {ord.shippingAddress && (
                          <div className="customer-address" style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>
                              {ord.shippingAddress.doorNo}, {ord.shippingAddress.street},{' '}
                              {ord.shippingAddress.city}, {ord.shippingAddress.state} -{' '}
                              {ord.shippingAddress.pincode}
                            </span>
                          </div>
                        )}
                        {ord.giftNote && (
                          <div className="gift-banner" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 12 20 22 4 22 4 12" />
                              <rect x="2" y="7" width="20" height="5" />
                              <line x1="12" y1="22" x2="12" y2="7" />
                              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                            <em>"{ord.giftNote}"</em>
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
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Accept Order
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
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                              </svg>
                              WhatsApp Customer
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

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={() => exportBillsToExcel(allSales, undefined, 'Thenisai — All Sales Ledger')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #1D6F42',
                  background: '#1D6F42', color: '#fff', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600,
                }}
                title="Export all sales to Excel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <span>Export to Excel</span>
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
                <span className="stat-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Counter Store Sales
                </span>
                <strong className="stat-val">₹{counterRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{counterSales.length} In-Store Bills</span>
              </div>
              <div className="sales-stat-card online">
                <span className="stat-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Online Web Delivery
                </span>
                <strong className="stat-val">₹{onlineRevenue.toLocaleString('en-IN')}</strong>
                <span className="stat-sub">{onlineOrders.length} Online Orders</span>
              </div>
              <div className="sales-stat-card payment">
                <span className="stat-label">Payment Modes</span>
                <div className="payment-split-pills">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                    Cash: ₹{totalCashRevenue.toLocaleString('en-IN')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    UPI: ₹{totalUpiRevenue.toLocaleString('en-IN')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Card: ₹{totalCardRevenue.toLocaleString('en-IN')}
                  </span>
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
                          <div className="cashier-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="cashier-name">{c.name}</h5>
                            <span className="cashier-meta">{c.counter} · {c.role?.toUpperCase()}</span>
                          </div>
                          <span className={`filter-indicator-badge ${isSelected ? 'active' : ''}`}>
                            {isSelected ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Filtered
                              </span>
                            ) : (
                              'Filter'
                            )}
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="6" width="20" height="12" rx="2" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            ₹{c.cash}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            ₹{c.upi}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            ₹{c.card}
                          </span>
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
                      {c.name} ({c.counter})
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
                  <option value="counter">Counter POS Bills</option>
                  <option value="online">Online Website Orders</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash Only</option>
                  <option value="upi">UPI QR Only</option>
                  <option value="card">Card Swipe Only</option>
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
                  <button type="button" className="clear-btn" onClick={() => setSalesSearchTerm('')} aria-label="Clear Search">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Sales Table Card */}
            <div className="sales-table-card" data-lenis-prevent="true">
              {filteredSales.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                      <path d="M16 8h-8" />
                      <path d="M16 12h-8" />
                      <path d="M10 16h-2" />
                    </svg>
                  </div>
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
                            {sale.source === 'online' ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                Online
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Counter POS
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          {sale.cashier ? (
                            <div className="cashier-cell">
                              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                {sale.cashier.name || sale.cashier.username}
                              </strong>
                              <small>{sale.cashier.counter || 'Counter Desk'}</small>
                            </div>
                          ) : (
                            <span className="cashier-online-tag">
                              {sale.source === 'online' ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  Web System
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  </svg>
                                  Store POS
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{sale.customer?.fullName || 'Walk-in Guest'}</strong>
                          {sale.customer?.phone && (
                            <div className="sub-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {sale.customer.phone}
                            </div>
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
                            {sale.paymentMethod === 'upi' ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                </svg>
                                UPI
                              </>
                            ) : sale.paymentMethod === 'card' ? (
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

        {/* =========================================
            TAB 3: DAILY SALES & REVENUE REPORT
           ========================================= */}
        {activeTab === 'daily-revenue' && (
          <section className="tab-content admin-daily-revenue-tab">
            <DailyRevenueReport
              allSales={allSales}
              onOpenInvoice={openInvoice}
              onRefresh={handleSyncAllSales}
            />
          </section>
        )}
        {/* GST & Tax Configuration Modal */}
        <GstSettingsModal
          isOpen={isGstModalOpen}
          onClose={() => setIsGstModalOpen(false)}
        />
      </main>
      </div>
    </div>
  );
}
