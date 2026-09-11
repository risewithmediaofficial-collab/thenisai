import { useState } from 'react';
import { motion } from 'framer-motion';
import { SWEETS_CATALOG, SWEET_WEIGHT_OPTIONS } from '../../data/sweetsData';
import { useCart } from '../../context/CartContext';
import './SweetsCollection.css';

function SweetCard({ sweet, index }) {
  const hasPrices = Boolean(sweet.prices);
  const [selectedWeight, setSelectedWeight] = useState(hasPrices ? '500g' : (sweet.unit || '1 Cup'));
  const [justAdded, setJustAdded] = useState(false);

  const currentPrice = hasPrices
    ? (sweet.prices[selectedWeight] || sweet.prices['500g'] || Object.values(sweet.prices)[0])
    : (sweet.price || 20);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(sweet, selectedWeight, currentPrice, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleOrderNow = (e) => {
    e.stopPropagation();
    addToCart(sweet, selectedWeight, currentPrice, 1);
    setIsCartOpen(true);
  };

  return (
    <motion.div
      className={`sweet-card ${sweet.featured ? 'sweet-card--featured' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        delay: (index % 4) * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
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
        <div className="sweet-card__price-tag">
          ₹{currentPrice}
        </div>
      </div>

      <div className="sweet-card__body">
        <span className="sweet-card__tagline label">{sweet.tagline}</span>
        <h3 className="sweet-card__name">{sweet.name}</h3>
        <p className="sweet-card__desc">{sweet.description}</p>

        {/* Weight / Unit Selector */}
        <div className="sweet-card__weights">
          {hasPrices ? SWEET_WEIGHT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`weight-pill ${selectedWeight === opt.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWeight(opt.id);
              }}
            >
              {opt.label}
            </button>
          )) : (
            <span className="weight-pill active">{sweet.unit || '1 Cup'}</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="sweet-card__actions">
          <button
            type="button"
            className={`btn-add-cart ${justAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <>
                <span className="added-check">✓</span>
                <span>Added to Box</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Add to Box</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-quick-buy"
            onClick={handleOrderNow}
            title="Order directly"
          >
            <span>Order</span>
            <svg width="12" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M0 5h12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SweetsCollection() {
  return (
    <section id="collection" className="collection section">
      <div className="container">
        {/* Header */}
        <div className="collection__header">
          <span className="label collection__eyebrow">
            Handcrafted Traditional Sweets
          </span>
          <h2 className="display-md collection__title">
            Fresh Kitchen Collection
          </h2>
          <p className="collection__subtitle">
            Crafted daily with pure farm milk and aromatic desi ghee. Choose your pack size and order directly.
          </p>
          <div className="gold-line" style={{ marginTop: 16 }} />
        </div>

        {/* Grid */}
        <div className="collection__grid">
          {SWEETS_CATALOG.map((sweet, i) => (
            <SweetCard key={sweet.id} sweet={sweet} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
