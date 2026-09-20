import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG, SPECIAL_BOX } from '../../data/sweetsData';
export default function WishlistDrawer() {
  const {
    wishlist,
    customer,
    isWishlistOpen,
    setIsWishlistOpen,
    removeFromWishlist,
    setIsAuthModalOpen,
    logoutCustomer,
  } = useWishlist();

  const { addToCart, setIsCartOpen } = useCart();

  useScrollLock(isWishlistOpen);

  useEffect(() => {
    if (!isWishlistOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsWishlistOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isWishlistOpen, setIsWishlistOpen]);

  if (!isWishlistOpen) return null;

  const catalog = [...SWEETS_CATALOG, SPECIAL_BOX];
  const validSweetIds = new Set(catalog.map((s) => s.id));
  const wishlistItems = wishlist
    .filter((id) => validSweetIds.has(id))
    .map((id) => catalog.find((item) => item.id === id))
    .filter(Boolean);

  const handleMoveToCart = (item) => {
    const hasPrices = Boolean(item.prices);
    const weight = hasPrices ? '500g' : (item.weight || '1kg');
    const price = hasPrices
      ? (item.prices['500g'] || Object.values(item.prices)[0])
      : (item.price || 0);
    addToCart(item, weight, price, 1);
  };

  const handleAddAllToCart = () => {
    wishlistItems.forEach((item) => {
      const hasPrices = Boolean(item.prices);
      const weight = hasPrices ? '500g' : (item.weight || '1kg');
      const price = hasPrices
        ? (item.prices['500g'] || Object.values(item.prices)[0])
        : (item.price || 0);
      addToCart(item, weight, price, 1);
    });
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const estimatedTotal = wishlistItems.reduce((sum, item) => {
    const hasPrices = Boolean(item.prices);
    const price = hasPrices
      ? (item.prices['500g'] || Object.values(item.prices)[0])
      : (item.price || 0);
    return sum + price;
  }, 0);

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AnimatePresence>
      <div className="wishlist-drawer-portal">
        {/* Blurred backdrop */}
        <motion.div
          className="wishlist-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsWishlistOpen(false)}
        />

        {/* Drawer Panel */}
        <motion.div
          className="wishlist-drawer"
          data-lenis-prevent
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Header ── */}
          <div className="wishlist-header">
            <div className="wishlist-header-left">
              <span className="wishlist-header-eyebrow">Thenisai Kitchen</span>
              <h2 className="wishlist-header-title">
                <span className="wishlist-heart-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                My Wishlist
                {wishlistItems.length > 0 && (
                  <span className="wishlist-count-chip">{wishlistItems.length}</span>
                )}
              </h2>
            </div>
            <button
              type="button"
              className="wishlist-close-btn"
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close Wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Account Strip ── */}
          <div className="wishlist-account-strip">
            {customer?.phone ? (
              <div className="wl-account-row">
                <div className="wl-avatar">
                  {getInitials(customer.name || 'Guest')}
                </div>
                <div className="wl-account-info">
                  <div className="wl-account-name">{customer.name || 'Valued Guest'}</div>
                  <div className="wl-account-phone">
                    <span className="wl-verified-dot" />
                    +91 {customer.phone} · Verified
                  </div>
                </div>
                <button type="button" className="wl-logout-btn" onClick={logoutCustomer}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="wl-guest-strip">
                <div className="wl-guest-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="wl-guest-text">
                  <strong>Sign in to save your favorites</strong>
                  Save sweets with your mobile number
                </div>
                <button type="button" className="wl-signin-btn" onClick={() => setIsAuthModalOpen(true)}>
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* ── Scrollable Content ── */}
          <div className="wishlist-content" data-lenis-prevent>
            {wishlistItems.length === 0 ? (
              <div className="wishlist-empty">
                <div className="wishlist-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h3>Your Wishlist is Empty</h3>
                <p>
                  Explore our handcrafted authentic South Indian sweets and tap the heart icon to save your favorites here.
                </p>
                <button
                  type="button"
                  className="wl-explore-btn"
                  onClick={() => {
                    setIsWishlistOpen(false);
                    const el = document.querySelector('#collection');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Explore Sweets</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            ) : (
              wishlistItems.map((item) => {
                const hasPrices = Boolean(item.prices);
                const weightLabel = hasPrices ? '500g Pack' : (item.weight || 'Handcrafted Sweet');
                const price = hasPrices
                  ? (item.prices['500g'] || Object.values(item.prices)[0])
                  : (item.price || 0);

                return (
                  <div key={item.id} className="wl-item-card">
                    {/* Thumbnail */}
                    <div className="wl-item-img-wrap">
                      <img src={item.image} alt={item.name} className="wl-item-img" />
                    </div>

                    {/* Details */}
                    <div className="wl-item-body">
                      <div className="wl-item-top">
                        <h4 className="wl-item-name">{item.name}</h4>
                        <button
                          type="button"
                          className="wl-item-remove"
                          onClick={() => removeFromWishlist(item.id)}
                          title="Remove from wishlist"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>

                      <span className="wl-item-tag">
                        {weightLabel}
                      </span>

                      <div className="wl-item-bottom">
                        <span className="wl-item-price">₹{price}</span>
                        <button
                          type="button"
                          className="wl-add-btn"
                          onClick={() => handleMoveToCart(item)}
                          title="Add to Sweet Box"
                        >
                          Add to Box
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Footer ── */}
          {wishlistItems.length > 0 && (
            <div className="wishlist-footer">
              <div className="wl-summary-row">
                <span className="wl-summary-label">Saved Sweets</span>
                <span className="wl-summary-val">{wishlistItems.length} items</span>
              </div>
              <div className="wl-divider" />
              <div className="wl-total-row">
                <span className="wl-total-label">Estimated Value</span>
                <span className="wl-total-val">₹{estimatedTotal}</span>
              </div>

              <button type="button" className="wl-cta-btn" onClick={handleAddAllToCart}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Add All to Sweet Box ({wishlistItems.length})
              </button>

              <p className="wl-guarantee">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Fresh Daily · Pure Milk &amp; Ghee · Authentic South Indian
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
