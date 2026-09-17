import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist, setIsWishlistOpen } = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useScrollLock(menuOpen);

  const links = [
    { label: 'Home', href: '#hero' },
    { label: 'Sweets', href: '#collection' },
    { label: 'Our Story', href: '#story' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    if (window.__lenis) {
      window.__lenis.scrollTo(href, { offset: -20, duration: 1.2 });
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="navbar__inner">
          {/* Logo */}
          <a className="navbar__logo" href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }} aria-label="Thenisai Palkhova & Sweets">
            <img src="/images/branding/logo-light.png" alt="Thenisai Palkhova & Sweets" className="navbar__logo-img" />
          </a>

          {/* Desktop links */}
          <ul className="navbar__links">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="navbar__link"
                  onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right actions: Wishlist + Cart + Order CTA */}
          <div className="navbar__actions">
            <button
              className={`navbar__wishlist-btn ${wishlist.length > 0 ? 'has-items' : ''}`}
              onClick={() => setIsWishlistOpen(true)}
              aria-label={`View wishlist (${wishlist.length} saved)`}
              title="My Wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlist.length > 0 ? '#D97706' : 'none'} stroke={wishlist.length > 0 ? '#D97706' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="navbar__cart-badge">{wishlist.length}</span>
              )}
            </button>

            <button
              className="navbar__cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`View sweet box cart (${totalItems} items)`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6h18" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 10a4 4 0 01-8 0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {totalItems > 0 && (
                <span className="navbar__cart-badge">{totalItems}</span>
              )}
            </button>

            <button
              className="navbar__cta btn btn-gold"
              onClick={() => {
                if (totalItems > 0) {
                  setIsCartOpen(true);
                } else {
                  scrollTo('#collection');
                }
              }}
            >
              <span>{totalItems > 0 ? 'Checkout' : 'Order Now'}</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            data-lenis-prevent
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mobile-menu__inner">
              <nav className="mobile-menu__links">
                {links.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    className="mobile-menu__link"
                    onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 + 0.08 }}
                  >
                    <span className="mobile-menu__link-num">0{i + 1}</span>
                    <span className="mobile-menu__link-text">{link.label}</span>
                  </motion.a>
                ))}

                <button
                  type="button"
                  className="mobile-menu__wishlist-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsWishlistOpen(true);
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    My Wishlist
                  </span>
                  {wishlist.length > 0 && <span className="mobile-wishlist-count">{wishlist.length}</span>}
                </button>

                <motion.div
                  className="mobile-menu__divider"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                />

                <motion.button
                  className="btn btn-gold mobile-menu__cta"
                  onClick={() => {
                    setMenuOpen(false);
                    if (totalItems > 0) {
                      setIsCartOpen(true);
                    } else {
                      scrollTo('#collection');
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <span>{totalItems > 0 ? `Sweet Box (${totalItems})` : 'Order Now'}</span>
                </motion.button>
              </nav>

              <div className="mobile-menu__footer">
                <div className="mobile-menu__tagline">Since 2006 · Pure · Rich · Traditional</div>
                <div className="mobile-menu__sub">Handcrafted South Indian Delicacies</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

