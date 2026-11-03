import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

export default function PreOrderAlert() {
  const { navigateTo } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show alert message promptly after user opens the website
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToPreOrder = () => {
    setIsOpen(false);
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setDismissed(true);
  };

  return (
    <>
      {/* 1. Interactive Alert Modal Prompt (Appears when website user opens) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="stardust-alert-modal-wrap font-lato"
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="stardust-alert-card">
              {/* Close Button */}
              <button
                type="button"
                className="stardust-alert-close"
                onClick={handleDismiss}
                aria-label="Close notification"
              >
                ✕
              </button>

              {/* Alert Header Badge */}
              <div className="stardust-alert-badge">
                <span className="stardust-alert-dot" />
                <span>ONLINE PRE-ORDER NOW LIVE</span>
              </div>

              {/* Artisanal Script Flourish */}
              <span className="font-script stardust-alert-script" style={{ fontSize: '32px', color: '#C59334' }}>
                Fresh Hot Batches
              </span>

              {/* Display Headline */}
              <h3 className="stardust-alert-title font-garamond" style={{ fontSize: '24px', margin: '4px 0 16px' }}>
                Reserve Sweets Before You Reach Krishnagiri
              </h3>

              {/* Big Clickable Pre-Order Highlight Button */}
              <div className="stardust-alert-actions">
                <button
                  type="button"
                  className="stardust-btn stardust-btn--primary stardust-btn--alert-glow"
                  onClick={handleGoToPreOrder}
                >
                  <span>👉 Click Here to Pre-Order Online</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="stardust-alert-dismiss-btn"
                  onClick={handleDismiss}
                >
                  Explore Website
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Persistent Bottom-Right Quick Button (Re-opens Pre-Order anytime) */}
      {(!isOpen || dismissed) && (
        <aside aria-label="Quick Pre-Order Widget" className="stardust-floating-preorder">
          <button
            type="button"
            className="stardust-floating-preorder__btn font-lato"
            onClick={handleGoToPreOrder}
            title="Pre-Order Fresh Sweets Online"
          >
            <span className="stardust-floating-preorder__icon">🛍️</span>
            <span className="stardust-floating-preorder__text">
              <strong>Pre-Order Online</strong>
              <small>Zero Waiting Time on NH 44</small>
            </span>
            <span className="stardust-floating-preorder__arrow">↗</span>
          </button>
        </aside>
      )}
    </>
  );
}
