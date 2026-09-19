import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS } from '../../data/sweetsData';
import EditBillModal from '../Billing/EditBillModal';
import './DailyRevenueReport.css';

/**
 * Format timestamp or date string into YYYY-MM-DD
 */
function toDateKey(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display: "16 Sep 2026"
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DailyRevenueReport({
  allSales = [],
  onOpenInvoice,
  onRefresh,
  onBack,
  isCashierOnly = false,
  currentUser = null,
}) {
  const { user: authUser } = useAuth();
  const activeUser = currentUser || authUser;

  // Determine if Cashier Mode is active:
  // Strictly Cashier Mode if:
  // - isCashierOnly is explicitly true
  // - Or window hash starts with #billing
  // - Or activeUser.role === 'cashier'
  // - Or activeUser.role !== 'admin'
  const isBillingScreen = typeof window !== 'undefined' && window.location.hash.toLowerCase().startsWith('#billing');
  const isCashier = Boolean(
    isCashierOnly ||
    isBillingScreen ||
    activeUser?.role === 'cashier' ||
    (activeUser && activeUser.role !== 'admin')
  );

  const { taxSettings, deleteBill } = useCart();
  const todayKey = toDateKey(new Date());

  // Date Selection: For cashiers, strictly 'today' (no yesterday, no all-time)
  const [dateMode, setDateMode] = useState('today');
  const [customDate, setCustomDate] = useState(todayKey);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Edit and Delete Modals State
  const [editBillModalItem, setEditBillModalItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [deleteReasonInput, setDeleteReasonInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Available Staff for Admin filter
  const availableCashiers = useMemo(() => {
    const staffMap = new Map();
    allSales.forEach((s) => {
      if (s.cashier?.name) {
        const id = s.cashier.id || s.cashier.username || s.cashier.name;
        staffMap.set(id, s.cashier.name + (s.cashier.counter ? ` (${s.cashier.counter})` : ''));
      }
    });
    if (!staffMap.has('kannan') && !staffMap.has('staff-2')) {
      staffMap.set('kannan', 'M. Kannan — Counter Desk 01');
    }
    if (!staffMap.has('ramanathan') && !staffMap.has('staff-1')) {
      staffMap.set('ramanathan', 'S. Ramanathan — Operations Central');
    }
    return Array.from(staffMap.entries());
  }, [allSales]);

  // Compute targeted date string
  const activeDateString = useMemo(() => {
    if (isCashier) return todayKey; // Cashier is strictly locked to Today
    if (dateMode === 'today') return todayKey;
    if (dateMode === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return toDateKey(yesterday);
    }
    if (dateMode === 'custom') return customDate;
    return ''; // 'all' mode
  }, [isCashier, dateMode, todayKey, customDate]);

  // Filter sales for the selected date and staff
  const daySales = useMemo(() => {
    return allSales.filter((sale) => {
      // Check date matching: Cashier strictly matches todayKey
      const targetDateKey = isCashier ? todayKey : activeDateString;
      if (targetDateKey) {
        const saleDateKey = sale.createdAt ? toDateKey(sale.createdAt) : '';
        if (saleDateKey !== targetDateKey) {
          if (sale.orderDate) {
            const parsed = toDateKey(sale.orderDate);
            if (parsed !== targetDateKey) return false;
          } else {
            return false;
          }
        }
      }

      // If in cashier mode, exclude online delivery orders from shift report
      if (isCashier && sale.source === 'online') return false;

      // If in cashier mode and specific cashier user is known, only show their shift bills
      if (isCashier && activeUser) {
        const uid = activeUser.id || activeUser._id || activeUser.username;
        if (sale.cashier?.username && sale.cashier.username !== activeUser.username && sale.cashier?.id !== uid) {
          return false;
        }
      }

      // Staff filter for Admin view
      if (!isCashier && selectedStaffFilter !== 'all') {
        if (selectedStaffFilter === 'online') {
          if (sale.source !== 'online') return false;
        } else {
          const cid = sale.cashier?.id || sale.cashier?.username || sale.cashier?.name;
          const match =
            cid === selectedStaffFilter ||
            sale.cashier?.username === selectedStaffFilter ||
            sale.cashier?.id === selectedStaffFilter ||
            sale.cashier?.name === selectedStaffFilter ||
            (selectedStaffFilter === 'kannan' && (sale.cashier?.name?.toLowerCase().includes('kannan') || sale.cashier?.id === 'staff-2')) ||
            (selectedStaffFilter === 'ramanathan' && (sale.cashier?.name?.toLowerCase().includes('ramanathan') || sale.cashier?.id === 'staff-1'));
          if (!match) return false;
        }
      }

      // Check payment filter
      if (selectedPaymentFilter !== 'all') {
        const pm = (sale.paymentMethod || '').toLowerCase();
        if (selectedPaymentFilter === 'cash' && pm !== 'cash' && pm !== 'split') return false;
        if (selectedPaymentFilter === 'upi' && pm !== 'upi' && pm !== 'split') return false;
        if (selectedPaymentFilter === 'card' && pm !== 'card') return false;
        if (selectedPaymentFilter === 'split' && pm !== 'split') return false;
      }

      // Check search query (invoice number, customer phone, customer name, cashier name)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inv = (sale.invoiceNumber || '').toLowerCase();
        const phone = (sale.customer?.phone || '').toLowerCase();
        const name = (sale.customer?.fullName || '').toLowerCase();
        const cName = (sale.cashier?.name || '').toLowerCase();
        if (!inv.includes(q) && !phone.includes(q) && !name.includes(q) && !cName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allSales, activeDateString, isCashier, todayKey, activeUser, selectedStaffFilter, selectedPaymentFilter, searchTerm]);

  // Key Financial Calculations
  const grossRevenue = useMemo(() => {
    return daySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }, [daySales]);

  const totalTax = useMemo(() => {
    return daySales.reduce((acc, s) => {
      const tax = s.taxBreakdown?.totalTax || 0;
      return acc + tax;
    }, 0);
  }, [daySales]);

  const netSales = grossRevenue - totalTax;
  const cgstAmount = useMemo(() => {
    return daySales.reduce((acc, s) => {
      const c = typeof s.taxBreakdown?.cgst === 'number' ? s.taxBreakdown.cgst : (s.taxBreakdown?.totalTax ? s.taxBreakdown.totalTax / 2 : 0);
      return acc + c;
    }, 0);
  }, [daySales]);

  const sgstAmount = useMemo(() => {
    return daySales.reduce((acc, s) => {
      const sg = typeof s.taxBreakdown?.sgst === 'number' ? s.taxBreakdown.sgst : (s.taxBreakdown?.totalTax ? s.taxBreakdown.totalTax / 2 : 0);
      return acc + sg;
    }, 0);
  }, [daySales]);

  const totalBills = daySales.length;
  const avgOrderValue = totalBills > 0 ? Math.round(grossRevenue / totalBills) : 0;

  // Tender Breakdown (Cash, UPI, Card, Split)
  const tenderSummary = useMemo(() => {
    let cash = 0, upi = 0, card = 0, split = 0;
    let cashCount = 0, upiCount = 0, cardCount = 0, splitCount = 0;

    daySales.forEach((s) => {
      const amt = s.grandTotal || 0;
      const pm = (s.paymentMethod || '').toLowerCase();
      if (pm === 'cash') {
        cash += amt;
        cashCount += 1;
      } else if (pm === 'upi') {
        upi += amt;
        upiCount += 1;
      } else if (pm === 'card') {
        card += amt;
        cardCount += 1;
      } else if (pm === 'split') {
        const c = s.paymentDetails?.cash ?? s.splitCash ?? 0;
        const u = s.paymentDetails?.upi ?? s.splitUpi ?? 0;
        cash += c;
        upi += u;
        split += amt;
        splitCount += 1;
      } else {
        // Fallback default to cash if counter sale
        cash += amt;
        cashCount += 1;
      }
    });

    return {
      cash: { amount: cash, count: cashCount, percent: grossRevenue > 0 ? Math.round((cash / grossRevenue) * 100) : 0 },
      upi: { amount: upi, count: upiCount, percent: grossRevenue > 0 ? Math.round((upi / grossRevenue) * 100) : 0 },
      card: { amount: card, count: cardCount, percent: grossRevenue > 0 ? Math.round((card / grossRevenue) * 100) : 0 },
      split: { amount: split, count: splitCount, percent: grossRevenue > 0 ? Math.round((split / grossRevenue) * 100) : 0 },
    };
  }, [daySales, grossRevenue]);

  // Hourly Distribution (06:00 to 22:00)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 22 (10 PM)
    const stats = {};
    hours.forEach((h) => {
      stats[h] = { hour: h, label: `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`, amount: 0, count: 0 };
    });

    daySales.forEach((s) => {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        const h = d.getHours();
        if (stats[h]) {
          stats[h].amount += s.grandTotal || 0;
          stats[h].count += 1;
        }
      }
    });

    return Object.values(stats);
  }, [daySales]);

  // Peak hourly amount for relative bar heights
  const maxHourlyAmount = useMemo(() => {
    return Math.max(...hourlyData.map((h) => h.amount), 1);
  }, [hourlyData]);

  // Top-Selling Sweets of the Selected Day
  const topSweets = useMemo(() => {
    const map = {};
    daySales.forEach((s) => {
      (s.items || []).forEach((it) => {
        const key = it.id || it.name;
        if (!map[key]) {
          map[key] = {
            id: it.id,
            name: it.name,
            unit: it.unit || it.weight || 'Pc',
            price: it.price || 0,
            quantity: 0,
            revenue: 0,
          };
        }
        const qty = it.quantity || 1;
        map[key].quantity += qty;
        map[key].revenue += (it.price || 0) * qty;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [daySales]);

  // Cashier Shift Settlement Summary
  const cashierSettlement = useMemo(() => {
    const map = {};
    daySales.forEach((s) => {
      const cid = s.cashier?.username || s.cashier?.id || 'counter-desk-01';
      const cname = s.cashier?.name || 'Counter Cashier';
      const cdesk = s.cashier?.counter || 'Register Desk #01';

      if (!map[cid]) {
        map[cid] = {
          id: cid,
          name: cname,
          counter: cdesk,
          bills: 0,
          total: 0,
          cash: 0,
          upi: 0,
          card: 0,
        };
      }

      map[cid].bills += 1;
      const amt = s.grandTotal || 0;
      map[cid].total += amt;
      const pm = (s.paymentMethod || '').toLowerCase();
      if (pm === 'cash') map[cid].cash += amt;
      else if (pm === 'upi') map[cid].upi += amt;
      else if (pm === 'card') map[cid].card += amt;
      else map[cid].cash += amt;
    });

    return Object.values(map);
  }, [daySales]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (daySales.length === 0) {
      alert('No sales records to export for this date.');
      return;
    }

    const headers = ['Invoice #', 'Date & Time', 'Customer', 'Phone', 'Payment Method', 'Cashier', 'Subtotal', 'Tax', 'Grand Total (INR)'];
    const rows = daySales.map((s) => [
      `"${s.invoiceNumber || s.id}"`,
      `"${s.orderDate || ''} ${s.orderTime || ''}"`,
      `"${s.customer?.fullName || 'Walk-in'}"`,
      `"${s.customer?.phone || ''}"`,
      `"${s.paymentMethod || 'Cash'}"`,
      `"${s.cashier?.name || 'Counter Staff'}"`,
      s.subtotal || 0,
      s.taxBreakdown?.totalTax || 0,
      s.grandTotal || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Thenisai_Daily_Sales_${activeDateString || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Z-Report Print
  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="daily-revenue-wrapper">
      {/* Top Controls & Title */}
      <div className="daily-revenue__header">
        <div className="daily-revenue__title-group">
          {onBack && (
            <button
              type="button"
              className="daily-back-btn"
              onClick={onBack}
              title="Return to Billing Register"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to POS Register</span>
            </button>
          )}

          {isCashier ? (
            <div className="daily-cashier-shift-banner">
              <div className="cashier-shift-badge">
                <span className="live-dot pulse" />
                <span>ACTIVE CASHIER SHIFT</span>
              </div>
              <div className="cashier-shift-user-info">
                <strong>{activeUser?.name || 'Counter Staff'}</strong>
                <span className="shift-counter-id">Terminal: {activeUser?.counter || 'Counter Desk 01'}</span>
              </div>
              <span className="cashier-shift-scope-note">Today's Sales &amp; Register Ledger Only</span>
            </div>
          ) : (
            <div className="daily-title-meta-row">
              <div className="daily-title-badge">
                <span className="live-dot" />
                <span>FINANCIAL LEDGER &amp; CLOSING</span>
              </div>
              <span className="daily-store-tag">Krishnagiri NH 44 Store</span>
            </div>
          )}

          <h2 className="daily-title-h2">
            {isCashier ? "Today's Register & Shift Revenue" : "Daily Revenue & Shift Bills"}
          </h2>
          <p className="daily-title-sub">
            {isCashier
              ? "Live Shift Transactions · Real-time Cash, UPI & Drawer Reconciliation"
              : "Shift Register Audit & Day-End Settlement · Real-time Revenue & Tender Reconciliation"}
          </p>
        </div>

        <div className="daily-actions-group">
          {onRefresh && (
            <button
              type="button"
              className="daily-action-btn secondary"
              onClick={onRefresh}
              title="Refresh Live Data"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Sync</span>
            </button>
          )}

          <button
            type="button"
            className="daily-action-btn secondary"
            onClick={handleExportCSV}
            title="Download CSV Spreadsheet"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="daily-action-btn primary"
            onClick={() => setIsZReportOpen(true)}
            title="Generate Official Thermal Z-Report"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print Day Z-Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs & Selector */}
      {isCashier ? (
        <div className="daily-filter-strip cashier-mode">
          <div className="cashier-shift-status-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span><strong>Today's Shift:</strong> {formatDateLabel(todayKey)}</span>
            <span className="shift-live-tag">Active Shift</span>
          </div>
        </div>
      ) : (
        <div className="daily-filter-strip">
          <div className="date-preset-pills">
            <button
              type="button"
              className={`date-pill ${dateMode === 'today' ? 'active' : ''}`}
              onClick={() => setDateMode('today')}
            >
              Today ({formatDateLabel(todayKey)})
            </button>
            <button
              type="button"
              className={`date-pill ${dateMode === 'yesterday' ? 'active' : ''}`}
              onClick={() => setDateMode('yesterday')}
            >
              Yesterday
            </button>
            <button
              type="button"
              className={`date-pill ${dateMode === 'all' ? 'active' : ''}`}
              onClick={() => setDateMode('all')}
            >
              All-Time Consolidated
            </button>
          </div>

          <div className="daily-filter-right-group">
            <div className="staff-filter-select-wrap">
              <span className="picker-label">Staff Filter:</span>
              <select
                className="admin-staff-select"
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
              >
                <option value="all">All Staff &amp; Channels</option>
                {availableCashiers.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
                <option value="online">Online Web Orders</option>
              </select>
            </div>

            <div className="custom-date-picker">
              <span className="picker-label">Pick Date:</span>
              <input
                type="date"
                className="date-input"
                value={dateMode === 'custom' ? customDate : activeDateString || todayKey}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateMode('custom');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid — Clean Revenue & Operations (No GST) */}
      <section className="revenue-kpi-grid">
        <div className="rev-card gross">
          <span className="rev-label">TOTAL SALES REVENUE</span>
          <div className="rev-value">₹{grossRevenue.toLocaleString('en-IN')}</div>
          <span className="rev-foot">{totalBills} Bills / Transactions</span>
        </div>

        <div className="rev-card net">
          <span className="rev-label">AVERAGE ORDER VALUE</span>
          <div className="rev-value">₹{avgOrderValue.toLocaleString('en-IN')}</div>
          <span className="rev-foot">Per Customer Bill</span>
        </div>

        <div className="rev-card aov">
          <span className="rev-label">TOTAL ITEMS SOLD</span>
          <div className="rev-value">
            {daySales.reduce((acc, s) => acc + (s.items || []).reduce((iSum, it) => iSum + (Number(it.quantity) || 1), 0), 0)}
          </div>
          <span className="rev-foot">Cups, Sweets &amp; Savories</span>
        </div>

        <div className="rev-card gst">
          <span className="rev-label">SETTLED TRANSACTIONS</span>
          <div className="rev-value">{totalBills}</div>
          <span className="rev-foot">Cash: ₹{tenderSummary.cash.amount.toLocaleString('en-IN')} · UPI: ₹{tenderSummary.upi.amount.toLocaleString('en-IN')}</span>
        </div>
      </section>

      {/* Tender Breakdown Cards (Cash vs UPI vs Card) with SVG Strokes instead of emojis */}
      <section className="tender-section">
        <h3 className="section-subtitle">Payment Mode &amp; Drawer Tender Breakdown</h3>
        <div className="tender-cards-grid">
          <div
            className={`tender-card cash ${selectedPaymentFilter === 'cash' ? 'selected' : ''}`}
            onClick={() => setSelectedPaymentFilter((prev) => (prev === 'cash' ? 'all' : 'cash'))}
            role="button"
            tabIndex={0}
          >
            <div className="tender-top">
              <span className="tender-badge cash">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                Cash in Drawer
              </span>
              <span className="tender-percent">{tenderSummary.cash.percent}%</span>
            </div>
            <div className="tender-amt">₹{tenderSummary.cash.amount.toLocaleString('en-IN')}</div>
            <div className="tender-count">{tenderSummary.cash.count} Cash Bills (Click to filter)</div>
          </div>

          <div
            className={`tender-card upi ${selectedPaymentFilter === 'upi' ? 'selected' : ''}`}
            onClick={() => setSelectedPaymentFilter((prev) => (prev === 'upi' ? 'all' : 'upi'))}
            role="button"
            tabIndex={0}
          >
            <div className="tender-top">
              <span className="tender-badge upi">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                UPI / QR Code
              </span>
              <span className="tender-percent">{tenderSummary.upi.percent}%</span>
            </div>
            <div className="tender-amt">₹{tenderSummary.upi.amount.toLocaleString('en-IN')}</div>
            <div className="tender-count">{tenderSummary.upi.count} UPI Transfers (Click to filter)</div>
          </div>

          <div
            className={`tender-card card ${selectedPaymentFilter === 'card' ? 'selected' : ''}`}
            onClick={() => setSelectedPaymentFilter((prev) => (prev === 'card' ? 'all' : 'card'))}
            role="button"
            tabIndex={0}
          >
            <div className="tender-top">
              <span className="tender-badge card">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Card / Swipe
              </span>
              <span className="tender-percent">{tenderSummary.card.percent}%</span>
            </div>
            <div className="tender-amt">₹{tenderSummary.card.amount.toLocaleString('en-IN')}</div>
            <div className="tender-count">{tenderSummary.card.count} Card Swipes (Click to filter)</div>
          </div>
        </div>
      </section>

      {/* Two-Column Analytics Layout: Hourly Rush & Top Sweets */}
      <div className="analytics-split-layout">
        {/* Hourly Rush Chart */}
        <div className="analytics-card hourly-rush">
          <div className="card-header-line">
            <h4 className="card-title">Hourly Sales Flow &amp; Peak Times</h4>
            <span className="card-tag">6 AM – 10 PM</span>
          </div>

          <div className="hourly-bars-container">
            {hourlyData.map((h) => {
              const heightPercent = h.amount > 0 ? Math.max((h.amount / maxHourlyAmount) * 100, 6) : 2;
              return (
                <div key={h.hour} className="hourly-bar-col" title={`${h.label}: ₹${h.amount} (${h.count} bills)`}>
                  <div className="bar-wrapper">
                    <div
                      className={`bar-fill ${h.amount > 0 ? 'active' : ''}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="bar-hour-label">{h.hour}</span>
                </div>
              );
            })}
          </div>
          <div className="hourly-legend">
            <span>Morning Counter (6–11 AM)</span>
            <span>Afternoon (12–4 PM)</span>
            <span>Evening Rush (5–9 PM)</span>
          </div>
        </div>

        {/* Top-Selling Sweets */}
        <div className="analytics-card top-sweets">
          <div className="card-header-line">
            <h4 className="card-title">Top Sweets Contribution</h4>
            <span className="card-tag">{topSweets.length} Items</span>
          </div>

          {topSweets.length === 0 ? (
            <div className="empty-state-notice">
              <p>No itemized sweets sold yet for this period.</p>
            </div>
          ) : (
            <div className="top-sweets-table-wrap">
              <table className="top-sweets-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty Sold</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topSweets.map((sw, idx) => (
                    <tr key={sw.id || idx}>
                      <td>
                        <div className="sw-name-cell">
                          <span className="sw-rank">#{idx + 1}</span>
                          <span className="sw-title">{sw.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sw-qty-badge">{sw.quantity} {sw.unit}</span>
                      </td>
                      <td className="text-right">
                        <strong className="sw-rev-text">₹{sw.revenue.toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cashier Shift Reconciliation */}
      <section className="cashier-reconciliation-section">
        <h3 className="section-subtitle">Cashier Shift &amp; Drawer Settlement</h3>
        <div className="cashier-table-wrap">
          <table className="cashier-table">
            <thead>
              <tr>
                <th>Cashier Staff</th>
                <th>Counter Terminal</th>
                <th>Total Bills</th>
                <th>Cash in Drawer</th>
                <th>UPI Collected</th>
                <th>Card Collected</th>
                <th className="text-right">Total Shift Sales</th>
              </tr>
            </thead>
            <tbody>
              {cashierSettlement.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>
                    <span className="terminal-badge">{c.counter}</span>
                  </td>
                  <td>{c.bills}</td>
                  <td>
                    <span className="t-cash">₹{c.cash.toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <span className="t-upi">₹{c.upi.toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <span className="t-card">₹{c.card.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="text-right">
                    <strong className="t-total">₹{c.total.toLocaleString('en-IN')}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Daily Bills Transaction Log */}
      <section className="daily-bills-section">
        <div className="bills-header-line">
          <h3 className="section-subtitle">
            Shift Bills &amp; Invoices Log ({daySales.length} Transactions)
          </h3>
          <div className="search-bills-box">
            <input
              type="text"
              placeholder="Search invoice #, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bills-search-input"
            />
          </div>
        </div>

        {daySales.length === 0 ? (
          <div className="empty-day-state">
            <p>No transaction records found matching the selected date and filters.</p>
          </div>
        ) : (
          <div className="daily-bills-table-wrap">
            <table className="daily-bills-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {daySales.map((s) => {
                  const pm = (s.paymentMethod || 'cash').toLowerCase();
                  return (
                    <tr key={s.id || s.invoiceNumber}>
                      <td>
                        <div className="inv-badge-wrap">
                          <strong className="inv-badge">{s.invoiceNumber || s.id}</strong>
                          {s.isEdited && <span className="edited-badge" title="This bill was edited">Edited</span>}
                        </div>
                      </td>
                      <td>
                        <span className="time-text">{s.orderTime || (s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')}</span>
                      </td>
                      <td>
                        <div className="cust-info">
                          <span>{s.customer?.fullName || 'Walk-in Customer'}</span>
                          {s.customer?.phone && <small>{s.customer.phone}</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`pm-badge ${pm}`}>{s.paymentMethod || 'Cash'}</span>
                      </td>
                      <td>{s.cashier?.name || 'Counter Staff'}</td>
                      <td>
                        <span className="items-summary-badge">
                          {(s.items || []).length} items
                        </span>
                      </td>
                      <td className="text-right">
                        <strong className="bill-amt">₹{(s.grandTotal || 0).toLocaleString('en-IN')}</strong>
                      </td>
                      <td className="text-center table-actions-cell">
                        <div className="table-actions-cluster">
                          <button
                            type="button"
                            className="view-bill-btn"
                            onClick={() => onOpenInvoice && onOpenInvoice(s)}
                            title="View &amp; Print Tax Invoice"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="edit-bill-btn"
                            onClick={() => setEditBillModalItem(s)}
                            title="Edit Bill Details &amp; Items"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete-bill-btn"
                            onClick={() => {
                              setDeleteModalItem(s);
                              setDeleteReasonInput('');
                            }}
                            title="Delete Bill to 30-Day Recycle Bin"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Printable Z-Report Modal */}
      <AnimatePresence>
        {isZReportOpen && (
          <div className="z-report-overlay" onClick={() => setIsZReportOpen(false)}>
            <motion.div
              className="z-report-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Modal Top Actions */}
              <div className="z-report-actions no-print">
                <button
                  type="button"
                  className="z-print-btn"
                  onClick={handlePrintZReport}
                  title="Print Thermal Slip"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  className="z-close-btn"
                  onClick={() => setIsZReportOpen(false)}
                >
                  ✕ Close
                </button>
              </div>

              {/* Thermal Slip Content */}
              <div className="z-slip-paper" id="daily-z-slip">
                <div className="z-slip-header">
                  <h3 className="z-brand-title">{STORE_DETAILS.name}</h3>
                  <p className="z-brand-sub">{STORE_DETAILS.tagline}</p>
                  <p className="z-brand-loc">{STORE_DETAILS.address.line1}, {STORE_DETAILS.address.city}</p>
                  <p className="z-brand-gst">GSTIN: {taxSettings?.gstin || STORE_DETAILS.gstin}</p>
                  <p className="z-brand-fssai">FSSAI: {STORE_DETAILS.fssai}</p>
                </div>

                <div className="slip-divider" />

                <div className="z-slip-meta">
                  <div className="slip-row">
                    <span>REPORT TYPE:</span>
                    <strong>DAILY Z-REPORT (FINANCIAL CLOSING)</strong>
                  </div>
                  <div className="slip-row">
                    <span>REPORT DATE:</span>
                    <strong>{activeDateString || todayKey}</strong>
                  </div>
                  <div className="slip-row">
                    <span>PRINTED AT:</span>
                    <span>{new Date().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="slip-row">
                    <span>TERMINAL:</span>
                    <span>{isCashier ? (activeUser?.counter || 'Counter Desk 01') : 'Master Terminal — POS 01'}</span>
                  </div>
                </div>

                <div className="slip-divider" />

                <div className="z-slip-section">
                  <div className="slip-row title">
                    <strong>FINANCIAL SUMMARY</strong>
                  </div>
                  <div className="slip-row">
                    <span>Total Invoices / Bills:</span>
                    <strong>{totalBills}</strong>
                  </div>
                  <div className="slip-row">
                    <span>Net Sales:</span>
                    <span>₹{netSales.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="slip-row">
                    <span>Total GST:</span>
                    <span>₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="slip-row total">
                    <strong>GROSS DAY REVENUE:</strong>
                    <strong>₹{grossRevenue.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="slip-divider" />

                <div className="z-slip-section">
                  <div className="slip-row title">
                    <strong>TENDER RECONCILIATION</strong>
                  </div>
                  <div className="slip-row">
                    <span>Cash in Drawer:</span>
                    <strong>₹{tenderSummary.cash.amount.toLocaleString('en-IN')} ({tenderSummary.cash.count})</strong>
                  </div>
                  <div className="slip-row">
                    <span>UPI / QR Received:</span>
                    <strong>₹{tenderSummary.upi.amount.toLocaleString('en-IN')} ({tenderSummary.upi.count})</strong>
                  </div>
                  <div className="slip-row">
                    <span>Card Received:</span>
                    <strong>₹{tenderSummary.card.amount.toLocaleString('en-IN')} ({tenderSummary.card.count})</strong>
                  </div>
                </div>

                <div className="slip-divider" />

                <div className="z-slip-signatures">
                  <div className="sig-line">
                    <p>Cashier Signature</p>
                  </div>
                  <div className="sig-line">
                    <p>Manager Verification</p>
                  </div>
                </div>

                <div className="z-slip-footer">
                  <p>*** END OF DAY Z-REPORT ***</p>
                  <p>Thenisai Traditional Sweets Since 2006</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Bill Modal */}
      {editBillModalItem && (
        <EditBillModal
          isOpen={!!editBillModalItem}
          bill={editBillModalItem}
          onClose={() => setEditBillModalItem(null)}
          onSuccess={(updated) => {
            setEditBillModalItem(null);
            if (onRefresh) onRefresh();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalItem && (
          <div className="delete-modal-overlay" role="dialog" aria-modal="true">
            <motion.div
              className="delete-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="delete-modal-header">
                <div className="del-icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4>Delete Bill #{deleteModalItem.invoiceNumber || deleteModalItem.id}</h4>
                  <p className="del-modal-sub">Amount: ₹{(deleteModalItem.grandTotal || 0).toLocaleString('en-IN')} · Customer: {deleteModalItem.customer?.fullName || 'Walk-in'}</p>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => !isDeleting && setDeleteModalItem(null)}
                  aria-label="Close"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              </div>

              <div className="delete-modal-body">
                <p className="del-warning-text">
                  This bill will be removed from active sales, drawer tender totals will adjust, and it will be moved to the 30-day Recycle Bin.
                </p>
                <label className="del-reason-label">
                  Reason for Deletion <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="del-reason-input"
                  placeholder="e.g., Customer cancelled order, duplicate entry..."
                  value={deleteReasonInput}
                  onChange={(e) => setDeleteReasonInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="del-cancel-btn"
                  onClick={() => setDeleteModalItem(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="del-confirm-btn"
                  disabled={isDeleting || !deleteReasonInput.trim()}
                  onClick={async () => {
                    if (!deleteReasonInput.trim()) return;
                    setIsDeleting(true);
                    try {
                      const billId = deleteModalItem._id || deleteModalItem.id || deleteModalItem.invoiceNumber;
                      await deleteBill(billId, deleteReasonInput.trim(), currentUser);
                      setDeleteModalItem(null);
                      if (onRefresh) onRefresh();
                    } catch (err) {
                      alert(err.message || 'Failed to delete bill');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
