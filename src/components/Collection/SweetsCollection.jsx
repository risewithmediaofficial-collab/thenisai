import { useState } from 'react';
import { useCart } from '../../context/CartContext';

const CATEGORIES = [
  { id: 'all', label: 'All Specialties', icon: '✨' },
  { id: 'sweets', label: 'Pure Milk Sweets', icon: '🍬' },
  { id: 'savories', label: 'Crispy Savories', icon: '🥨' },
  { id: 'chaat', label: 'Live Pani Puri', icon: '🧆' },
  { id: 'beverages', label: 'Tea, Coffee & Juices', icon: '☕' },
];

const SHOWCASE_ITEMS = [
  // 1. Traditional Sweets
  {
    id: 'palkova',
    category: 'sweets',
    name: 'Signature Krishnagiri Palkova',
    flourish: 'Our 20-Year Legend',
    price: '₹340',
    weight: '500g',
    image: '/images/products/palkova_hero.webp?v=2',
  },
  {
    id: 'kaju-katli',
    category: 'sweets',
    name: 'Kaju Katli',
    flourish: 'Pure Cashew',
    price: '₹280',
    weight: '250g',
    image: '/images/products/kaju_katli_real.jpg?v=2',
  },
  {
    id: 'mysore-pak',
    category: 'sweets',
    name: 'Royal Mysore Pak',
    flourish: 'Pure Desi Ghee',
    price: '₹190',
    weight: '250g',
    image: '/images/products/mysore_pak.webp?v=2',
  },
  {
    id: 'jangiri',
    category: 'sweets',
    name: 'Traditional Jangiri',
    flourish: 'Crisp Sweet Swirls',
    price: '₹280',
    weight: '500g',
    image: '/images/products/jangiri_real.jpg?v=2',
  },

  // 2. Savories & Kara Boondi
  {
    id: 'kara-boondi',
    category: 'savories',
    name: 'Crispy Spicy Kara Boondi',
    flourish: 'Curry Leaves & Peanuts',
    price: '₹140',
    weight: '250g',
    image: '/images/products/savories_boondi_real.jpg?v=2',
  },

  // 3. Live Highway Chaat
  {
    id: 'pani-puri',
    category: 'chaat',
    name: 'Highway Special Pani Puri',
    flourish: 'Live Chaat Counter',
    price: '₹50',
    weight: 'Plate (6 pcs)',
    image: '/images/products/panipuri_real.jpg?v=2',
  },

  // 4. Beverages: Tea, Fresh Juices, Rose Milk & Filter Coffee
  {
    id: 'hot-tea',
    category: 'beverages',
    name: 'Fresh Tea',
    flourish: 'Brewed Hot',
    price: '₹20',
    weight: 'Hot Cup',
    image: '/images/products/tea_real.jpg?v=2',
  },
  {
    id: 'fresh-juices',
    category: 'beverages',
    name: 'Fresh Juices',
    flourish: '100% Fresh',
    price: '₹60',
    weight: '300ml Glass',
    image: '/images/products/fresh_juices_real.jpg?v=2',
  },
  {
    id: 'rose-milk',
    category: 'beverages',
    name: 'Rose Milk',
    flourish: 'Chilled & Sweet',
    price: '₹30',
    weight: 'Chilled Glass',
    image: '/images/products/rosemilk_real.jpg?v=2',
  },
  {
    id: 'filter-coffee',
    category: 'beverages',
    name: 'Filter Coffee',
    flourish: 'Fresh Brew',
    price: '₹25',
    weight: 'Hot Cup',
    image: '/images/products/filter_coffee_real.jpg?v=2',
  },
];

export default function SweetsCollection() {
  const { navigateTo } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleGoToPreOrders = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = selectedCategory === 'all'
    ? SHOWCASE_ITEMS
    : SHOWCASE_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <section id="bestsellers" className="stardust-section stardust-section--bestsellers">
      <div className="stardust-container">
        {/* Section Header with Refined Typography & Clean Taglines */}
        <div className="stardust-bestsellers__header">
          <div>
            <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', lineHeight: 1, marginBottom: '6px' }}>
              Handcrafted Masterpieces &amp; Highway Favorites
            </span>
            <h2 className="stardust-section__title font-garamond" style={{ margin: 0 }}>
              Our Bestselling Confectionery &amp; Savories
            </h2>
          </div>

          <button
            type="button"
            className="stardust-btn stardust-btn--outline-dark font-lato"
            onClick={handleGoToPreOrders}
          >
            <span>View All &amp; Pre-Order Online</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>

        {/* Category Filter Pills Strip */}
        <div className="stardust-collection-tabs font-lato">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`stardust-collection-tab ${selectedCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Responsive Grid: Minimalist Luxury Presentation */}
        <div className="stardust-bestsellers__grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="stardust-card">
              {/* Product Real Image Frame */}
              <div className="stardust-card__img-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  className="stardust-card__img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/sweets_platter_hero.jpg?v=2';
                  }}
                />

                <span className="stardust-card__badge-tag font-lato">
                  {item.flourish}
                </span>
              </div>

              {/* Card Body: Clean Title, Pricing & Action CTA */}
              <div className="stardust-card__body font-lato" style={{ gap: '14px' }}>
                <div className="stardust-card__header">
                  <h3 className="stardust-card__title font-garamond">{item.name}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <span className="stardust-card__price">{item.price}</span>
                    <small style={{ display: 'block', fontSize: '11px', color: '#8C7769' }}>/ {item.weight}</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="stardust-card__btn font-lato"
                  onClick={handleGoToPreOrders}
                >
                  <span>Pre-Order for Zero-Wait Pickup ↗</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
