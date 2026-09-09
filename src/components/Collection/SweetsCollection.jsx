import { motion } from 'framer-motion';
import './SweetsCollection.css';

const sweets = [
  {
    id: 'palkova',
    name: 'Palkova',
    tagline: 'Our Signature',
    image: '/palkova_card.jpg',
    featured: true,
  },
  {
    id: 'milk-peda',
    name: 'Milk Peda',
    tagline: 'Melt-in-mouth',
    image: '/milk_peda.jpg',
  },
  {
    id: 'mysore-pak',
    name: 'Mysore Pak',
    tagline: 'Rich & Ghee',
    image: '/mysore_pak.jpg',
  },
  {
    id: 'kaju-katli',
    name: 'Kaju Katli',
    tagline: 'Silver Leaf',
    image: '/kaju_katli.jpg',
  },
  {
    id: 'badam-halwa',
    name: 'Badam Halwa',
    tagline: 'Saffron Kissed',
    image: '/badam_halwa.jpg',
  },
  {
    id: 'jangiri',
    name: 'Jangiri',
    tagline: 'Classic South',
    image: '/jangiri.jpg',
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    tagline: 'Syrup Soaked',
    image: '/gulab_jamun.jpg',
  },
];

function SweetCard({ sweet, index }) {
  return (
    <motion.div
      className={`sweet-card ${sweet.featured ? 'sweet-card--featured' : ''}`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        delay: (index % 4) * 0.1,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={{ y: -8 }}
    >
      <div className="sweet-card__img-wrap">
        <img
          src={sweet.image}
          alt={sweet.name}
          className="sweet-card__img"
          loading="lazy"
        />
        <div className="sweet-card__overlay" />
        {sweet.featured && (
          <div className="sweet-card__badge label">Signature</div>
        )}
      </div>

      <div className="sweet-card__body">
        <span className="sweet-card__tagline label">{sweet.tagline}</span>
        <h3 className="sweet-card__name">{sweet.name}</h3>
        <a href="#contact" className="sweet-card__discover">
          <span>Discover</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M0 5h12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

export default function SweetsCollection() {
  return (
    <section id="collection" className="collection section">
      <div className="container">
        {/* Header */}
        <div className="collection__header" data-reveal>
          <motion.span
            className="label collection__eyebrow"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Our Collection
          </motion.span>
          <motion.h2
            className="display-md collection__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            Premium Sweets
          </motion.h2>
          <div className="gold-line" style={{ marginTop: 20 }} />
        </div>

        {/* Grid */}
        <div className="collection__grid">
          {sweets.map((sweet, i) => (
            <SweetCard key={sweet.id} sweet={sweet} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
