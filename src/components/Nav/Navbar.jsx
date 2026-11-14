import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { navigateTo } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const handlePreOrder = () => {
    setIsMobileMenuOpen(false);
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className={`thenisai-nav ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="thenisai-nav__inner">
          {/* Brand: ONLY LOGO (No raw text) */}
          <a
            href="#home"
            className="thenisai-nav__brand"
            onClick={(e) => {
              e.preventDefault();
              handleNav('storefront', '');
            }}
            title="Thenisai Sweets - Home"
          >
            <img
              src="/images/branding/logo.webp"
              alt="Thenisai Sweets"
              className="thenisai-nav__logo-img"
              onError={(e) => {
                e.currentTarget.src = '/images/branding/logo-icon.png';
              }}
            />
          </a>

          {/* Desktop Navigation Links (Bold, Uppercase, High-Impact) */}
          <nav className="thenisai-nav__links" aria-label="Main navigation">
            <a
              href="#menu"
              className="thenisai-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleNav('menu', '#menu');
              }}
            >
              Shop All Sweets
            </a>
            <a
              href="#collection"
              className="thenisai-nav__link"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('collection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else handleNav('storefront', '#collection');
              }}
            >
              Festive Gifting
            </a>
            <a
              href="#story"
              className="thenisai-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleNav('story', '#story');
              }}
            >
              Our Legacy
            </a>
            <a
              href="#contact"
              className="thenisai-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleNav('contact', '#contact');
              }}
            >
              Highway Store
            </a>
          </nav>

          {/* Actions: Search Pill + Rounded Pill Action Button */}
          <div className="thenisai-nav__actions">
            <button
              type="button"
              className="thenisai-nav__search"
              onClick={handlePreOrder}
              aria-label="Search sweets"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Explore Sweets...</span>
            </button>

            <button
              type="button"
              className="thenisai-nav__btn"
              onClick={handlePreOrder}
            >
              <span>Pre-Order Online</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="thenisai-nav__mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="thenisai-nav__burger-bar" />
              <span className="thenisai-nav__burger-bar" />
              <span className="thenisai-nav__burger-bar" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="stardust-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="stardust-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="stardust-sidebar__header">
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                type="button"
                className="stardust-sidebar__close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="stardust-sidebar__nav">
              <a href="#home" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
              <a href="#menu" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Shop All Sweets</a>
              <a href="#collection" onClick={(e) => { e.preventDefault(); handleNav('storefront', '#collection'); }}>Festive Gifting</a>
              <a href="#story" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our Legacy</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Highway Store</a>
            </nav>

            <div style={{ padding: '20px 24px', marginTop: 'auto' }}>
              <button
                type="button"
                className="thenisai-nav__btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handlePreOrder}
              >
                Pre-Order Online ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
