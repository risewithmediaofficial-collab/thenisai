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
    desc: 'Authentic 100% farm-fresh cow milk, slow-simmered in heavy brass urulis for 4 hours into golden, rich caramelized perfection.',
    image: '/images/products/palkova_hero.webp',
  },
  {
    id: 'kaju-katli',
    category: 'sweets',
    name: 'Kaju Katli',
    flourish: 'Pure Cashew',
    price: '₹280',
    weight: '250g',
    desc: 'Silken diamond-cut fudge handcrafted from premium cashews and pure milk, slow-cooked to tender melt-in-the-mouth perfection.',
    image: '/images/products/kaju_katli_real.jpg',
  },
  {
    id: 'mysore-pak',
    category: 'sweets',
    name: 'Royal Mysore Pak',
    flourish: 'Pure Desi Ghee',
    price: '₹190',
    weight: '250g',
    desc: 'Traditional melt-in-mouth confectionery prepared with pure golden desi ghee, roasted gram flour, and aromatic cardamom.',
    image: '/images/products/mysore_pak.webp',
  },
  {
    id: 'jangiri',
    category: 'sweets',
    name: 'Traditional Jangiri',
    flourish: 'Crisp Sweet Swirls',
    price: '₹280',
    weight: '500g',
    desc: 'Crisp festive swirls piped from finely ground urad batter, fried golden in pure ghee and soaked in aromatic saffron syrup.',
    image: '/images/products/jangiri_real.jpg',
  },

  // 2. Savories & Kara Boondi
  {
    id: 'kara-boondi',
    category: 'savories',
    name: 'Crispy Spicy Kara Boondi',
    flourish: 'Curry Leaves & Peanuts',
    price: '₹140',
    weight: '250g',
    desc: 'Crunchy golden gram flour pearls infused with roasted peanuts, cashews, garlic, and fried garden-fresh curry leaves.',
    image: '/images/products/savories_boondi_real.jpg',
  },

  // 3. Live Highway Chaat
  {
    id: 'pani-puri',
    category: 'chaat',
    name: 'Highway Special Pani Puri',
    flourish: 'Live Chaat Counter',
    price: '₹50',
    weight: 'Plate (6 pcs)',
    desc: 'Hollow, crisp puffed puris filled with spiced potato-sprout filling and served with ice-cold mint theekha paani and sweet tamarind chutney.',
    image: '/images/products/panipuri_real.jpg',
  },

  // 4. Beverages: Tea, Fresh Juices, Rose Milk & Filter Coffee
  {
    id: 'hot-tea',
    category: 'beverages',
    name: 'Fresh Tea',
    flourish: 'Brewed Hot',
    price: '₹20',
    weight: 'Hot Cup',
    desc: 'Steaming hot aromatic tea prepared fresh with unadulterated pure cow milk and subtle cardamom.',
    image: '/images/products/tea_real.jpg',
  },
  {
    id: 'fresh-juices',
    category: 'beverages',
    name: 'Fresh Juices',
    flourish: '100% Fresh',
    price: '₹60',
    weight: '300ml Glass',
    desc: 'Freshly squeezed seasonal fruits served chilled without artificial colors or added water.',
    image: '/images/products/fresh_juices_real.jpg',
  },
  {
    id: 'rose-milk',
    category: 'beverages',
    name: 'Rose Milk',
    flourish: 'Chilled & Sweet',
    price: '₹30',
    weight: 'Chilled Glass',
    desc: 'Delicious chilled rose milk made with fragrant rose syrup and thick fresh milk.',
    image: '/images/products/rosemilk_real.jpg',
  },
  {
    id: 'filter-coffee',
    category: 'beverages',
    name: 'Filter Coffee',
    flourish: 'Fresh Brew',
    price: '₹25',
    weight: 'Hot Cup',
    desc: 'Rich, authentic South Indian filter coffee brewed with fresh cow milk and aromatic blend.',
    image: '/images/products/tea_coffee_real.jpg',
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
        {/* Section Header with Unique Artisanal Detailing */}
        <div className="stardust-bestsellers__header">
          <div>
            <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', lineHeight: 1, marginBottom: '6px' }}>
              Handcrafted Masterpieces &amp; Highway Favorites
            </span>
            <h2 className="stardust-section__title font-garamond">
              Our Bestselling Confectionery &amp; Savories
            </h2>
            <p className="stardust-section__sub font-lato">
              Small-batch sweets, crispy savories, live hot pani puri, fresh juices, chilled rose milk, tea, and filter coffee prepared fresh daily on NH 44.
            </p>
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

        {/* Dynamic Responsive Grid with Real Uploaded Images */}
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
                    e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                  }}
                />

                <span className="stardust-card__badge-tag font-lato">
                  {item.flourish}
                </span>
              </div>

              {/* Card Body */}
              <div className="stardust-card__body font-lato">
                <div className="stardust-card__header">
                  <h3 className="stardust-card__title font-garamond">{item.name}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <span className="stardust-card__price">{item.price}</span>
                    <small style={{ display: 'block', fontSize: '11px', color: '#8C7769' }}>/ {item.weight}</small>
                  </div>
                </div>

                <p className="stardust-card__desc">
                  {item.desc}
                </p>

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
