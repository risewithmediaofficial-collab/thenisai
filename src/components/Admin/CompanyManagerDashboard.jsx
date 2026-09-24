import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getItemStockConfig } from '../../utils/unitConfig';
import AddStockModal from '../Inventory/AddStockModal';
import DispatchStockModal from './DispatchStockModal';
import ReturnStockModal from './ReturnStockModal';

export default function CompanyManagerDashboard() {
  const { user, logout } = useAuth();
  const {
    inventory,
    stockLogs = [],
    fetchStockLogs,
    navigateTo,
  } = useCart();

  // Active tab: 'remaining' | 'daily'
  const [activeTab, setActiveTab] = useState('remaining');

  // Search & Filtering for Remaining Stock
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'low_godown' | 'low_counter' | 'out_of_stock'

  // Responsive Layout Mode: 'auto' | 'table' | 'cards'
  const [viewMode, setViewMode] = useState('auto');

  // Filtering for Daily Activity Logs
  const [logTypeFilter, setLogTypeFilter] = useState('all'); // 'all' | 'GODOWN_INWARD' | 'DISPATCH_TO_COUNTER' | 'COUNTER_RETURN' | 'WASTAGE'
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('today'); // 'today' | 'all'

  // Modals state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [modalSelectedSweetId, setModalSelectedSweetId] = useState(null);
  const [modalTarget, setModalTarget] = useState('godown');

  // Refresh logs on mount
  useEffect(() => {
    if (typeof fetchStockLogs === 'function') {
      fetchStockLogs();
    }
  }, []);

  // Compute Categories from inventory
  const categories = useMemo(() => {
    const set = new Set();
    inventory.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtered remaining stock
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = !query ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.englishName && item.englishName.toLowerCase().includes(query)) ||
        (item.tamilName && item.tamilName.toLowerCase().includes(query)) ||
        (item.skuCode && String(item.skuCode).toLowerCase().includes(query)) ||
        (item.itemNumber && String(item.itemNumber).includes(query));

      if (!nameMatch) return false;

      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      const counter = item.counterStock ?? item.stockKg ?? 0;
      const godown = item.godownStock ?? Math.round(counter * 1.5);
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      if (stockStatusFilter === 'low_godown') {
        return godown <= minThresh;
      }
      if (stockStatusFilter === 'low_counter') {
        return counter <= minThresh;
      }
      if (stockStatusFilter === 'out_of_stock') {
        return counter <= 0 && godown <= 0;
      }

      return true;
    });
  }, [inventory, searchQuery, selectedCategory, stockStatusFilter]);

  // Aggregate remaining stock metrics
  const stockSummary = useMemo(() => {
    let totalGodownItems = 0;
    let totalCounterItems = 0;
    let lowGodownCount = 0;
    let lowCounterCount = 0;
    let outOfStockCount = 0;

    inventory.forEach((item) => {
      const counter = item.counterStock ?? item.stockKg ?? 0;
      const godown = item.godownStock ?? Math.round(counter * 1.5);
      const minThresh = item.minThreshold || 8;

      totalGodownItems += godown;
      totalCounterItems += counter;

      if (godown <= minThresh) lowGodownCount++;
      if (counter <= minThresh) lowCounterCount++;
      if (godown <= 0 && counter <= 0) outOfStockCount++;
    });

    return {
      totalProducts: inventory.length,
      totalGodownItems: Math.round(totalGodownItems * 10) / 10,
      totalCounterItems: Math.round(totalCounterItems * 10) / 10,
      lowGodownCount,
      lowCounterCount,
      outOfStockCount,
    };
  }, [inventory]);

  // Filtered Daily Activity Logs
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN');

    return stockLogs.filter((log) => {
      if (logDateFilter === 'today' && log.date && log.date !== todayStr) {
        return false;
      }

      if (logTypeFilter !== 'all' && log.type !== logTypeFilter) {
        return false;
      }

      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase().trim();
        const pName = (log.productName || log.productId || '').toLowerCase();
        const pNote = (log.note || '').toLowerCase();
        const pUser = (log.performedBy || '').toLowerCase();
        return pName.includes(q) || pNote.includes(q) || pUser.includes(q);
      }

      return true;
    });
  }, [stockLogs, logDateFilter, logTypeFilter, logSearchQuery]);

  // Daily movement metrics
  const dailyMetrics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    let inwardCount = 0;
    let dispatchCount = 0;
    let returnCount = 0;
    let wastageCount = 0;

    stockLogs.forEach((log) => {
      if (log.date === todayStr || !log.date) {
        if (log.type === 'GODOWN_INWARD') inwardCount += 1;
        else if (log.type === 'DISPATCH_TO_COUNTER') dispatchCount += 1;
        else if (log.type === 'COUNTER_RETURN') returnCount += 1;
        else if (log.type === 'WASTAGE') wastageCount += 1;
      }
    });

    return { inwardCount, dispatchCount, returnCount, wastageCount };
  }, [stockLogs]);

  // Quick actions
  const handleOpenInward = (sweetId = null, target = 'godown') => {
    setModalSelectedSweetId(sweetId);
    setModalTarget(target);
    setIsAddStockOpen(true);
  };

  const handleOpenDispatch = (sweetId = null) => {
    setModalSelectedSweetId(sweetId);
    setIsDispatchOpen(true);
  };

  const handleOpenReturn = (sweetId = null) => {
    setModalSelectedSweetId(sweetId);
    setIsReturnOpen(true);
  };

  const handleLogout = () => {
    logout();
    if (typeof navigateTo === 'function') {
      navigateTo('storefront');
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Navigation Bar - Light Theme */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Brand & Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
              color: '#fff',
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: '#0f172a',
                  fontFamily: "'Outfit', 'Cinzel', serif",
                }}
              >
                THENISAI SWEETS
              </h1>
              <span
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Company Manager Portal
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Godown Warehouse &amp; Daily Stock Control System (கோடவுன் மேலாளர் போர்ட்டல்)
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleOpenInward(null, 'godown')}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>+ Inward Stock</span>
            <span style={{ fontSize: '11px', opacity: 0.9 }}>(சரக்கு வரவு)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDispatch(null)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <span>🚚 Dispatch to Counter</span>
            <span style={{ fontSize: '11px', opacity: 0.9 }}>(கவுண்டருக்கு)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenReturn(null)}
            style={{
              backgroundColor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>↩️ Return / Wastage</span>
          </button>

          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#e2e8f0',
              margin: '0 4px',
            }}
          />

          {/* User profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                {user?.name || 'Company Manager'}
              </div>
              <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>● Online (Godown Dept)</div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Sign out of Company Manager Portal"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
        {/* KPI Summary Cards - Light Theme */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Godown Total Items */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                🏭 Total Godown Stock
              </span>
              <span style={{ fontSize: '18px' }}>📦</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
              {stockSummary.totalGodownItems}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Across {stockSummary.totalProducts} active products in warehouse
            </div>
          </div>

          {/* Counter Tray Stock */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                🛒 Shop Counter Trays
              </span>
              <span style={{ fontSize: '18px' }}>🧁</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {stockSummary.totalCounterItems}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Active retail tray stock available for selling
            </div>
          </div>

          {/* Today's Inwards */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#047857', fontWeight: 600, letterSpacing: '0.04em' }}>
                📥 Today's Inwards
              </span>
              <span style={{ fontSize: '18px' }}>✨</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {dailyMetrics.inwardCount}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>batches</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Kitchen arrivals loaded into Godown today
            </div>
          </div>

          {/* Today's Dispatches to Counter */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 600, letterSpacing: '0.04em' }}>
                🚚 Today's Dispatches
              </span>
              <span style={{ fontSize: '18px' }}>⚡</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
              {dailyMetrics.dispatchCount}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>transfers</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Replenished to shop counter trays
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div
            style={{
              backgroundColor: stockSummary.lowGodownCount > 0 ? '#fef2f2' : '#ffffff',
              border: stockSummary.lowGodownCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  color: stockSummary.lowGodownCount > 0 ? '#b91c1c' : '#64748b',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                ⚠️ Low Godown Stock
              </span>
              <span style={{ fontSize: '18px' }}>🚨</span>
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: stockSummary.lowGodownCount > 0 ? '#dc2626' : '#059669',
                marginTop: '6px',
              }}
            >
              {stockSummary.lowGodownCount}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>items</span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: stockSummary.lowGodownCount > 0 ? '#b91c1c' : '#64748b',
                marginTop: '4px',
              }}
            >
              {stockSummary.lowGodownCount > 0 ? 'Requires kitchen replenishment' : 'All godown balances healthy'}
            </div>
          </div>
        </section>

        {/* View Selection Tabs & Layout Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('remaining')}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'remaining' ? '3px solid #d97706' : '3px solid transparent',
                color: activeTab === 'remaining' ? '#92400e' : '#64748b',
                fontSize: '15px',
                fontWeight: activeTab === 'remaining' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📦 Remaining Stock</span>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>(மீதமுள்ள சரக்கு)</span>
              <span
                style={{
                  backgroundColor: activeTab === 'remaining' ? '#fef3c7' : '#f1f5f9',
                  color: activeTab === 'remaining' ? '#92400e' : '#475569',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {filteredInventory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'daily' ? '3px solid #d97706' : '3px solid transparent',
                color: activeTab === 'daily' ? '#92400e' : '#64748b',
                fontSize: '15px',
                fontWeight: activeTab === 'daily' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📋 Daily Stock Activity</span>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>(தினசரி சரக்கு நகர்வு)</span>
              <span
                style={{
                  backgroundColor: activeTab === 'daily' ? '#fef3c7' : '#f1f5f9',
                  color: activeTab === 'daily' ? '#92400e' : '#475569',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {filteredLogs.length}
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle: Auto / Table / Cards */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Table View"
              >
                <span>☰</span>
                <span className="hide-on-mobile">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  border: 'none',
                  background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                  color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Card View"
              >
                <span>🔲</span>
                <span className="hide-on-mobile">Cards</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof fetchStockLogs === 'function') fetchStockLogs();
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🔄 Refresh</span>
            </button>
          </div>
        </div>

        {/* TAB 1: REMAINING STOCK (MEETHAMULLA SARAKKU) */}
        {activeTab === 'remaining' && (
          <div>
            {/* Filter Toolbar - Light Theme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                backgroundColor: '#ffffff',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Search Input */}
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
                <input
                  type="text"
                  placeholder="Search item by name, Tamil or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    color: '#94a3b8',
                  }}
                >
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Category:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Categories ({inventory.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'low_godown', label: `Low Godown (${stockSummary.lowGodownCount})` },
                  { id: 'low_counter', label: `Low Counter (${stockSummary.lowCounterCount})` },
                  { id: 'out_of_stock', label: `Out of Stock (${stockSummary.outOfStockCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStockStatusFilter(f.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: stockStatusFilter === f.id
                        ? '1px solid #d97706'
                        : '1px solid #e2e8f0',
                      backgroundColor: stockStatusFilter === f.id
                        ? '#fef3c7'
                        : '#f8fafc',
                      color: stockStatusFilter === f.id ? '#92400e' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CARD VIEW (For Mobile & Optional Toggle) */}
            {viewMode === 'cards' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {filteredInventory.length === 0 ? (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '48px',
                      textAlign: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                  >
                    No products match the selected filters.
                  </div>
                ) : (
                  filteredInventory.map((item) => {
                    const unitConf = getItemStockConfig(item);
                    const counter = item.counterStock ?? item.stockKg ?? 0;
                    const godown = item.godownStock ?? Math.round(counter * 1.5);
                    const total = Math.round((godown + counter) * 100) / 100;
                    const minThresh = item.minThreshold || (unitConf.type === 'pcs' ? 15 : 8);

                    const isGodownLow = godown <= minThresh;
                    const isCounterLow = counter <= minThresh;
                    const isOut = godown <= 0 && counter <= 0;

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isOut
                            ? '1px solid #fecaca'
                            : isGodownLow
                            ? '1px solid #fed7aa'
                            : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '18px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                        }}
                      >
                        {/* Header: Name, Tamil & Status */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                {item.name || item.englishName}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                {item.tamilName && (
                                  <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
                                    {item.tamilName}
                                  </span>
                                )}
                                {item.tamilName && <span style={{ color: '#cbd5e1' }}>•</span>}
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  SKU: {item.skuCode || item.itemNumber || item.id}
                                </span>
                              </div>
                            </div>

                            <span
                              style={{
                                backgroundColor: isOut
                                  ? '#fef2f2'
                                  : isGodownLow
                                  ? '#fff7ed'
                                  : isCounterLow
                                  ? '#fffbeb'
                                  : '#ecfdf5',
                                color: isOut
                                  ? '#b91c1c'
                                  : isGodownLow
                                  ? '#c2410c'
                                  : isCounterLow
                                  ? '#b45309'
                                  : '#047857',
                                border: isOut
                                  ? '1px solid #fecaca'
                                  : isGodownLow
                                  ? '1px solid #ffedd5'
                                  : isCounterLow
                                  ? '1px solid #fde68a'
                                  : '1px solid #a7f3d0',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isOut ? 'OUT OF STOCK' : isGodownLow ? 'LOW GODOWN' : isCounterLow ? 'LOW COUNTER' : 'HEALTHY'}
                            </span>
                          </div>

                          <div style={{ marginTop: '8px' }}>
                            <span
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #e2e8f0',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              Unit: {unitConf.label}
                            </span>
                          </div>
                        </div>

                        {/* Stock Balance Comparison */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '8px',
                            backgroundColor: '#f8fafc',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                              🏭 Godown
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: isGodownLow ? '#dc2626' : '#2563eb', marginTop: '2px' }}>
                              {godown}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{unitConf.label}</div>
                          </div>

                          <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                              🛒 Counter
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: isCounterLow ? '#d97706' : '#059669', marginTop: '2px' }}>
                              {counter}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{unitConf.label}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                              📦 Total
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                              {total}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{unitConf.label}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenInward(item.id, 'godown')}
                            style={{
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Inward
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDispatch(item.id)}
                            disabled={godown <= 0}
                            style={{
                              backgroundColor: godown > 0 ? '#eff6ff' : '#f8fafc',
                              border: godown > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              color: godown > 0 ? '#1d4ed8' : '#94a3b8',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: godown > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            🚚 Dispatch
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReturn(item.id)}
                            disabled={counter <= 0}
                            style={{
                              backgroundColor: counter > 0 ? '#fffbeb' : '#f8fafc',
                              border: counter > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                              color: counter > 0 ? '#b45309' : '#94a3b8',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: counter > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            ↩️ Return
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* TABLE VIEW (Light Theme with Crisp Typography) */
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                    <thead>
                      <tr
                        style={{
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#475569',
                          fontWeight: 700,
                        }}
                      >
                        <th style={{ padding: '14px 18px' }}>Product &amp; SKU</th>
                        <th style={{ padding: '14px 14px' }}>Unit</th>
                        <th style={{ padding: '14px 14px' }}>🏭 Godown Stock</th>
                        <th style={{ padding: '14px 14px' }}>🛒 Counter Tray</th>
                        <th style={{ padding: '14px 14px' }}>📦 Total Balance</th>
                        <th style={{ padding: '14px 14px' }}>Status</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                            No products match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item, idx) => {
                          const unitConf = getItemStockConfig(item);
                          const counter = item.counterStock ?? item.stockKg ?? 0;
                          const godown = item.godownStock ?? Math.round(counter * 1.5);
                          const total = Math.round((godown + counter) * 100) / 100;
                          const minThresh = item.minThreshold || (unitConf.type === 'pcs' ? 15 : 8);

                          const isGodownLow = godown <= minThresh;
                          const isCounterLow = counter <= minThresh;
                          const isOut = godown <= 0 && counter <= 0;

                          return (
                            <tr
                              key={item.id || idx}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                transition: 'background-color 0.12s ease',
                              }}
                            >
                              {/* Product & Details - Crisp typography, NO duplicate Tamil text */}
                              <td style={{ padding: '14px 18px' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                                  {item.name || item.englishName}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                  {item.tamilName && (
                                    <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
                                      {item.tamilName}
                                    </span>
                                  )}
                                  {item.tamilName && <span style={{ color: '#cbd5e1' }}>•</span>}
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    SKU: {item.skuCode || item.itemNumber || item.id}
                                  </span>
                                </div>
                              </td>

                              {/* Native Unit Pill - Clean badge without duplication */}
                              <td style={{ padding: '14px 14px' }}>
                                <span
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    color: '#334155',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {unitConf.label}
                                </span>
                              </td>

                              {/* Godown Warehouse Stock */}
                              <td style={{ padding: '14px 14px' }}>
                                <div
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: isGodownLow ? '#dc2626' : '#2563eb',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '4px',
                                  }}
                                >
                                  <span>{godown}</span>
                                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                                    {unitConf.label}
                                  </span>
                                </div>
                                {isGodownLow && (
                                  <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                                    Below min ({minThresh})
                                  </div>
                                )}
                              </td>

                              {/* Counter Tray Stock */}
                              <td style={{ padding: '14px 14px' }}>
                                <div
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: isCounterLow ? '#d97706' : '#059669',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '4px',
                                  }}
                                >
                                  <span>{counter}</span>
                                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                                    {unitConf.label}
                                  </span>
                                </div>
                                {isCounterLow && (
                                  <div style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                                    Refill needed
                                  </div>
                                )}
                              </td>

                              {/* Total Combined Remaining */}
                              <td style={{ padding: '14px 14px' }}>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                  {total}{' '}
                                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                                    {unitConf.label}
                                  </span>
                                </div>
                              </td>

                              {/* Status Tag - nowrap so it never breaks awkwardly */}
                              <td style={{ padding: '14px 14px' }}>
                                {isOut ? (
                                  <span
                                    style={{
                                      backgroundColor: '#fef2f2',
                                      color: '#b91c1c',
                                      border: '1px solid #fecaca',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '9999px',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                    }}
                                  >
                                    OUT OF STOCK
                                  </span>
                                ) : isGodownLow ? (
                                  <span
                                    style={{
                                      backgroundColor: '#fff7ed',
                                      color: '#c2410c',
                                      border: '1px solid #ffedd5',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '9999px',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                    }}
                                  >
                                    LOW GODOWN
                                  </span>
                                ) : isCounterLow ? (
                                  <span
                                    style={{
                                      backgroundColor: '#fffbeb',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '9999px',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                    }}
                                  >
                                    LOW COUNTER
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      backgroundColor: '#ecfdf5',
                                      color: '#047857',
                                      border: '1px solid #a7f3d0',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: '9999px',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                    }}
                                  >
                                    HEALTHY
                                  </span>
                                )}
                              </td>

                              {/* Row Action Buttons */}
                              <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  {/* Inward button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInward(item.id, 'godown')}
                                    style={{
                                      backgroundColor: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      color: '#047857',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`Inward ${unitConf.label} to Godown`}
                                  >
                                    + Inward
                                  </button>

                                  {/* Dispatch to counter button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDispatch(item.id)}
                                    disabled={godown <= 0}
                                    style={{
                                      backgroundColor: godown > 0 ? '#eff6ff' : '#f8fafc',
                                      border: godown > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                      color: godown > 0 ? '#1d4ed8' : '#94a3b8',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: godown > 0 ? 'pointer' : 'not-allowed',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`Dispatch from Godown to Counter Tray`}
                                  >
                                    🚚 Dispatch
                                  </button>

                                  {/* Return / wastage button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturn(item.id)}
                                    disabled={counter <= 0}
                                    style={{
                                      backgroundColor: counter > 0 ? '#fffbeb' : '#f8fafc',
                                      border: counter > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                                      color: counter > 0 ? '#b45309' : '#94a3b8',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: counter > 0 ? 'pointer' : 'not-allowed',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`Return or Wastage for ${item.name}`}
                                  >
                                    ↩️ Return
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DAILY STOCK ACTIVITY LOG (DINASARI SARAKKU NAGARVU) */}
        {activeTab === 'daily' && (
          <div>
            {/* Filter toolbar - Light Theme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                backgroundColor: '#ffffff',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Search Log Input */}
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
                <input
                  type="text"
                  placeholder="Search logs by product, note, or staff..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    color: '#94a3b8',
                  }}
                >
                  🔍
                </span>
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Movement Type Filter */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Movements' },
                  { id: 'GODOWN_INWARD', label: '📥 Inwards' },
                  { id: 'DISPATCH_TO_COUNTER', label: '🚚 Dispatches' },
                  { id: 'COUNTER_RETURN', label: '↩️ Returns' },
                  { id: 'WASTAGE', label: '🗑️ Wastages' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLogTypeFilter(type.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: logTypeFilter === type.id
                        ? '1px solid #d97706'
                        : '1px solid #e2e8f0',
                      backgroundColor: logTypeFilter === type.id
                        ? '#fef3c7'
                        : '#f8fafc',
                      color: logTypeFilter === type.id ? '#92400e' : '#475569',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Date Scope Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setLogDateFilter('today')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: logDateFilter === 'today' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: logDateFilter === 'today' ? '#eff6ff' : '#ffffff',
                    color: logDateFilter === 'today' ? '#1d4ed8' : '#475569',
                  }}
                >
                  📅 Today Only
                </button>
                <button
                  type="button"
                  onClick={() => setLogDateFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: logDateFilter === 'all' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: logDateFilter === 'all' ? '#eff6ff' : '#ffffff',
                    color: logDateFilter === 'all' ? '#1d4ed8' : '#475569',
                  }}
                >
                  All History
                </button>
              </div>
            </div>

            {/* Daily Logs Table - Light Theme */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#475569',
                        fontWeight: 700,
                      }}
                    >
                      <th style={{ padding: '14px 18px' }}>Date &amp; Time</th>
                      <th style={{ padding: '14px 14px' }}>Movement Type</th>
                      <th style={{ padding: '14px 14px' }}>Product</th>
                      <th style={{ padding: '14px 14px' }}>Quantity</th>
                      <th style={{ padding: '14px 14px' }}>Handled By</th>
                      <th style={{ padding: '14px 18px' }}>Batch / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                          No stock movements recorded for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, idx) => {
                        const isToday = log.date === new Date().toLocaleDateString('en-IN');
                        let badgeColor = '#047857';
                        let badgeBg = '#ecfdf5';
                        let badgeBorder = '#a7f3d0';
                        let labelText = 'INWARD (வரவு)';

                        if (log.type === 'DISPATCH_TO_COUNTER') {
                          badgeColor = '#1d4ed8';
                          badgeBg = '#eff6ff';
                          badgeBorder = '#bfdbfe';
                          labelText = 'DISPATCH (கவுண்டருக்கு)';
                        } else if (log.type === 'COUNTER_RETURN') {
                          badgeColor = '#b45309';
                          badgeBg = '#fffbeb';
                          badgeBorder = '#fde68a';
                          labelText = 'RETURN (திரும்பியது)';
                        } else if (log.type === 'WASTAGE') {
                          badgeColor = '#b91c1c';
                          badgeBg = '#fef2f2';
                          badgeBorder = '#fecaca';
                          labelText = 'WASTAGE (கழிவு)';
                        }

                        return (
                          <tr
                            key={log.id || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                            }}
                          >
                            {/* Date & Time */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                {log.time || '—'}
                              </div>
                              <div style={{ fontSize: '11px', color: isToday ? '#059669' : '#64748b' }}>
                                {isToday ? 'Today' : log.date}
                              </div>
                            </td>

                            {/* Movement Type */}
                            <td style={{ padding: '14px 14px' }}>
                              <span
                                style={{
                                  backgroundColor: badgeBg,
                                  color: badgeColor,
                                  border: `1px solid ${badgeBorder}`,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.03em',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {labelText}
                              </span>
                            </td>

                            {/* Product */}
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                {log.productName || log.productId}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                ID: {log.productId}
                              </div>
                            </td>

                            {/* Quantity in Native Unit */}
                            <td style={{ padding: '14px 14px' }}>
                              <span
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  color:
                                    log.type === 'GODOWN_INWARD'
                                      ? '#059669'
                                      : log.type === 'DISPATCH_TO_COUNTER'
                                      ? '#2563eb'
                                      : log.type === 'WASTAGE'
                                      ? '#dc2626'
                                      : '#d97706',
                                }}
                              >
                                {log.type === 'GODOWN_INWARD' || log.type === 'COUNTER_RETURN' ? '+' : '-'}
                                {log.quantity} {log.unit || 'kg'}
                              </span>
                            </td>

                            {/* Handled By */}
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontSize: '13px', color: '#334155' }}>
                                {log.performedBy || 'Company Manager'}
                              </div>
                            </td>

                            {/* Note */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {log.note || '—'}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => {
          setIsAddStockOpen(false);
          setModalSelectedSweetId(null);
        }}
        initialSweetId={modalSelectedSweetId}
        initialTarget={modalTarget}
      />

      <DispatchStockModal
        isOpen={isDispatchOpen}
        onClose={() => {
          setIsDispatchOpen(false);
          setModalSelectedSweetId(null);
        }}
        initialSweetId={modalSelectedSweetId}
      />

      <ReturnStockModal
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setModalSelectedSweetId(null);
        }}
        initialSweetId={modalSelectedSweetId}
      />
    </div>
  );
}
