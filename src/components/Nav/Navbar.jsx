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
    { label: 'Home', view: 'storefront', hash: '' },
    { label: 'Pre-Order Sweets', view: 'menu', hash: '#menu' },
    { label: 'Our Story', view: 'story', hash: '#story' },
    { label: 'Visit & Contact', view: 'contact', hash: '#contact' },
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
            <span className="stardust-nav__logo font-garamond">Thenisai</span>
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

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className={`stardust-nav__hamburger ${menuOpen ? 'is-open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="stardust-nav__mobile font-lato" role="dialog" aria-modal="true">
          <div className="stardust-nav__mobile-links">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.hash || '#'}
                className={`stardust-nav__mobile-link ${currentView === item.view ? 'stardust-nav__mobile-link--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item);
                }}
              >
                <span>{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ))}
          </div>

          <div className="stardust-nav__mobile-footer">
            <button
              type="button"
              className="stardust-btn stardust-btn--primary"
              style={{ width: '100%', minHeight: '48px', fontSize: '15px' }}
              onClick={handlePreOrderCTA}
            >
              <span>Pre-Order Sweets Online</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
            <p className="stardust-nav__mobile-note">
              📍 NH 44, Krishnagiri · ⏰ 6:00 AM – 10:30 PM Daily
            </p>
          </div>
        </div>
      )}
    </>
  );
}
