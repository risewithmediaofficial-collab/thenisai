import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { navigateTo } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile sidebar drawer is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle ESC key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNav = (view, hash = '') => {
    setIsMobileMenuOpen(false);
    if (hash) {
      window.location.hash = hash;
    } else {
      window.location.hash = '';
    }
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="ks-header">
        <div className="ks-header__main">
          <div className="ks-container">
            <div className="ks-header__row">
              {/* Brand Logo */}
              <a
                href="#home"
                className="ks-header__logo-wrap"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('storefront', '');
                }}
                title="Thenisai Sweets Krishnagiri - Home"
              >
                <img
                  src="/images/branding/logo.webp"
                  alt="Thenisai Sweets"
                  className="ks-header__logo"
                  onError={(e) => {
                    e.currentTarget.src = '/images/branding/logo-icon.png';
                  }}
                />
              </a>

              {/* Desktop Minimal Nav Links: Home, Our Heritage, Pre-Order, Contact Us */}
              <nav className="ks-header__nav" aria-label="Main Navigation">
                <a
                  href="#home"
                  className="ks-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('storefront', '');
                  }}
                >
                  Home
                </a>
                <a
                  href="#story"
                  className="ks-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('story', '#story');
                  }}
                >
                  Our Heritage
                </a>
                <a
                  href="#menu"
                  className="ks-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('menu', '#menu');
                  }}
                >
                  Pre-Order
                </a>
                <a
                  href="#contact"
                  className="ks-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('contact', '#contact');
                  }}
                >
                  Contact Us
                </a>
              </nav>

              {/* Right Action: Pre-Order Online Button & Mobile Hamburger Toggle */}
              <div className="ks-header__actions">
                <button
                  type="button"
                  className="ks-preorder-btn"
                  onClick={() => handleNav('menu', '#menu')}
                  aria-label="Pre-Order Sweets Online"
                >
                  <span className="ks-preorder-btn__text--desktop">Pre-Order Online</span>
                  <span className="ks-preorder-btn__text--mobile">Pre-Order</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  className="ks-mobile-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {isMobileMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Native Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div
          className="ks-mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <aside className="ks-mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="ks-mobile-menu-drawer__header">
              <div className="ks-mobile-menu-drawer__brand">
                <img
                  src="/images/branding/logo.webp"
                  alt="Thenisai Sweets"
                  className="ks-mobile-menu-drawer__logo"
                  onError={(e) => {
                    e.currentTarget.src = '/images/branding/logo-icon.png';
                  }}
                />
                <span className="ks-mobile-menu-drawer__tag">NH 44 Krishnagiri · Est. 2006</span>
              </div>
              <button
                type="button"
                className="ks-mobile-menu-drawer__close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="ks-mobile-menu-drawer__nav" aria-label="Mobile Links">
              <a
                href="#home"
                className="ks-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('storefront', '');
                }}
              >
                <span className="ks-drawer-link__title">Home</span>
                <span className="ks-drawer-link__arrow">›</span>
              </a>

              <a
                href="#story"
                className="ks-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('story', '#story');
                }}
              >
                <span className="ks-drawer-link__title">Our Heritage &amp; Story</span>
                <span className="ks-drawer-link__arrow">›</span>
              </a>

              <a
                href="#menu"
                className="ks-drawer-link ks-drawer-link--featured"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('menu', '#menu');
                }}
              >
                <div>
                  <span className="ks-drawer-link__title">Pre-Order Sweets</span>
                  <span className="ks-drawer-link__badge">Zero-Wait Pickup</span>
                </div>
                <span className="ks-drawer-link__arrow">›</span>
              </a>

              <a
                href="#contact"
                className="ks-drawer-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('contact', '#contact');
                }}
              >
                <span className="ks-drawer-link__title">Contact &amp; Location</span>
                <span className="ks-drawer-link__arrow">›</span>
              </a>
            </nav>

            {/* Highway Boutique Details Card Inside Drawer */}
            <div className="ks-drawer-store-card">
              <div className="ks-drawer-store-card__header">
                <span className="ks-drawer-store-card__icon">📍</span>
                <div>
                  <strong>Krishnagiri Highway Store</strong>
                  <p>Opp. HP Petrol Bunk, NH 44</p>
                </div>
              </div>
              <div className="ks-drawer-store-card__hours">
                <span>⏰ Open Daily: 6:00 AM – 10:30 PM</span>
              </div>
              <div className="ks-drawer-store-card__actions">
                <a href="tel:+919344893547" className="ks-drawer-pill-btn">
                  <span>📞 Call Store</span>
                </a>
                <a
                  href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20want%20to%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ks-drawer-pill-btn ks-drawer-pill-btn--wa"
                >
                  <span>💬 WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Bottom Full-Width CTA */}
            <div className="ks-mobile-menu-drawer__footer">
              <button
                type="button"
                className="ks-preorder-btn ks-preorder-btn--full"
                onClick={() => handleNav('menu', '#menu')}
              >
                <span>Pre-Order Sweets Online ↗</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
