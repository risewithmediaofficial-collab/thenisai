import { motion } from 'framer-motion';
import './IngredientsSection.css';

const ingredients = [
  { emoji: '🥛', name: 'Milk', desc: 'Whole fresh milk', color: '#F5EDD8', delay: 0 },
  { emoji: '🌿', name: 'Cardamom', desc: 'Hand-picked pods', color: '#D4E8C0', delay: 0.1 },
  { emoji: '🌰', name: 'Pistachio', desc: 'Premium nuts', color: '#C8E090', delay: 0.2 },
  { emoji: '✨', name: 'Saffron', desc: 'Pure strands', color: '#FFE4A0', delay: 0.3 },
  { emoji: '🍬', name: 'Sugar', desc: 'Pure cane', color: '#FFF0D8', delay: 0.4 },
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
                <div className="ingredient-card__emoji">{ing.emoji}</div>
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
