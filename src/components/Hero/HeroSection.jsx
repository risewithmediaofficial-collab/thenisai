import { useCart } from '../../context/CartContext';

export default function HeroSection() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStory = () => {
    window.location.hash = '#story';
    navigateTo('story');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const slices = [
    { name: 'Palkova', img: '/images/products/palkova_card.webp' },
    { name: 'Mysore Pak', img: '/images/products/mysore_pak.webp' },
    { name: 'Kaju Katli', img: '/images/products/kaju_katli_real.jpg' },
    { name: 'Kara Boondi', img: '/images/products/savories_boondi_real.jpg' },
    { name: 'Jangiri', img: '/images/products/jangiri_real.jpg' },
  ];

  return (
    <>
      {/* SECTION 1: HERO CARD (YELLOW BLOCK + MULTI-SLICE FOOD GALLERY) */}
      <section id="hero" className="thenisai-hero-wrap">
        <div className="thenisai-hero-card">
          {/* Left Block: Bold Typography & Action Button */}
          <div className="thenisai-hero-card__left">
            <span className="thenisai-hero-card__script-tag">
              Signature Krishnagiri Palkova
            </span>

            <h1 className="thenisai-hero-card__headline">
              TASTE THE FLAVOURFUL DIFFERENCE!
            </h1>

            <p className="thenisai-hero-card__tagline">
              100% farm-fresh cow milk simmered for 4 hours in heavy brass urulis. Fresh daily morning batches on NH 44 Krishnagiri.
            </p>

            <button
              type="button"
              className="thenisai-hero-card__cta-btn"
              onClick={handlePreOrder}
            >
              <span>Pre-Order Online</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          </div>

          {/* Right Block: Vertical Multi-Slice Food Gallery */}
          <div className="thenisai-hero-card__right" onClick={handlePreOrder} role="button" tabIndex={0} title="Click to view menu & pre-order">
            {slices.map((slice) => (
              <div key={slice.name} className="thenisai-hero-slice">
                <img
                  src={slice.img}
                  alt={slice.name}
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                  }}
                />
                <span className="thenisai-hero-slice__label">{slice.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: HERITAGE & INDULGENCE STATEMENT BANNER */}
      <section className="thenisai-heritage-banner">
        <div className="thenisai-heritage-banner__card">
          <div className="thenisai-heritage-banner__avatar">
            <img
              src="/images/products/sweets_platter_hero.jpg"
              alt="Thenisai Master Craftsman"
              loading="lazy"
            />
          </div>

          <h2 className="thenisai-heritage-banner__text">
            INDULGE YOUR TASTE BUDS IN THE DELIGHTFUL WORLD OF THENISAI, WHERE TRADITION MEETS FLAVOR.
          </h2>

          <div className="thenisai-heritage-banner__badge" onClick={handleStory} style={{ cursor: 'pointer' }}>
            <span className="thenisai-heritage-banner__badge-num">2006</span>
            <span className="thenisai-heritage-banner__badge-label">Est. NH 44</span>
          </div>
        </div>
      </section>
    </>
  );
}
