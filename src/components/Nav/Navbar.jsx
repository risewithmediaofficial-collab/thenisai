import { useState, useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { wishlist, setIsWishlistOpen } = useWishlist();
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
            {/* Wishlist Icon */}
            <button
              type="button"
              className="stardust-nav__icon-btn"
              onClick={() => setIsWishlistOpen(true)}
              aria-label="Saved Sweets"
              title="Saved Sweets"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.length > 0 ? '#C59334' : 'none'} stroke={wishlist.length > 0 ? '#C59334' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="stardust-nav__badge">{wishlist.length}</span>
              )}
            </button>

            {/* Search Icon */}
            <button
              type="button"
              className="stardust-nav__icon-btn"
              onClick={handlePreOrderCTA}
              aria-label="Search All Sweets"
              title="Search All Sweets"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Pre-Order Now Pill Button */}
            <button
              type="button"
              className="stardust-btn stardust-btn--primary"
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
        <div className="stardust-nav__mobile font-lato">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.hash || '#'}
              className="stardust-nav__mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNav(item);
              }}
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            className="stardust-btn stardust-btn--primary"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={handlePreOrderCTA}
          >
            <span>Pre-Order Sweets Online ↗</span>
          </button>
        </div>
      )}
    </>
  );
}
