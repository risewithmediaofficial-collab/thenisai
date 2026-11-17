import { useCart } from '../../context/CartContext';

export default function ValuesSection() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContact = () => {
    window.location.hash = '#contact';
    navigateTo('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMaps = () => {
    window.open('https://maps.google.com/?q=Thenisai+Palkova+and+Sweets+Krishnagiri', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="ks-section" style={{ paddingTop: 0 }}>
      <div className="ks-container">
        {/* 1. LUXURY FESTIVE & WEDDING GIFTING BANNER */}
        <div id="gifting-banner" className="ks-gifting-banner">
          <div className="ks-gifting-banner__content">
            <span className="ks-gifting-banner__sub">
              Festive Gifting &amp; Bulk Celebrations
            </span>
            <h2 className="ks-gifting-banner__title">
              Make Every Celebration Sweeter
            </h2>
            <p className="ks-gifting-banner__desc">
              Curated sweet boxes and gift hampers for weddings, family functions, and corporate gifting. Custom sweet assortments prepared fresh and boxed in royal packaging.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ks-gifting-banner__btn"
                onClick={handlePreOrder}
              >
                <span>Explore Gift Boxes</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <a
                href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20would%20like%20to%20inquire%20about%20Bulk%20Wedding%20Sweet%20Boxes"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.3)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Bulk Wedding Inquiry</span>
              </a>
            </div>
          </div>

          <div className="ks-gifting-banner__media">
            <img
              src="/images/products/sweet_box.webp"
              alt="Thenisai Luxury Sweet Hampers"
              className="ks-gifting-banner__img"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
              }}
            />
          </div>
        </div>

        {/* 2. HIGHWAY STORE LOCATOR & VISIT CARD */}
        <div className="ks-store-section" style={{ marginTop: '48px' }}>
          <div className="ks-store-info">
            <span className="ks-store-info__eyebrow">Highway Pitstop Experience</span>
            <h3 className="ks-store-info__title">Visit Our Krishnagiri Boutique</h3>

            {/* Professionally Aligned Reduced Content Specs */}
            <div className="ks-store-specs">
              <div className="ks-store-spec-item">
                <span className="ks-store-spec-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div className="ks-store-spec-text">
                  <span className="ks-store-spec-label">Address</span>
                  <span className="ks-store-spec-val">Opp. HP Petrol Bunk, Bangalore–Salem Highway (NH 44), Krishnagiri</span>
                </div>
              </div>

              <div className="ks-store-spec-item">
                <span className="ks-store-spec-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div className="ks-store-spec-text">
                  <span className="ks-store-spec-label">Hours</span>
                  <span className="ks-store-spec-val">Daily 6:00 AM &ndash; 10:30 PM &middot; Fresh morning batches ready by 7:30 AM</span>
                </div>
              </div>

              <div className="ks-store-spec-item">
                <span className="ks-store-spec-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <div className="ks-store-spec-text">
                  <span className="ks-store-spec-label">Direct Desk</span>
                  <span className="ks-store-spec-val">+91 93448 93547 &middot; Counter Pickup &amp; WhatsApp Support</span>
                </div>
              </div>
            </div>

            <div className="ks-store-actions">
              <button
                type="button"
                className="ks-hero__btn-primary"
                onClick={handleMaps}
              >
                <span>Open in Google Maps</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>

              <button
                type="button"
                className="ks-hero__btn-secondary"
                onClick={handleContact}
              >
                <span>Store Details &amp; Contact</span>
              </button>
            </div>
          </div>

          <div className="ks-store-media">
            <img
              src="/images/products/sweets_platter_hero.jpg"
              alt="Thenisai Sweets Storefront"
              className="ks-store-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
