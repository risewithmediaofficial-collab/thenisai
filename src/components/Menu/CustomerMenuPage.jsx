import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

const KG_WEIGHT_PRESETS = [
  { label: '250g', factor: 0.25 },
  { label: '500g', factor: 0.5 },
  { label: '1 kg', factor: 1.0 },
];

export default function CustomerMenuPage() {
  const { inventory, addPreOrder, navigateTo } = useCart();

  // Search & Category
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Portion selection for each item { [itemId]: weightLabel } (default '500g' for kg, '1' for piece)
  const [itemSelections, setItemSelections] = useState({});

  // Local cart tray state for pre-order: Array<{ id, itemId, name, tamilName, portion, unit, price, quantity, subtotal }>
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

  // Filter available active inventory items
  const menuItems = useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return [];
    return inventory.filter((item) => {
      if (item.isInactive) return false;
      return true;
    });
  }, [inventory]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set();
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category.toLowerCase());
    });
    const list = Array.from(set);
    return [
      { id: 'all', label: 'All Items' },
      ...list.map((cat) => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
      })),
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

  // Determine if item is sold by weight
  const isKgItem = (item) => {
    if (!item) return false;
    const u = (item.unit || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    if (u.includes('cup') || u.includes('pc') || u.includes('bottle') || u.includes('box')) {
      return false;
    }
    if (cat === 'beverages' || cat === 'snacks') return false;
    return true;
  };

  // Get selected portion for an item
  const getSelectedPortion = (item) => {
    if (itemSelections[item.id]) return itemSelections[item.id];
    return isKgItem(item) ? '500g' : (item.unit || '1 Pc');
  };

  // Compute price for selected portion
  const computePrice = (item, portion) => {
    const basePrice = Number(item.price || item.unitPrice || item.pricePerKg || 0);
    if (isKgItem(item)) {
      if (portion === '250g') return Math.round(basePrice * 0.25);
      if (portion === '500g') return Math.round(basePrice * 0.5);
      if (portion === '1 kg') return Math.round(basePrice * 1.0);
      return basePrice;
    }
    return basePrice;
  };

  const handleSelectPortion = (itemId, portion) => {
    setItemSelections((prev) => ({ ...prev, [itemId]: portion }));
  };

  // Add item to pre-order cart
  const handleAddToCart = (item) => {
    const portion = getSelectedPortion(item);
    const unitPrice = computePrice(item, portion);
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
          unit: item.unit || 'kg',
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

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: '#f8fafc', fontFamily: 'inherit' }}>
      {/* ── Top Header Navigation ────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(12, 10, 9, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(217, 119, 6, 0.25)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/images/branding/logo-light.webp"
              alt="Thenisai Logo"
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/branding/logo-icon.webp';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fef3c7', margin: 0 }}>
                  Thenisai Counter Menu
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(217, 119, 6, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(217, 119, 6, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.04em',
                  }}
                >
                  PRE-ORDER
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#a8a29e' }}>
                Order from fresh inventory • Quick pickup & counter billing
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Back to Storefront */}
            <button
              type="button"
              onClick={() => {
                if (window.location.hash) {
                  window.location.hash = '';
                }
                navigateTo('storefront');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Store</span>
            </button>

            {/* Mobile Tray toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#fff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              className="mobile-cart-toggle-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <span>Tray ({totalItemCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout: Menu Catalog + Pre-Order Tray ─────────────────────── */}
      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px 20px 80px',
        }}
      >
        {/* Banner Alert */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.12), rgba(180, 83, 9, 0.04))',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fef3c7' }}>
                How Pre-Ordering Works
              </div>
              <div style={{ fontSize: '12px', color: '#d6d3d1' }}>
                1. Select your favorite sweets &amp; savouries below &bull; 2. Add to tray &bull; 3. Confirm with your phone number &bull; 4. Biller prepares your parcel instantly when you arrive!
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>
            No Advance Payment Needed &bull; Pay at Counter
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }} className="menu-grid-container">
          {/* ── Left Column: Menu Items ────────────────────────────────────── */}
          <div>
            {/* Search & Category Filter */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search sweets, savouries, tea, halwa (e.g. Mysore Pak, Gulab Jamun, Kara)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1c1917',
                    border: '1px solid #383531',
                    borderRadius: '10px',
                    padding: '12px 16px 12px 42px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                  onBlur={(e) => (e.target.style.borderColor = '#383531')}
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
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
                      background: 'transparent',
                      border: 'none',
                      color: '#a8a29e',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                }}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: isSelected ? '1px solid #d97706' : '1px solid #292524',
                        background: isSelected ? 'linear-gradient(135deg, #d97706, #b45309)' : '#1c1917',
                        color: isSelected ? '#ffffff' : '#a8a29e',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu List Header Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#78716c' }}>
                Showing <strong style={{ color: '#fbbf24' }}>{filteredItems.length}</strong> items in inventory
              </div>
            </div>

            {/* Menu Item Cards (Text-Only, No Images) */}
            {filteredItems.length === 0 ? (
              <div
                style={{
                  background: '#1c1917',
                  border: '1px dashed #383531',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#78716c',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#d6d3d1' }}>
                  No items matched your search
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  Try another search term or click "All Items"
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredItems.map((item) => {
                  const isKg = isKgItem(item);
                  const selectedPortion = getSelectedPortion(item);
                  const currentPrice = computePrice(item, selectedPortion);

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#171412',
                        border: '1px solid #292524',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.4)';
                        e.currentTarget.style.background = '#1c1917';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#292524';
                        e.currentTarget.style.background = '#171412';
                      }}
                    >
                      {/* Left: Item Information (Text Only) */}
                      <div style={{ flex: '1 1 240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fef3c7' }}>
                            {item.name || item.englishName}
                          </h3>
                          {item.tamilName && (
                            <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 500 }}>
                              ({item.tamilName})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#292524',
                              color: '#a8a29e',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {item.category || 'Sweet'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#78716c' }}>
                            Base rate: ₹{item.price || item.unitPrice || item.pricePerKg} / {item.unit || (isKg ? 'kg' : 'pc')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Portion / Weight selector & Add button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Portions if kg item */}
                        {isKg ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              background: '#0c0a09',
                              border: '1px solid #383531',
                              borderRadius: '8px',
                              padding: '3px',
                              gap: '2px',
                            }}
                          >
                            {KG_WEIGHT_PRESETS.map((preset) => {
                              const isPSelected = selectedPortion === preset.label;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleSelectPortion(item.id, preset.label)}
                                  style={{
                                    border: 'none',
                                    padding: '5px 9px',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: isPSelected ? 700 : 500,
                                    cursor: 'pointer',
                                    background: isPSelected ? '#d97706' : 'transparent',
                                    color: isPSelected ? '#fff' : '#a8a29e',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#a8a29e', background: '#292524', padding: '4px 10px', borderRadius: '6px' }}>
                            {item.unit || '1 Unit'}
                          </div>
                        )}

                        {/* Price Display */}
                        <div style={{ textAlign: 'right', minWidth: '70px' }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#fbbf24' }}>
                            ₹{currentPrice}
                          </div>
                          <div style={{ fontSize: '10px', color: '#78716c' }}>
                            for {selectedPortion}
                          </div>
                        </div>

                        {/* Add to Tray Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #d97706, #b45309)',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                            transition: 'transform 0.1s, filter 0.2s',
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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

          {/* ── Right Column: In-Page Pre-Order Tray ───────────────────────── */}
          <div
            style={{
              position: 'sticky',
              top: '80px',
              background: '#171412',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
            className={`preorder-tray-panel ${isMobileCartOpen ? 'mobile-open' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #292524', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛒</span>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fef3c7' }}>
                  Pre-Order Tray
                </h2>
              </div>
              <span
                style={{
                  background: 'rgba(217, 119, 6, 0.2)',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {totalItemCount} items
              </span>
            </div>

            {/* Tray items list */}
            {preCart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#78716c' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍯</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#a8a29e' }}>Your tray is empty</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Click &ldquo;Add&rdquo; on any sweet or snack from the counter menu
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                {preCart.map((item) => (
                  <div
                    key={item.cartItemId}
                    style={{
                      background: '#1c1917',
                      border: '1px solid #292524',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>
                          Portion: {item.portion} &bull; ₹{item.price} each
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#78716c',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '12px',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #292524', paddingTop: '6px' }}>
                      {/* Qty +/- */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#0c0a09', borderRadius: '6px', border: '1px solid #383531' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, -1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#a8a29e',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '0 6px', color: '#f8fafc' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.cartItemId, 1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#a8a29e',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fef3c7' }}>
                        ₹{item.subtotal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tray Footer & Checkout Action */}
            {preCart.length > 0 && (
              <div style={{ borderTop: '1px solid #292524', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#a8a29e' }}>Counter Total (Est.)</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>₹{grandTotal}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '14px', lineHeight: 1.4 }}>
                  No online payment. Pay when picking up at the counter.
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Proceed to Pre-Order →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Checkout Details Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#171412',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fef3c7' }}>
                    Customer Pre-Order Details
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a8a29e' }}>
                    Our counter staff will use this to identify your pre-order
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a8a29e',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginBottom: '14px',
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitPreOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d6d3d1', marginBottom: '6px' }}>
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
                      background: '#1c1917',
                      border: '1px solid #383531',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#383531')}
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d6d3d1', marginBottom: '6px' }}>
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
                      background: '#1c1917',
                      border: '1px solid #383531',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#383531')}
                  />
                </div>

                {/* Optional Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d6d3d1', marginBottom: '6px' }}>
                    Pickup Time / Special Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coming by 4 PM, pack in 2 boxes"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1c1917',
                      border: '1px solid #383531',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#d97706')}
                    onBlur={(e) => (e.target.style.borderColor = '#383531')}
                  />
                </div>

                {/* Summary Box */}
                <div
                  style={{
                    background: '#0c0a09',
                    border: '1px solid #292524',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#a8a29e' }}>Items Total ({totalItemCount})</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24' }}>₹{grandTotal}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    style={{
                      flex: 1,
                      background: '#292524',
                      border: 'none',
                      color: '#d6d3d1',
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
                      color: '#fff',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
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
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#171412',
                border: '1px solid #d97706',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px',
                }}
              >
                ✓
              </div>

              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fef3c7' }}>
                Pre-Order Placed Successfully!
              </h3>
              <p style={{ margin: '6px 0 16px', fontSize: '13px', color: '#a8a29e' }}>
                Your order is sent to the billing counter. Pay &amp; collect when you visit.
              </p>

              {/* Order Card Detail */}
              <div
                style={{
                  background: '#0c0a09',
                  border: '1px solid #292524',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#78716c' }}>Order ID:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                    {placedOrder.id}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#78716c' }}>Customer Name:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {placedOrder.customerName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#78716c' }}>Mobile Number:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {placedOrder.customerPhone}
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #292524', margin: '8px 0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#d6d3d1' }}>Estimated Bill:</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
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
                    background: '#292524',
                    border: 'none',
                    color: '#d6d3d1',
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
                    color: '#fff',
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

      <style>{`
        @media (max-width: 900px) {
          .menu-grid-container {
            grid-template-columns: 1fr !important;
          }
          .preorder-tray-panel {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            border-radius: 16px 16px 0 0 !important;
            z-index: 50 !important;
            max-height: 80vh !important;
            transform: translateY(calc(100% - 68px));
            transition: transform 0.3s ease;
          }
          .preorder-tray-panel.mobile-open {
            transform: translateY(0);
          }
          .mobile-cart-toggle-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}
