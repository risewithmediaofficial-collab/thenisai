import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { ALL_BILLING_ITEMS } from '../../data/sweetsData';
import { useScrollLock } from '../../hooks/useScrollLock';
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
  const { allBillingProducts, inventory, addPreOrder, navigateTo, productAvailabilityMap } = useCart();

  // Search & Category
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Portion selection for each item { [itemId]: weightLabel } (default '500g' for kg, '500ml' for litre, unit for single item)
  const [itemSelections, setItemSelections] = useState({});

  // Local cart tray state for pre-order: Array<{ cartItemId, id, name, tamilName, portion, unit, price, quantity, subtotal }>
  const [preCart, setPreCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [placedOrder, setPlacedOrder] = useState(null);

  // Strict Background Scroll Lock when any popup, tray drawer, or modal is active
  useScrollLock(isCheckoutOpen || Boolean(placedOrder) || isMobileCartOpen);

  // Helper functions matching POS Billing exactly
  const isLitreItem = (item) => {
    if (!item) return false;
    const u = (item.unit || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    return u.includes('litre') || u.includes('liter') || id.includes('ghee_bottle') || id.includes('oil');
  };

  const isKgItem = (item) => {
    if (!item) return false;
    const u = (item.unit || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    // Check if beverage or cup-based or piece-based fast seller (matching BillingCounter.jsx)
    if (
      cat.includes('beverage') ||
      cat === 'snacks' ||
      id.includes('tea') ||
      id.includes('coffee') ||
      id.includes('milk') ||
      id.includes('boost') ||
      id.includes('horlicks') ||
      id.includes('malt') ||
      name.includes('tea') ||
      name.includes('coffee') ||
      name.includes('milk') ||
      name.includes('boost') ||
      name.includes('horlicks') ||
      name.includes('malt') ||
      id === 'vada' ||
      u.includes('cup') ||
      u.includes('pc') ||
      u.includes('piece') ||
      u.includes('pkt') ||
      u.includes('packet') ||
      u.includes('bottle') ||
      u.includes('box') ||
      u.includes('litre') ||
      u.includes('liter')
    ) {
      return false;
    }
    return u === 'kg' || !u || Boolean(item.prices && (item.prices['250g'] || item.prices['500g']));
  };

  const getItemUnitDisplay = (item) => {
    if (!item) return '1 Cup';
    const cat = (item.category || '').toLowerCase();
    const u = (item.unit || '').trim();
    const id = (item.id || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (
      cat.includes('beverage') ||
      id.includes('tea') ||
      id.includes('coffee') ||
      id.includes('milk') ||
      id.includes('boost') ||
      id.includes('horlicks') ||
      id.includes('malt') ||
      name.includes('tea') ||
      name.includes('coffee') ||
      name.includes('milk') ||
      name.includes('boost') ||
      name.includes('horlicks') ||
      name.includes('malt') ||
      u.toLowerCase().includes('cup')
    ) {
      return '1 Cup';
    }
    if (cat === 'snacks' || id === 'vada' || u.toLowerCase().includes('pc') || u.toLowerCase().includes('piece')) {
      return '1 Pc';
    }
    if (u.toLowerCase().includes('litre') || u.toLowerCase().includes('liter')) return '1 Litre';
    if (u.toLowerCase().includes('pkt') || u.toLowerCase().includes('packet')) return '1 Pkt';
    if (u.toLowerCase().includes('bottle')) return '1 Bottle';
    if (u.toLowerCase().includes('box')) return '1 Box';
    return u || 'kg';
  };

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

  const handleSelectPortion = (itemId, portion) => {
    setItemSelections((prev) => ({ ...prev, [itemId]: portion }));
  };

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

  // Filtered items
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
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
  }, [menuItems, selectedCategory, searchTerm]);

  // Add item to pre-order cart
  const handleAddToCart = (item) => {
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
  };

  // Update item quantity in pre-order cart
  const handleUpdateQty = (cartItemId, delta) => {
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
  };

  // Remove item
  const handleRemoveItem = (cartItemId) => {
    setPreCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Totals
  const grandTotal = useMemo(() => {
    return preCart.reduce((sum, i) => sum + i.subtotal, 0);
  }, [preCart]);

  const totalItemCount = useMemo(() => {
    return preCart.reduce((sum, i) => sum + i.quantity, 0);
  }, [preCart]);

  // Handle Submit Pre-Order
  const handleSubmitPreOrder = (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/\D/g, '');

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
      const orderPayload = {
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

      const created = addPreOrder(orderPayload);
      setPlacedOrder(created);
      setPreCart([]);
      setIsCheckoutOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNote('');
    } catch {
      setFormError('Could not save your pre-order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => setSearchTerm('')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredItems.map((item) => {
                  const availablePortions = getAvailablePortions(item);
                  const selectedPortion = getSelectedPortion(item);
                  const currentPrice = computePrice(item, selectedPortion);
                  const unitDisplay = getItemUnitDisplay(item);

                  return (
                    <div key={item.id} className="clean-menu-card">
                      {/* Left: Item Information (Text Only) */}
                      <div className="clean-menu-card-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 className="clean-menu-card-title">
                            {item.name || item.englishName}
                          </h3>
                          {item.tamilName && !item.name?.includes('—') && (
                            <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>
                              ({item.tamilName})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {item.category || 'Item'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Base rate: ₹{item.price || item.unitPrice || item.pricePerKg} / {unitDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Right: Portion / Weight selector & Add button */}
                      <div className="clean-menu-card-controls">
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
                          <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '5px 11px', borderRadius: '6px', fontWeight: 600 }}>
                            {unitDisplay}
                          </div>
                        )}

                        {/* Price Display */}
                        <div className="price-display-wrap">
                          <div className="price-val">₹{currentPrice}</div>
                          <div className="price-portion-label">for {selectedPortion}</div>
                        </div>

                        {/* Add to Tray Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="btn-add-tray"
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
                  style={{
                    display: 'none',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
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
                    setPlacedOrder(null);
                    if (window.location.hash) window.location.hash = '';
                    navigateTo('storefront');
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Back to Store
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
