import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS } from '../../data/sweetsData';
import EditBillModal from '../Billing/EditBillModal';
import ResetBillSequenceModal from './ResetBillSequenceModal';
/**
 * Format timestamp or date string into YYYY-MM-DD
 */
/**
 * Format timestamp or date string into YYYY-MM-DD
 * Supports ISO strings, millisecond numbers, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, and "22 Sept 2026" / "22 Sep 2026"
 */
function toDateKey(dateVal) {
  if (!dateVal) return '';

  // If already YYYY-MM-DD
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }

  // If DD-MM-YYYY or DD/MM/YYYY
  if (typeof dateVal === 'string') {
    const dmyMatch = dateVal.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // If "22 Sep 2026" or "22 Sept 2026" or "22 September 2026"
    const textMatch = dateVal.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (textMatch) {
      const day = textMatch[1].padStart(2, '0');
      const monStr = textMatch[2].toLowerCase().slice(0, 3);
      const year = textMatch[3];
      const months = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      if (months[monStr]) {
        return `${year}-${months[monStr]}-${day}`;
      }
    }
  }

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
    (activeUser?.role !== 'admin' && (isBillingScreen || activeUser?.role === 'cashier'))
  );

  const { taxSettings, deleteBill, expenses = [], fetchExpenses } = useCart();
  const todayKey = toDateKey(new Date());

  React.useEffect(() => {
    if (fetchExpenses) {
      fetchExpenses();
    }
  }, [fetchExpenses]);

  // Date Selection: For cashiers, strictly 'today' (no yesterday, no all-time)
  const [dateMode, setDateMode] = useState('today');
  const [customDate, setCustomDate] = useState(todayKey);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(todayKey);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isResetBillModalOpen, setIsResetBillModalOpen] = useState(false);

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
    if (dateMode === 'custom') return toDateKey(customDate);
    if (dateMode === 'this-month' || dateMode === 'range') {
      return `${fromDate}_to_${toDate}`;
    }
    return ''; // 'all' mode
  }, [isCashier, dateMode, todayKey, customDate, fromDate, toDate]);

  // Filter sales for the selected date and staff
  const daySales = useMemo(() => {
    return allSales.filter((sale) => {
      // Check date matching: Cashier strictly matches todayKey
      if (isCashier) {
        const createdKey = sale.createdAt ? toDateKey(sale.createdAt) : '';
        const orderDateKey = sale.orderDate ? toDateKey(sale.orderDate) : '';
        const rawDateKey = sale.date ? toDateKey(sale.date) : '';
        const matchesDate = (
          createdKey === todayKey ||
          orderDateKey === todayKey ||
          rawDateKey === todayKey
        );
        if (!matchesDate) return false;
      } else if (dateMode === 'this-month' || dateMode === 'range') {
        const createdKey = sale.createdAt ? toDateKey(sale.createdAt) : '';
        const orderDateKey = sale.orderDate ? toDateKey(sale.orderDate) : '';
        const rawDateKey = sale.date ? toDateKey(sale.date) : '';
        const saleKey = createdKey || orderDateKey || rawDateKey;
        if (!saleKey || saleKey < fromDate || saleKey > toDate) return false;
      } else if (activeDateString) {
        const createdKey = sale.createdAt ? toDateKey(sale.createdAt) : '';
        const orderDateKey = sale.orderDate ? toDateKey(sale.orderDate) : '';
        const rawDateKey = sale.date ? toDateKey(sale.date) : '';
        const matchesDate = (
          createdKey === activeDateString ||
          orderDateKey === activeDateString ||
          rawDateKey === activeDateString
        );
        if (!matchesDate) return false;
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
    }).sort((a, b) => {
      // Sort chronologically: oldest first so first bill of the day is #1
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [allSales, activeDateString, isCashier, todayKey, dateMode, fromDate, toDate, activeUser, selectedStaffFilter, selectedPaymentFilter, searchTerm]);

  // Filter expenses for the selected date and staff
  const dayExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter((exp) => {
      const expDateKey = toDateKey(exp.date || exp.createdAt);
      if (isCashier) {
        if (expDateKey !== todayKey) return false;
        if (activeUser) {
          const uid = activeUser.id || activeUser._id || activeUser.username;
          if (exp.cashier?.username && exp.cashier.username !== activeUser.username && exp.cashier?.id !== uid) {
            return false;
          }
        }
      } else if (dateMode === 'this-month' || dateMode === 'range') {
        if (!expDateKey || expDateKey < fromDate || expDateKey > toDate) return false;
      } else if (activeDateString) {
        if (expDateKey !== activeDateString) return false;
      }

      if (!isCashier && selectedStaffFilter !== 'all') {
        const cid = exp.cashier?.id || exp.cashier?.username || exp.cashier?.name;
        const match =
          cid === selectedStaffFilter ||
          exp.cashier?.username === selectedStaffFilter ||
          exp.cashier?.id === selectedStaffFilter ||
          exp.cashier?.name === selectedStaffFilter;
        if (!match) return false;
      }
      return true;
    });
  }, [expenses, isCashier, todayKey, dateMode, fromDate, toDate, activeDateString, activeUser, selectedStaffFilter]);

  // Key Financial Calculations
  const grossRevenue = useMemo(() => {
    return daySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }, [daySales]);

  const totalExpenses = useMemo(() => {
    return dayExpenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  }, [dayExpenses]);

  const netRevenueAfterExpenses = grossRevenue - totalExpenses;

  const totalTax = useMemo(() => {
    return daySales.reduce((acc, s) => {
      const tax = s.taxBreakdown?.totalTax || 0;
      return acc + tax;
    }, 0);
  }, [daySales]);

  const netSales = grossRevenue - totalTax;
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

  // Daily Breakdown Aggregation for Monthly and Date-to-Date Reports
  const dailyBreakdown = useMemo(() => {
    const dayMap = {};
    daySales.forEach((s) => {
      const createdKey = s.createdAt ? toDateKey(s.createdAt) : '';
      const orderDateKey = s.orderDate ? toDateKey(s.orderDate) : '';
      const rawDateKey = s.date ? toDateKey(s.date) : '';
      const dKey = createdKey || orderDateKey || rawDateKey || 'Unknown';

      if (!dayMap[dKey]) {
        dayMap[dKey] = {
          dateKey: dKey,
          bills: 0,
          cash: 0,
          upi: 0,
          card: 0,
          total: 0,
        };
      }
      dayMap[dKey].bills += 1;
      const amt = s.grandTotal || 0;
      dayMap[dKey].total += amt;
      const pm = (s.paymentMethod || '').toLowerCase();
      if (pm === 'cash') dayMap[dKey].cash += amt;
      else if (pm === 'upi') dayMap[dKey].upi += amt;
      else if (pm === 'card') dayMap[dKey].card += amt;
      else if (pm === 'split') {
        dayMap[dKey].cash += (s.paymentDetails?.cash ?? s.splitCash ?? 0);
        dayMap[dKey].upi += (s.paymentDetails?.upi ?? s.splitUpi ?? 0);
      } else {
        dayMap[dKey].cash += amt;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [daySales]);

  // CSV Export Handler with Date-to-Date & Accounting Breakdown
  const handleExportCSV = () => {
    if (daySales.length === 0) {
      alert('No sales records to export for this date range.');
      return;
    }

    const headers = [
      'Invoice #',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Payment Method',
      'Cash (INR)',
      'UPI (INR)',
      'Card (INR)',
      'Cashier',
      'Items Count',
      'Subtotal (INR)',
      'Tax (INR)',
      'Grand Total (INR)',
    ];

    let sumCash = 0;
    let sumUpi = 0;
    let sumCard = 0;
    let sumItems = 0;
    let sumSubtotal = 0;
    let sumTax = 0;
    let sumGrandTotal = 0;

    const rows = daySales.map((s) => {
      const pm = (s.paymentMethod || 'cash').toLowerCase();
      const grandTotal = s.grandTotal || 0;
      const subtotal = s.subtotal || 0;
      const tax = s.taxBreakdown?.totalTax || 0;
      const itemsCount = (s.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

      let cashAmt = 0;
      let upiAmt = 0;
      let cardAmt = 0;

      if (pm === 'cash') cashAmt = grandTotal;
      else if (pm === 'upi') upiAmt = grandTotal;
      else if (pm === 'card') cardAmt = grandTotal;
      else if (pm === 'split') {
        cashAmt = s.paymentDetails?.cash ?? s.splitCash ?? 0;
        upiAmt = s.paymentDetails?.upi ?? s.splitUpi ?? 0;
      } else {
        cashAmt = grandTotal;
      }

      sumCash += cashAmt;
      sumUpi += upiAmt;
      sumCard += cardAmt;
      sumItems += itemsCount;
      sumSubtotal += subtotal;
      sumTax += tax;
      sumGrandTotal += grandTotal;

      const dateStr = s.orderDate || (s.createdAt ? toDateKey(s.createdAt) : '');
      const timeStr = s.orderTime || (s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

      return [
        `"${s.invoiceNumber || s.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(s.customer?.fullName || 'Walk-in Customer').replace(/"/g, '""')}"`,
        `"${s.customer?.phone || ''}"`,
        `"${s.paymentMethod || 'Cash'}"`,
        cashAmt,
        upiAmt,
        cardAmt,
        `"${(s.cashier?.name || 'Counter Staff').replace(/"/g, '""')}"`,
        itemsCount,
        subtotal,
        tax,
        grandTotal,
      ];
    });

    // Summary Totals Row
    const totalsRow = [
      '"TOTALS"',
      '""',
      '""',
      '""',
      '""',
      '""',
      sumCash,
      sumUpi,
      sumCard,
      '""',
      sumItems,
      sumSubtotal,
      sumTax,
      sumGrandTotal,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(',')), totalsRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    let filename = `Thenisai_Daily_Sales_${todayKey}.csv`;
    if (dateMode === 'this-month') {
      filename = `Thenisai_Monthly_Report_${fromDate}_to_${toDate}.csv`;
    } else if (dateMode === 'range') {
      filename = `Thenisai_Sales_Report_${fromDate}_to_${toDate}.csv`;
    } else if (dateMode === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      filename = `Thenisai_Daily_Sales_${toDateKey(y)}.csv`;
    } else if (dateMode === 'custom') {
      filename = `Thenisai_Daily_Sales_${customDate}.csv`;
    } else if (dateMode === 'all') {
      filename = `Thenisai_All_Sales_Consolidated.csv`;
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Z-Report / Monthly Report Print
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
          {!isCashier && (
            <button
              type="button"
              id="daily-reset-bill-btn"
              className="daily-action-btn secondary"
              onClick={() => setIsResetBillModalOpen(true)}
              style={{
                color: '#e11d48',
                borderColor: '#fecdd3',
                background: '#fff1f2',
              }}
              title="Reset bill numbers to start fresh from AA001"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset Bill No (AA001)</span>
            </button>
          )}

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
            title={
              dateMode === 'this-month'
                ? 'Print Monthly Financial Report'
                : dateMode === 'range'
                ? 'Print Period Financial Report'
                : dateMode === 'all'
                ? 'Print Consolidated Financial Report'
                : 'Generate Official Thermal Z-Report'
            }
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>
              {dateMode === 'this-month'
                ? 'Print Monthly Report'
                : dateMode === 'range'
                ? 'Print Period Report'
                : dateMode === 'all'
                ? 'Print Consolidated Report'
                : 'Print Day Z-Report'}
            </span>
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
              className={`date-pill ${dateMode === 'this-month' ? 'active' : ''}`}
              onClick={() => {
                const d = new Date();
                setFromDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                setToDate(todayKey);
                setDateMode('this-month');
              }}
            >
              This Month
            </button>
            <button
              type="button"
              className={`date-pill ${dateMode === 'range' ? 'active' : ''}`}
              onClick={() => setDateMode('range')}
            >
              Date to Date
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

            {dateMode === 'range' || dateMode === 'this-month' ? (
              <div className="range-date-pickers">
                <div className="custom-date-picker">
                  <span className="picker-label">From:</span>
                  <input
                    type="date"
                    className="date-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="custom-date-picker">
                  <span className="picker-label">To:</span>
                  <input
                    type="date"
                    className="date-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* Scrollable Content Area: KPIs, Tender Breakdown, Shift & Daily Bills */}
      <div className="daily-revenue-scroll-area">
        {/* Primary KPI Metrics Grid — Revenue & Operations */}
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

        <div className="rev-card settled">
          <span className="rev-label">SETTLED TRANSACTIONS</span>
          <div className="rev-value">{totalBills}</div>
          <span className="rev-foot">Cash: ₹{tenderSummary.cash.amount.toLocaleString('en-IN')} · UPI: ₹{tenderSummary.upi.amount.toLocaleString('en-IN')}</span>
        </div>

        <div className="rev-card expenses" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="rev-label">TOTAL STORE EXPENSES</span>
          <div className="rev-value" style={{ color: '#ef4444' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
          <span className="rev-foot">{dayExpenses.length} Expense Payouts Logged</span>
        </div>

        <div className="rev-card net-revenue" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="rev-label">NET REVENUE (PROFIT)</span>
          <div className="rev-value" style={{ color: '#10b981' }}>₹{netRevenueAfterExpenses.toLocaleString('en-IN')}</div>
          <span className="rev-foot">Sales (₹{grossRevenue.toLocaleString('en-IN')}) − Expenses</span>
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
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
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
                {daySales.map((s, idx) => {
                  const pm = (s.paymentMethod || 'cash').toLowerCase();
                  return (
                    <tr key={s.id || s.invoiceNumber}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#6366f1', fontSize: '13px' }}>
                        {idx + 1}
                      </td>
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

      {/* Daily Expenses Transaction Log */}
      <section className="daily-bills-section" style={{ marginTop: '24px' }}>
        <div className="bills-header-line">
          <div>
            <h3 className="section-subtitle">
              Logged Store Expenses ({dayExpenses.length} Records)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Tea, provisions, packaging &amp; miscellaneous operational disbursements
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
            Total: ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
        </div>

        {dayExpenses.length === 0 ? (
          <div className="empty-day-state">
            <p>No expense payouts logged for this period.</p>
          </div>
        ) : (
          <div className="daily-bills-table-wrap">
            <table className="daily-bills-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>Time / Date</th>
                  <th>Category</th>
                  <th>Purpose / Description</th>
                  <th>Cashier</th>
                  <th>Note</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {dayExpenses.map((exp, idx) => (
                  <tr key={exp.id || idx}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#6366f1', fontSize: '13px' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <span className="time-text">
                        {exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (exp.date || '-')}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#dc2626',
                        border: '1px solid rgba(239,68,68,0.2)'
                      }}>
                        {exp.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{exp.purpose || 'Expense'}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {exp.cashier?.name || exp.cashier?.username || 'Counter Staff'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{exp.note || '—'}</span>
                    </td>
                    <td className="text-right">
                      <strong style={{ color: '#ef4444', fontSize: '14px', fontWeight: 800 }}>
                        ₹{(Number(exp.amount) || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>

      {/* Printable Z-Report / Monthly Report Modal */}
      <AnimatePresence>
        {isZReportOpen && (
          <div className="z-report-overlay" onClick={() => setIsZReportOpen(false)}>
            <motion.div
              className={`z-report-modal ${dateMode === 'this-month' || dateMode === 'range' || dateMode === 'all' ? 'period-report' : ''}`}
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
                  title="Print Report"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  <span>
                    {dateMode === 'this-month'
                      ? 'Print Monthly Report'
                      : dateMode === 'range'
                      ? 'Print Period Report'
                      : 'Print Slip'}
                  </span>
                </button>
                <button
                  type="button"
                  className="z-close-btn"
                  onClick={() => setIsZReportOpen(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>

              {/* Thermal Slip / Report Content */}
              <div className="z-slip-paper" id="daily-z-slip">
                <div className="z-slip-header">
                  <h3 className="z-brand-title">{STORE_DETAILS.brandName || STORE_DETAILS.name || 'Thenisai Palkova & Sweets'}</h3>
                  <p className="z-brand-sub">{STORE_DETAILS.tagline}</p>
                  <p className="z-brand-loc">{STORE_DETAILS.addressLine1 || STORE_DETAILS.address?.line1 || 'Nattamai Kottai, NH 44'}, {STORE_DETAILS.cityStatePin || STORE_DETAILS.address?.city || 'Krishnagiri'}</p>
                  <p className="z-brand-fssai">FSSAI: {STORE_DETAILS.fssai}</p>
                </div>

                <div className="slip-divider" />

                <div className="z-slip-meta">
                  <div className="slip-row">
                    <span>REPORT TYPE:</span>
                    <strong>
                      {dateMode === 'this-month'
                        ? 'MONTHLY FINANCIAL REPORT'
                        : dateMode === 'range'
                        ? 'PERIOD SALES & REVENUE REPORT'
                        : dateMode === 'all'
                        ? 'ALL-TIME CONSOLIDATED FINANCIAL REPORT'
                        : 'DAILY Z-REPORT (FINANCIAL CLOSING)'}
                    </strong>
                  </div>
                  <div className="slip-row">
                    <span>{dateMode === 'this-month' || dateMode === 'range' ? 'PERIOD:' : 'REPORT DATE:'}</span>
                    <strong>
                      {dateMode === 'this-month' || dateMode === 'range'
                        ? `${formatDateLabel(fromDate)} to ${formatDateLabel(toDate)}`
                        : (formatDateLabel(activeDateString) || formatDateLabel(todayKey))}
                    </strong>
                  </div>
                  <div className="slip-row">
                    <span>PRINTED AT:</span>
                    <span>{new Date().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="slip-row">
                    <span>TERMINAL:</span>
                    <span>{isCashier ? (activeUser?.counter || 'Counter Desk 01') : 'Master Terminal — POS 01'}</span>
                  </div>
                  {selectedStaffFilter !== 'all' && (
                    <div className="slip-row">
                      <span>STAFF FILTER:</span>
                      <span>{selectedStaffFilter === 'online' ? 'Pre-Orders' : selectedStaffFilter}</span>
                    </div>
                  )}
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
                    <span>Tax (GST):</span>
                    <span>₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="slip-row total">
                    <strong>{dateMode === 'this-month' ? 'GROSS MONTH REVENUE:' : dateMode === 'range' ? 'GROSS PERIOD REVENUE:' : 'GROSS DAY REVENUE:'}</strong>
                    <strong>₹{grossRevenue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="slip-row" style={{ color: '#dc2626' }}>
                    <span>Store Expenses Logged:</span>
                    <span>-₹{totalExpenses.toLocaleString('en-IN')} ({dayExpenses.length})</span>
                  </div>
                  <div className="slip-row total" style={{ borderTop: '1px dashed #334155', marginTop: '4px', paddingTop: '4px' }}>
                    <strong>NET SETTLED REVENUE:</strong>
                    <strong>₹{netRevenueAfterExpenses.toLocaleString('en-IN')}</strong>
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

                {/* Daily Breakdown for Monthly and Range Reports */}
                {(dateMode === 'this-month' || dateMode === 'range' || dateMode === 'all') && dailyBreakdown.length > 0 && (
                  <>
                    <div className="slip-divider" />
                    <div className="z-slip-section">
                      <div className="slip-row title">
                        <strong>DAILY BREAKDOWN ({dailyBreakdown.length} DAYS)</strong>
                      </div>
                      <table className="z-slip-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '6px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px dashed #94a3b8' }}>
                            <th style={{ textAlign: 'left', padding: '3px 0' }}>Date</th>
                            <th style={{ textAlign: 'center', padding: '3px 0' }}>Bills</th>
                            <th style={{ textAlign: 'right', padding: '3px 0' }}>Cash</th>
                            <th style={{ textAlign: 'right', padding: '3px 0' }}>UPI</th>
                            <th style={{ textAlign: 'right', padding: '3px 0' }}>Card</th>
                            <th style={{ textAlign: 'right', padding: '3px 0' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyBreakdown.map((d) => (
                            <tr key={d.dateKey} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                              <td style={{ textAlign: 'left', padding: '3px 0' }}>{formatDateLabel(d.dateKey)}</td>
                              <td style={{ textAlign: 'center', padding: '3px 0' }}>{d.bills}</td>
                              <td style={{ textAlign: 'right', padding: '3px 0' }}>₹{d.cash.toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'right', padding: '3px 0' }}>₹{d.upi.toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'right', padding: '3px 0' }}>₹{d.card.toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '3px 0' }}>₹{d.total.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Top Sweets Sold in Period */}
                {topSweets.length > 0 && (
                  <>
                    <div className="slip-divider" />
                    <div className="z-slip-section">
                      <div className="slip-row title">
                        <strong>TOP PRODUCTS SOLD ({topSweets.length})</strong>
                      </div>
                      <table className="z-slip-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '6px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px dashed #94a3b8' }}>
                            <th style={{ textAlign: 'left', padding: '3px 0' }}># Item</th>
                            <th style={{ textAlign: 'center', padding: '3px 0' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '3px 0' }}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSweets.slice(0, 8).map((sw, idx) => (
                            <tr key={sw.id || idx} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                              <td style={{ textAlign: 'left', padding: '3px 0' }}>{idx + 1}. {sw.name}</td>
                              <td style={{ textAlign: 'center', padding: '3px 0' }}>{sw.quantity} {sw.unit}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '3px 0' }}>₹{sw.revenue.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="slip-divider" />

                <div className="z-slip-signatures">
                  <div className="sig-line">
                    <p>Prepared By / Cashier</p>
                  </div>
                  <div className="sig-line">
                    <p>Manager Verification</p>
                  </div>
                </div>

                <div className="z-slip-footer">
                  <p>*** {dateMode === 'this-month' ? 'END OF MONTHLY REPORT' : dateMode === 'range' ? 'END OF PERIOD REPORT' : 'END OF DAY Z-REPORT'} ***</p>
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
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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
                      const billId = deleteModalItem.invoiceNumber || deleteModalItem.id || deleteModalItem._id;
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

      {/* Reset Bill Sequence Modal */}
      <ResetBillSequenceModal
        isOpen={isResetBillModalOpen}
        onClose={() => setIsResetBillModalOpen(false)}
        onResetSuccess={onRefresh}
      />
    </div>
  );
}
