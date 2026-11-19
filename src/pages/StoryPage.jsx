import { useCart } from '../context/CartContext';

export default function StoryPage() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-gray-900">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-[#FFF9EE] to-[#FAF7F2] border-b border-amber-100/70 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#B32D00] mb-2 block">
            Bangalore–Salem Highway (NH 44), Krishnagiri · Est. 2006
          </span>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
            Our Heritage: Pure Cow Milk Sweets Since 2006
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
            Started nearly 20 years ago on the NH 44 highway corridor in Krishnagiri, Thenisai is famous for pure cow milk Palkova and authentic traditional ghee sweets.
          </p>
        </div>
      </section>

      {/* 2. Visual Story Showcase */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B32D00] block mb-2">
                Made Fresh Every Morning
              </span>
              <h2 className="font-display text-xl sm:text-3xl font-bold text-gray-900 leading-snug mb-4">
                Slow-Simmered for 4 Hours in Traditional Vessels
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                <p>
                  Every morning before sunrise, fresh milk arrives from local dairy farms. We slowly simmer the milk in traditional heavy brass vessels for over 4 continuous hours with pure sugar, stirring gently until it turns into rich, golden Palkova.
                </p>
                <p>
                  Zero milk powder, zero artificial thickeners, and zero preservatives. Just pure milk goodness that highway travellers, families, and regular commuters have loved since 2006.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePreOrder}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <span>Pre-Order Fresh Sweets</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div className="lg:col-span-5">
              <img
                src="/images/products/sweets_platter_hero.jpg"
                alt="Thenisai Artisanal Tradition"
                className="w-full h-64 sm:h-96 object-cover rounded-2xl shadow-lg border-4 border-white"
                loading="lazy"
              />
            </div>
          </div>

          {/* 3. 4 Timeless Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🥛</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">100% Farm Milk</h3>
                <p className="text-xs text-gray-500 leading-normal">Pure cow milk direct from local farms</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🍲</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">Brass Uruli Simmer</h3>
                <p className="text-xs text-gray-500 leading-normal">4-hour unhurried traditional reduction</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🌿</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">Zero Preservatives</h3>
                <p className="text-xs text-gray-500 leading-normal">Natural pure ghee and aromatic spices</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🚗</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">Highway Heritage</h3>
                <p className="text-xs text-gray-500 leading-normal">Beloved NH 44 landmark since 2006</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
