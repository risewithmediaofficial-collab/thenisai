import { useCart } from '../../context/CartContext';

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
    <section className="bg-gradient-to-br from-[#FFF9EE] to-[#FAF2E3] border-b border-[#EAE2D5] py-8 sm:py-12 md:py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline & Action Buttons with Professional Unified Alignment */}
          <div className="lg:col-span-7 flex flex-col justify-center items-start text-left">
            <span className="inline-block text-[#7B1812] uppercase font-bold text-xs sm:text-sm tracking-wider mb-2.5">
              NH 44 Highway, Krishnagiri · Since 2006
            </span>

            <h1 className="font-display text-[#1C130D] text-3xl sm:text-4xl md:text-5xl lg:text-[50px] leading-[1.18] font-bold mb-4 tracking-tight">
              Pure Cow Milk Palkova &amp; Traditional Sweets
            </h1>

            <p className="text-[#5C4A3E] text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mb-6 sm:mb-8 font-sans">
              Freshly prepared every day using 100% pure cow milk and pure ghee. Stop by our shop on the Bangalore–Salem highway or pre-order online for instant pickup with zero waiting time.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 w-full sm:w-auto">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#7B1812] hover:bg-[#63120D] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border-0 text-center"
                onClick={handlePreOrder}
              >
                <span>Pre-Order for Pickup</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-sm sm:text-base border border-[#EAE2D5] shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer text-center"
                onClick={handleGifting}
              >
                <span>Special Sweet Boxes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean Food Photography */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none rounded-2xl overflow-hidden shadow-xl border-4 border-white aspect-[4/3] sm:aspect-[16/11]">
              <img
                src="/images/products/sweets_platter_hero.jpg"
                alt="Thenisai Artisanal Sweets Platter"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
