import { useCart } from '../../context/CartContext';

export default function HeroSection() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGifting = () => {
    const el = document.getElementById('gifting-banner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#collection';
      navigateTo('storefront');
    }
  };

  return (
    <section className="ks-hero">
      <div className="ks-container">
        <div className="ks-hero__grid">
          {/* Left Column: Headline & Action Buttons */}
          <div className="ks-hero__content">
            <span className="ks-hero__kicker">
              Krishnagiri Landmark · Bangalore–Salem Highway (NH 44)
            </span>

            <h1 className="ks-hero__title">
              Authentic Sweets &amp; Bakes, Handcrafted Fresh Daily
            </h1>

            <p className="ks-hero__desc">
              From slow-simmered Krishnagiri Palkova made with 100% pure cow milk to rich ghee Mysore Pak and crispy highway savouries — prepared in traditional brass urulis for travellers and celebrations.
            </p>

            <div className="ks-hero__actions">
              <button
                type="button"
                className="ks-hero__btn-primary"
                onClick={handlePreOrder}
              >
                <span>Pre-Order for Pickup</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>

              <button
                type="button"
                className="ks-hero__btn-secondary"
                onClick={handleGifting}
              >
                <span>Festive Sweet Boxes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean Food Photography */}
          <div className="ks-hero__media">
            <div className="ks-hero__img-frame">
              <img
                src="/images/products/sweets_platter_hero.jpg"
                alt="Thenisai Artisanal Sweets Platter"
                className="ks-hero__img"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
