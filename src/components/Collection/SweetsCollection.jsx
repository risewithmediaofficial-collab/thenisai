import { useState } from 'react';
import { useCart } from '../../context/CartContext';

const CATEGORIES = [
  {
    id: 'sweets',
    sub: 'Traditional Sweets',
    title: 'Palkova & Milk Sweets',
    img: '/images/products/sweets_assorted_real.jpg',
  },
  {
    id: 'ghee',
    sub: 'Pure Desi Ghee',
    title: 'Kaju Katli & Mysore Pak',
    img: '/images/products/kaju_katli_real.jpg',
  },
  {
    id: 'savories',
    sub: 'Crunchy Savouries',
    title: 'Kara Boondi & Namkeens',
    img: '/images/products/savories_boondi_real.jpg',
  },
  {
    id: 'chaat',
    sub: 'Highway Live Counter',
    title: 'Fresh Chaat & Hot Snacks',
    img: '/images/products/panipuri_real.jpg',
  },
];
const BEST_SELLERS = [
  {
    id: 'palkova',
    name: 'Signature Krishnagiri Palkova',
    img: '/images/products/palkova_card.webp',
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
    name: 'Pure Ghee Mysore Pak',
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

  const handleGoToMenu = (category = '') => {
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
      {/* 1. SPECIALTY CATEGORIES */}
      <section id="categories" className="ks-section ks-section--soft">
        <div className="ks-container">
          <div className="ks-section-header">
            <span className="ks-section-header__sub">
              Fresh Daily Batches
            </span>
            <h2 className="ks-section-header__title">
              Our Specialties
            </h2>
          </div>

          <div className="ks-categories-grid">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="ks-cat-card"
                onClick={() => handleGoToMenu(cat.id)}
              >
                <div className="ks-cat-card__img-wrap">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="ks-cat-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                    }}
                  />
                </div>
                <div className="ks-cat-card__body">
                  <span className="ks-cat-card__sub">{cat.sub}</span>
                  <h3 className="ks-cat-card__name">{cat.title}</h3>
                  <span className="ks-cat-card__btn">
                    <span>View Delicacies</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CUSTOMER FAVORITES */}
      <section id="bestsellers" className="ks-section">
        <div className="ks-container">
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '36px',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '4px' }}>
                Handcrafted Delights
              </span>
              <h2 className="ks-section-header__title" style={{ textAlign: 'left' }}>
                Customer Favorites
              </h2>
            </div>

            <button
              type="button"
              className="ks-action-link"
              onClick={() => handleGoToMenu()}
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--ks-maroon)',
                gap: '8px',
              }}
            >
              <span>Explore Full Menu</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="ks-products-grid">
            {BEST_SELLERS.map((prod) => {
              const currentPortion = selectedPortions[prod.id] || prod.baseWeight;
              const portionObj = prod.portions.find((p) => p.label === currentPortion) || prod.portions[0];

              return (
                <div key={prod.id} className="ks-product-card">
                  <div className="ks-product-card__img-wrap">
                    <img
                      src={prod.img}
                      alt={prod.name}
                      className="ks-product-card__img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                      }}
                    />
                  </div>

                  <h3 className="ks-product-card__title" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="ks-product-card__price-row">
                    <span className="ks-product-card__price">₹{portionObj.price}</span>
                    <span className="ks-product-card__weight">/ {portionObj.label}</span>
                  </div>

                  {/* Portion Selectors */}
                  <div className="ks-product-card__portions">
                    {prod.portions.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`ks-portion-chip ${currentPortion === p.label ? 'is-active' : ''}`}
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
                    className="ks-product-card__btn"
                    onClick={() => handleGoToMenu()}
                  >
                    <span>Pre-Order for Pickup</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
