import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { navigateTo } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                title="Thenisai Sweets - Home"
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

              {/* Right Action: Pre-Order Online Pill Button & Mobile Toggle */}
              <div className="ks-header__actions">
                <button
                  type="button"
                  className="ks-preorder-btn"
                  onClick={() => handleNav('menu', '#menu')}
                >
                  <span>Pre-Order Online</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>

                {/* Mobile Menu Button */}
                <button
                  type="button"
                  className="ks-mobile-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {isMobileMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
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

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="ks-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="ks-mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ks-mobile-menu-drawer__header">
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                type="button"
                className="ks-mobile-menu-drawer__close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="ks-mobile-menu-drawer__nav">
              <a href="#home" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
              <a href="#story" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our Heritage</a>
              <a href="#menu" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Pre-Order</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Contact Us</a>
            </nav>

            <div style={{ padding: '24px 20px', marginTop: 'auto', borderTop: '1px solid var(--ks-border)' }}>
              <button
                type="button"
                className="ks-preorder-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleNav('menu', '#menu')}
              >
                <span>Pre-Order Online ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
