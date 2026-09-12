import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { SWEETS_CATALOG, SPECIAL_BOX } from '../../data/sweetsData';
import './WishlistDrawer.css';

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

  if (!isWishlistOpen) return null;

  // STRICT FILTER: Only authentic handcrafted sweets and special box can EVER appear in customer wishlist
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

  return (
    <AnimatePresence>
      <div className="cart-drawer-portal wishlist-drawer-portal">
        {/* Backdrop matching Cart Drawer */}
        <motion.div
          className="cart-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsWishlistOpen(false)}
        />

        {/* Drawer panel matching Cart Drawer */}
        <motion.div
          className="cart-drawer wishlist-drawer"
          data-lenis-prevent
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="cart-drawer__header">
            <div className="cart-drawer__title-wrap">
              <span className="cart-drawer__badge">✦ Thenisai Kitchen</span>
              <h2 className="cart-drawer__title">My Wishlist</h2>
            </div>
            <button
              className="cart-drawer__close-btn"
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close Wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Customer Account Strip matching Cart Theme */}
          <div className="wishlist-account-strip">
            {customer?.phone ? (
              <div className="account-verified-info">
                <div className="account-avatar-badge">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="account-details">
                  <strong className="account-name">{customer.name || 'Valued Guest'}</strong>
                  <span className="account-phone">
                    <span className="verified-check">✓</span> +91 {customer.phone} · Saved Account
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-account-logout"
                  onClick={logoutCustomer}
                  title="Switch Account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="account-guest-prompt">
                <span className="guest-prompt-text">Save your favorite sweets with your mobile number</span>
                <button
                  type="button"
                  className="btn-prompt-login"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In / OTP ➔
                </button>
              </div>
            )}
          </div>

          {/* Items Content Area */}
          <div className="cart-drawer__content" data-lenis-prevent>
            {wishlistItems.length === 0 ? (
              <div className="cart-drawer__empty">
                <div className="cart-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h3 className="cart-empty__title">Your Wishlist is Empty</h3>
                <p className="cart-empty__desc">
                  Explore our handcrafted authentic South Indian sweets and tap the heart icon on any sweet to save it here.
                </p>
                <button
                  className="btn btn-gold cart-empty__btn"
                  onClick={() => {
                    setIsWishlistOpen(false);
                    const el = document.querySelector('#collection');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>Explore Sweets</span>
                </button>
              </div>
            ) : (
              <div className="cart-drawer__items">
                {wishlistItems.map((item) => {
                  const hasPrices = Boolean(item.prices);
                  const weightLabel = hasPrices ? '500g Pack' : (item.weight || 'Handcrafted Sweet');
                  const price = hasPrices
                    ? (item.prices['500g'] || Object.values(item.prices)[0])
                    : (item.price || 0);

                  return (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item__img-wrap">
                        <img src={item.image} alt={item.name} className="cart-item__img" />
                      </div>

                      <div className="cart-item__details">
                        <div className="cart-item__top">
                          <h4 className="cart-item__name">{item.name}</h4>
                          <button
                            type="button"
                            className="cart-item__remove"
                            onClick={() => removeFromWishlist(item.id)}
                            title="Remove from wishlist"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>

                        <div className="cart-item__weight-tag">{weightLabel}</div>

                        <div className="cart-item__bottom">
                          <div className="cart-item__price" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            ₹{price}
                          </div>

                          <button
                            type="button"
                            className="btn btn-gold wishlist-add-btn"
                            onClick={() => handleMoveToCart(item)}
                            title="Add to Sweet Box"
                          >
                            <span>Add to Box</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with subtotal & CTA */}
          {wishlistItems.length > 0 && (
            <div className="cart-drawer__footer">
              <div className="cart-summary__row">
                <span className="cart-summary__label">Saved Sweets ({wishlistItems.length})</span>
                <span className="cart-summary__val" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  ₹{estimatedTotal}
                </span>
              </div>
              <div className="cart-summary__row note">
                <span>Handcrafted with pure milk &amp; ghee</span>
                <span>Ready to Pack</span>
              </div>
              <div className="gold-divider" />
              <div className="cart-summary__row total">
                <span className="cart-total__label">Estimated Box Value</span>
                <span className="cart-total__val" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  ₹{estimatedTotal}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-gold cart-checkout-btn"
                onClick={handleAddAllToCart}
              >
                <span>Add All to Sweet Box ({wishlistItems.length})</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <p className="cart-footer__guarantee">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Fresh Daily Made · Authentic South Indian Ghee Sweets
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
