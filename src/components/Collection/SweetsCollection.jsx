import { useCart } from '../../context/CartContext';

const BESTSELLERS = [
  {
    id: 'kaju-katli',
    name: 'Diamond Kaju Katli',
    flourish: 'Goan Cashews',
    price: '₹280',
    weight: '250g',
    desc: 'Silken diamond-cut fudge handcrafted from premium Goan cashews and pure milk, slow-cooked to melt-in-the-mouth tenderness.',
    image: '/images/products/kaju_katli_real.jpg',
  },
  {
    id: 'palkova',
    name: 'Signature Krishnagiri Palkova',
    flourish: 'Our 20-Year Legend',
    price: '₹340',
    weight: '500g',
    desc: 'Authentic 100% farm-fresh cow milk, slow-simmered in heavy brass urulis for 4 hours into golden, rich caramelized perfection.',
    image: '/images/products/palkova_hero.webp',
  },
  {
    id: 'gulab-jamun',
    name: 'Caramel Gulab Jamun',
    flourish: 'Desi Khoya & Saffron',
    price: '₹300',
    weight: '500g',
    desc: 'Plump, melt-soft khoya dumplings fried in country ghee and steeped in fragrant green cardamom and saffron sugar nectar.',
    image: '/images/products/gulab_jamun_real.jpg',
  },
  {
    id: 'jangiri',
    name: 'Traditional Royal Jangiri',
    flourish: 'South Indian Swirl',
    price: '₹280',
    weight: '500g',
    desc: 'Crisp, ornate festive sweet swirls piped from finely ground urad batter, fried golden and soaked in aromatic saffron syrup.',
    image: '/images/products/jangiri_real.jpg',
  },
];

export default function SweetsCollection() {
  const { navigateTo } = useCart();

  const handleGoToPreOrders = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="bestsellers" className="stardust-section stardust-section--bestsellers">
      <div className="stardust-container">
        {/* Section Header with Unique Artisanal Detailing */}
        <div className="stardust-bestsellers__header">
          <div>
            <span className="font-script" style={{ fontSize: '32px', color: '#C59334', display: 'block', lineHeight: 1, marginBottom: '6px' }}>
              Handcrafted Masterpieces
            </span>
            <h2 className="stardust-section__title font-garamond">
              Our Bestselling Confectionery
            </h2>
            <p className="stardust-section__sub font-lato">
              Small-batch sweets prepared fresh every dawn using 100% pure cow milk and authentic traditional methods.
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

        {/* 4-Card Horizontal Grid with Real Images */}
        <div className="stardust-bestsellers__grid">
          {BESTSELLERS.map((sweet) => (
            <div key={sweet.id} className="stardust-card">
              {/* Product Real Image Frame */}
              <div className="stardust-card__img-wrap">
                <img
                  src={sweet.image}
                  alt={sweet.name}
                  className="stardust-card__img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <span className="stardust-card__badge-tag font-lato">
                  {sweet.flourish}
                </span>
              </div>

                {/* Card Body */}
                <div className="stardust-card__body font-lato">
                  <div className="stardust-card__header">
                    <h3 className="stardust-card__title font-garamond">{sweet.name}</h3>
                    <div style={{ textAlign: 'right' }}>
                      <span className="stardust-card__price">{sweet.price}</span>
                      <small style={{ display: 'block', fontSize: '11px', color: '#8C7769' }}>/ {sweet.weight}</small>
                    </div>
                  </div>

                  <p className="stardust-card__desc">
                    {sweet.desc}
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
