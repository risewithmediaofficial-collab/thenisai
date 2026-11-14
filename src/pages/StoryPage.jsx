import { useCart } from '../context/CartContext';

export default function StoryPage() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="stardust-page stardust-page--story">
      {/* Hero Banner with Clean Taglines */}
      <section className="stardust-story-hero">
        <div className="stardust-container">
          <span className="stardust-story-tag font-lato">EST. 2006 · KRISHNAGIRI · NH 44 HIGHWAY</span>
          <span className="font-script" style={{ fontSize: '42px', color: '#E8C06A', display: 'block', marginBottom: '8px' }}>
            The Art of Pure Milk Confectionery
          </span>
          <h1 className="stardust-story-title font-garamond" style={{ marginBottom: '8px' }}>
            Handcrafted in Authentic Brass Urulis
          </h1>
          <p className="font-garamond italic" style={{ fontSize: '20px', color: '#E8C06A', margin: '8px 0 0' }}>
            Two Decades of Artisanal Tradition on NH 44
          </p>
        </div>
      </section>

      {/* Main Story Content */}
      <section className="stardust-section stardust-section--story-body">
        <div className="stardust-container">
          {/* Two-Column Grid: Real Image & Heritage Highlights */}
          <div className="stardust-story-grid">
            <div className="stardust-story-visual">
              <div className="stardust-story-frame">
                <img
                  src="/images/products/sweets_platter_hero.jpg?v=2"
                  alt="Thenisai Traditional Sweets Platter"
                  className="stardust-story__img"
                  loading="lazy"
                />
                <div className="stardust-story__img-caption font-lato">
                  <span>Slow-simmered in heavy bell-metal brass urulis since 2006</span>
                </div>
              </div>
            </div>

            <div className="stardust-story-content font-lato">
              <span className="stardust-pill-badge">Traditional Uruli Method</span>
              <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', marginTop: '10px' }}>
                Simmered with Patience
              </span>
              <h2 className="stardust-section__title font-garamond" style={{ marginTop: '2px', marginBottom: '14px' }}>
                Four Hours of Continuous Gentle Flame
              </h2>

              <span className="font-garamond italic" style={{ fontSize: '20px', color: '#8C5A2B', display: 'block', marginBottom: '28px', lineHeight: 1.4 }}>
                100% Farm-Fresh Cow Milk · Heavy Bell-Metal Brass Urulis · Zero Preservatives
              </span>

              {/* 3 Heritage Highlights */}
              <div className="stardust-story-highlights">
                <div className="stardust-story-highlight-card">
                  <span className="stardust-highlight-num font-garamond">100%</span>
                  <span className="stardust-highlight-label">Pure Cow Milk</span>
                </div>
                <div className="stardust-story-highlight-card">
                  <span className="stardust-highlight-num font-garamond">4+ Hrs</span>
                  <span className="stardust-highlight-label">Patient Simmer</span>
                </div>
                <div className="stardust-story-highlight-card">
                  <span className="stardust-highlight-num font-garamond">20 Yrs</span>
                  <span className="stardust-highlight-label">Highway Heritage</span>
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop: '36px' }}>
                <button
                  type="button"
                  className="stardust-btn stardust-btn--primary"
                  onClick={handlePreOrder}
                >
                  <span>Pre-Order Sweets Online</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
