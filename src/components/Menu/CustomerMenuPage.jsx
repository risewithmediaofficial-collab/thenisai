import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { ALL_BILLING_ITEMS } from '../../data/sweetsData';
import { useScrollLock } from '../../hooks/useScrollLock';
import api from '../../utils/api';
import { getNextPreOrderInvoiceNumber } from '../../utils/invoiceNumber';
import {
  isBeverageDrink,
  isPieceItem,
  isPacketItem,
  isLitreProduct,
  isKgProduct,
  resolveProductDefaultUnit,
  resolveProductUnitDisplay,
} from '../../utils/unitConfig';
import './CustomerMenuPage.css';

const KG_WEIGHT_PRESETS = [
  { label: '250g', factor: 0.25 },
  { label: '500g', factor: 0.5 },
  { label: '1 kg', factor: 1.0 },
];

const LITRE_PORTIONS = [
  { label: '250ml', factor: 0.25 },
  { label: '500ml', factor: 0.5 },
  { label: '1 Litre', factor: 1.0 },
];

export default function CustomerMenuPage() {
  const { allBillingProducts, inventory, addPreOrder, navigateTo, productAvailabilityMap, preOrders = [], bills = [] } = useCart();

  // Search & Category with useRef debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 120);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Portion selection for each item { [itemId]: weightLabel } (default '500g' for kg, '500ml' for litre, unit for single item)
  const [itemSelections, setItemSelections] = useState({});

  // Local cart tray state for pre-order: Array<{ cartItemId, id, name, tamilName, portion, unit, price, quantity, subtotal }>
  const [preCart, setPreCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customer Account Session (Mobile number acts as username and password)
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('thenisai_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Customer Login Modal State
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Customer Orders Tracking Modal State
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [customerPreOrders, setCustomerPreOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState(() => customerUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(() => customerUser?.phone || '');
  const [orderNote, setOrderNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [placedOrder, setPlacedOrder] = useState(null);

  // Synchronize customer name & phone if logged in
  useEffect(() => {
    if (customerUser) {
      if (customerUser.name && !customerName) setCustomerName(customerUser.name);
      if (customerUser.phone && !customerPhone) setCustomerPhone(customerUser.phone);
    }
  }, [customerUser]);

  // Strict Background Scroll Lock when any popup, tray drawer, or modal is active
  useScrollLock(isCheckoutOpen || Boolean(placedOrder) || isMobileCartOpen || isCustomerLoginOpen || isMyOrdersOpen);

  // Helper functions matching POS Billing exactly
  const isLitreItem = (item) => isLitreProduct(item);
  const isKgItem = (item) => isKgProduct(item);
  const getItemUnitDisplay = (item) => resolveProductUnitDisplay(item);

  const getAvailablePortions = (item) => {
    if (isLitreItem(item)) return LITRE_PORTIONS;
    if (isKgItem(item)) return KG_WEIGHT_PRESETS;
    return null;
  };

  const getSelectedPortion = (item) => {
    if (itemSelections[item.id]) return itemSelections[item.id];
    if (isLitreItem(item)) return '500ml';
    if (isKgItem(item)) return '500g';
    return getItemUnitDisplay(item);
  };

  const computePrice = (item, portion) => {
    const basePrice = Number(item.price || item.unitPrice || item.pricePerKg || 0);
    if (isLitreItem(item)) {
      if (portion === '250ml') return Math.round(basePrice * 0.25);
      if (portion === '500ml') return Math.round(basePrice * 0.5);
      if (portion === '1 Litre' || portion === '1L') return Math.round(basePrice * 1.0);
      return basePrice;
    }
    if (isKgItem(item)) {
      if (portion === '250g') return Math.round(basePrice * 0.25);
      if (portion === '500g') return Math.round(basePrice * 0.5);
      if (portion === '1 kg' || portion === '1kg') return Math.round(basePrice * 1.0);
      return basePrice;
    }
    return basePrice;
  };

  const handleSelectPortion = useCallback((itemId, portion) => {
    setItemSelections((prev) => ({ ...prev, [itemId]: portion }));
  }, []);

  // Filter available active items using allBillingProducts (with live POS master prices and catalog fallback)
  const menuItems = useMemo(() => {
    const list = (allBillingProducts && allBillingProducts.length > 0)
      ? allBillingProducts
      : (inventory && inventory.length > 0 ? inventory : ALL_BILLING_ITEMS);

    return list.filter((item) => {
      // In productAvailabilityMap, true explicitly means inactive/hidden by admin
      const isInactive = productAvailabilityMap && productAvailabilityMap[item.id] !== undefined
        ? Boolean(productAvailabilityMap[item.id])
        : Boolean(item.isInactive);
      if (isInactive) return false;
      return true;
    });
  }, [allBillingProducts, inventory, productAvailabilityMap]);

  // Extract categories dynamically with item counts & icons
  const categories = useMemo(() => {
    const counts = {};
    counts['all'] = menuItems.length;
    menuItems.forEach((item) => {
      const cat = (item.category || 'other').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const set = new Set();
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category.toLowerCase());
    });
    const list = Array.from(set);

    return [
      { id: 'all', label: 'All Items', count: counts['all'] || 0, icon: '🍽️' },
      ...list.map((cat) => {
        let icon = '🍯';
        const lower = cat.toLowerCase();
        if (lower.includes('beverage') || lower.includes('tea') || lower.includes('coffee')) icon = '☕';
        else if (lower.includes('spice') || lower.includes('kara') || lower.includes('savouries')) icon = '🌶️';
        else if (lower.includes('snack') || lower.includes('vada')) icon = '🥨';
        else if (lower.includes('ghee')) icon = '🧈';
        else if (lower.includes('halwa')) icon = '🍮';

        return {
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          count: counts[cat] || 0,
          icon,
        };
      }),
    ];
  }, [menuItems]);

  // Filtered items (memoized with debounced search)
  const filteredItems = useMemo(() => {
    const term = debouncedSearch.toLowerCase().trim();
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'all' ||
        (item.category && item.category.toLowerCase() === selectedCategory);
      if (!matchCat) return false;

      if (!term) return true;
      const name = (item.name || '').toLowerCase();
      const eng = (item.englishName || '').toLowerCase();
      const tam = (item.tamilName || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return (
        name.includes(term) ||
        eng.includes(term) ||
        tam.includes(term) ||
        cat.includes(term)
      );
    });
  }, [menuItems, selectedCategory, debouncedSearch]);

  // Add item to pre-order cart
  const handleAddToCart = useCallback((item) => {
    const portion = getSelectedPortion(item);
    const unitPrice = computePrice(item, portion);
    const isWeight = isKgItem(item) || isLitreItem(item);
    const cartItemId = `${item.id}-${portion}`;

    setPreCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const next = [...prev];
        const updatedQty = next[existingIndex].quantity + 1;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: updatedQty,
          subtotal: updatedQty * unitPrice,
        };
        return next;
      }
      return [
        ...prev,
        {
          cartItemId,
          id: item.id,
          name: item.name || item.englishName,
          tamilName: item.tamilName || '',
          portion,
          unit: isWeight ? portion : getItemUnitDisplay(item),
          price: unitPrice,
          basePrice: item.price,
          quantity: 1,
          subtotal: unitPrice,
        },
      ];
    });
  }, [itemSelections]);

  // Update item quantity in pre-order cart
  const handleUpdateQty = useCallback((cartItemId, delta) => {
    setPreCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              subtotal: nextQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  }, []);

  // Remove item
  const handleRemoveItem = useCallback((cartItemId) => {
    setPreCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  // Totals
  const grandTotal = useMemo(() => {
    return preCart.reduce((sum, i) => sum + i.subtotal, 0);
  }, [preCart]);

  const totalItemCount = useMemo(() => {
    return preCart.reduce((sum, i) => sum + i.quantity, 0);
  }, [preCart]);

  // Fetch customer orders by phone
  const fetchCustomerOrders = async (phone) => {
    const p = phone || customerUser?.phone;
    if (!p) return;
    const cleanPhone = String(p).replace(/\D/g, '').slice(-10);
    setIsLoadingOrders(true);
    try {
      const res = await api.get(`/api/preorders/customer/${cleanPhone}`);
      if (res && res.success && Array.isArray(res.preOrders)) {
        setCustomerPreOrders(res.preOrders);
      } else {
        const local = (preOrders || []).filter((o) => String(o.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
        setCustomerPreOrders(local);
      }
    } catch {
      const local = (preOrders || []).filter((o) => String(o.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
      setCustomerPreOrders(local);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Live auto-polling when My Orders modal is open so customer sees live status updates (e.g. Accepted)
  useEffect(() => {
    if (!isMyOrdersOpen || !customerUser?.phone) return;
    fetchCustomerOrders(customerUser.phone);
    const interval = setInterval(() => {
      fetchCustomerOrders(customerUser.phone);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMyOrdersOpen, customerUser]);

  // Count active preorders for logged in customer
  const customerOrdersCount = useMemo(() => {
    if (!customerUser?.phone) return 0;
    const cleanPhone = String(customerUser.phone).replace(/\D/g, '').slice(-10);
    const countServer = (customerPreOrders || []).length;
    const countLocal = (preOrders || []).filter((o) => String(o.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone).length;
    return Math.max(countServer, countLocal);
  }, [customerUser, customerPreOrders, preOrders]);

  // Handle Submit Pre-Order (starts AA001 with PRE - ORD prefix, mobile as password)
  const handleSubmitPreOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);

    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }

    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (preCart.length === 0) {
      setFormError('Your pre-order tray is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate next sequential invoice number synchronized with POS billing (PRE - ORD AA001...)
      const combined = [...(bills || []), ...(preOrders || [])];
      const nextPreOrderNumber = getNextPreOrderInvoiceNumber(combined);

      const orderPayload = {
        invoiceNumber: nextPreOrderNumber,
        customerName: trimmedName,
        customerPhone: cleanPhone,
        items: preCart.map((item) => ({
          id: item.id,
          name: item.name,
          tamilName: item.tamilName,
          portion: item.portion,
          weight: item.portion,
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        grandTotal,
        note: orderNote.trim(),
        totalItems: totalItemCount,
      };

      const created = await addPreOrder(orderPayload);

      // Auto-assign mobile number itself as password for logging in!
      const userSession = {
        phone: cleanPhone,
        name: trimmedName,
        password: cleanPhone,
        token: `cust_${cleanPhone}_${Date.now()}`,
      };
      setCustomerUser(userSession);
      try {
        localStorage.setItem('thenisai_customer_user', JSON.stringify(userSession));
      } catch {}

      setPlacedOrder(created);
      setPreCart([]);
      setIsCheckoutOpen(false);
      setOrderNote('');
    } catch {
      setFormError('Could not save your pre-order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer Login Handler
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await api.post('/api/customer/login', {
        phone: cleanPhone,
        password: loginPassword.trim() || cleanPhone,
      });

      if (res && res.success && res.customer) {
        const userObj = {
          phone: res.customer.phone || cleanPhone,
          name: res.customer.name || `Customer ${cleanPhone.slice(-4)}`,
          password: cleanPhone,
          token: res.token,
        };
        setCustomerUser(userObj);
        try { localStorage.setItem('thenisai_customer_user', JSON.stringify(userObj)); } catch {}
        if (Array.isArray(res.preOrders)) {
          setCustomerPreOrders(res.preOrders);
        }
        setIsCustomerLoginOpen(false);
        setIsMyOrdersOpen(true);
      } else {
        setLoginError(res?.message || 'Login failed. Please check your mobile number.');
      }
    } catch {
      // Offline fallback
      const matched = (preOrders || []).filter((o) => String(o.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
      const userObj = {
        phone: cleanPhone,
        name: matched[0]?.customerName || `Customer ${cleanPhone.slice(-4)}`,
        password: cleanPhone,
      };
      setCustomerUser(userObj);
      try { localStorage.setItem('thenisai_customer_user', JSON.stringify(userObj)); } catch {}
      setCustomerPreOrders(matched);
      setIsCustomerLoginOpen(false);
      setIsMyOrdersOpen(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomerLogout = () => {
    setCustomerUser(null);
    try { localStorage.removeItem('thenisai_customer_user'); } catch {}
    setIsMyOrdersOpen(false);
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0];

  return (
    <div className="customer-menu-root">
      {/* ── Top Clean White Header ───────────────────────────────────────── */}
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="menu-header-row">
            {/* Brand info */}
            <div className="menu-brand-wrap">
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Logo"
                className="menu-brand-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/branding/logo-icon.webp';
                }}
              />
              <div className="menu-brand-info">
                <h1 className="menu-title">Thenisai Menu</h1>
                <span className="menu-preorder-badge">PRE-ORDER</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="menu-actions-wrap">
              {/* Customer Account & Orders */}
              {customerUser ? (
                <div className="menu-auth-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      fetchCustomerOrders(customerUser.phone);
                      setIsMyOrdersOpen(true);
                    }}
                    className="menu-auth-orders-btn"
                    title="Track Your Pre-Orders"
                  >
                    <span>📋 My Orders</span>
                    {customerOrdersCount > 0 && (
                      <span className="menu-auth-count-badge">{customerOrdersCount}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomerLogout}
                    className="menu-auth-logout-btn"
                    title="Sign Out"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomerLoginOpen(true)}
                  className="menu-auth-login-btn"
                  title="Log In using your mobile number"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Orders</span>
                </button>
              )}

              {/* Back to Storefront */}
              <button
                type="button"
                onClick={() => {
                  if (window.location.hash) {
                    window.location.hash = '';
                  }
                  navigateTo('storefront');
                }}
                className="menu-back-btn"
                title="Back to Storefront"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span className="desktop-back-text">Back to Store</span>
                <span className="mobile-back-text">Store</span>
              </button>

              {/* Mobile Tray toggle button */}
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
                className="mobile-cart-toggle-btn"
                title="View Pre-Order Tray"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span>Tray</span>
                <span className="mobile-cart-count-badge">{totalItemCount}</span>
              </button>
            </div>
          </div>

          <p className="menu-subtitle">
            Fresh counter stock &bull; Quick store pickup &bull; Pay at counter
          </p>
        </div>
      </header>

      {/* ── Main Clean Layout: Sidebar + Catalog + Tray ──────────────────── */}
      <main className="menu-main-wrap">
        {/* Clean Warm Info Banner */}
        <div className="menu-info-banner">
          <div className="menu-info-left">
            <span className="menu-info-icon">⚡</span>
            <div>
              <div className="menu-info-title">
                Simple &amp; Fast Website Pre-Ordering
              </div>
              <div className="menu-info-desc">
                Choose your sweets &bull; Add portions to tray &bull; Enter name &amp; phone &bull; Our counter packs your parcel ready for pickup!
              </div>
            </div>
          </div>
          <div className="menu-info-badge">
            No Advance Payment &bull; Pay at Counter
          </div>
        </div>

        {/* 3-Column Responsive Grid Layout */}
        <div className="menu-page-grid">
          {/* ── 1. LEFT SIDEBAR: CATEGORIES (Desktop) ────────────────────── */}
          <aside className="menu-category-sidebar">
            <div className="sidebar-category-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>📂</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Categories
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#64748b',
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}
                >
                  {menuItems.length}
                </span>
              </div>

              {/* Category Buttons List */}
              <div className="sidebar-category-list">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className={`sidebar-cat-btn ${isSelected ? 'active' : ''}`}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isSelected ? '#f59e0b' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#64748b',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          minWidth: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── 2. CENTER COLUMN: SEARCH + MENU ITEMS ────────────────────── */}
          <div className="menu-main-content">
            {/* Search Input Bar */}
            <div className="menu-search-wrap">
              <input
                type="text"
                placeholder="Search menu items (e.g. Mysore Pak, Gulab Jamun, Kara, Tea)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="menu-search-input"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="menu-search-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Category Quick Bar (Horizontal scroll on phone/tablet) */}
            <div className="mobile-category-strip">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`mobile-cat-chip ${isSelected ? 'active' : ''}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span style={{ fontSize: '11px', opacity: 0.85 }}>({cat.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Category Header Title */}
            <div className="menu-cat-header">
              <div className="menu-cat-title-wrap">
                <span style={{ fontSize: '18px' }}>{activeCategoryObj.icon}</span>
                <h2 className="menu-cat-title">
                  {activeCategoryObj.label}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  ({filteredItems.length} items available)
                </span>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d97706',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All &rarr;
                </button>
              )}
            </div>

            {/* Menu Items Cards List */}
            {filteredItems.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  No items matched your search
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  Try another search term or click &ldquo;All Items&rdquo; in the categories
                </div>
              </div>
            ) : (
              <div className="menu-list-container">
                {filteredItems.map((item) => {
                  const availablePortions = getAvailablePortions(item);
                  const selectedPortion = getSelectedPortion(item);
                  const currentPrice = computePrice(item, selectedPortion);
                  const unitDisplay = getItemUnitDisplay(item);

                  return (
                    <div key={item.id} className="menu-list-row">
                      {/* Left: Item Information (Text Only) */}
                      <div className="menu-list-info">
                        <div className="menu-list-title-wrap">
                          <h3 className="menu-list-title">
                            {item.name || item.englishName}
                          </h3>
                          {item.tamilName && !item.name?.includes('—') && (
                            <span className="menu-list-tamil">
                              ({item.tamilName})
                            </span>
                          )}
                        </div>

                        <div className="menu-list-meta-row">
                          <span className="menu-list-cat-badge">
                            {item.category || 'Item'}
                          </span>
                          <span className="menu-list-rate">
                            Base rate: ₹{item.price || item.unitPrice || item.pricePerKg} / {unitDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Right: Portion / Weight selector & Add button placed on right side */}
                      <div className="menu-list-action">
                        {/* Portions if weight or litre item */}
                        {availablePortions ? (
                          <div className="portion-selector-wrap">
                            {availablePortions.map((preset) => {
                              const isPSelected = selectedPortion === preset.label;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleSelectPortion(item.id, preset.label)}
                                  className={`portion-btn ${isPSelected ? 'active' : ''}`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="menu-list-unit-pill">
                            {unitDisplay}
                          </div>
                        )}

                        {/* Price Display */}
                        <div className="menu-list-price-wrap">
                          <div className="menu-list-price">₹{currentPrice}</div>
                          {availablePortions && (
                            <div className="menu-list-price-label">{selectedPortion}</div>
                          )}
                        </div>

                        {/* Add to Tray Button - ALWAYS ON RIGHT SIDE */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="btn-add-tray"
                          title={`Add ${item.name || item.englishName} to pre-order tray`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Mobile Backdrop when tray open ────────────────────────────── */}
          <div
            className={`preorder-tray-backdrop ${isMobileCartOpen ? 'mobile-open' : ''}`}
            onClick={() => setIsMobileCartOpen(false)}
          />

          {/* ── 3. RIGHT COLUMN: IN-PAGE PRE-ORDER TRAY ───────────────────── */}
          <div className={`preorder-tray-panel ${isMobileCartOpen ? 'mobile-open' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛒</span>
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Pre-Order Tray
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                  }}
                >
                  {totalItemCount} items
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="mobile-tray-close-btn"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tray items list */}
            {preCart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍯</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Your tray is empty</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Click &ldquo;Add&rdquo; on any sweet, beverage, or snack from the counter menu
                </div>
              </div>
            ) : (
              <div className="tray-items-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
                {preCart.map((item) => (
                  <div
                    key={item.cartItemId}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
                          Portion: {item.portion} &bull; ₹{item.price} each
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '12px',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                      {/* Qty +/- */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, -1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#475569',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '0 6px', color: '#0f172a' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, 1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#475569',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{item.subtotal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tray Footer & Checkout Action */}
            {preCart.length > 0 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Counter Total (Est.)</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>₹{grandTotal}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px', lineHeight: 1.4 }}>
                  No advance payment. Pay when picking up at the counter.
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Proceed to Pre-Order &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Floating Mobile Checkout Bar (Visible on mobile/tablet when items in tray) ── */}
      {preCart.length > 0 && (
        <div
          className="mobile-floating-tray-bar"
          onClick={() => setIsMobileCartOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🛒</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in Tray
              </div>
              <div style={{ fontSize: '11px', color: '#fcd34d' }}>
                ₹{grandTotal} Counter Total
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #d97706, #b45309)',
              border: 'none',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            View Tray &rarr;
          </button>
        </div>
      )}

      {/* ── Clean White Checkout Details Modal ────────────────────────────── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div
            className="preorder-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              className="preorder-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Customer Pre-Order Details
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Our counter staff will use this to identify your pre-order
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '14px',
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitPreOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Your Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name (e.g. Ramesh Kumar)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0f172a',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0f172a',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      marginTop: '6px',
                      fontSize: '11.5px',
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>🔑</span>
                    <span>
                      <strong>Account Access:</strong> Your 10-digit mobile number will be your login ID and password. You can log in anytime to view your orders and check live status!
                    </span>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Pickup Time / Special Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coming by 4 PM, pack in 2 separate boxes"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0f172a',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>

                {/* Summary Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Items Total ({totalItemCount})</span>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>₹{grandTotal}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    style={{
                      flex: 1,
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 2,
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Pre-Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Order Success Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {placedOrder && (
          <div
            className="preorder-success-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              className="preorder-success-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  border: '2px solid #16a34a',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px',
                  fontWeight: 800,
                }}
              >
                ✓
              </div>

              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                Pre-Order Placed Successfully!
              </h3>
              <p style={{ margin: '6px 0 16px', fontSize: '13px', color: '#64748b' }}>
                Your order is sent to the billing counter. Pay &amp; collect when you visit.
              </p>

              {/* Order Card Detail */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Order ID:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>
                    {placedOrder.id}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Bill Number:</span>
                  <span className="bill-number-badge">
                    🏷️ {placedOrder.invoiceNumber || placedOrder.id}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Order Status:</span>
                  <span className="cust-status-badge pending">
                    <span className="pulsing-dot pending" />
                    Pending Biller Action
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Customer Name:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {placedOrder.customerName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Mobile Number:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {placedOrder.customerPhone}
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>Estimated Bill:</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                    ₹{placedOrder.grandTotal}
                  </span>
                </div>
              </div>

              {/* Account Credentials Reminder */}
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '12px',
                  color: '#065f46',
                  textAlign: 'left',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🔑</span> Customer Account Activated
                </div>
                <div>
                  Your mobile number <strong>{placedOrder.customerPhone}</strong> is assigned as your password. You can track this order anytime and see when the counter staff accepts it!
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPlacedOrder(null)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Order More
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const phone = placedOrder.customerPhone;
                    setPlacedOrder(null);
                    fetchCustomerOrders(phone);
                    setIsMyOrdersOpen(true);
                  }}
                  style={{
                    flex: 1.5,
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                  }}
                >
                  Track Order Status &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Customer Login Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isCustomerLoginOpen && (
          <div
            className="preorder-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 120,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              className="preorder-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Customer Login
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Track your pre-orders and live acceptance status
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerLoginOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              {loginError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '14px',
                  }}
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleCustomerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter your 10-digit mobile number"
                    value={loginPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setLoginPhone(val);
                      if (!loginPassword || loginPassword === loginPhone) {
                        setLoginPassword(val);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0f172a',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Password (Mobile Number) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Your 10-digit mobile number is password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0f172a',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    💡 Tip: For all pre-orders, your mobile number itself is your password.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCustomerLoginOpen(false)}
                    style={{
                      flex: 1,
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    style={{
                      flex: 2,
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: isLoggingIn ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    {isLoggingIn ? 'Logging in...' : 'Log In & View Orders'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── My Pre-Orders Status Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isMyOrdersOpen && (
          <div
            className="preorder-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 130,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              className="preorder-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 22px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafbfc',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      My Pre-Orders
                    </h3>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {customerUser?.phone ? `+91 ${customerUser.phone}` : ''}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Live order queue &bull; Track acceptance and billing status
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fetchCustomerOrders(customerUser?.phone)}
                    disabled={isLoadingOrders}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Refresh live status"
                  >
                    <span>↻</span>
                    <span>{isLoadingOrders ? 'Checking...' : 'Refresh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMyOrdersOpen(false)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      color: '#64748b',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Orders List Container */}
              <div
                style={{
                  padding: '16px 20px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {customerPreOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>No Pre-Orders Placed Yet</div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Add sweets &amp; beverages to the tray and confirm pre-order to view them here.
                    </div>
                  </div>
                ) : (
                  customerPreOrders.map((order) => {
                    const isPending = order.status === 'pending';
                    const isAccepted = order.status === 'accepted';
                    const isBilled = order.status === 'billed';
                    const formattedDate = order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : 'Recently';

                    return (
                      <div
                        key={order.id || order.invoiceNumber}
                        style={{
                          background: '#ffffff',
                          border: isPending ? '1.5px solid #fde68a' : (isAccepted ? '1.5px solid #bae6fd' : '1px solid #e2e8f0'),
                          borderRadius: '12px',
                          padding: '14px 16px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Order Card Top: Bill No & Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <span className="bill-number-badge">
                              🏷️ {order.invoiceNumber || order.id}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              Placed: {formattedDate}
                            </div>
                          </div>

                          <div>
                            {isPending && (
                              <span className="cust-status-badge pending">
                                <span className="pulsing-dot pending" />
                                ⏳ Pending Acceptance
                              </span>
                            )}
                            {isAccepted && (
                              <span className="cust-status-badge accepted">
                                <span className="pulsing-dot accepted" />
                                🔵 Accepted &amp; Preparing
                              </span>
                            )}
                            {isBilled && (
                              <span className="cust-status-badge billed">
                                ✓ Ready for Pickup
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Description Callout */}
                        <div
                          style={{
                            background: isPending ? '#fffbeb' : (isAccepted ? '#f0f9ff' : '#f0fdf4'),
                            border: `1px solid ${isPending ? '#fde68a' : (isAccepted ? '#bae6fd' : '#bbf7d0')}`,
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: isPending ? '#92400e' : (isAccepted ? '#0369a1' : '#15803d'),
                            marginBottom: '10px',
                            lineHeight: 1.35,
                          }}
                        >
                          {isPending && (
                            <span>
                              ⏳ <strong>Order Pending:</strong> Your pre-order is in the counter queue. Staff will accept it shortly.
                            </span>
                          )}
                          {isAccepted && (
                            <span>
                              ✓ <strong>Accepted by Counter:</strong> Your pre-order has been accepted and is being packed.
                            </span>
                          )}
                          {isBilled && (
                            <span>
                              🎉 <strong>Billed &amp; Ready:</strong> Your pre-order is billed! Pay and pick up at the billing counter.
                            </span>
                          )}
                        </div>

                        {/* Items list */}
                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                          {(order.items || []).map((it, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                borderBottom: idx < (order.items || []).length - 1 ? '1px dashed #e2e8f0' : 'none',
                              }}
                            >
                              <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                {it.name} &times; {it.quantity} {it.portion ? `(${it.portion})` : ''}
                              </span>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                ₹{it.subtotal || (it.price * (it.quantity || 1))}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total Amount */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Estimated Total:</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            ₹{order.grandTotal}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#fafbfc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Live auto-refresh enabled
                </span>
                <button
                  type="button"
                  onClick={() => setIsMyOrdersOpen(false)}
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
