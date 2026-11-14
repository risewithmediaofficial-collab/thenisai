export default function CustomerReviews() {
  const reviews = [
    {
      id: 1,
      name: 'Anitha & Karthik',
      role: 'Verified Customer',
      quote: 'The Palkova tasted just like my grandmother used to make in brass urulis. Pure nostalgia in every single bite.',
      stars: 5,
      date: '08/10/2026',
      featured: false,
    },
    {
      id: 2,
      name: 'Suresh Kumar',
      role: 'NH 44 Highway Commuter',
      quote: 'We always stop at Krishnagiri on our Bangalore–Salem drive. The fresh hot Palkova and Ghee Mysore Pak are simply unbeatable.',
      stars: 5,
      date: '09/01/2026',
      featured: true,
    },
    {
      id: 3,
      name: 'Priya & Ramesh',
      role: 'Wedding Gift Order',
      quote: 'Ordered festive sweet boxes for our family wedding. Outstanding quality, authentic pure ghee freshness, and great packing.',
      stars: 5,
      date: '08/25/2026',
      featured: false,
    },
  ];

  return (
    <section className="stardust-section stardust-section--reviews">
      <div className="stardust-container">
        {/* Header with Refined Typography */}
        <div className="text-center" style={{ marginBottom: '36px' }}>
          <div className="stardust-pill-badge font-lato">
            <span>★ 4.9 · rated by 500+ happy customers</span>
          </div>

          <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', marginTop: '6px' }}>
            Stories of Sweetness
          </span>

          <h2 className="stardust-section__title font-garamond" style={{ marginTop: '2px', marginBottom: 0 }}>
            What Our Customers Say
          </h2>
        </div>

        {/* 3 Review Cards */}
        <div className="stardust-reviews__grid font-lato">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`stardust-review-card ${rev.featured ? 'stardust-review-card--featured' : ''}`}
            >
              {/* Header: User & Rating */}
              <div className="stardust-review-card__user">
                <div className="stardust-review-card__avatar">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="stardust-review-card__name font-garamond" style={{ fontSize: '18px' }}>{rev.name}</h4>
                  <span className="stardust-review-card__badge">{rev.role}</span>
                </div>
              </div>

              {/* Quote Body */}
              <p className="stardust-review-card__quote font-garamond" style={{ fontSize: '16px', fontStyle: 'italic', color: rev.featured ? '#FAF5EB' : '#4A3B32' }}>
                &ldquo;{rev.quote}&rdquo;
              </p>

              {/* Footer */}
              <div className="stardust-review-card__footer">
                <div className="stardust-review-card__stars">
                  {'★'.repeat(rev.stars)}
                </div>
                <span className="stardust-review-card__date">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
