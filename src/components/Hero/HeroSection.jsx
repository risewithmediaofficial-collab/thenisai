import { useCart } from '../../context/CartContext';
import MaskRiseText from '../Common/MaskRiseText';

export default function HeroSection() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGifting = () => {
    const el = document.getElementById('gifting-banner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#collection';
      navigateTo('storefront');
    }
  };

  return (
    <section className="relative bg-[#FFF9EE] overflow-hidden min-h-[calc(100vh-114px)] lg:h-[calc(100vh-114px)] flex items-center py-3 sm:py-4 lg:py-4 border-b border-[#EAE2D5] font-sans">
      {/* Soft Bottom Milk Wave matching reference design */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 sm:h-11 md:h-13 lg:h-14 object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M0,45 C320,85 680,15 1080,55 C1260,70 1380,60 1440,50 L1440,90 L0,90 Z"
            fill="#FAF0DD"
            opacity="0.9"
          />
          <path
            d="M0,60 C360,95 740,35 1140,70 C1300,82 1400,74 1440,68 L1440,90 L0,90 Z"
            fill="#F5E8CF"
            opacity="0.65"
          />
        </svg>
      </div>

      {/* Bottom-Left Authentic Heritage Cow & Brass Milk Pot Illustration */}
      <div className="absolute bottom-0 left-0 z-10 pointer-events-none select-none w-[110px] xs:w-[130px] sm:w-[155px] md:w-[175px] lg:w-[195px] xl:w-[225px] opacity-50 sm:opacity-80 lg:opacity-100 transition-all duration-300">
        <img
          src="/images/branding/cow-hero-section.png"
          alt="Traditional Cow Milk Palkova Heritage"
          className="w-full h-auto object-contain object-bottom filter drop-shadow-sm"
          loading="eager"
        />
      </div>

      {/* Main Content Grid */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Left Column: Headlines, Trust Badges, Buttons */}
          <div className="lg:col-span-7 flex flex-col justify-center items-start text-left sm:pl-0 md:pl-2 lg:pl-16 xl:pl-22">
            <MaskRiseText
              as="span"
              delay={0.05}
              className="font-museo uppercase font-bold text-[10.5px] sm:text-xs tracking-[0.08em] text-[#C55018] mb-1.5 inline-block"
            >
              NH 44 Highway, Krishnagiri · Since 2006
            </MaskRiseText>

            <MaskRiseText
              as="h1"
              className="font-shantell font-extrabold text-[#161B26] text-2xl sm:text-3xl md:text-4xl lg:text-[34px] xl:text-[42px] leading-[1.12] mb-2 sm:mb-2.5 tracking-tight"
              lineClassName="font-shantell whitespace-normal sm:whitespace-nowrap"
              lines={['Pure Cow Milk Palkova', '& Traditional Sweets']}
              delay={0.12}
              stagger={0.09}
            />

            <MaskRiseText
              as="p"
              delay={0.28}
              duration={0.65}
              className="font-museo text-[#5C5256] text-xs sm:text-[13px] lg:text-[13.5px] xl:text-[14px] leading-relaxed max-w-lg mb-3 sm:mb-3.5"
            >
              Freshly prepared every day using 100% pure cow milk and pure ghee. Stop by our shop on the Bangalore–Salem highway or pre-order online for instant pickup with zero waiting time.
            </MaskRiseText>

            {/* 3 Trust Badges: 100% Pure Cow Milk, Pure Ghee, Traditional Recipes */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5 mb-3.5 sm:mb-4">
              {/* Badge 1: 100% Pure Cow Milk */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEE9B5] flex items-center justify-center text-[#7B1812] flex-shrink-0 shadow-2xs border border-amber-300/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B1812" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 6C5 4 3 5 3 7c0 3 2 5 4 5" />
                    <path d="M17 6c2-2 4-1 4 1 0 3-2 5-4 5" />
                    <ellipse cx="12" cy="14" rx="7" ry="6" />
                    <circle cx="9.5" cy="12.5" r="1.5" fill="#7B1812" />
                    <circle cx="14.5" cy="12.5" r="1.5" fill="#7B1812" />
                    <ellipse cx="12" cy="16" rx="3" ry="2" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs sm:text-sm text-[#161B26]">100%</span>
                  <span className="block text-[11px] sm:text-xs text-[#5C5256] font-medium">Pure Cow Milk</span>
                </div>
              </div>

              {/* Badge 2: Pure Ghee */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEE9B5] flex items-center justify-center text-[#7B1812] flex-shrink-0 shadow-2xs border border-amber-300/60">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B1812" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 5h8v2H8z" fill="#7B1812" />
                    <path d="M6 7c0 0-2 4-2 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-7-2-7H6z" />
                    <ellipse cx="12" cy="7" rx="4" ry="1.5" />
                    <path d="M10 12c1 1 3 1 4 0" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs sm:text-sm text-[#161B26]">Pure</span>
                  <span className="block text-[11px] sm:text-xs text-[#5C5256] font-medium">Ghee</span>
                </div>
              </div>

              {/* Badge 3: Traditional Recipes */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEE9B5] flex items-center justify-center text-[#7B1812] flex-shrink-0 shadow-2xs border border-amber-300/60">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B1812" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 4 13a9 9 0 0 1 16-6c0 6-5 13-9 13Z" />
                    <path d="M8 16c2-3 5-6 8-8" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-xs sm:text-sm text-[#161B26]">Traditional</span>
                  <span className="block text-[11px] sm:text-xs text-[#5C5256] font-medium">Recipes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row items-center justify-start gap-3 w-full sm:w-auto">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#7B1812] hover:bg-[#63120D] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border-0 text-center"
                onClick={handlePreOrder}
              >
                <span>Pre-Order for Pickup</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-xs sm:text-sm border border-[#5C3D1E]/40 shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer text-center"
                onClick={handleGifting}
              >
                <span>Special Sweet Boxes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Organic Curved Sweets Platter with Decorative Sparkles */}
          <div className="lg:col-span-5 flex justify-center items-center relative mt-3 lg:mt-0">
            {/* Outer Organic Warm Golden Frame */}
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-[310px] lg:max-w-[340px] xl:max-w-[390px]">
              {/* Top-Left Radiating Sun Rays */}
              <div className="absolute -top-3 -left-2 sm:-top-4 sm:-left-3 z-20 pointer-events-none">
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" stroke="#E5A835" strokeWidth="3.5" strokeLinecap="round">
                  <line x1="12" y1="28" x2="5" y2="34" />
                  <line x1="20" y1="22" x2="16" y2="10" />
                  <line x1="28" y1="24" x2="36" y2="17" />
                </svg>
              </div>

              {/* Top-Right Radiating Sun Rays */}
              <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-3 z-20 pointer-events-none">
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" stroke="#E5A835" strokeWidth="3.5" strokeLinecap="round">
                  <line x1="14" y1="24" x2="6" y2="18" />
                  <line x1="20" y1="20" x2="24" y2="8" />
                  <line x1="26" y1="22" x2="34" y2="18" />
                </svg>
              </div>

              {/* Golden Organic Aura Backdrop */}
              <div
                className="absolute inset-0 -m-2 sm:-m-2.5 bg-gradient-to-br from-[#F8CE73] to-[#F1B943] opacity-90 shadow-lg"
                style={{
                  borderRadius: '44% 56% 62% 38% / 42% 48% 52% 58%',
                  transform: 'rotate(-2deg)',
                }}
              />

              {/* Inner Organic Image Container with Thick Golden Border */}
              <div
                className="relative overflow-hidden border-[4px] sm:border-[5px] border-[#D99524] shadow-xl bg-amber-50 aspect-square"
                style={{
                  borderRadius: '48% 52% 58% 42% / 46% 54% 46% 54%',
                }}
              >
                <img
                  src="/images/products/sweets_platter_hero.jpg"
                  alt="Thenisai Traditional Sweets Platter"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/palkova_hero.webp';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
