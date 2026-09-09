import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CustomerReviews.css';

const reviews = [
  {
    id: 1,
    quote: 'Absolutely rich and delicious.',
    author: 'Priya M.',
    location: 'Chennai',
  },
  {
    id: 2,
    quote: 'Just like traditional homemade Palkova.',
    author: 'Ramesh K.',
    location: 'Coimbatore',
  },
  {
    id: 3,
    quote: 'A taste worth remembering.',
    author: 'Anitha S.',
    location: 'Madurai',
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
              <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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
                    <span key={i} className="reviews__star">★</span>
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
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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
