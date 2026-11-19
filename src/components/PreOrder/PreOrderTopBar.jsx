import { useCart } from '../../context/CartContext';

export default function PreOrderTopBar() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#7B1812] text-white font-sans text-xs py-2 px-3 sm:px-6 border-b border-[#63120D]" role="region" aria-label="Store announcement">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Desktop Left */}
        <div className="hidden md:flex items-center gap-3 text-white/90">
          <span>NH 44 Highway Store: Opp. HP Petrol Bunk, Krishnagiri</span>
          <span className="text-white/40">·</span>
          <span>Open Daily: 6:00 AM – 10:30 PM</span>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-4 text-white/95">
          <button
            type="button"
            onClick={handlePreOrder}
            className="hover:text-[#F8D68B] transition-colors bg-transparent border-0 text-white cursor-pointer"
          >
            <strong className="text-[#F8D68B] font-bold">Zero-Wait Counter Pickup</strong> — Pre-Order Online
          </button>
          <span className="text-white/40">·</span>
          <a
            href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20would%20like%20to%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F8D68B] transition-colors text-white no-underline"
          >
            WhatsApp: +91 93448 93547
          </a>
        </div>

        {/* Mobile Single-line Centered Announcement */}
        <div className="flex md:hidden w-full items-center justify-center text-center truncate">
          <span onClick={handlePreOrder} className="cursor-pointer text-[11px] xs:text-xs tracking-wide">
            <strong className="text-[#F8D68B] font-bold">Zero-Wait Counter Pickup</strong> on NH 44 · 6 AM – 10:30 PM
          </span>
        </div>
      </div>
    </div>
  );
}
