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
    <>
      {/* SECTION 5: PROMOTIONAL CRIMSON BANNER ("MUNCH FOR MOODS") */}
      <section className="thenisai-munch-banner">
        <div className="thenisai-munch-card">
          <div className="thenisai-munch-card__content">
            <div className="thenisai-munch-card__stickers">
              <span className="thenisai-sticker">Crispy</span>
              <span className="thenisai-sticker thenisai-sticker--white">Tasty</span>
            </div>

            <h2 className="thenisai-munch-card__headline">
              MUNCH FOR MOODS. NOT JUST FOR CRAVINGS.
            </h2>

            <p className="thenisai-munch-card__tagline">
              You have enough to focus on. We&apos;ve got your highway snacks &amp; artisanal sweets.
            </p>

            <button
              type="button"
              className="thenisai-munch-card__btn"
              onClick={handlePreOrder}
            >
              <span>Shop Sweets</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          </div>

          <div className="thenisai-munch-card__media">
            <img
              src="/images/products/sweet_box.webp"
              alt="Thenisai Artisanal Sweets & Snacks"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
              }}
            />
          </div>
        </div>
      </section>

      {/* SECTION 6: FOREST GREEN LOCATION BANNER ("ONLY AT THENISAI NH 44") */}
      <section className="thenisai-location-banner">
        <div className="thenisai-location-card">
          <div className="thenisai-location-card__content">
            <span className="thenisai-location-card__eyebrow">
              HIGHWAY LANDMARK · NH 44
            </span>

            <h2 className="thenisai-location-card__title">
              FAMOUS NH 44 HIGHWAY STOREFRONT
            </h2>

            <p className="thenisai-location-card__desc">
              Opposite to HP Petrol Bunk, Nattamai Kottai, Krishnagiri · Open Daily 6:00 AM – 10:30 PM
            </p>

            <button
              type="button"
              className="thenisai-location-card__btn"
              onClick={handleMaps}
            >
              <span>Get Directions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </button>
          </div>

          <div className="thenisai-location-card__media">
            <img
              src="/images/products/sweets_platter_hero.jpg"
              alt="Thenisai Highway Storefront Krishnagiri"
              className="thenisai-location-card__img"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* SECTION 7: TRUST SEALS STRIP ("YOU CAN TRUST US") */}
      <section className="thenisai-trust-strip">
        <h3 className="thenisai-trust-strip__title">
          YOU CAN TRUST US: CLEAN, AUTHENTIC &amp; PURE
        </h3>

        <div className="thenisai-trust-badges">
          <span className="thenisai-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4AC36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            100% Pure Cow Milk
          </span>
          <span className="thenisai-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4AC36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Golden Desi Ghee
          </span>
          <span className="thenisai-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4AC36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            4-Hr Brass Uruli Simmer
          </span>
          <span className="thenisai-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4AC36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Zero Chemical Essences
          </span>
          <span className="thenisai-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4AC36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Fresh Daily Batches
          </span>
        </div>
      </section>

      {/* SECTION 8: "WHERE YOU CAN ENJOY" (3 CARDS) */}
      <section className="thenisai-destinations-strip">
        <div className="thenisai-destinations-grid">
          <div className="thenisai-destinations-title-box">
            <h3>WHERE YOU CAN ENJOY</h3>
          </div>

          <div className="thenisai-destinations-cards">
            <div className="thenisai-dest-card" onClick={handleContact} role="button" tabIndex={0}>
              <span className="thenisai-dest-card__icon">🚗</span>
              <h4 className="thenisai-dest-card__name">Highway Pitstop</h4>
              <span className="thenisai-dest-card__tag">NH 44 Krishnagiri</span>
            </div>

            <div className="thenisai-dest-card" onClick={handlePreOrder} role="button" tabIndex={0}>
              <span className="thenisai-dest-card__icon">🎁</span>
              <h4 className="thenisai-dest-card__name">Festive Gifting</h4>
              <span className="thenisai-dest-card__tag">Custom Sweet Boxes</span>
            </div>

            <div className="thenisai-dest-card" onClick={handlePreOrder} role="button" tabIndex={0}>
              <span className="thenisai-dest-card__icon">⚡</span>
              <h4 className="thenisai-dest-card__name">Zero-Wait Pickup</h4>
              <span className="thenisai-dest-card__tag">Instant Counter Handover</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: BRAND HERITAGE SYNONYMOUS CENTERPIECE (ONLY LOGO, NO RAW TEXT) */}
      <section className="thenisai-heritage-center">
        <div className="thenisai-heritage-center__logo">
          <img
            src="/images/branding/logo.webp"
            alt="Thenisai Sweets"
            style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'inline-block' }}
          />
        </div>

        <p className="thenisai-heritage-center__statement">
          ESTABLISHED IN 2006 IN KRISHNAGIRI, SYNONYMOUS WITH PREMIUM QUALITY SOUTH INDIAN CONFECTIONERY.
        </p>

        <div className="thenisai-heritage-steps">
          <div className="thenisai-heritage-step">
            <div className="thenisai-heritage-step__circle">🥛</div>
            <span className="thenisai-heritage-step__label">Farm Milk</span>
          </div>

          <span style={{ color: '#D4A843', fontSize: '20px' }}>&bull;&bull;&bull;</span>

          <div className="thenisai-heritage-step">
            <div className="thenisai-heritage-step__circle">🍲</div>
            <span className="thenisai-heritage-step__label">Brass Uruli</span>
          </div>

          <span style={{ color: '#D4A843', fontSize: '20px' }}>&bull;&bull;&bull;</span>

          <div className="thenisai-heritage-step">
            <div className="thenisai-heritage-step__circle">🍬</div>
            <span className="thenisai-heritage-step__label">Pure Sweets</span>
          </div>
        </div>
      </section>
    </>
  );
}
