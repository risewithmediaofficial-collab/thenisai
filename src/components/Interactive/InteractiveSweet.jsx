import { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveSweetCanvas = lazy(() => import('./InteractiveSweetCanvas'));

const SWEET_ITEMS = [
  {
    id: 'palkova',
    name: 'Signature Palkova',
    tagline: 'Melt-in-mouth caramelized milk fudge',
    image: '/images/products/palkova_card.webp',
    textureNote: 'Creamy milk-solid curds, slow-cooked in pure ghee',
    curdType: 'round',
  },
  {
    id: 'kaju-katli',
    name: 'Kaju Katli',
    tagline: 'Pure cashew diamond with delicate silver vark',
    image: '/images/products/kaju_katli.webp',
    textureNote: 'Velvety smooth paste of premium whole cashews',
    curdType: 'flat',
  },
  {
    id: 'mysore-pak',
    name: 'Royal Mysore Pak',
    tagline: 'Porous, rich golden gram flour & desi ghee fudge',
    image: '/images/products/mysore_pak.webp',
    textureNote: 'Aerated, crisp on outside and melt-in-mouth inside',
    curdType: 'cube',
  },
  {
    id: 'badam-halwa',
    name: 'Badam Halwa',
    tagline: 'Saffron-infused rich crushed almond delicacy',
    image: '/images/products/badam_halwa.webp',
    textureNote: 'Dense, glossy with saffron, cardamom, and almond grain',
    curdType: 'bowl',
  },
];

export default function InteractiveSweet() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef();
  const localMouse = useRef({ normX: 0, normY: 0 });
  const [shouldRender3D, setShouldRender3D] = useState(false);

  const enable3D = () => {
    if (!shouldRender3D && typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) {
      setShouldRender3D(true);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      localMouse.current = {
        normX: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        normY: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };

    el.addEventListener('mousemove', handleMove, { passive: true });
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  const currentSweet = SWEET_ITEMS[activeIdx];

  return (
    <section className="interactive-sweet section">
      <div className="interactive-sweet__bg">
        <div className="interactive-sweet__glow" />
      </div>

      <div className="container">
        <div className="interactive-sweet__header">
          <motion.span
            className="label interactive-sweet__eyebrow"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Tactile Experience
          </motion.span>
          <motion.h2
            className="display-md interactive-sweet__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            Feel the Richness
          </motion.h2>
          <motion.p
            className="interactive-sweet__hint body-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            style={{ display: shouldRender3D ? undefined : 'none' }}
          >
            Move your cursor to illuminate and tilt the authentic sweets
          </motion.p>

          {/* Sweet Selector Pills */}
          <div className="interactive-sweet__tabs">
            {SWEET_ITEMS.map((item, i) => (
              <button
                key={item.id}
                className={`interactive-sweet__tab ${i === activeIdx ? 'active' : ''}`}
                onClick={() => {
                  setActiveIdx(i);
                  enable3D();
                }}
              >
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Canvas Showcase — desktop only, loaded on interaction */}
      <div
        className="interactive-sweet__canvas"
        ref={containerRef}
        onPointerEnter={enable3D}
        onTouchStart={enable3D}
        onClick={enable3D}
      >
        {shouldRender3D ? (
          <Suspense fallback={<div className="interactive-sweet__placeholder" />}>
            <InteractiveSweetCanvas currentSweet={currentSweet} localMouse={localMouse} />
          </Suspense>
        ) : (
          /* Static image fallback shown on mobile / before interaction */
          <div className="interactive-sweet__placeholder">
            <img
              src={currentSweet.image}
              alt={currentSweet.name}
              loading="lazy"
              width="500"
              height="500"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            />
          </div>
        )}
      </div>

      {/* Selected Sweet Info Badge */}
      <div className="container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSweet.id}
            className="interactive-sweet__meta"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="interactive-sweet__meta-title">{currentSweet.name}</h3>
            <p className="interactive-sweet__meta-tagline">{currentSweet.tagline}</p>
            <span className="interactive-sweet__meta-note">{currentSweet.textureNote}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
