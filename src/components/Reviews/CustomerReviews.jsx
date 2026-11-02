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
      featured: true, // Featured card in deep espresso with gold stars
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
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '44px' }}>
          <div className="stardust-pill-badge font-lato">
            <span>★ 4.9 · rated by 500+ happy customers</span>
          </div>

          <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', marginTop: '6px' }}>
            Stories of Sweetness
          </span>

          <h2 className="stardust-section__title font-garamond" style={{ marginTop: '2px' }}>
            What Our Customers Say
          </h2>

          <p className="stardust-section__sub font-lato" style={{ maxWidth: '520px', margin: '8px auto 0' }}>
            Real stories from travelers and families who have made Thenisai a part of their journeys and celebrations.
          </p>
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
                  <h4 className="stardust-review-card__name">{rev.name}</h4>
                  <span className="stardust-review-card__badge">{rev.role}</span>
                </div>
              </div>

              {/* Quote Body */}
              <p className="stardust-review-card__quote">
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
