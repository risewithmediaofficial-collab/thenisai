import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentView, navigateTo } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useScrollLock(menuOpen);

  const navItems = [
    { label: 'Shop All Sweets', view: 'menu', hash: '#menu', icon: '🍬', desc: 'Zero-Wait Highway Counter Pickup' },
    { label: 'Festive Gifting', view: 'contact', hash: '#contact', icon: '🎁', desc: 'Wedding & Corporate Gift Boxes' },
    { label: 'Our Legacy', view: 'story', hash: '#story', icon: '📜', desc: '20-Year Legacy Since 2006' },
    { label: 'Highway Store', view: 'contact', hash: '#contact', icon: '📍', desc: 'NH 44 Krishnagiri Landmark' },
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

  const handleSearchClick = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className={`thenisai-nav ${scrolled ? 'thenisai-nav--scrolled' : ''}`}>
        <div className="thenisai-nav__inner">
          {/* Brand Logo & Name */}
          <a
            href="#home"
            className="thenisai-nav__brand"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('storefront');
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/images/branding/logo.webp"
              alt="Thenisai Sweets"
              className="thenisai-nav__logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="thenisai-nav__brand-title">Thenisai</h1>
              <div className="thenisai-nav__brand-sub">Sweets &amp; Bakes · NH 44</div>
            </div>
          </a>

          {/* Center Navigation Links (Matching Reference Layout) */}
          <nav className="thenisai-nav__links" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <a
                  key={item.label}
                  href={item.hash}
                  className={`thenisai-nav__link ${isActive ? 'is-active' : ''}`}
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

          {/* Right Actions: Search Pill, Pre-Order CTA & Mobile Menu */}
          <div className="thenisai-nav__actions">
            <button
              type="button"
              className="thenisai-nav__search"
              onClick={handleSearchClick}
              title="Search Thenisai Delicacies"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Explore Sweets...</span>
            </button>

            <button
              type="button"
              className="thenisai-nav__btn"
              onClick={handlePreOrderCTA}
            >
              <span>Pre-Order Online</span>
              <span>↗</span>
            </button>

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              className={`stardust-nav__hamburger ${menuOpen ? 'is-active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ display: 'flex' }}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Mobile Sidebar Drawer */}
      {menuOpen && (
        <>
          <div
            className="stardust-sidebar-backdrop animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <aside
            className="stardust-mobile-sidebar font-lato"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Sidebar"
          >
            {/* Sidebar Header */}
            <div className="stardust-sidebar__header">
              <div className="stardust-sidebar__brand">
                <img
                  src="/images/branding/logo.webp"
                  alt="Thenisai"
                  className="stardust-sidebar__logo-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h3 className="stardust-sidebar__brand-name font-display-heavy">Thenisai Sweets</h3>
                  <p className="stardust-sidebar__brand-tag">Est. 2006 · NH 44 Krishnagiri</p>
                </div>
              </div>

              <button
                type="button"
                className="stardust-sidebar__close-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="stardust-sidebar__body">
              <div className="stardust-sidebar__section">
                <span className="stardust-sidebar__section-title">DESTINATIONS</span>
                <div className="stardust-sidebar__links">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.hash}
                      className="stardust-sidebar__link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav(item);
                      }}
                    >
                      <div className="stardust-sidebar__link-left">
                        <span className="stardust-sidebar__link-icon">{item.icon}</span>
                        <div>
                          <div className="stardust-sidebar__link-label font-display-heavy">{item.label}</div>
                          <span className="stardust-sidebar__link-desc">{item.desc}</span>
                        </div>
                      </div>
                      <span>↗</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Pre-Order Action Button */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="thenisai-hero-card__cta-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handlePreOrderCTA}
                >
                  Pre-Order for Zero-Wait Pickup ↗
                </button>
              </div>

              {/* Highway Pitstop Information Box */}
              <div className="stardust-sidebar__info-card" style={{ marginTop: '20px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1C0F08' }}>
                  📍 NH 44 Near HP Bunk, Nattamai Kottai, Krishnagiri
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7A695B' }}>
                  ⏰ Open Daily: 6:00 AM – 10:30 PM · 📞 +91 93448 93547
                </p>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
