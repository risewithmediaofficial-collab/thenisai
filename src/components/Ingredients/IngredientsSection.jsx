import { motion } from 'framer-motion';
import './IngredientsSection.css';

const MilkIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="24" cy="11" rx="9" ry="3.5" />
    <path d="M15 11v3c0 3.5-5 8-5 18a14 14 0 0 0 28 0c0-10-5-14.5-5-18v-3" />
    <path d="M32 17c3.5 0 6.5 2.5 6.5 6s-2 5.5-5.5 6" />
    <path d="M14 26c3 1.8 7-1.2 10 0.5s7-1 10 0.5" />
    <path d="M24 33c-1.5 2.5-2.5 3.5-2.5 5a2.5 2.5 0 0 0 5 0c0-1.5-1-2.5-2.5-5z" />
  </svg>
);

const CardamomIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M24 6C16 13 13 22 15 32a11 11 0 0 0 18 0c2-10-1-19-9-26z" />
    <path d="M24 6v37" />
    <path d="M19 18c3 4 3 12 0 18" />
    <path d="M29 18c-3 4-3 12 0 18" />
    <path d="M24 6c-1.5-2-3.5-3-5-3M24 6c1.5-2 3.5-3 5-3" />
  </svg>
);

const PistachioIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M24 7C14 11 9 21 11 33a13.5 13.5 0 0 0 26 0c2-12-3-22-13-26z" />
    <path d="M19 12c-5 6-4 15-1 22" />
    <path d="M29 12c5 6 4 15 1 22" />
    <ellipse cx="24" cy="24" rx="4.5" ry="11" />
    <path d="M24 16c-1 3-1 12 0 15" strokeWidth="1.5" />
  </svg>
);

const SaffronIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M24 43V26" />
    <path d="M24 26c-3-6-8-10-10-19 4 0 8 4 9 10" />
    <path d="M24 26c0-7 1-15 0-21 3 2 4 8 3 14" />
    <path d="M24 26c3-6 8-10 10-19-4 0-8 4-9 10" />
    <circle cx="14" cy="7" r="2" />
    <circle cx="24" cy="5" r="2" />
    <circle cx="34" cy="7" r="2" />
  </svg>
);

const SugarIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="24 5 40 17 24 43 8 17" />
    <line x1="8" y1="17" x2="40" y2="17" />
    <line x1="24" y1="5" x2="24" y2="43" />
    <line x1="16" y1="17" x2="24" y2="43" />
    <line x1="32" y1="17" x2="24" y2="43" />
    <line x1="24" y1="5" x2="16" y2="17" />
    <line x1="24" y1="5" x2="32" y2="17" />
  </svg>
);

const ingredients = [
  { icon: MilkIcon, name: 'Milk', desc: 'Whole fresh milk', delay: 0 },
  { icon: CardamomIcon, name: 'Cardamom', desc: 'Hand-picked pods', delay: 0.1 },
  { icon: PistachioIcon, name: 'Pistachio', desc: 'Premium nuts', delay: 0.2 },
  { icon: SaffronIcon, name: 'Saffron', desc: 'Pure strands', delay: 0.3 },
  { icon: SugarIcon, name: 'Sugar', desc: 'Pure cane', delay: 0.4 },
];

export default function IngredientsSection() {
  return (
    <section className="ingredients section">
      <div className="ingredients__bg-img">
        <img src="/ingredients.jpg" alt="Ingredients" loading="lazy" />
        <div className="ingredients__bg-overlay" />
      </div>

      <div className="container">
        <div className="ingredients__inner">
          {/* Header */}
          <motion.div
            className="ingredients__header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="display-md ingredients__title">
              Simple Ingredients.
              <em> Rich Taste.</em>
            </h2>
            <p className="body-lg ingredients__sub">
              Nothing complicated. Just the richness of tradition.
            </p>
          </motion.div>

          {/* Ingredient cards */}
          <div className="ingredients__grid">
            {ingredients.map((ing, i) => (
              <motion.div
                key={ing.name}
                className="ingredient-card"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: ing.delay,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.04 }}
              >
                <div className="ingredient-card__icon-wrap">
                  <ing.icon />
                </div>
                <div className="ingredient-card__name">{ing.name}</div>
                <div className="ingredient-card__desc label">{ing.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Bottom gold line */}
          <motion.div
            className="gold-line"
            style={{ marginTop: 48, width: 80 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
          />
        </div>
      </div>
    </section>
  );
}
