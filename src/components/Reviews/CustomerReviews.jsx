const REVIEWS = [
  {
    id: 1,
    name: 'Anitha & Karthik',
    role: 'Bangalore Commuters',
    quote: 'The Palkova tasted just like what my grandmother made in heavy brass urulis. Pure nostalgia in every single bite.',
    stars: 5,
  },
  {
    id: 2,
    name: 'Suresh Kumar',
    role: 'Highway Traveller',
    quote: 'Mandatory pitstop on our Bangalore–Salem highway trip. Fresh hot Palkova and Ghee Mysore Pak are simply unbeatable.',
    stars: 5,
  },
  {
    id: 3,
    name: 'Priya Ramesh',
    role: 'Wedding Gift Order',
    quote: 'Ordered 150 festive assorted sweet boxes for our family wedding. Outstanding pure ghee aroma and great packing.',
    stars: 5,
  },
];

export default function CustomerReviews() {
  return (
    <section className="ks-section ks-section--soft">
      <div className="ks-container">
        <div className="ks-section-header">
          <span className="ks-section-header__sub">
            Customer Reviews
          </span>
          <h2 className="ks-section-header__title">
            What Customers Say About Thenisai
          </h2>
        </div>

        <div className="ks-reviews-grid">
          {REVIEWS.map((rev) => (
            <div key={rev.id} className="ks-review-card">
              <div>
                <div className="ks-review-stars">
                  {'★'.repeat(rev.stars)}
                </div>
                <p className="ks-review-quote">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="ks-review-author">
                <div className="ks-review-avatar">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="ks-review-name">{rev.name}</h4>
                  <span className="ks-review-role">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
