import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getItemStockConfig, isProductUnlimitedStock } from '../../utils/unitConfig';
import AddStockModal from '../Inventory/AddStockModal';
import ReturnStockModal from './ReturnStockModal';

export default function CompanyManagerDashboard() {
  const { user, logout } = useAuth();
  const {
    inventory,
    stockLogs = [],
    fetchStockLogs,
    navigateTo,
    toggleProductUnlimitedStock,
  } = useCart();

  // Active tab: 'remaining' | 'daily'
  const [activeTab, setActiveTab] = useState('remaining');

  // Search & Filtering for Remaining Stock with useRef debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'low_godown' | 'low_counter' | 'out_of_stock'

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 100);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Responsive Layout Mode: 'auto' | 'table' | 'cards'
  const [viewMode, setViewMode] = useState('auto');

  // Filtering for Daily Activity Logs
  const [logTypeFilter, setLogTypeFilter] = useState('all'); // 'all' | 'GODOWN_INWARD' | 'DISPATCH_TO_COUNTER' | 'COUNTER_RETURN' | 'WASTAGE'
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [debouncedLogSearch, setDebouncedLogSearch] = useState('');
  const logSearchDebounceRef = useRef(null);
  const [logDateFilter, setLogDateFilter] = useState('today'); // 'today' | 'all'

  const handleLogSearchChange = (e) => {
    const val = e.target.value;
    setLogSearchQuery(val);
    if (logSearchDebounceRef.current) clearTimeout(logSearchDebounceRef.current);
    logSearchDebounceRef.current = setTimeout(() => {
      setDebouncedLogSearch(val);
    }, 100);
  };

  const handleClearLogSearch = () => {
    setLogSearchQuery('');
    setDebouncedLogSearch('');
    if (logSearchDebounceRef.current) clearTimeout(logSearchDebounceRef.current);
  };

  // Modals state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [modalSelectedSweetId, setModalSelectedSweetId] = useState(null);
  const [modalTarget, setModalTarget] = useState('counter');

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

  // Filtered remaining stock with debounced search
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Search match
      const query = debouncedSearch.toLowerCase().trim();
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

      // Stock status filter (Shop Stored Stock)
      const isUnlimited = isProductUnlimitedStock(item);
      const stock = item.counterStock ?? item.stockKg ?? 0;
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      if (stockStatusFilter === 'unlimited') {
        return isUnlimited;
      }
      if (stockStatusFilter === 'low_stock' || stockStatusFilter === 'low_counter' || stockStatusFilter === 'low_godown') {
        if (isUnlimited) return false;
        return stock > 0 && stock <= minThresh;
      }
      if (stockStatusFilter === 'out_of_stock') {
        if (isUnlimited) return false;
        return stock <= 0;
      }

      return true;
    });
  }, [inventory, debouncedSearch, selectedCategory, stockStatusFilter]);

  // Aggregate remaining stock metrics
  const stockSummary = useMemo(() => {
    let totalShopStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let unlimitedCount = 0;

    inventory.forEach((item) => {
      const isUnlimited = isProductUnlimitedStock(item);
      const stock = item.counterStock ?? item.stockKg ?? 0;
      const minThresh = item.minThreshold || (item.unit === '1 Pc' ? 15 : 8);

      totalShopStock += stock;

      if (isUnlimited) {
        unlimitedCount++;
      } else if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= minThresh) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: inventory.length,
      totalShopStock: Math.round(totalShopStock * 10) / 10,
      totalCounterItems: Math.round(totalShopStock * 10) / 10,
      lowStockCount,
      lowGodownCount: lowStockCount,
      lowCounterCount: lowStockCount,
      outOfStockCount,
      unlimitedCount,
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

      if (debouncedLogSearch.trim()) {
        const q = debouncedLogSearch.toLowerCase().trim();
        const pName = (log.productName || log.productId || '').toLowerCase();
        const pNote = (log.note || '').toLowerCase();
        const pUser = (log.performedBy || '').toLowerCase();
        return pName.includes(q) || pNote.includes(q) || pUser.includes(q);
      }

      return true;
    });
  }, [stockLogs, logDateFilter, logTypeFilter, debouncedLogSearch]);

  // Daily movement metrics
  const dailyMetrics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN');
    let inwardCount = 0;
    let returnCount = 0;
    let wastageCount = 0;

    stockLogs.forEach((log) => {
      if (log.date === todayStr || !log.date) {
        if (log.type === 'GODOWN_INWARD') inwardCount += 1;
        else if (log.type === 'COUNTER_RETURN') returnCount += 1;
        else if (log.type === 'WASTAGE') wastageCount += 1;
      }
    });

    return { inwardCount, returnCount, wastageCount };
  }, [stockLogs]);

  // Quick actions with useCallback
  const handleOpenInward = useCallback((sweetId = null, target = 'counter') => {
    setModalSelectedSweetId(sweetId);
    setModalTarget(target);
    setIsAddStockOpen(true);
  }, []);

  const handleOpenReturn = useCallback((sweetId = null) => {
    setModalSelectedSweetId(sweetId);
    setIsReturnOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    if (typeof navigateTo === 'function') {
      navigateTo('storefront');
    } else {
      window.location.hash = '';
    }
  }, [logout, navigateTo]);

  return (
    <div
      className="company-manager-dashboard"
      style={{
        height: '100%',
        maxHeight: '100%',
        flex: '1 1 0%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Navigation Bar - Light Theme */}
      <header
        className="company-manager-header"
        style={{
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
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
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
              Shop Stored Stock &amp; Company Inward Control System (சரக்கு வரவு &amp; இருப்பு மேலாண்மை)
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleOpenInward(null, 'counter')}
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
            <span>+ Add Stock</span>
            <span style={{ fontSize: '11px', opacity: 0.9 }}>(சரக்கு சேர்த்தல்)</span>
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
              <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>● Online (Store &amp; Inward)</div>
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
      <main
        className="company-manager-main"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '10px 18px',
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* KPI Summary Cards - Light Theme */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px',
            marginBottom: '10px',
            flexShrink: 0,
          }}
        >
          {/* Total Products in Catalog */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                📋 Total Products
              </span>
              <span style={{ fontSize: '16px' }}>🏷️</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {stockSummary.totalProducts}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Active sweet, savoury & beverage varieties
            </div>
          </div>

          {/* Shop Stored Stock */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#047857', fontWeight: 600, letterSpacing: '0.04em' }}>
                🏪 Shop Stored Stock
              </span>
              <span style={{ fontSize: '16px' }}>🧁</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {stockSummary.totalShopStock}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Total units stored in shop ready for selling
            </div>
          </div>

          {/* Stock Added Today */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b45309', fontWeight: 600, letterSpacing: '0.04em' }}>
                📦 Added to Shop Today
              </span>
              <span style={{ fontSize: '16px' }}>🧁</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
              {dailyMetrics.inwardCount}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>batches</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Stock verified and added to shop storage today
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div
            style={{
              backgroundColor: stockSummary.lowStockCount > 0 ? '#fef2f2' : '#ffffff',
              border: stockSummary.lowStockCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: stockSummary.lowStockCount > 0 ? '#b91c1c' : '#64748b',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                ⚠️ Low Stock in Shop
              </span>
              <span style={{ fontSize: '16px' }}>🚨</span>
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: stockSummary.lowStockCount > 0 ? '#dc2626' : '#059669',
                marginTop: '2px',
              }}
            >
              {stockSummary.lowStockCount}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>items</span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: stockSummary.lowStockCount > 0 ? '#b91c1c' : '#64748b',
                marginTop: '2px',
              }}
            >
              {stockSummary.lowStockCount > 0 ? 'Order refill from company godown' : 'All shop stock levels healthy'}
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
            marginBottom: '10px',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('remaining')}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'remaining' ? '3px solid #d97706' : '3px solid transparent',
                color: activeTab === 'remaining' ? '#92400e' : '#64748b',
                fontSize: '14px',
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
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'daily' ? '3px solid #d97706' : '3px solid transparent',
                color: activeTab === 'daily' ? '#92400e' : '#64748b',
                fontSize: '14px',
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
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, height: '100%', overflow: 'hidden' }}>
            {/* Filter Toolbar - Light Theme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '10px',
                backgroundColor: '#ffffff',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                flexShrink: 0,
              }}
            >
              {/* Search Input */}
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
                <input
                  type="text"
                  placeholder="Search item by name, Tamil or SKU..."
                  value={searchQuery}
                  onChange={handleSearchChange}
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
                    onClick={handleClearSearch}
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
                  { id: 'all', label: `All Items (${inventory.length})` },
                  { id: 'low_stock', label: `⚠️ Low Stock (${stockSummary.lowStockCount})` },
                  { id: 'out_of_stock', label: `🚫 Out of Stock (${stockSummary.outOfStockCount})` },
                  { id: 'unlimited', label: `∞ Unlimited Stock (${stockSummary.unlimitedCount || 0})` },
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
                className="company-stock-cards-wrap"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px',
                  overflowY: 'auto',
                  flex: '1 1 0%',
                  minHeight: 0,
                  paddingBottom: '10px',
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
                    const isUnlimited = isProductUnlimitedStock(item);
                    const stock = item.counterStock ?? item.stockKg ?? 0;
                    const minThresh = item.minThreshold || (unitConf.type === 'pcs' ? 15 : 8);

                    const isLow = !isUnlimited && stock > 0 && stock <= minThresh;
                    const isOut = !isUnlimited && stock <= 0;

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isUnlimited
                            ? '1px solid #a7f3d0'
                            : isOut
                            ? '1px solid #fecaca'
                            : isLow
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
                                backgroundColor: isUnlimited
                                  ? '#ecfdf5'
                                  : isOut
                                  ? '#fef2f2'
                                  : isLow
                                  ? '#fffbeb'
                                  : '#ecfdf5',
                                color: isUnlimited
                                  ? '#047857'
                                  : isOut
                                  ? '#b91c1c'
                                  : isLow
                                  ? '#b45309'
                                  : '#047857',
                                border: isUnlimited
                                  ? '1px solid #a7f3d0'
                                  : isOut
                                  ? '1px solid #fecaca'
                                  : isLow
                                  ? '1px solid #fde68a'
                                  : '1px solid #a7f3d0',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isUnlimited ? '∞ UNLIMITED STOCK' : isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </div>

                          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                            {isUnlimited && (
                              <span
                                style={{
                                  backgroundColor: '#dcfce7',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                Always Available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Shop Stored Stock Balance */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isUnlimited ? '#f0fdf4' : '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: isUnlimited ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', color: isUnlimited ? '#047857' : '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                              🏪 Shop Stored Stock
                            </div>
                            {isUnlimited ? (
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>Unlimited</span>
                                <span style={{ fontSize: '15px' }}>(∞)</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '20px', fontWeight: 800, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669', marginTop: '2px' }}>
                                {stock} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{unitConf.label}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{isUnlimited ? 'Mode' : 'Min Threshold'}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: isUnlimited ? '#059669' : '#475569', marginTop: '2px' }}>
                              {isUnlimited ? 'On-Demand' : `${minThresh} ${unitConf.label}`}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenInward(item.id)}
                            style={{
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                            title={`Add ${unitConf.label} to Shop Stock`}
                          >
                            + Add Stock
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleProductUnlimitedStock(item.id, !isUnlimited, user?.username || 'Manager')}
                            style={{
                              backgroundColor: isUnlimited ? '#eff6ff' : '#f8fafc',
                              border: isUnlimited ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                              color: isUnlimited ? '#1d4ed8' : '#475569',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                            title={isUnlimited ? 'Switch to tracked inventory count' : 'Enable unlimited stock for this product'}
                          >
                            {isUnlimited ? 'Set Tracked' : '∞ Unlimited'}
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
                className="company-stock-table-card"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 0%',
                  minHeight: 0,
                  height: '100%',
                }}
              >
                <div
                  className="company-stock-table-wrap"
                  style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    flex: '1 1 0%',
                    minHeight: 0,
                    maxHeight: '100%',
                    height: '100%',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                    <thead>
                      <tr
                        style={{
                          backgroundColor: '#f8fafc',
                          borderBottom: '1.5px solid #e2e8f0',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#475569',
                          fontWeight: 700,
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        <th style={{ padding: '12px 16px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Product &amp; SKU</th>
                        <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Unit</th>
                        <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>🏪 Shop Stored Stock</th>
                        <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Min Threshold</th>
                        <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Status</th>
                        <th style={{ padding: '12px 16px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc', textAlign: 'right' }}>Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                            No products match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item, idx) => {
                          const unitConf = getItemStockConfig(item);
                          const isUnlimited = isProductUnlimitedStock(item);
                          const stock = item.counterStock ?? item.stockKg ?? 0;
                          const minThresh = item.minThreshold || (unitConf.type === 'pcs' ? 15 : 8);

                          const isLow = !isUnlimited && stock > 0 && stock <= minThresh;
                          const isOut = !isUnlimited && stock <= 0;

                          return (
                            <tr
                              key={item.id || idx}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                transition: 'background-color 0.12s ease',
                              }}
                            >
                              {/* Product & Details - Crisp typography */}
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

                              {/* Native Unit Pill */}
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

                              {/* Shop Stored Stock */}
                              <td style={{ padding: '14px 14px' }}>
                                {isUnlimited ? (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        color: '#059669',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <span>Unlimited</span>
                                      <span style={{ fontSize: '13px', color: '#047857' }}>(∞)</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                      Always available
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: '16px',
                                        fontWeight: 800,
                                        color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: '5px',
                                      }}
                                    >
                                      <span>{stock}</span>
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                                        {unitConf.label}
                                      </span>
                                    </div>
                                    {isLow && (
                                      <div style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                                        Refill needed from Godown
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Min Threshold */}
                              <td style={{ padding: '14px 14px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: isUnlimited ? '#059669' : '#475569' }}>
                                  {isUnlimited ? (
                                    <span>No Limit</span>
                                  ) : (
                                    <>
                                      {minThresh}{' '}
                                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
                                        {unitConf.label}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Status Tag */}
                              <td style={{ padding: '14px 14px' }}>
                                {isUnlimited ? (
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
                                    ∞ UNLIMITED
                                  </span>
                                ) : isOut ? (
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
                                ) : isLow ? (
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
                                    LOW STOCK
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
                                    IN STOCK
                                  </span>
                                )}
                              </td>

                              {/* Row Action Buttons */}
                              <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInward(item.id)}
                                    style={{
                                      backgroundColor: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      color: '#047857',
                                      borderRadius: '6px',
                                      padding: '6px 12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`Add ${unitConf.label} to Shop Stock`}
                                  >
                                    + Add Stock
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleProductUnlimitedStock(item.id, !isUnlimited, user?.username || 'Manager')}
                                    style={{
                                      backgroundColor: isUnlimited ? '#eff6ff' : '#f8fafc',
                                      border: isUnlimited ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                                      color: isUnlimited ? '#1d4ed8' : '#475569',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={isUnlimited ? 'Switch to tracked inventory count' : 'Enable unlimited stock for this product'}
                                  >
                                    {isUnlimited ? 'Track' : '∞ Unlimited'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturn(item.id)}
                                    disabled={stock <= 0}
                                    style={{
                                      backgroundColor: stock > 0 ? '#fffbeb' : '#f8fafc',
                                      border: stock > 0 ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                                      color: stock > 0 ? '#9a3412' : '#94a3b8',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: stock > 0 ? 'pointer' : 'not-allowed',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`Return stock to Company Godown or record wastage`}
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
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, height: '100%', overflow: 'hidden' }}>
            {/* Filter toolbar - Light Theme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '10px',
                backgroundColor: '#ffffff',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                flexShrink: 0,
              }}
            >
              {/* Search Log Input */}
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
                <input
                  type="text"
                  placeholder="Search logs by product, note, or staff..."
                  value={logSearchQuery}
                  onChange={handleLogSearchChange}
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
                    onClick={handleClearLogSearch}
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
                  { id: 'GODOWN_INWARD', label: '📦 Stock Added' },
                  { id: 'COUNTER_RETURN', label: '↩️ Returned to Godown' },
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
              className="company-stock-table-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 0%',
                minHeight: 0,
                height: '100%',
              }}
            >
              <div
                className="company-stock-table-wrap"
                style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  flex: '1 1 0%',
                  minHeight: 0,
                  maxHeight: '100%',
                  height: '100%',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1.5px solid #e2e8f0',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#475569',
                        fontWeight: 700,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                      }}
                    >
                      <th style={{ padding: '12px 16px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Date &amp; Time</th>
                      <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Movement Type</th>
                      <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Product</th>
                      <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Quantity</th>
                      <th style={{ padding: '12px 14px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Handled By</th>
                      <th style={{ padding: '12px 16px', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#f8fafc' }}>Batch / Note</th>
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
