import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { isProductUnlimitedStock, getItemStockConfig } from '../../utils/unitConfig';

export default function StockDetailsModal({
  item,
  onClose,
  onEditItem,
  onOpenRefill,
}) {
  const { bills = [], stockLogs = [], inventory = [] } = useCart();

  // Filters state
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sale' | 'inward' | 'manual'
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  // Fresh live inventory item data
  const liveInv = inventory.find((i) => i.id === item.id) || item;
  const isUnlimited = isProductUnlimitedStock(liveInv);
  const stockConfig = getItemStockConfig(liveInv);
  const currentStock = typeof liveInv.counterStock === 'number'
    ? liveInv.counterStock
    : (typeof liveInv.stockKg === 'number' ? liveInv.stockKg : 0);
  const minThreshold = liveInv.minThreshold || (liveInv.unit === '1 Pc' ? 15 : 8);

  const stockStatus = isUnlimited
    ? 'unlimited'
    : currentStock <= 0
    ? 'out_of_stock'
    : currentStock <= minThreshold
    ? 'low_stock'
    : 'in_stock';

  // Extract all historical sales records for this product from bills
  const salesHistory = useMemo(() => {
    const records = [];
    if (!Array.isArray(bills)) return records;

    bills.forEach((bill) => {
      if (!Array.isArray(bill.items)) return;
      bill.items.forEach((lineItem) => {
        if (lineItem.id === item.id) {
          const qty = parseFloat(lineItem.quantity) || 1;
          const lineTotal = Number(lineItem.total ?? (Number(lineItem.price || 0) * qty));
          const unitStr = lineItem.weight || lineItem.unit || liveInv.unit || 'unit';

          // Extract date
          let dateObj = null;
          if (bill.createdAt) {
            dateObj = new Date(bill.createdAt);
          } else if (bill.orderDate) {
            dateObj = new Date(bill.orderDate);
          }

          const rawDateStr = bill.orderDate || (dateObj ? dateObj.toLocaleDateString('en-IN') : 'N/A');
          const rawTimeStr = bill.orderTime || (dateObj ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

          records.push({
            id: `sale-${bill.id || bill.invoiceNumber}-${lineItem.id}`,
            type: 'SALE',
            typeLabel: 'Counter Sale',
            invoiceNumber: bill.invoiceNumber || bill.id || 'N/A',
            quantity: qty,
            unitDisplay: `${qty} × ${unitStr}`,
            rate: lineItem.price || 0,
            amount: lineTotal,
            cashier: bill.cashier?.name || 'Counter Cashier',
            paymentMethod: bill.paymentMethod || 'Cash',
            dateStr: rawDateStr,
            timeStr: rawTimeStr,
            timestamp: dateObj && !isNaN(dateObj.getTime()) ? dateObj.getTime() : (bill.createdAt || 0),
            note: `Billed to ${bill.customer?.name || 'Walk-in Customer'}`,
          });
        }
      });
    });

    return records;
  }, [bills, item.id, liveInv.unit]);

  // Extract relevant stockLogs (inward, refills, returns, manual edits)
  const movementLogs = useMemo(() => {
    if (!Array.isArray(stockLogs)) return [];
    return stockLogs
      .filter((log) => log.productId === item.id)
      .map((log) => ({
        id: log.id || `log-${log.timestamp || Date.now()}`,
        type: log.type === 'COUNTER_SALE' ? 'SALE' : (log.type === 'GODOWN_INWARD' || log.type === 'REFILL') ? 'INWARD' : 'MANUAL',
        typeLabel: log.type === 'COUNTER_SALE'
          ? 'Counter Sale'
          : log.type === 'GODOWN_INWARD'
          ? 'Godown Inward'
          : log.type === 'REFILL'
          ? 'Counter Refill'
          : log.type === 'WASTAGE'
          ? 'Wastage Return'
          : 'Stock Adjustment',
        invoiceNumber: log.invoiceNumber || '—',
        quantity: log.quantity || 1,
        unitDisplay: log.displayQty || `${log.quantity} ${log.unit || liveInv.unit || ''}`,
        rate: log.sellingPrice || liveInv.price || 0,
        amount: log.totalAmount || 0,
        cashier: log.performedBy || 'Staff',
        paymentMethod: '—',
        dateStr: log.date || (log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-IN') : 'N/A'),
        timeStr: log.time || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''),
        timestamp: log.timestamp || log.createdAt || 0,
        note: log.note || 'Stock event',
      }));
  }, [stockLogs, item.id, liveInv.unit, liveInv.price]);

  // Merge and deduplicate by ID or invoiceNumber
  const allEvents = useMemo(() => {
    const combined = [...salesHistory];
    movementLogs.forEach((m) => {
      // Don't duplicate sales if already present from bills
      if (m.type === 'SALE') {
        const exists = combined.some((s) => s.invoiceNumber === m.invoiceNumber && m.invoiceNumber !== '—');
        if (!exists) combined.push(m);
      } else {
        combined.push(m);
      }
    });

    // Sort newest first
    return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [salesHistory, movementLogs]);

  // Date filtering helper
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const ms7Days = 7 * 24 * 60 * 60 * 1000;
    const ms30Days = 30 * 24 * 60 * 60 * 1000;

    return allEvents.filter((ev) => {
      // Type filter
      if (typeFilter === 'sale' && ev.type !== 'SALE') return false;
      if (typeFilter === 'inward' && ev.type !== 'INWARD') return false;
      if (typeFilter === 'manual' && ev.type !== 'MANUAL') return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          String(ev.invoiceNumber || '').toLowerCase().includes(q) ||
          String(ev.cashier || '').toLowerCase().includes(q) ||
          String(ev.note || '').toLowerCase().includes(q) ||
          String(ev.paymentMethod || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Date filter
      if (dateFilter === 'all') return true;

      const evTime = ev.timestamp;
      const evDate = new Date(evTime);
      const evDateFormatted = !isNaN(evDate.getTime())
        ? `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`
        : '';

      if (dateFilter === 'today') {
        return evDateFormatted === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return evDateFormatted === yesterdayStr;
      }
      if (dateFilter === '7days') {
        return (now.getTime() - evTime) <= ms7Days;
      }
      if (dateFilter === '30days') {
        return (now.getTime() - evTime) <= ms30Days;
      }
      if (dateFilter === 'custom' && customDate) {
        return evDateFormatted === customDate;
      }

      return true;
    });
  }, [allEvents, typeFilter, dateFilter, customDate, searchTerm]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    let totalQtySold = 0;
    let totalRevenue = 0;
    let totalSalesCount = 0;
    let totalInwardQty = 0;

    filteredEvents.forEach((ev) => {
      if (ev.type === 'SALE') {
        totalQtySold += ev.quantity;
        totalRevenue += ev.amount;
        totalSalesCount += 1;
      } else if (ev.type === 'INWARD') {
        totalInwardQty += ev.quantity;
      }
    });

    return {
      totalQtySold: Math.round(totalQtySold * 100) / 100,
      totalRevenue: Math.round(totalRevenue),
      totalSalesCount,
      totalInwardQty: Math.round(totalInwardQty * 100) / 100,
    };
  }, [filteredEvents]);

  return (
    <div
      className="stock-details-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="stock-details-modal-card"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#92400e',
                fontSize: '20px',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.2)',
              }}
            >
              📦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#ede9fe',
                    color: '#6d28d9',
                    fontFamily: 'monospace',
                  }}
                >
                  SKU: {liveInv.skuCode || liveInv.itemNumber || '—'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#475569',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {liveInv.category || 'Sweets'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Unit: {liveInv.unit || stockConfig.label}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {liveInv.englishName || (liveInv.name ? liveInv.name.split('—')[0].trim() : 'Product Details')}
                {liveInv.tamilName && (
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#d97706' }}>
                    ({liveInv.tamilName})
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenRefill && (
              <button
                type="button"
                onClick={() => onOpenRefill(liveInv.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ➕ Refill Stock
              </button>
            )}

            {onEditItem && (
              <button
                type="button"
                onClick={() => onEditItem(liveInv)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ✏️ Edit Item
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              title="Close modal (Esc)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* LIVE STOCK & KPI CARDS STRIP */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            {/* 1. CURRENT AVAILABLE STOCK */}
            <div
              style={{
                background: isUnlimited
                  ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                  : stockStatus === 'out_of_stock'
                  ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                  : stockStatus === 'low_stock'
                  ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
                  : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                border: `1.5px solid ${
                  isUnlimited
                    ? '#86efac'
                    : stockStatus === 'out_of_stock'
                    ? '#fca5a5'
                    : stockStatus === 'low_stock'
                    ? '#fde68a'
                    : '#cbd5e1'
                }`,
                borderRadius: '12px',
                padding: '14px 16px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Stock
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background:
                      isUnlimited
                        ? '#dcfce7'
                        : stockStatus === 'out_of_stock'
                        ? '#fee2e2'
                        : stockStatus === 'low_stock'
                        ? '#fef3c7'
                        : '#d1fae5',
                    color:
                      isUnlimited
                        ? '#15803d'
                        : stockStatus === 'out_of_stock'
                        ? '#b91c1c'
                        : stockStatus === 'low_stock'
                        ? '#b45309'
                        : '#047857',
                  }}
                >
                  {isUnlimited
                    ? '∞ UNLIMITED'
                    : stockStatus === 'out_of_stock'
                    ? '🔴 OUT OF STOCK'
                    : stockStatus === 'low_stock'
                    ? '⚠️ LOW STOCK'
                    : '🟢 IN STOCK'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color:
                      stockStatus === 'out_of_stock'
                        ? '#b91c1c'
                        : stockStatus === 'low_stock'
                        ? '#b45309'
                        : '#0f172a',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {isUnlimited ? '∞' : currentStock}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
                  {isUnlimited ? 'Prepared on demand' : liveInv.unit || stockConfig.label}
                </span>
              </div>
              {!isUnlimited && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Alert threshold: <strong>{minThreshold} {liveInv.unit || stockConfig.label}</strong>
                </div>
              )}
            </div>

            {/* 2. TOTAL SOLD IN FILTERED PERIOD */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Total Quantity Sold
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', fontFamily: "'JetBrains Mono', monospace" }}>
                  {summaryMetrics.totalQtySold}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
                  units / times
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                From <strong>{summaryMetrics.totalSalesCount}</strong> finalized bills
              </div>
            </div>

            {/* 3. TOTAL REVENUE FROM ITEM */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Total Revenue Generated
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#059669', fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{summaryMetrics.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Unit Price: <strong>₹{liveInv.price || 0}</strong> {liveInv.discountPercent > 0 && `(${liveInv.discountPercent}% OFF)`}
              </div>
            </div>

            {/* 4. TOTAL RESTOCKED / INWARD */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Total Restocked
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', fontFamily: "'JetBrains Mono', monospace" }}>
                  {summaryMetrics.totalInwardQty}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
                  {liveInv.unit || stockConfig.label}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Through Godown Inward &amp; Refills
              </div>
            </div>
          </div>

          {/* FILTER CONTROLS BAR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Quick Date Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
                📅 Time Range:
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: "Today's Shift" },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Date' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDateFilter(pill.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: dateFilter === pill.id ? 700 : 500,
                    backgroundColor: dateFilter === pill.id ? '#0f172a' : '#ffffff',
                    color: dateFilter === pill.id ? '#ffffff' : '#475569',
                    border: dateFilter === pill.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pill.label}
                </button>
              ))}

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #94a3b8',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                  }}
                />
              )}
            </div>

            {/* Type Filter & Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="all">All Movements</option>
                <option value="sale">Sales Only (Billed)</option>
                <option value="inward">Restocks / Inward</option>
                <option value="manual">Manual Adjustments</option>
              </select>

              <input
                type="text"
                placeholder="Search invoice #, cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  width: '180px',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* HISTORICAL MOVEMENT & SALES TABLE */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                Stock Sales &amp; Inward Log ({filteredEvents.length} transactions)
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Real-time stock audit history with timestamp
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                  No stock transactions found for this period
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Try changing your time filter or search query.
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '10px 14px' }}>DATE &amp; TIME</th>
                      <th style={{ padding: '10px 14px' }}>EVENT TYPE</th>
                      <th style={{ padding: '10px 14px' }}>INVOICE / REF</th>
                      <th style={{ padding: '10px 14px' }}>QTY / WEIGHT</th>
                      <th style={{ padding: '10px 14px' }}>RATE &amp; TOTAL</th>
                      <th style={{ padding: '10px 14px' }}>CASHIER / STAFF</th>
                      <th style={{ padding: '10px 14px' }}>DETAILS / NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((ev, index) => (
                      <tr
                        key={ev.id || index}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                          transition: 'background-color 0.1s',
                        }}
                      >
                        {/* 1. Date & Time */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.dateStr}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{ev.timeStr}</div>
                        </td>

                        {/* 2. Event Type */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor:
                                ev.type === 'SALE'
                                  ? '#fef2f2'
                                  : ev.type === 'INWARD'
                                  ? '#eff6ff'
                                  : '#fef3c7',
                              color:
                                ev.type === 'SALE'
                                  ? '#b91c1c'
                                  : ev.type === 'INWARD'
                                  ? '#1d4ed8'
                                  : '#b45309',
                            }}
                          >
                            {ev.type === 'SALE' ? '📉 Sold (Bill)' : ev.type === 'INWARD' ? '📈 Inward Refill' : '✏️ Adjustment'}
                          </span>
                        </td>

                        {/* 3. Invoice Number */}
                        <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {ev.invoiceNumber !== '—' ? (
                            <span
                              style={{
                                background: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                color: '#0f172a',
                              }}
                            >
                              #{ev.invoiceNumber}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 4. Quantity / Weight */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              color: ev.type === 'SALE' ? '#b91c1c' : '#059669',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {ev.type === 'SALE' ? `-${ev.unitDisplay}` : `+${ev.unitDisplay}`}
                          </span>
                        </td>

                        {/* 5. Rate & Amount */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {ev.amount > 0 ? (
                            <div>
                              <strong style={{ color: '#0f172a' }}>₹{ev.amount.toLocaleString('en-IN')}</strong>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                                @ ₹{ev.rate}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 6. Cashier */}
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {ev.cashier}
                          </span>
                          {ev.paymentMethod !== '—' && (
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                              Pay: {ev.paymentMethod}
                            </span>
                          )}
                        </td>

                        {/* 7. Note */}
                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>
                          {ev.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <strong>{filteredEvents.length}</strong> activity logs for {liveInv.name}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
