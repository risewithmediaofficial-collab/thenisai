import { useCart } from '../../context/CartContext';

export default function Footer() {
  const { navigateTo } = useCart();

  const handleNav = (view, hash = '') => {
    if (hash) {
      window.location.hash = hash;
    } else {
      window.location.hash = '';
    }
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="ks-footer">
      <div className="ks-container">
        <div className="ks-footer__top">
          {/* Col 1: Brand Logo & Tagline */}
          <div className="ks-footer__brand-col">
            <div
              className="ks-footer__logo-wrap"
              onClick={() => handleNav('storefront', '')}
              title="Thenisai Sweets"
            >
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets Logo"
                className="ks-footer__logo"
                onError={(e) => {
                  e.currentTarget.src = '/images/branding/logo-icon.png';
                }}
              />
            </div>

            <span className="font-script ks-footer__tagline">
              The Art of Pure Milk Confectionery &middot; Est. 2006
            </span>

            <p className="ks-footer__desc">
              Authentic 100% pure cow milk sweets and savouries simmered in traditional brass urulis on the Bangalore–Salem Highway (NH 44), Krishnagiri.
            </p>
          </div>

          {/* Col 2: Customer Pages */}
          <div>
            <h4 className="ks-footer__col-title">Customer Pages</h4>
            <div className="ks-footer__links-list">
              <a href="#home" className="ks-footer__link" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
              <a href="#menu" className="ks-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Pre-Order Sweets</a>
              <a href="#story" className="ks-footer__link" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our Story &amp; Heritage</a>
              <a href="#contact" className="ks-footer__link" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Visit &amp; Bulk Orders</a>
            </div>
          </div>

          {/* Col 3: Highway Boutique */}
          <div>
            <h4 className="ks-footer__col-title">Highway Boutique</h4>
            <div className="ks-footer__links-list">
              <span className="ks-footer__info-text">NH 44 Highway Pitstop</span>
              <span className="ks-footer__info-text">Near HP Petrol Bunk</span>
              <span className="ks-footer__info-text">Nattamai Kottai</span>
              <span className="ks-footer__info-text">Krishnagiri &ndash; 635001</span>
              <span className="ks-footer__highlight-text">
                ⏰ 6:00 AM &ndash; 10:30 PM Daily
              </span>
              <span className="ks-footer__highlight-text">
                📞 +91 93448 93547
              </span>
            </div>
          </div>

          {/* Col 4: Staff Portal */}
          <div>
            <h4 className="ks-footer__col-title">Staff Portal</h4>
            <div className="ks-footer__links-list">
              <a
                href="#admin"
                className="ks-footer__link"
                onClick={(e) => { e.preventDefault(); handleNav('admin', '#admin'); }}
              >
                Admin Dashboard
              </a>
              <a
                href="#billing"
                className="ks-footer__link"
                onClick={(e) => { e.preventDefault(); handleNav('billing', '#billing'); }}
              >
                POS Billing Counter
              </a>
              <a
                href="#manager"
                className="ks-footer__link"
                onClick={(e) => { e.preventDefault(); handleNav('manager', '#manager'); }}
              >
                Stock Manager
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="ks-footer__bottom">
          <span>&copy; 2006&ndash;2026 Thenisai Palkova &amp; Sweets. Handcrafted in Tamil Nadu.</span>
          <div className="ks-footer__social-links">
            <a href="https://instagram.com/thenisai_sweets" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span>&middot;</span>
            <a href="https://facebook.com/thenisaisweets" target="_blank" rel="noopener noreferrer">Facebook</a>
            <span>&middot;</span>
            <a href="https://wa.me/919344893547" target="_blank" rel="noopener noreferrer">WhatsApp Order</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
