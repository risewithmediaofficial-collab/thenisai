import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentView, navigateTo } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useScrollLock(menuOpen);

  const navItems = [
    { label: 'Home', view: 'storefront', hash: '', icon: '🏠', desc: 'Main Storefront' },
    { label: 'Pre-Order Sweets', view: 'menu', hash: '#menu', icon: '🍬', desc: 'Zero-Wait Highway Counter Pickup', badge: 'POPULAR' },
    { label: 'Our Story', view: 'story', hash: '#story', icon: '📜', desc: '20-Year Legacy Since 2006' },
    { label: 'Visit & Contact', view: 'contact', hash: '#contact', icon: '📍', desc: 'NH 44 Krishnagiri Store' },
  ];

  const quickCategories = [
    { label: 'Pure Milk Sweets', icon: '🍬', hash: '#bestsellers' },
    { label: 'Crispy Savories', icon: '🥨', hash: '#bestsellers' },
    { label: 'Live Pani Puri', icon: '🧆', hash: '#bestsellers' },
    { label: 'Degree Coffee & Tea', icon: '☕', hash: '#bestsellers' },
    { label: 'Fresh Fruit Juices', icon: '🥤', hash: '#bestsellers' },
  ];

  const handleNav = (item) => {
    setMenuOpen(false);
    window.location.hash = item.hash;
    navigateTo(item.view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreOrderCTA = () => {
    setMenuOpen(false);
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryShortcut = (hash) => {
    setMenuOpen(false);
    if (currentView !== 'storefront') {
      navigateTo('storefront');
    }
    setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <header className={`stardust-nav ${scrolled ? 'stardust-nav--scrolled' : ''}`}>
        <div className="stardust-nav__container">
          {/* Brand Logo with Actual Image from Logo Files */}
          <a
            href="#home"
            className="stardust-nav__brand"
            onClick={(e) => {
              e.preventDefault();
              handleNav({ view: 'storefront', hash: '' });
            }}
          >
            <img
              src="/images/branding/logo.webp"
              alt="Thenisai Sweets"
              className="stardust-nav__logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="stardust-nav__logo-group">
              <span className="stardust-nav__logo font-garamond">Thenisai</span>
              <span className="stardust-nav__logo-sub font-lato">Sweets &amp; Bakes</span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="stardust-nav__menu font-lato" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <a
                  key={item.label}
                  href={item.hash || '#'}
                  className={`stardust-nav__link ${isActive ? 'stardust-nav__link--active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item);
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="stardust-nav__actions font-lato">
            {/* Pre-Order Now Pill Button (Desktop only) */}
            <button
              type="button"
              className="stardust-btn stardust-btn--primary stardust-nav__cta-desktop"
              onClick={handlePreOrderCTA}
            >
              <span>Pre-Order Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className={`stardust-nav__hamburger ${menuOpen ? 'is-active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Modern Slide-In Mobile Sidebar & Backdrop */}
      {menuOpen && (
        <>
          {/* Blur Backdrop */}
          <div
            className="stardust-sidebar-backdrop animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Sidebar Drawer */}
          <aside
            className="stardust-mobile-sidebar font-lato animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Sidebar"
          >
            {/* Sidebar Top Header with Close Button */}
            <div className="stardust-sidebar__header">
              <div className="stardust-sidebar__brand">
                <img
                  src="/images/branding/logo.webp"
                  alt="Thenisai"
                  className="stardust-sidebar__logo-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h3 className="stardust-sidebar__brand-name font-garamond">Thenisai Sweets</h3>
                  <p className="stardust-sidebar__brand-tag font-lato">Est. 2006 · NH 44 Krishnagiri</p>
                </div>
              </div>

              <button
                type="button"
                className="stardust-sidebar__close-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Sidebar Body */}
            <div className="stardust-sidebar__body">
              {/* Primary Pages Nav */}
              <div className="stardust-sidebar__section">
                <span className="stardust-sidebar__section-title">PAGES &amp; DESTINATIONS</span>
                <div className="stardust-sidebar__links">
                  {navItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                      <a
                        key={item.label}
                        href={item.hash || '#'}
                        className={`stardust-sidebar__link ${isActive ? 'stardust-sidebar__link--active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNav(item);
                        }}
                      >
                        <div className="stardust-sidebar__link-left">
                          <span className="stardust-sidebar__link-icon">{item.icon}</span>
                          <div>
                            <div className="stardust-sidebar__link-label">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="stardust-sidebar__pill-badge">{item.badge}</span>
                              )}
                            </div>
                            <span className="stardust-sidebar__link-desc">{item.desc}</span>
                          </div>
                        </div>

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stardust-sidebar__chevron">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Quick Menu Shortcuts */}
              <div className="stardust-sidebar__section">
                <span className="stardust-sidebar__section-title">QUICK SPECIALTY SHORTCUTS</span>
                <div className="stardust-sidebar__shortcuts">
                  {quickCategories.map((qc) => (
                    <button
                      key={qc.label}
                      type="button"
                      className="stardust-sidebar__shortcut-chip"
                      onClick={() => handleCategoryShortcut(qc.hash)}
                    >
                      <span>{qc.icon}</span>
                      <span>{qc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Highway Pitstop & Store Info Box */}
              <div className="stardust-sidebar__info-card">
                <div className="stardust-sidebar__info-row">
                  <span className="stardust-sidebar__info-icon">📍</span>
                  <div>
                    <strong className="stardust-sidebar__info-title">Highway Counter Location</strong>
                    <p className="stardust-sidebar__info-text">Nattamai Kottai, Near HP Petrol Bunk, NH 44, Krishnagiri</p>
                  </div>
                </div>

                <div className="stardust-sidebar__info-row">
                  <span className="stardust-sidebar__info-icon">⏰</span>
                  <div>
                    <strong className="stardust-sidebar__info-title">Open Daily</strong>
                    <p className="stardust-sidebar__info-text">6:00 AM – 10:30 PM (Fresh morning batches at dawn)</p>
                  </div>
                </div>

                <a
                  href="tel:+919344893547"
                  className="stardust-sidebar__phone-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Call Highway Desk: +91 93448 93547</span>
                </a>
              </div>
            </div>

            {/* Sidebar Sticky Bottom CTA */}
            <div className="stardust-sidebar__footer">
              <button
                type="button"
                className="stardust-btn stardust-btn--primary"
                style={{ width: '100%', minHeight: '50px', fontSize: '15px' }}
                onClick={handlePreOrderCTA}
              >
                <span>Pre-Order Sweets Online ↗</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
