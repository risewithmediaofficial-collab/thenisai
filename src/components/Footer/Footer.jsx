import { useCart } from '../../context/CartContext';

export default function Footer() {
  const { navigateTo } = useCart();

  const handleNav = (view, hash) => {
    window.location.hash = hash;
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="stardust-footer font-lato">
      <div className="stardust-container">
        {/* Massive Brand Watermark */}
        <div className="stardust-footer__watermark font-garamond" aria-hidden="true">
          Thenisai
        </div>

        {/* Footer Top Links */}
        <div className="stardust-footer__top">
          <div className="stardust-footer__brand">
            <span
              className="stardust-footer__logo font-garamond"
              style={{ cursor: 'pointer' }}
              onClick={() => handleNav('storefront', '')}
            >
              Thenisai
            </span>
            <p className="stardust-footer__tagline">
              Handcrafted traditional confectionery from Krishnagiri, Tamil Nadu. Pure cow milk and country ghee since 2006. Pre-order online for zero waiting time on NH 44.
            </p>
          </div>

          <div className="stardust-footer__links-group">
            <div className="stardust-footer__col">
              <span className="stardust-footer__col-title">Customer Pages</span>
              <a href="#home" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
              <a href="#menu" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Pre-Order Sweets</a>
              <a href="#story" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our Story &amp; Heritage</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Visit &amp; Bulk Orders</a>
            </div>

            <div className="stardust-footer__col">
              <span className="stardust-footer__col-title">Highway Boutique</span>
              <span>NH 44 Highway Pitstop</span>
              <span>Near HP Petrol Bunk</span>
              <span>Nattamai Kottai</span>
              <span>Krishnagiri - 635001</span>
              <span style={{ color: '#8EC4A5', marginTop: '4px' }}>⏰ 6:00 AM &ndash; 10:30 PM Daily</span>
            </div>

            <div className="stardust-footer__col">
              <span className="stardust-footer__col-title">Staff Portal</span>
              <a href="#admin" onClick={() => navigateTo('admin')}>Admin Dashboard</a>
              <a href="#billing" onClick={() => navigateTo('billing')}>POS Billing Counter</a>
              <a href="#manager" onClick={() => navigateTo('manager')}>Stock Manager</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="stardust-footer__bottom">
          <span>&copy; 2006&ndash;2026 Thenisai Palkova &amp; Sweets. Handcrafted in Tamil Nadu.</span>
          <div className="stardust-footer__social">
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
