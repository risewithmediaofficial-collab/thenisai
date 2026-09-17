import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const frames = [
  {
    id: 'frame-1',
    number: '01',
    label: 'The Source',
    subheading: 'Pure Farm Milk',
    caption: 'Fresh whole milk collected daily at dawn from local heritage farms in Tamil Nadu, preserving unmatched rich sweetness and purity.',
    img: '/images/story/ingredients.jpg',
  },
  {
    id: 'frame-2',
    number: '02',
    label: 'The Process',
    subheading: 'Slow Stirred with Love',
    caption: 'Patiently stirred for 4+ continuous hours over gentle fire with pure country cow ghee, allowing milk solids to naturally coalesce.',
    img: '/images/story/brand_story.jpg',
  },
  {
    id: 'frame-3',
    number: '03',
    label: 'The Craft',
    subheading: 'Melt-in-Mouth Perfection',
    caption: 'Finished to rich, velvety goodness without artificial essence or preservatives — authentic South Indian Palkova as tradition intended.',
    img: '/images/products/palkova_hero.jpg',
  },
];

const AUTO_SWIPE_INTERVAL = 4000;

export default function BrandStory() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const timerRef = useRef(null);

  const paginate = useCallback((newDirection) => {
    setDirection(newDirection);
    setCurrent((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = frames.length - 1;
      if (next >= frames.length) next = 0;
      return next;
    });
  }, []);

  const goToSlide = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // Auto-swipe effect
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      paginate(1);
    }, AUTO_SWIPE_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, paginate]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      paginate(1);
    } else if (isRightSwipe) {
      paginate(-1);
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      },
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  const currentFrame = frames[current];

  return (
    <section
      id="story"
      className="relative w-full py-20 md:py-28 lg:py-32 bg-warm-dark text-cream overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-caramel/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.span
            className="inline-block text-gold uppercase tracking-[0.25em] text-xs md:text-sm font-ui font-medium mb-3"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Sacred Heritage
          </motion.span>
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-cream mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            viewport={{ once: true }}
          >
            Made The Traditional Way
          </motion.h2>
          <motion.p
            className="font-body italic text-lg sm:text-xl md:text-2xl text-cream/70 font-light"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            viewport={{ once: true }}
          >
            Slow cooked. Purely crafted. Unforgettable taste.
          </motion.p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
        </div>

        {/* Interactive Auto-Swipe Showcase Container */}
        <div
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Step Navigation Tabs (Desktop & Tablet) */}
          <div className="hidden sm:grid grid-cols-3 gap-3 md:gap-4 mb-8">
            {frames.map((frame, index) => {
              const isActive = index === current;
              return (
                <button
                  key={frame.id}
                  onClick={() => goToSlide(index)}
                  className={`text-left p-3 md:p-4 rounded-lg border transition-all duration-500 relative overflow-hidden group ${
                    isActive
                      ? 'bg-cream/10 border-gold/60 shadow-gold-glow'
                      : 'bg-cream/5 border-white/10 hover:border-gold/30 hover:bg-cream/[0.07]'
                  }`}
                >
                  {/* Progress bar fill for active step */}
                  {isActive && !isPaused && (
                    <motion.div
                      className="absolute bottom-0 left-0 top-0 bg-gold/15 -z-0"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: AUTO_SWIPE_INTERVAL / 1000, ease: 'linear' }}
                      key={current}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-ui font-semibold tracking-wider ${isActive ? 'text-gold' : 'text-cream/50'}`}>
                      {frame.number}
                    </span>
                    <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-gold' : 'bg-cream/30'}`} />
                  </div>
                  <div className={`font-display text-sm md:text-base font-medium truncate ${isActive ? 'text-cream' : 'text-cream/70 group-hover:text-cream'}`}>
                    {frame.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Visual Slide Card */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-gold/20 bg-deep-brown/40 shadow-2xl backdrop-blur-sm min-h-[460px] sm:min-h-[500px] md:min-h-[540px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-12 h-full items-stretch"
              >
                {/* Image Column */}
                <div className="relative md:col-span-7 h-[260px] sm:h-[320px] md:h-full min-h-[260px] md:min-h-[500px] overflow-hidden group">
                  <img
                    src={currentFrame.img}
                    alt={currentFrame.label}
                    className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-warm-dark/90 via-warm-dark/30 to-transparent" />
                  
                  {/* Badge on Image */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-gold/30">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <span className="font-ui text-[11px] tracking-wider uppercase text-gold">Step {currentFrame.number}</span>
                  </div>
                </div>

                {/* Content Column */}
                <div className="md:col-span-5 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between bg-gradient-to-b from-deep-brown/80 to-warm-dark/95">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-gold font-ui text-xs font-semibold tracking-widest uppercase">
                        Chapter {currentFrame.number} of 03
                      </span>
                      <span className="w-8 h-[1px] bg-gold/50" />
                    </div>

                    <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-cream font-normal leading-tight mb-2">
                      {currentFrame.label}
                    </h3>
                    <h4 className="font-display italic text-gold text-lg sm:text-xl font-normal mb-4">
                      {currentFrame.subheading}
                    </h4>

                    <p className="font-body text-cream/80 text-base sm:text-lg md:text-xl leading-relaxed font-light mb-6">
                      {currentFrame.caption}
                    </p>
                  </div>

                  {/* Controls & Progress bar */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    {/* Dots / Indicators */}
                    <div className="flex items-center gap-2">
                      {frames.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goToSlide(i)}
                          aria-label={`Go to slide ${i + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === current ? 'w-8 bg-gold' : 'w-2 bg-cream/30 hover:bg-cream/60'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Prev / Next Arrows */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(-1)}
                        className="w-10 h-10 rounded-full border border-gold/30 bg-cream/5 flex items-center justify-center text-cream hover:bg-gold hover:text-deep-brown transition-all duration-300 active:scale-95"
                        aria-label="Previous step"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => paginate(1)}
                        className="w-10 h-10 rounded-full border border-gold/30 bg-cream/5 flex items-center justify-center text-cream hover:bg-gold hover:text-deep-brown transition-all duration-300 active:scale-95"
                        aria-label="Next step"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden flex items-center justify-center gap-2 text-gold/70 text-xs font-ui mt-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Swipe left or right to explore steps</span>
          </div>
        </div>
      </div>
    </section>
  );
}
