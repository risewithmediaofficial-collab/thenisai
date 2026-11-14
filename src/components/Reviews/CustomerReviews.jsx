import { useState } from 'react';

const REVIEWS = [
  {
    id: 1,
    name: 'Anitha & Karthik',
    role: 'Bangalore Commuters',
    quote: 'The Palkova tasted just like my grandmother made in heavy brass urulis. Pure nostalgia in every single bite.',
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
  {
    id: 4,
    name: 'Vikram Sundaram',
    role: 'Weekly Regular',
    quote: 'Melt-in-mouth Kaju Katli and crispy Kara Boondi. Exceptional hygiene, clean restrooms, and fast counter service.',
    stars: 5,
  },
];

export default function CustomerReviews() {
  const [scrollIndex, setScrollIndex] = useState(0);

  const handleNext = () => {
    setScrollIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const handlePrev = () => {
    setScrollIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  return (
    <section className="thenisai-reviews-banner">
      <div className="thenisai-reviews-card">
        <div className="thenisai-reviews-card__header">
          <h2 className="thenisai-reviews-card__title">CUSTOMER REVIEWS</h2>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="thenisai-round-arrow-btn"
              onClick={handlePrev}
              aria-label="Previous review"
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF' }}
            >
              ‹
            </button>
            <button
              type="button"
              className="thenisai-round-arrow-btn"
              onClick={handleNext}
              aria-label="Next review"
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF' }}
            >
              ›
            </button>
          </div>
        </div>

        <div className="thenisai-reviews-grid">
          {REVIEWS.map((rev) => (
            <div key={rev.id} className="thenisai-bubble-col">
              <div className="thenisai-speech-bubble">
                <div className="thenisai-bubble-stars">
                  {'★'.repeat(rev.stars)}
                </div>
                <p className="thenisai-bubble-quote">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="thenisai-bubble-author">
                <h4 className="thenisai-bubble-author__name">{rev.name}</h4>
                <span className="thenisai-bubble-author__role">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
