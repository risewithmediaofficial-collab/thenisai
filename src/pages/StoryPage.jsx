import { useCart } from '../context/CartContext';

export default function StoryPage() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="thenisai-page">
      {/* Hero Banner Card */}
      <section className="thenisai-hero-wrap" style={{ marginTop: '24px' }}>
        <div className="thenisai-hero-card" style={{ minHeight: 'auto', gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="thenisai-hero-card__left" style={{ padding: '48px 40px' }}>
            <span className="thenisai-hero-card__script-tag">
              Two Decades of Confectionery Legacy
            </span>

            <h1 className="thenisai-hero-card__headline" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              HANDCRAFTED IN AUTHENTIC BRASS URULIS SINCE 2006.
            </h1>

            <p className="thenisai-hero-card__tagline">
              100% Pure Cow Milk · Continuous 4-Hour Gentle Flame Simmer · Zero Chemical Essences · NH 44 Krishnagiri
            </p>

            <button
              type="button"
              className="thenisai-hero-card__cta-btn"
              onClick={handlePreOrder}
            >
              <span>Pre-Order Sweets Online</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src="/images/products/sweets_platter_hero.jpg"
              alt="Thenisai Artisanal Sweets"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* 4 Pillars Card Grid */}
      <section className="thenisai-section" style={{ marginTop: '48px' }}>
        <div className="thenisai-section__title-center">
          <h2 className="thenisai-section__headline">OUR TIMELESS CRAFT</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          <div style={{
            background: 'var(--tint-blue-bg)',
            border: '1px solid var(--tint-blue-border)',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🥛</span>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              textTransform: 'uppercase',
              color: '#0E4770',
              margin: '0 0 8px 0',
            }}>
              100% PURE COW MILK
            </h3>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C0F08',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Fresh dawn farm collections with zero adulteration
            </span>
          </div>

          <div style={{
            background: 'var(--tint-rose-bg)',
            border: '1px solid var(--tint-rose-border)',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🍲</span>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              textTransform: 'uppercase',
              color: '#8E2B20',
              margin: '0 0 8px 0',
            }}>
              4-HR BRASS URULI SIMMER
            </h3>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C0F08',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Patient reduction over gentle flame for deep caramel note
            </span>
          </div>

          <div style={{
            background: 'var(--tint-teal-bg)',
            border: '1px solid var(--tint-teal-border)',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🌿</span>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              textTransform: 'uppercase',
              color: '#175446',
              margin: '0 0 8px 0',
            }}>
              ZERO CHEMICAL ESSENCES
            </h3>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C0F08',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Natural cardamom, pure desi ghee &amp; premium cashews
            </span>
          </div>

          <div style={{
            background: 'var(--tint-lavender-bg)',
            border: '1px solid var(--tint-lavender-border)',
            borderRadius: '20px',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🚗</span>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              textTransform: 'uppercase',
              color: '#4C2B7A',
              margin: '0 0 8px 0',
            }}>
              NH 44 HIGHWAY PITSTOP
            </h3>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C0F08',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Krishnagiri landmark opposite HP bunk since 2006
            </span>
          </div>
        </div>
      </section>

      {/* Heritage Statement Banner */}
      <section className="thenisai-heritage-banner" style={{ marginTop: '48px', marginBottom: '32px' }}>
        <div className="thenisai-heritage-banner__card">
          <div className="thenisai-heritage-banner__avatar">
            <img
              src="/images/products/sweets_assorted_real.jpg"
              alt="Thenisai Master Craftsman"
              loading="lazy"
            />
          </div>

          <h2 className="thenisai-heritage-banner__text">
            SWEETNESS IS AN HONEST ART. TASTE THE AUTHENTIC PURITY IN EVERY BATCH.
          </h2>

          <div className="thenisai-heritage-banner__badge" onClick={handlePreOrder} style={{ cursor: 'pointer' }}>
            <span className="thenisai-heritage-banner__badge-num">100%</span>
            <span className="thenisai-heritage-banner__badge-label">Pure Ghee</span>
          </div>
        </div>
      </section>
    </div>
  );
}
