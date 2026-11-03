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

  const scrollToBestsellers = () => {
    const el = document.querySelector('#bestsellers');
    if (el) {
      if (window.__lenis) {
        window.__lenis.scrollTo('#bestsellers', { offset: -20, duration: 0.9 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="hero" className="stardust-hero">
      <div className="stardust-hero__container">
        <div className="stardust-hero__grid">
          {/* Left Column: Typography & CTAs with Exact Font Pairings */}
          <div className="stardust-hero__content">
            <span className="stardust-hero__tag font-lato">
              EST. 2006 · BANGALORE–SALEM HIGHWAY (NH 44) · KRISHNAGIRI
            </span>

            <h1 className="stardust-hero__title font-garamond">
              Thenisai Sweets
              <span className="stardust-hero__script font-script">
                The Art of Pure Milk Confectionery
              </span>
            </h1>

            {/* Unique Shop Detailing Pills */}
            <div className="stardust-hero__pills font-lato" style={{ marginTop: '16px', marginBottom: '24px' }}>
              <span className="stardust-hero__pill">● 100% Pure Cow Milk</span>
              <span className="stardust-hero__pill">● 4-Hr Brass Uruli Simmer</span>
              <span className="stardust-hero__pill">● Zero Chemical Essences</span>
              <span className="stardust-hero__pill">● Zero-Wait Counter Pickup</span>
            </div>

            <div className="stardust-hero__buttons font-lato">
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

              <button
                type="button"
                className="stardust-btn stardust-btn--outline-light"
                onClick={handleStory}
              >
                <span>Our 20-Year Heritage</span>
              </button>
            </div>

            {/* Scroll Indicator */}
            <div
              className="stardust-hero__scroll font-lato"
              onClick={scrollToBestsellers}
              role="button"
              tabIndex={0}
            >
              <div className="stardust-hero__mouse-icon">
                <span className="stardust-hero__mouse-wheel" />
              </div>
              <span>Scroll to explore confectionery</span>
            </div>
          </div>

          {/* Right Column: Real Sweets Platter Image from Provided Assets */}
          <div className="stardust-hero__media">
            <div className="stardust-hero__platter-wrap">
              <img
                src="/images/products/sweets_platter_hero.jpg"
                alt="Thenisai Traditional Sweets Platter"
                className="stardust-hero__platter-img"
                loading="eager"
              />
              <div className="stardust-hero__platter-badge font-lato">
                <span>⭐ Fresh Morning Batch · NH 44</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
