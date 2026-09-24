import { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const SignaturePalkovaCanvas = lazy(() => import('./SignaturePalkovaCanvas'));

const FEATURES_LEFT = [
  {
    title: '100% Pure Whole Milk',
    desc: 'Sourced fresh daily from local grazing herds, boiled down to rich khoa.',
  },
  {
    title: 'Slow-Simmered for Hours',
    desc: 'Patiently reduced over gentle flame in heavy-bottomed brass urulis.',
  },
];

const FEATURES_RIGHT = [
  {
    title: 'Rich Desi Ghee & Saffron',
    desc: 'Infused with aromatic ghee and hand-selected Kashmiri saffron strands.',
  },
  {
    title: 'Generations-Old Recipe',
    desc: 'Zero artificial preservatives, colorants, or fillers. Just pure taste.',
  },
];

export default function SignaturePalkova() {
  const [shouldLoad3D, setShouldLoad3D] = useState(false);

  const enable3D = () => {
    if (!shouldLoad3D && typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) {
      setShouldLoad3D(true);
    }
  };

  return (
    <section className="signature section">
      <div className="container">
        {/* Header */}
        <div className="signature__header">
          <motion.span
            className="label signature__eyebrow"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Signature Masterpiece
          </motion.span>
          <motion.h2
            className="display-md signature__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            The Original Palkova
          </motion.h2>
          <div className="gold-line" style={{ marginTop: 16 }} />
        </div>

        {/* 3-Column Showcase: Left Features | 3D Interactive Vessel | Right Features */}
        <div className="signature__showcase">
          {/* Left Feature Column */}
          <div className="signature__col signature__col--left">
            {FEATURES_LEFT.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="signature__card"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="signature__card-indicator">
                  <span className="signature__card-dot" />
                  <span className="signature__card-line" />
                </div>
                <h3 className="signature__card-title">{feat.title}</h3>
                <p className="signature__card-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Center 3D Interactive Vessel */}
          <div
            className="signature__canvas-wrap"
            onPointerEnter={enable3D}
            onTouchStart={enable3D}
            onClick={enable3D}
          >
            <div className="signature__canvas">
              {shouldLoad3D ? (
                <Suspense fallback={<div className="signature__canvas-placeholder" />}>
                  <SignaturePalkovaCanvas />
                </Suspense>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <img
                    src="/images/products/palkova_card.webp"
                    alt="Thenisai Signature Palkova Masterpiece"
                    width="420"
                    height="420"
                    loading="lazy"
                    decoding="async"
                    style={{
                      maxWidth: '85%',
                      maxHeight: '85%',
                      objectFit: 'contain',
                      borderRadius: '50%',
                      boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Feature Column */}
          <div className="signature__col signature__col--right">
            {FEATURES_RIGHT.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="signature__card"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="signature__card-indicator signature__card-indicator--right">
                  <span className="signature__card-line" />
                  <span className="signature__card-dot" />
                </div>
                <h3 className="signature__card-title">{feat.title}</h3>
                <p className="signature__card-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom attributes strip */}
        <div className="signature__attrs">
          {['100% Pure Milk', 'No Preservatives', 'Traditional Method', 'Fresh Daily'].map((attr) => (
            <div key={attr} className="signature__attr">
              <div className="signature__attr-dot" />
              <span className="label">{attr}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
