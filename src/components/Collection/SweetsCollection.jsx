import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import MaskRiseText from '../Common/MaskRiseText';

const CATEGORIES = [
  {
    id: 'sweets',
    sub: '100% Pure Cow Milk',
    title: 'Palkova & Milk Sweets',
    img: '/images/products/sweets_assorted_real.jpg',
  },
  {
    id: 'ghee',
    sub: 'Pure Desi Ghee',
    title: 'Mysore Pak & Halwa',
    img: '/images/products/kaju_katli_real.jpg',
  },
  {
    id: 'savories',
    sub: 'Crispy & Crunchy',
    title: 'Kara Boondi & Mixtures',
    img: '/images/products/savories_boondi_real.jpg',
  },
  {
    id: 'chaat',
    sub: 'Highway Live Counter',
    title: 'Hot Snacks, Tea & Coffee',
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
      <section id="categories" className="bg-[#FAF7F2] py-12 sm:py-16 border-b border-[#EAE2D5] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <MaskRiseText
              as="span"
              delay={0.04}
              className="font-museo uppercase font-bold text-xs sm:text-[13px] tracking-[0.08em] text-[#C55018] block mb-2"
            >
              Fresh From Our Kitchen
            </MaskRiseText>
            <MaskRiseText
              as="h2"
              delay={0.12}
              className="font-shantell font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#161B26] tracking-tight"
              lineClassName="font-shantell"
            >
              Popular Sweets &amp; Snacks
            </MaskRiseText>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#EAE2D5] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col"
                onClick={() => handleGoToMenu(cat.id)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                    }}
                  />
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <span className="text-xs text-[#A97922] font-semibold mb-1 block">{cat.sub}</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#1C130D] mb-3 group-hover:text-[#7B1812] transition-colors">{cat.title}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#7B1812] group-hover:translate-x-1 transition-transform">
                    <span>View Sweets</span>
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
      <section id="bestsellers" className="bg-white py-12 sm:py-16 border-b border-[#EAE2D5] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <MaskRiseText
                as="span"
                delay={0.04}
                className="font-museo uppercase font-bold text-xs sm:text-[13px] tracking-[0.08em] text-[#C55018] block mb-1"
              >
                Highway Specials
              </MaskRiseText>
              <MaskRiseText
                as="h2"
                delay={0.12}
                className="font-shantell font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#161B26] tracking-tight"
                lineClassName="font-shantell"
              >
                Signature Sweets
              </MaskRiseText>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#7B1812] hover:text-[#63120D] transition-colors cursor-pointer bg-transparent border-0 p-0"
              onClick={() => handleGoToMenu()}
            >
              <span>See All Sweets</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {BEST_SELLERS.map((prod) => {
              const currentPortion = selectedPortions[prod.id] || prod.baseWeight;
              const portionObj = prod.portions.find((p) => p.label === currentPortion) || prod.portions[0];

              return (
                <div key={prod.id} className="bg-white rounded-2xl border border-[#EAE2D5] p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-[4/3] w-full rounded-xl overflow-hidden mb-3.5 bg-gray-100">
                    <img
                      src={prod.img}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                      }}
                    />
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-[#1C130D] mb-1.5 truncate" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="flex items-baseline gap-1.5 mb-3.5">
                    <span className="text-xl sm:text-2xl font-bold text-[#1C130D]">₹{portionObj.price}</span>
                    <span className="text-xs text-gray-500">/ {portionObj.label}</span>
                  </div>

                  {/* Portion Selectors */}
                  <div className="flex items-center gap-1.5 mb-4">
                    {prod.portions.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          currentPortion === p.label
                            ? 'bg-[#C59334] text-white border-[#C59334] shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
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
                    className="mt-auto w-full py-2.5 px-3 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border-0"
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
