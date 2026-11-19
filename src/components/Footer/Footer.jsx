import { useCart } from '../../context/CartContext';

export default function Footer() {
  const { navigateTo } = useCart();

  const handleNav = (view, hash = '') => {
    if (hash) {
      window.location.hash = hash;
    } else {
      window.location.hash = '';
    }
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C130D] text-white py-12 sm:py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12 pb-12 border-b border-white/10">
          {/* Col 1: Brand Logo & Tagline */}
          <div className="flex flex-col items-start">
            <div
              className="inline-block p-2 bg-white rounded-xl mb-4 cursor-pointer"
              onClick={() => handleNav('storefront', '')}
              title="Thenisai Sweets"
            >
              <img
                src="/images/branding/logo.webp"
                alt="Thenisai Sweets Logo"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/images/branding/logo-icon.png';
                }}
              />
            </div>

            <span className="font-bold tracking-tight text-[#C59334] text-lg sm:text-xl block mb-2 leading-snug">
              Traditional Pure Cow Milk Sweets &middot; Est. 2006
            </span>

            <p className="text-white/70 text-xs sm:text-sm leading-relaxed m-0">
              Fresh cow milk Palkova and traditional sweets made daily on the Bangalore–Salem Highway (NH 44), Krishnagiri.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/90 mb-4">Quick Links</h4>
            <div className="flex flex-col space-y-2.5 text-xs sm:text-sm">
              <a href="#home" className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline" onClick={(e) => { e.preventDefault(); handleNav('storefront', ''); }}>Home</a>
              <a href="#menu" className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline" onClick={(e) => { e.preventDefault(); handleNav('menu', '#menu'); }}>Pre-Order Sweets</a>
              <a href="#story" className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline" onClick={(e) => { e.preventDefault(); handleNav('story', '#story'); }}>Our Heritage &amp; Story</a>
              <a href="#contact" className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline" onClick={(e) => { e.preventDefault(); handleNav('contact', '#contact'); }}>Visit &amp; Contact Us</a>
            </div>
          </div>

          {/* Col 3: Highway Store */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/90 mb-4">Highway Store</h4>
            <div className="flex flex-col space-y-2 text-xs sm:text-sm text-white/70">
              <span>NH 44 Highway Pitstop</span>
              <span>Opp. HP Petrol Bunk</span>
              <span>Nattamai Kottai, Krishnagiri &ndash; 635001</span>
              <span className="text-[#F8D68B] font-semibold pt-1">
                ⏰ 6:00 AM &ndash; 10:30 PM Daily
              </span>
              <a href="tel:+919344893547" className="text-[#F8D68B] font-semibold no-underline hover:underline">
                📞 +91 93448 93547
              </a>
            </div>
          </div>

          {/* Col 4: Staff Portal */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/90 mb-4">Staff Portal</h4>
            <div className="flex flex-col space-y-2.5 text-xs sm:text-sm">
              <a
                href="#admin"
                className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline"
                onClick={(e) => { e.preventDefault(); handleNav('admin', '#admin'); }}
              >
                Admin Dashboard
              </a>
              <a
                href="#billing"
                className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline"
                onClick={(e) => { e.preventDefault(); handleNav('billing', '#billing'); }}
              >
                POS Billing Counter
              </a>
              <a
                href="#manager"
                className="text-white/70 hover:text-[#F8D68B] transition-colors no-underline"
                onClick={(e) => { e.preventDefault(); handleNav('manager', '#manager'); }}
              >
                Stock Manager
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <span>&copy; 2006&ndash;2026 Thenisai Palkova &amp; Sweets. Handcrafted in Tamil Nadu.</span>
          <div className="flex items-center gap-3">
            <a href="https://instagram.com/thenisai_sweets" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline">Instagram</a>
            <span>&middot;</span>
            <a href="https://facebook.com/thenisaisweets" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline">Facebook</a>
            <span>&middot;</span>
            <a href="https://wa.me/919344893547" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline text-[#F8D68B]">WhatsApp Order</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
