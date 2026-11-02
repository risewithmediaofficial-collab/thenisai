export default function ValuesSection() {
  const values = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93A10 10 0 0 0 12 2z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: '100% Pure Cow Milk',
      desc: 'Collected fresh daily at dawn from local grass-fed herds across Krishnagiri.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
      title: 'Heavy Brass Urulis',
      desc: 'Patiently slow-simmered for 4+ hours in authentic bell-metal brass urulis.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      title: 'Zero Chemical Essences',
      desc: 'Free from artificial flavors, preservatives, and commercial milk powders.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
      title: 'NH 44 Highway Heritage',
      desc: 'Serving thousands of travelers between Bangalore, Salem, and Tamil Nadu since 2006.',
    },
  ];

  return (
    <section id="values" className="stardust-section stardust-section--values">
      <div className="stardust-container">
        <div className="stardust-values__grid">
          {/* Left Column: Real Assorted Sweets Image Frame */}
          <div className="stardust-values__media">
            <div className="stardust-values__img-frame">
              <img
                src="/images/products/sweets_assorted_real.jpg"
                alt="Thenisai Artisanal Sweets Craft"
                className="stardust-values__img"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                }}
              />
              <div className="stardust-values__tag-badge font-lato">
                <span>Traditional Slow Simmer</span>
              </div>
            </div>
          </div>

          {/* Right Column: Values Headline & 4 Pillars with Unique Detailing */}
          <div className="stardust-values__content">
            <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', lineHeight: 1, marginBottom: '6px' }}>
              Pure &amp; Natural Heritage
            </span>

            <h2 className="stardust-section__title font-garamond">
              The Timeless Values Behind<br />
              Every Uruli Batch
            </h2>

            <p className="stardust-section__sub font-lato" style={{ maxWidth: '520px', marginTop: '12px' }}>
              For 20 years, we have preserved the patient art of slow reduction over gentle fire, honoring true South Indian sweet making with zero artificial additives.
            </p>

            <div className="stardust-values__list">
              {values.map((v) => (
                <div key={v.title} className="stardust-value-card font-lato">
                  <div className="stardust-value-card__icon">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="stardust-value-card__title font-garamond">{v.title}</h3>
                    <p className="stardust-value-card__desc">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
