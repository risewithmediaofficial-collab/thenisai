import { useCart } from '../../context/CartContext';

export default function Footer() {
  const { navigateTo } = useCart();

  const handleNav = (view, hash) => {
    window.location.hash = hash;
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="thenisai-footer">
      <div className="thenisai-footer__inner">
        <div className="thenisai-footer__top">
          {/* Brand Col: ONLY LOGO (No raw text) */}
          <div>
            <div
              style={{ marginBottom: '12px', cursor: 'pointer' }}
              onClick={() => handleNav('storefront', '')}
              title="Thenisai Sweets"
            >
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets"
                className="thenisai-footer__logo-img"
              />
            </div>

            <p className="thenisai-footer__brand-sub">
              Authentic Pure Cow Milk Confectionery &amp; Savories.<br />
              Simmered in brass urulis on NH 44 Krishnagiri since 2006.
            </p>

            <div style={{ display: 'flex', gap: '14px', marginTop: '18px' }}>
              <a
                href="https://instagram.com/thenisai_sweets"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1C0F08',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                }}
              >
                Instagram ↗
              </a>
              <span style={{ opacity: 0.4 }}>·</span>
              <a
                href="https://wa.me/919344893547"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1C0F08',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                }}
              >
                WhatsApp ↗
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="thenisai-footer__links-grid">
            <div>
              <h4 className="thenisai-footer__col-title">Customer Pages</h4>
              <div className="thenisai-footer__links-list">
                <a href="#home" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
                <a href="#menu" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Pre-Order Online</a>
                <a href="#story" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our 20-Year Legacy</a>
                <a href="#contact" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Highway Store &amp; Bulk</a>
              </div>
            </div>

            <div>
              <h4 className="thenisai-footer__col-title">Signature Sweets</h4>
              <div className="thenisai-footer__links-list">
                <a href="#menu" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Krishnagiri Palkova</a>
                <a href="#menu" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Royal Mysore Pak</a>
                <a href="#menu" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Silken Kaju Katli</a>
                <a href="#menu" className="thenisai-footer__link" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Crispy Kara Boondi</a>
              </div>
            </div>

            <div>
              <h4 className="thenisai-footer__col-title">Highway Boutique</h4>
              <div className="thenisai-footer__links-list">
                <span className="thenisai-footer__link" style={{ pointerEvents: 'none' }}>NH 44 Highway Pitstop</span>
                <span className="thenisai-footer__link" style={{ pointerEvents: 'none' }}>Near HP Petrol Bunk</span>
                <span className="thenisai-footer__link" style={{ pointerEvents: 'none' }}>Krishnagiri - 635001</span>
                <span className="thenisai-footer__link" style={{ fontWeight: 800, marginTop: '4px', pointerEvents: 'none' }}>⏰ 6:00 AM – 10:30 PM Daily</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="thenisai-footer__bottom">
          <span>&copy; 2006–2026 Handcrafted in Krishnagiri, Tamil Nadu.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a
              href="#admin"
              onClick={(e) => { e.preventDefault(); navigateTo('admin'); }}
              style={{ color: '#1C0F08', textDecoration: 'none', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}
            >
              Admin Portal
            </a>
            <span style={{ opacity: 0.4 }}>·</span>
            <a
              href="#billing"
              onClick={(e) => { e.preventDefault(); navigateTo('billing'); }}
              style={{ color: '#1C0F08', textDecoration: 'none', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}
            >
              POS Billing
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
