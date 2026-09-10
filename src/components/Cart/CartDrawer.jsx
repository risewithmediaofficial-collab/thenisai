import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { FREE_DELIVERY_THRESHOLD } from '../../data/sweetsData';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
    freeDeliveryRemaining,
    isFreeDelivery,
    openCheckout,
    cartNotification,
  } = useCart();

  const progressPercent = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );

  return (
    <>
      {/* Notification Toast when item added */}
      <AnimatePresence>
        {cartNotification && !isCartOpen && (
          <motion.div
            className="cart-toast"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
          >
            <div className="cart-toast__body">
              <span className="cart-toast__sparkle">✦</span>
              <div className="cart-toast__text">
                <span className="cart-toast__title">
                  {cartNotification.name} ({cartNotification.weight})
                </span>
                <span className="cart-toast__sub">Added to your sweet box</span>
              </div>
            </div>
            <button
              type="button"
              className="cart-toast__btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsCartOpen(true);
              }}
            >
              View Box →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="cart-drawer-portal">
            {/* Backdrop */}
            <motion.div
              className="cart-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              className="cart-drawer"
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
              <h2 className="cart-drawer__title">Your Sweet Box</h2>
            </div>
            <button
              className="cart-drawer__close-btn"
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Free delivery progress bar */}
          <div className="cart-drawer__shipping-bar">
            {isFreeDelivery ? (
              <div className="cart-drawer__shipping-msg success">
                <span className="shipping-icon">✓</span>
                <span>You unlocked <strong>FREE Home Delivery</strong> across Tamil Nadu!</span>
              </div>
            ) : (
              <div className="cart-drawer__shipping-msg">
                <span>Add <strong>₹{freeDeliveryRemaining}</strong> more for <strong>FREE Delivery</strong></span>
              </div>
            )}
            <div className="shipping-progress-track">
              <div
                className={`shipping-progress-fill ${isFreeDelivery ? 'complete' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Content */}
          <div className="cart-drawer__content" data-lenis-prevent>
            {cart.length === 0 ? (
              <div className="cart-drawer__empty">
                <div className="cart-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="8" width="18" height="13" rx="2" />
                    <path d="M12 8v13" />
                    <path d="M19 8H5" />
                    <path d="M12 8C9.5 8 7 5.5 8.5 3.5 10 1.5 12 5 12 8z" />
                    <path d="M12 8C14.5 8 17 5.5 15.5 3.5 14 1.5 12 5 12 8z" />
                  </svg>
                </div>
                <h3 className="cart-empty__title">Your Sweet Box is Empty</h3>
                <p className="cart-empty__desc">
                  Explore our handcrafted authentic South Indian sweets and fill your box with pure taste.
                </p>
                <button
                  className="btn btn-gold cart-empty__btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>Explore Sweets</span>
                </button>
              </div>
            ) : (
              <div className="cart-drawer__items">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="cart-item">
                    <div className="cart-item__img-wrap">
                      <img src={item.image} alt={item.name} className="cart-item__img" />
                    </div>

                    <div className="cart-item__details">
                      <div className="cart-item__top">
                        <h4 className="cart-item__name">{item.name}</h4>
                        <button
                          className="cart-item__remove"
                          onClick={() => removeFromCart(item.id, item.weight)}
                          title="Remove item"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      <div className="cart-item__weight-tag">{item.weight} Pack</div>

                      <div className="cart-item__bottom">
                        <div className="cart-item__stepper">
                          <button
                            className="stepper-btn"
                            onClick={() => updateQuantity(item.id, item.weight, -1)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="stepper-value">{item.quantity}</span>
                          <button
                            className="stepper-btn"
                            onClick={() => updateQuantity(item.id, item.weight, 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-item__price">
                          ₹{item.price * item.quantity}
                          {item.quantity > 1 && (
                            <span className="cart-item__unit-price">(₹{item.price} each)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with subtotal & CTA */}
          {cart.length > 0 && (
            <div className="cart-drawer__footer">
              <div className="cart-summary__row">
                <span className="cart-summary__label">Items ({totalItems})</span>
                <span className="cart-summary__val">₹{subtotal}</span>
              </div>
              <div className="cart-summary__row note">
                <span>GST & Delivery charges</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="gold-divider" />
              <div className="cart-summary__row total">
                <span className="cart-total__label">Estimated Subtotal</span>
                <span className="cart-total__val" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  ₹{subtotal}
                </span>
              </div>

              <button
                className="btn btn-gold cart-checkout-btn"
                onClick={openCheckout}
              >
                <span>Proceed to Billing & Checkout</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <p className="cart-footer__guarantee">
                🔒 Fresh Daily Made · Authentic South Indian Ghee Sweets
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
</>
  );
}
