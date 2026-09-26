import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCart } from '../../context/CartContext';

// Material UI icons (inline SVG to keep bundle lean while using MUI icon shapes)
const ReceiptIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 3.5 18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2zM19 19c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14zM18 16H6V4h12z"/>
    <path d="M9 6h2v2H9zm4 0h2v2h-2zm-4 3h2v2H9zm4 0h2v2h-2z"/>
  </svg>
);
const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
  </svg>
);
const FilterListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 18h4v-2h-4zM3 6v2h18V6zm3 7h12v-2H6z"/>
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"/>
  </svg>
);

const EXPENSE_CATEGORIES = [
  'General',
  'Fuel & Transport',
  'Packaging',
  'Utilities',
  'Cleaning',
  'Staff Welfare',
  'Maintenance',
  'Purchases',
  'Miscellaneous',
];

const CATEGORY_COLORS = {
  'General': '#475569',
  'Fuel & Transport': '#b45309',
  'Packaging': '#1d4ed8',
  'Utilities': '#6d28d9',
  'Cleaning': '#0f766e',
  'Staff Welfare': '#be185d',
  'Maintenance': '#c2410c',
  'Purchases': '#15803d',
  'Miscellaneous': '#64748b',
};

const CATEGORY_BG_COLORS = {
  'General': '#f1f5f9',
  'Fuel & Transport': '#fef3c7',
  'Packaging': '#eff6ff',
  'Utilities': '#f5f3ff',
  'Cleaning': '#f0fdfa',
  'Staff Welfare': '#fdf2f8',
  'Maintenance': '#fff7ed',
  'Purchases': '#f0fdf4',
  'Miscellaneous': '#f8fafc',
};

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Expense Logger Form (Cashier & Admin) ────────────────────────────────────
function ExpenseLogForm({ onSuccess, cashier, isAdmin = false }) {
  const { logExpense } = useCart();
  const [form, setForm] = useState({
    amount: '',
    purpose: '',
    category: 'General',
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (!form.purpose.trim()) {
      setError('Purpose / reason is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const expense = await logExpense({ ...form, cashier });
      setSuccess(`Expense of ${formatCurrency(expense.amount)} logged successfully.`);
      setForm({
        amount: '',
        purpose: '',
        category: 'General',
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        note: '',
      });
      if (onSuccess) onSuccess(expense);
    } catch (err) {
      setError(err?.message || 'Failed to log expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="expense-log-form"
      onSubmit={handleSubmit}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#d97706' }}>
            <AddIcon />
          </span>
          {isAdmin ? 'Add Store Expense Entry' : 'Log a New Expense'}
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: '#64748b',
            background: '#f8fafc',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          Recorded in Daily Z-Report
        </span>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#16a34a',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon />
          {success}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
            Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
          </span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              ₹
            </span>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              style={{ ...inputStyle, paddingLeft: '28px' }}
              required
            />
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
            Date <span style={{ color: '#dc2626' }}>*</span>
          </span>
          <input
            id="expense-date"
            type="text"
            placeholder="e.g. 25 Sep 2026"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
          Purpose / Reason <span style={{ color: '#dc2626' }}>*</span>
        </span>
        <input
          id="expense-purpose"
          type="text"
          placeholder="e.g. Auto fuel for delivery run, Packaging carry bags, Staff tea & snacks..."
          value={form.purpose}
          onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
          style={inputStyle}
          required
        />
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>Category</span>
          <select
            id="expense-category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            style={{
              ...inputStyle,
              appearance: 'auto',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
            }}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
            Note (optional voucher/receipt ID)
          </span>
          <input
            id="expense-note"
            type="text"
            placeholder="e.g. Voucher #104, Paid via GPay"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            style={inputStyle}
          />
        </label>
      </div>

      <button
        type="submit"
        id="expense-submit-btn"
        disabled={isSubmitting}
        style={{
          background: isSubmitting
            ? '#94a3b8'
            : 'linear-gradient(135deg, #d97706, #b45309)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 26px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(180, 83, 9, 0.25)',
        }}
      >
        <ReceiptIcon />
        {isSubmitting ? 'Saving Expense...' : 'Log Expense'}
      </button>
    </form>
  );
}

// ─── Expenses Main View ────────────────────────────────────────────────────────
export default function ExpensesPage({ currentUser, role = 'admin' }) {
  const { expenses, fetchExpenses, deleteExpense, bills = [], orders = [] } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const isCashier = role === 'cashier';

  const fetchExpensesRef = useRef(fetchExpenses);
  fetchExpensesRef.current = fetchExpenses;
  const isFetchingRef = useRef(false);

  const loadExpenses = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const filters = {};
      if (filterDate) filters.date = filterDate;
      if (filterCashier !== 'all') filters.cashierId = filterCashier;
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (fetchExpensesRef.current) {
        await fetchExpensesRef.current(filters);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [filterDate, filterCashier, filterCategory]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Unique cashiers from loaded expenses
  const cashierOptions = useMemo(() => {
    const seen = new Map();
    expenses.forEach((e) => {
      if (e.cashier?.id && !seen.has(e.cashier.id)) {
        seen.set(e.cashier.id, e.cashier.name || e.cashier.username || e.cashier.id);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [expenses]);

  // Totals
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  // Consolidated sales to determine sales revenue
  const allSales = useMemo(() => {
    let offlineLedger = [];
    let cachedBills = [];
    try {
      offlineLedger = JSON.parse(localStorage.getItem('thenisai_offline_ledger_v2') || '[]');
    } catch {}
    try {
      cachedBills = JSON.parse(localStorage.getItem('thenisai_bills_cache') || '[]');
    } catch {}

    const map = new Map();
    (bills || []).forEach((b) => {
      const key = b.id || b._id || b.invoiceNumber;
      if (key) map.set(key, b);
    });
    offlineLedger.forEach((b) => {
      const key = b.id || b._id || b.invoiceNumber;
      if (key && !map.has(key)) map.set(key, b);
    });
    cachedBills.forEach((b) => {
      const key = b.id || b._id || b.invoiceNumber;
      if (key && !map.has(key)) map.set(key, b);
    });
    (orders || []).forEach((o) => {
      const key = o.id || o._id || o.invoiceNumber;
      if (key && !map.has(key)) map.set(key, o);
    });
    return Array.from(map.values());
  }, [bills, orders]);

  // Helper to test if a record is from today
  const isTodayDate = (dateVal) => {
    if (!dateVal) return false;
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yr}-${mo}-${da}`;

    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const dYr = d.getFullYear();
      const dMo = String(d.getMonth() + 1).padStart(2, '0');
      const dDa = String(d.getDate()).padStart(2, '0');
      if (`${dYr}-${dMo}-${dDa}` === todayStr) return true;
    }
    if (typeof dateVal === 'string' && (dateVal.includes(todayStr) || dateVal === now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))) {
      return true;
    }
    return false;
  };

  const shiftSales = useMemo(() => {
    return allSales.filter((s) => {
      if (!isTodayDate(s.createdAt || s.orderDate || s.date)) return false;
      if (!currentUser || currentUser.role === 'admin') return true;
      const uid = currentUser.id || currentUser._id || currentUser.username;
      return (
        s.cashier?.id === uid ||
        s.cashier?.username === currentUser.username ||
        !s.cashier?.username
      );
    });
  }, [allSales, currentUser]);

  const salesRevenue = useMemo(() => {
    if (isCashier) {
      return shiftSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    }
    return allSales.filter((s) => {
      if (filterCashier !== 'all') {
        const cid = s.cashier?.id || s.cashier?.username || s.cashier?.name;
        if (cid !== filterCashier && s.cashier?.username !== filterCashier && s.cashier?.id !== filterCashier) {
          return false;
        }
      }
      if (filterDate) {
        const sDate = s.orderDate || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '');
        if (!sDate.includes(filterDate)) return false;
      }
      return true;
    }).reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  }, [isCashier, shiftSales, allSales, filterCashier, filterDate]);

  const netBalance = salesRevenue - totalAmount;

  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const cat = e.category || 'General';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleDelete = async (expenseId) => {
    setIsDeleting(true);
    try {
      await deleteExpense(expenseId);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterCashier('all');
    setFilterCategory('all');
  };

  const hasActiveFilters = filterDate || filterCashier !== 'all' || filterCategory !== 'all';

  return (
    <div
      id="expenses-page"
      className="expenses-page-container"
      style={{
        padding: '12px 18px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif",
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        flex: '1 1 0%',
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Strip */}
      <div
        className="expenses-header-strip"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#d97706',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            <ReceiptIcon />
            {isCashier ? 'Shift Petty Cash & Expenses' : 'Store Expenditure Audit'}
          </div>
          <h2
            style={{
              margin: '2px 0 4px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            {isCashier ? 'Log Expense' : 'Expenses'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
            {isCashier
              ? 'Record daily shop expenses so they appear in the Admin report.'
              : 'All shop expenses logged by cashiers — visible in the daily revenue report.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!isCashier && (
            <button
              type="button"
              id="expenses-add-btn"
              onClick={() => setShowAddForm((v) => !v)}
              style={{
                background: showAddForm
                  ? '#fee2e2'
                  : 'linear-gradient(135deg, #d97706, #b45309)',
                color: showAddForm ? '#dc2626' : '#ffffff',
                border: showAddForm ? '1px solid #fecaca' : 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {showAddForm ? <CloseIcon /> : <AddIcon />}
              {showAddForm ? 'Cancel' : 'Add Expense'}
            </button>
          )}

          <button
            type="button"
            id="expenses-refresh-btn"
            onClick={loadExpenses}
            disabled={isLoading}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '9px 14px',
              minWidth: '110px',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
          >
            <span style={{ display: 'inline-flex', animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
              <RefreshIcon />
            </span>
            {isLoading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Cashier Mode: Always display the ExpenseLogForm on top */}
      {isCashier && (
        <ExpenseLogForm cashier={currentUser} onSuccess={loadExpenses} />
      )}

      {/* Admin Mode: Show toggled ExpenseLogForm */}
      {!isCashier && showAddForm && (
        <ExpenseLogForm
          cashier={currentUser}
          isAdmin
          onSuccess={() => {
            setShowAddForm(false);
            loadExpenses();
          }}
        />
      )}

      {/* Summary KPI Cards */}
      <div
        className="expenses-kpis-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '10px',
          marginBottom: '10px',
          flexShrink: 0,
        }}
      >
        {/* Sales Revenue Card */}
        <div style={summaryCardStyle('#0284c7')}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            {isCashier ? 'Shift Sales Revenue' : (hasActiveFilters ? 'Sales Revenue (Filtered)' : 'Gross Sales Revenue')}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', letterSpacing: '-0.02em' }}>
            {formatCurrency(salesRevenue)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            {isCashier
              ? `${shiftSales.length} ${shiftSales.length === 1 ? 'bill' : 'bills'} today`
              : `${allSales.length} total bills collected`}
          </div>
        </div>

        {/* Total Expenses Card */}
        <div style={summaryCardStyle('#e11d48')}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 13H5M12 19l-7-7 7-7" />
            </svg>
            Total Expenses
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#e11d48', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalAmount)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'} logged
          </div>
        </div>

        {/* Net Balance (Revenue - Expense) Card */}
        <div style={summaryCardStyle(netBalance >= 0 ? '#059669' : '#dc2626')}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={netBalance >= 0 ? '#059669' : '#dc2626'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Net Balance (Revenue − Expense)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: netBalance >= 0 ? '#059669' : '#dc2626', letterSpacing: '-0.02em' }}>
            {netBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(netBalance))}
          </div>
          <div style={{ fontSize: '12px', color: netBalance >= 0 ? '#059669' : '#dc2626', marginTop: '4px', fontWeight: 600 }}>
            {netBalance >= 0 ? '✓ Net Surplus' : '⚠ Expenses exceed sales'}
          </div>
        </div>

        {categoryBreakdown.slice(0, 2).map(([cat, amount]) => (
          <div key={cat} style={summaryCardStyle(CATEGORY_COLORS[cat] || '#64748b')}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {cat}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: CATEGORY_COLORS[cat] || '#0f172a', letterSpacing: '-0.02em' }}>
              {formatCurrency(amount)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
              {Math.round((amount / (totalAmount || 1)) * 100)}% of expenses
            </div>
          </div>
        ))}
      </div>

      {/* Filters (Admin and Cashier) */}
      {!isCashier && (
        <div
          className="expenses-filter-strip"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <FilterListIcon />
            <span>Filters</span>
          </div>

          <input
            id="expenses-filter-date"
            type="text"
            placeholder="Filter Date (e.g. 25 Sep)"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ ...filterInputStyle, minWidth: '160px' }}
          />

          <select
            id="expenses-filter-cashier"
            value={filterCashier}
            onChange={(e) => setFilterCashier(e.target.value)}
            style={{ ...filterInputStyle, appearance: 'auto', cursor: 'pointer' }}
          >
            <option value="all">All Cashiers</option>
            {cashierOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            id="expenses-filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ ...filterInputStyle, appearance: 'auto', cursor: 'pointer' }}
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              id="expenses-clear-filters-btn"
              onClick={clearFilters}
              style={{
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                padding: '8px 14px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Expenses Table */}
      {isLoading && expenses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            color: '#64748b',
            fontSize: '14px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              border: '3px solid #cbd5e1',
              borderTopColor: '#d97706',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '10px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div>Loading expenses…</div>
        </div>
      ) : expenses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '54px 24px',
            color: '#64748b',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
            <ReceiptIcon />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            No expenses found
          </div>
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
            {isCashier
              ? 'Use the form above to log your first expense.'
              : 'No expenses logged yet for the selected filters.'}
          </div>
        </div>
      ) : (
        <div
          className="expenses-table-card"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            flex: '1 1 0%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="expenses-table-wrap"
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              flex: '1 1 0%',
              minHeight: 0,
              maxHeight: '100%',
              height: '100%',
            }}
          >
            <table
              id="expenses-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1.5px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {[
                    'Date',
                    'Purpose',
                    'Category',
                    'Logged By',
                    'Note',
                    'Amount',
                    ...(role === 'admin' ? ['Actions'] : []),
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: h === 'Amount' ? 'right' : 'left',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        background: '#f8fafc',
                        position: 'sticky',
                        top: 0,
                        zIndex: 11,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, idx) => (
                  <tr
                    key={exp.id || idx}
                    id={`expense-row-${exp.id || idx}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#f8fafc')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                    >
                      {exp.date || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#0f172a',
                        maxWidth: '280px',
                      }}
                    >
                      <div style={{ fontWeight: 600, lineHeight: 1.4 }}>
                        {exp.purpose}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background:
                            CATEGORY_BG_COLORS[exp.category] || '#f1f5f9',
                          color:
                            CATEGORY_COLORS[exp.category] || '#475569',
                          border: `1px solid ${CATEGORY_COLORS[exp.category] || '#cbd5e1'}44`,
                          borderRadius: '6px',
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {exp.category || 'General'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#475569',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                    >
                      {exp.cashier?.name || exp.cashier?.username || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#64748b',
                        fontSize: '12px',
                        maxWidth: '180px',
                      }}
                    >
                      {exp.note || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: 800,
                        color: '#b91c1c',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCurrency(exp.amount)}
                    </td>
                    {role === 'admin' && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          id={`expense-delete-${exp.id}`}
                          onClick={() => setDeleteTarget(exp)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Delete expense"
                        >
                          <DeleteIcon />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderTop: '2px solid #e2e8f0',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                  }}
                >
                  <td
                    colSpan={role === 'admin' ? 5 : 4}
                    style={{
                      padding: '14px 16px',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    Total ({expenses.length}{' '}
                    {expenses.length === 1 ? 'entry' : 'entries'})
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#b91c1c',
                      fontSize: '16px',
                    }}
                  >
                    {formatCurrency(totalAmount)}
                  </td>
                  {role === 'admin' && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h3
              style={{
                margin: '0 0 10px',
                color: '#0f172a',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              Delete Expense?
            </h3>
            <p
              style={{
                margin: '0 0 14px',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete this expense record? This will adjust the daily net revenue calculation.
            </p>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: '#b91c1c',
                  fontSize: '16px',
                }}
              >
                {formatCurrency(deleteTarget.amount)}
              </div>
              <div
                style={{
                  color: '#0f172a',
                  fontSize: '13px',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                {deleteTarget.purpose}
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                {deleteTarget.date} · {deleteTarget.cashier?.name || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                id="expense-delete-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                id="expense-delete-confirm-btn"
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={isDeleting}
                style={{
                  background: isDeleting
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  background: '#ffffff',
  border: '1.5px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '14px',
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const filterInputStyle = {
  ...inputStyle,
  flex: '0 1 auto',
  width: 'auto',
  minWidth: '140px',
  padding: '8px 12px',
  fontSize: '13px',
};

function summaryCardStyle(accentColor) {
  return {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderLeft: `4px solid ${accentColor}`,
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  };
}
