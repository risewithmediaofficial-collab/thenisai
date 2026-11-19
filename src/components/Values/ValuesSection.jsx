import { useCart } from '../../context/CartContext';

export default function ValuesSection() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContact = () => {
    window.location.hash = '#contact';
    navigateTo('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMaps = () => {
    window.open('https://maps.google.com/?q=Thenisai+Palkova+and+Sweets+Krishnagiri', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="bg-white py-12 sm:py-16 border-b border-[#EAE2D5] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. LUXURY FESTIVE & WEDDING GIFTING BANNER */}
        <div id="gifting-banner" className="bg-gradient-to-br from-[#7B1812] to-[#59100C] text-white rounded-3xl p-6 sm:p-10 lg:p-12 mb-12 sm:mb-16 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="text-[#F8D68B] uppercase font-bold text-xs sm:text-sm tracking-wider block mb-2">
                Gift Boxes &amp; Bulk Orders
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight">
                Sweet Boxes for Weddings &amp; Festivals
              </h2>
              <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed mb-6 max-w-xl">
                Freshly packed sweet gift boxes for family celebrations, highway commuters, and gifting. Choose your favorite sweets and get them packed in premium gift boxes.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-5 py-3 rounded-full bg-[#C59334] hover:bg-[#A97922] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-2 border-0 cursor-pointer"
                  onClick={handlePreOrder}
                >
                  <span>Order Sweet Boxes</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <a
                  href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20would%20like%20to%20inquire%20about%20Bulk%20Wedding%20Sweet%20Boxes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/25 transition-all active:scale-95 no-underline inline-flex items-center gap-2"
                >
                  <span>WhatsApp Bulk Inquiry</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-lg border-2 border-white/20 bg-black/20">
                <img
                  src="/images/products/sweet_box.webp"
                  alt="Thenisai Luxury Sweet Hampers"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. HIGHWAY STORE LOCATOR & VISIT CARD */}
        <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#EAE2D5] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="text-[#7B1812] uppercase font-bold text-xs sm:text-sm tracking-wider block mb-2">
                Store Location
              </span>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C130D] mb-6">
                Visit Our Krishnagiri Sweet Shop
              </h3>

              {/* Reduced Content Specs */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3.5 p-3.5 sm:p-4 bg-white rounded-xl border border-[#EAE2D5] shadow-xs">
                  <span className="text-[#7B1812] mt-0.5 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Address</span>
                    <span className="block text-xs sm:text-sm font-semibold text-[#1C130D]">
                      Opp. HP Petrol Bunk, Bangalore–Salem Highway (NH 44), Krishnagiri
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 sm:p-4 bg-white rounded-xl border border-[#EAE2D5] shadow-xs">
                  <span className="text-[#7B1812] mt-0.5 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Hours</span>
                    <span className="block text-xs sm:text-sm font-semibold text-[#1C130D]">
                      Daily 6:00 AM – 10:30 PM · Fresh morning batches ready by 7:30 AM
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 sm:p-4 bg-white rounded-xl border border-[#EAE2D5] shadow-xs">
                  <span className="text-[#7B1812] mt-0.5 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Direct Desk</span>
                    <span className="block text-xs sm:text-sm font-semibold text-[#1C130D]">
                      +91 93448 93547 · Call or WhatsApp for Orders
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-5 py-3 rounded-full bg-[#7B1812] hover:bg-[#63120D] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all border-0 cursor-pointer"
                  onClick={handleMaps}
                >
                  <span>Open in Google Maps</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="px-5 py-3 rounded-full bg-white hover:bg-gray-50 text-[#2C2018] font-bold text-xs sm:text-sm inline-flex items-center gap-2 border border-[#EAE2D5] shadow-xs active:scale-95 transition-all cursor-pointer"
                  onClick={handleContact}
                >
                  <span>Store Details &amp; Contact</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-lg border-4 border-white bg-gray-100">
                <img
                  src="/images/products/sweets_platter_hero.jpg"
                  alt="Thenisai Sweets Storefront"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
