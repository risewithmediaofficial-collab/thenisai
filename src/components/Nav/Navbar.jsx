import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.__lenis?.stop();
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.__lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.__lenis?.start();
    };
  }, [menuOpen]);

  const links = [
    { label: 'Home', href: '#hero' },
    { label: 'Sweets', href: '#collection' },
    { label: 'Our Story', href: '#story' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
          <a className="navbar__logo" href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }}>
            <span className="navbar__logo-text">THENISAI</span>
            <span className="navbar__logo-sub">The Taste of Tradition</span>
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

          {/* CTA */}
          <a
            href="#contact"
            className="navbar__cta btn btn-gold"
            onClick={(e) => { e.preventDefault(); scrollTo('#contact'); }}
          >
            <span>Order Now</span>
          </a>

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

                <motion.div
                  className="mobile-menu__divider"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                />

                <motion.a
                  href="#contact"
                  className="btn btn-gold mobile-menu__cta"
                  onClick={(e) => { e.preventDefault(); scrollTo('#contact'); }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <span>Order Now</span>
                </motion.a>
              </nav>

              <div className="mobile-menu__footer">
                <div className="mobile-menu__tagline">Pure · Rich · Traditional</div>
                <div className="mobile-menu__sub">Handcrafted South Indian Delicacies</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

