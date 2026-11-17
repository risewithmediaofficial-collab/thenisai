import { useCart } from '../context/CartContext';

export default function StoryPage() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="ks-page">
      {/* 1. Header Banner (Kanti Sweets Style) */}
      <section style={{
        background: 'linear-gradient(135deg, #FFF9EE 0%, #FAF2E3 100%)',
        borderBottom: '1px solid var(--ks-border)',
        padding: 'clamp(36px, 5vw, 56px) 0',
      }}>
        <div className="ks-container">
          <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '6px' }}>
            ESTD. 2006 · BANGALORE–SALEM HIGHWAY (NH 44)
          </span>
          <h1 style={{
            fontFamily: 'var(--ks-font-serif)',
            fontSize: 'clamp(30px, 4vw, 48px)',
            fontWeight: 700,
            color: 'var(--ks-charcoal)',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
          }}>
            The Art of Pure Milk Confectionery
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--ks-muted)',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.6,
          }}>
            Two decades of unhurried craftsmanship on the Krishnagiri highway corridor. Simmered in authentic heavy bell-metal brass urulis with 100% farm-fresh cow milk.
          </p>
        </div>
      </section>

      {/* 2. Visual Story Showcase */}
      <section className="ks-section">
        <div className="ks-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '40px',
            marginBottom: '48px',
          }}>
            <div>
              <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '4px' }}>
                Simmered with Patience
              </span>
              <h2 style={{
                fontFamily: 'var(--ks-font-serif)',
                fontSize: 'clamp(26px, 3.2vw, 36px)',
                fontWeight: 700,
                color: 'var(--ks-charcoal)',
                margin: '0 0 16px 0',
                lineHeight: 1.2,
              }}>
                Four Hours of Continuous Gentle Flame
              </h2>
              <p style={{
                fontSize: '14.5px',
                color: 'var(--ks-text)',
                lineHeight: 1.7,
                margin: '0 0 16px 0',
              }}>
                Every single morning before dawn breaks over Krishnagiri, farm-fresh milk arrives directly from local dairies. In our traditional workshop, master sweet-makers begin the unhurried reduction in heavy brass urulis, gently stirring for over 4 continuous hours until the milk naturally thickens and caramelizes into legendary Thenisai Palkova.
              </p>
              <p style={{
                fontSize: '14.5px',
                color: 'var(--ks-text)',
                lineHeight: 1.7,
                margin: '0 0 24px 0',
              }}>
                We never use milk powder, artificial thickeners, or chemical essences. Sweetness at Thenisai remains an honest craft, just as it was when we welcomed our very first highway commuter in 2006.
              </p>

              <button
                type="button"
                className="ks-hero__btn-primary"
                onClick={handlePreOrder}
              >
                <span>Pre-Order Fresh Batches</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <img
                src="/images/products/sweets_platter_hero.jpg"
                alt="Thenisai Artisanal Tradition"
                style={{
                  width: '100%',
                  height: '380px',
                  objectFit: 'cover',
                  borderRadius: 'var(--ks-radius-md)',
                  boxShadow: 'var(--ks-card-hover)',
                  border: '3px solid #FFFFFF',
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* 3. 4 Timeless Pillars Grid */}
          <div className="ks-trust-strip" style={{ marginTop: '32px' }}>
            <div className="ks-trust-card">
              <span className="ks-trust-card__icon">🥛</span>
              <div>
                <h4 className="ks-trust-card__title">100% Farm Milk</h4>
                <p className="ks-trust-card__desc">Pure cow milk direct from local farms</p>
              </div>
            </div>

            <div className="ks-trust-card">
              <span className="ks-trust-card__icon">🍲</span>
              <div>
                <h4 className="ks-trust-card__title">Brass Uruli Simmer</h4>
                <p className="ks-trust-card__desc">4-hour unhurried traditional reduction</p>
              </div>
            </div>

            <div className="ks-trust-card">
              <span className="ks-trust-card__icon">🌿</span>
              <div>
                <h4 className="ks-trust-card__title">Zero Preservatives</h4>
                <p className="ks-trust-card__desc">Natural pure ghee and aromatic spices</p>
              </div>
            </div>

            <div className="ks-trust-card">
              <span className="ks-trust-card__icon">🚗</span>
              <div>
                <h4 className="ks-trust-card__title">Highway Heritage</h4>
                <p className="ks-trust-card__desc">Beloved NH 44 landmark since 2006</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
