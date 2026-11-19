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
      <header className="sticky top-0 z-40 bg-white border-b border-[#EAE2D5] shadow-sm font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Brand Logo */}
            <a
              href="#home"
              className="flex items-center flex-shrink-0 cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                handleNav('storefront', '');
              }}
              title="Thenisai Sweets Krishnagiri - Home"
            >
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets"
                className="h-8 sm:h-10 w-auto max-w-[125px] sm:max-w-[160px] object-contain transition-transform hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/images/branding/logo-icon.png';
                }}
              />
            </a>

            {/* Desktop Minimal Nav Links: Home, Our Heritage, Pre-Order, Contact Us */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main Navigation">
              <a
                href="#home"
                className="text-[#2C2018] hover:text-[#7B1812] text-sm lg:text-[15px] font-semibold transition-colors duration-150 no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('storefront', '');
                }}
              >
                Home
              </a>
              <a
                href="#story"
                className="text-[#2C2018] hover:text-[#7B1812] text-sm lg:text-[15px] font-semibold transition-colors duration-150 no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('story', '#story');
                }}
              >
                Our Heritage
              </a>
              <a
                href="#menu"
                className="text-[#2C2018] hover:text-[#7B1812] text-sm lg:text-[15px] font-semibold transition-colors duration-150 no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('menu', '#menu');
                }}
              >
                Pre-Order
              </a>
              <a
                href="#contact"
                className="text-[#2C2018] hover:text-[#7B1812] text-sm lg:text-[15px] font-semibold transition-colors duration-150 no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('contact', '#contact');
                }}
              >
                Contact Us
              </a>
            </nav>

            {/* Right Actions: Pre-Order Pill Button & Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-150 cursor-pointer border-0 active:scale-95"
                onClick={() => handleNav('menu', '#menu')}
                aria-label="Pre-Order Sweets Online"
              >
                <span className="hidden sm:inline">Pre-Order Online</span>
                <span className="inline sm:hidden">Pre-Order</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#EAE2D5] text-[#2C2018] active:scale-95 transition-all cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      </header>

      {/* Pure Tailwind Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1000000] bg-black/60 backdrop-blur-sm flex justify-end font-sans transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <aside
            className="w-[84%] max-w-[320px] h-full h-[100dvh] bg-white flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#EAE2D5] flex items-center justify-between bg-[#FAF7F2] sticky top-0 z-10">
              <div className="flex flex-col gap-0.5">
                <img
                  src="/images/branding/logo.webp"
                  alt="Thenisai Sweets"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/images/branding/logo-icon.png';
                  }}
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C59334]">
                  NH 44 Krishnagiri · Est. 2006
                </span>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white border border-[#EAE2D5] flex items-center justify-center text-[#2C2018] active:scale-95 transition-transform cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col py-2" aria-label="Mobile Links">
              <a
                href="#home"
                className="flex items-center justify-between px-5 py-3.5 text-[#2C2018] hover:bg-[#FAF7F2] text-sm font-semibold border-b border-[#F3EDE4] transition-colors no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('storefront', '');
                }}
              >
                <span>Home</span>
                <span className="text-gray-400 text-lg leading-none">›</span>
              </a>

              <a
                href="#story"
                className="flex items-center justify-between px-5 py-3.5 text-[#2C2018] hover:bg-[#FAF7F2] text-sm font-semibold border-b border-[#F3EDE4] transition-colors no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('story', '#story');
                }}
              >
                <span>Our Heritage &amp; Story</span>
                <span className="text-gray-400 text-lg leading-none">›</span>
              </a>

              <a
                href="#menu"
                className="flex items-center justify-between px-5 py-3.5 bg-[#FAF4E8] text-[#1C130D] border-l-4 border-[#C59334] text-sm font-bold border-b border-[#F3EDE4] transition-colors no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('menu', '#menu');
                }}
              >
                <div>
                  <span className="block">Pre-Order Sweets</span>
                  <span className="block text-[11px] font-semibold text-[#A97922]">Zero-Wait Highway Pickup</span>
                </div>
                <span className="text-[#C59334] text-lg leading-none">›</span>
              </a>

              <a
                href="#contact"
                className="flex items-center justify-between px-5 py-3.5 text-[#2C2018] hover:bg-[#FAF7F2] text-sm font-semibold border-b border-[#F3EDE4] transition-colors no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('contact', '#contact');
                }}
              >
                <span>Contact &amp; Location</span>
                <span className="text-gray-400 text-lg leading-none">›</span>
              </a>
            </nav>

            {/* Highway Boutique Details Card Inside Drawer */}
            <div className="m-4 p-3.5 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">📍</span>
                <div>
                  <strong className="block text-[#1C130D] font-bold text-[12.5px]">Krishnagiri Highway Store</strong>
                  <p className="text-gray-600 text-[11px] m-0">Opp. HP Petrol Bunk, NH 44</p>
                </div>
              </div>
              <div className="text-gray-600 text-[11px] border-b border-dashed border-[#EAE2D5] pb-2">
                ⏰ Open Daily: 6:00 AM – 10:30 PM
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="tel:+919344893547"
                  className="inline-flex items-center justify-center py-2 px-2.5 rounded-full bg-white border border-[#EAE2D5] text-[#2C2018] font-bold text-[11px] no-underline active:scale-95 transition-transform"
                >
                  📞 Call Store
                </a>
                <a
                  href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20want%20to%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center py-2 px-2.5 rounded-full bg-[#25D366] text-white font-bold text-[11px] no-underline active:scale-95 transition-transform"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Bottom Full-Width CTA */}
            <div className="mt-auto p-4 border-t border-[#EAE2D5] bg-white sticky bottom-0">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white font-bold text-xs sm:text-sm text-center shadow-md active:scale-95 transition-transform border-0 cursor-pointer"
                onClick={() => handleNav('menu', '#menu')}
              >
                Pre-Order Sweets Online ↗
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
