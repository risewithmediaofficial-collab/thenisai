import { useState } from 'react';
import { useCart } from '../../context/CartContext';

const COLLECTIONS = [
  {
    id: 'sweets',
    title: 'Traditional Sweets',
    img: '/images/products/sweets_assorted_real.jpg',
  },
  {
    id: 'ghee',
    title: 'Festive Sweets & Ghee',
    img: '/images/products/kaju_katli_real.jpg',
  },
  {
    id: 'savories',
    title: 'Crispy Savories',
    img: '/images/products/savories_boondi_real.jpg',
  },
  {
    id: 'chaat',
    title: 'Highway Chaat & Drinks',
    img: '/images/products/panipuri_real.jpg',
  },
];

const BEST_SELLERS = [
  {
    id: 'palkova',
    name: 'Signature Krishnagiri Palkova',
    theme: 'blue',
    ribbon: 'BEST SELLER',
    img: '/images/products/palkova_hero.webp',
    basePrice: 340,
    baseWeight: '500g',
    portions: [
      { label: '250g', price: 170 },
      { label: '500g', price: 340 },
      { label: '1kg', price: 680 },
    ],
  },
  {
    id: 'mysore-pak',
    name: 'Royal Mysore Pak',
    theme: 'rose',
    ribbon: 'PURE GHEE',
    img: '/images/products/mysore_pak.webp',
    basePrice: 190,
    baseWeight: '250g',
    portions: [
      { label: '250g', price: 190 },
      { label: '500g', price: 380 },
      { label: '1kg', price: 760 },
    ],
  },
  {
    id: 'kaju-katli',
    name: 'Silken Kaju Katli',
    theme: 'teal',
    ribbon: 'ROYAL CASHEW',
    img: '/images/products/kaju_katli_real.jpg',
    basePrice: 280,
    baseWeight: '250g',
    portions: [
      { label: '250g', price: 280 },
      { label: '500g', price: 560 },
      { label: '1kg', price: 1120 },
    ],
  },
  {
    id: 'kara-boondi',
    name: 'Crispy Spicy Kara Boondi',
    theme: 'lavender',
    ribbon: 'HIGHWAY SPECIAL',
    img: '/images/products/savories_boondi_real.jpg',
    basePrice: 140,
    baseWeight: '250g',
    portions: [
      { label: '250g', price: 140 },
      { label: '500g', price: 280 },
      { label: '1kg', price: 560 },
    ],
  },
];

export default function SweetsCollection() {
  const { navigateTo } = useCart();
  const [selectedPortions, setSelectedPortions] = useState({
    palkova: '500g',
    'mysore-pak': '250g',
    'kaju-katli': '250g',
    'kara-boondi': '250g',
  });

  const handleGoToPreOrders = (category = '') => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePortionSelect = (prodId, portionLabel) => {
    setSelectedPortions((prev) => ({
      ...prev,
      [prodId]: portionLabel,
    }));
  };

  return (
    <>
      {/* SECTION 3: MEET THE COLLECTION (4 ROUNDED CARDS) */}
      <section id="collection" className="thenisai-section">
        <div className="thenisai-section__title-center">
          <h2 className="thenisai-section__headline">MEET THE COLLECTION</h2>
        </div>

        <div className="thenisai-collection-grid">
          {COLLECTIONS.map((c) => (
            <div
              key={c.id}
              className="thenisai-collection-card"
              onClick={() => handleGoToPreOrders(c.id)}
            >
              <div className="thenisai-collection-card__img-wrap">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                  }}
                />
              </div>
              <div className="thenisai-collection-card__footer">
                <span className="thenisai-collection-card__name">{c.title}</span>
                <span className="thenisai-collection-card__arrow">↗</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: OUR BEST SELLERS (4 PASTEL COLORED CARDS) */}
      <section id="bestsellers" className="thenisai-section" style={{ marginTop: '54px' }}>
        <div className="thenisai-bestsellers-header">
          <h2 className="thenisai-section__headline">OUR BEST SELLERS</h2>

          <div className="thenisai-bestsellers-nav">
            <button
              type="button"
              className="thenisai-round-arrow-btn"
              onClick={() => handleGoToPreOrders()}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              className="thenisai-round-arrow-btn"
              onClick={() => handleGoToPreOrders()}
              aria-label="Next"
            >
              ›
            </button>
            <button
              type="button"
              className="thenisai-view-all-pill"
              onClick={() => handleGoToPreOrders()}
            >
              View All ↗
            </button>
          </div>
        </div>

        <div className="thenisai-cards-grid">
          {BEST_SELLERS.map((prod) => {
            const currentPortion = selectedPortions[prod.id] || prod.baseWeight;
            const portionObj = prod.portions.find((p) => p.label === currentPortion) || prod.portions[0];

            return (
              <div
                key={prod.id}
                className={`thenisai-prod-card thenisai-prod-card--${prod.theme}`}
              >
                {/* Badge Ribbon */}
                <span className="thenisai-prod-card__ribbon">{prod.ribbon}</span>

                {/* Centered Food Image */}
                <div className="thenisai-prod-card__img-wrap">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="thenisai-prod-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                    }}
                  />
                </div>

                {/* White Inner Card */}
                <div className="thenisai-prod-card__details">
                  <h3 className="thenisai-prod-card__title" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="thenisai-prod-card__meta-row">
                    <span className="thenisai-prod-card__price">₹{portionObj.price}</span>
                    <span className="thenisai-prod-card__weight">{portionObj.label}</span>
                  </div>

                  {/* Portion Selectors */}
                  <div className="thenisai-prod-card__portions">
                    {prod.portions.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`thenisai-portion-chip ${currentPortion === p.label ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePortionSelect(prod.id, p.label);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    className="thenisai-prod-card__btn"
                    onClick={() => handleGoToPreOrders()}
                  >
                    Pre-Order Online ↗
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
