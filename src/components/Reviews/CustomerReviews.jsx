import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const reviews = [
  {
    id: 1,
    quote: 'The best authentic Palkova in Krishnagiri. Rich, fresh cow milk aroma and perfect sweetness.',
    author: 'Anitha S.',
    location: 'Krishnagiri Town',
  },
  {
    id: 2,
    quote: 'Our mandatory pitstop on the Bangalore–Salem Highway (NH 44). The warm Palkova and Ghee Mysore Pak are unbeatable.',
    author: 'Suresh Kumar',
    location: 'NH 44 Highway Commuter',
  },
  {
    id: 3,
    quote: 'Just like traditional village brass-uruli Palkova. Fresh morning batches right at Nattamai Kottai.',
    author: 'Ramesh K.',
    location: 'Nattamai Kottai, Krishnagiri',
  },
  {
    id: 4,
    quote: 'Ordered bulk sweets gift boxes for our family wedding in Kaveripattinam. Outstanding quality and fresh packaging.',
    author: 'K. Venkatesh',
    location: 'Kaveripattinam',
  },
];

const variants = {
  enter: (dir) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function CustomerReviews() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (d) => {
    setDir(d);
    setIndex((prev) => (prev + d + reviews.length) % reviews.length);
  };

  return (
    <section className="reviews section">
      <div className="container">
        {/* Header */}
        <motion.div
          className="reviews__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <span className="label reviews__eyebrow">Testimonials</span>
          <div className="gold-line" style={{ marginTop: 12 }} />
        </motion.div>

        {/* Carousel */}
        <div className="reviews__carousel">
          <button
            className="reviews__arrow reviews__arrow--prev"
            onClick={() => go(-1)}
            aria-label="Previous review"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="reviews__window">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={reviews[index].id}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="reviews__slide"
              >
                {/* Quote mark */}
                <div className="reviews__quote-mark">"</div>
                <blockquote className="reviews__text">
                  {reviews[index].quote}
                </blockquote>
                <div className="reviews__author">
                  <div className="reviews__author-dot" />
                  <span className="reviews__author-name label">{reviews[index].author}</span>
                  <span className="reviews__author-sep">·</span>
                  <span className="reviews__author-loc">{reviews[index].location}</span>
                </div>

                {/* Stars */}
                <div className="reviews__stars" aria-label="5 stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="reviews__star" width="16" height="16" viewBox="0 0 24 24" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            className="reviews__arrow reviews__arrow--next"
            onClick={() => go(1)}
            aria-label="Next review"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="reviews__dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              className={`reviews__dot ${i === index ? 'active' : ''}`}
              onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
