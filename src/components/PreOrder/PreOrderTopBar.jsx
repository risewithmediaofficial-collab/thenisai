import { useCart } from '../../context/CartContext';

export default function PreOrderTopBar() {
  const { navigateTo } = useCart();

  const handlePreOrder = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="ks-topbar" role="region" aria-label="Store announcement">
      <div className="ks-container">
        <div className="ks-topbar__inner">
          <div className="ks-topbar__left">
            <span className="ks-topbar__item">
              <span>NH 44 Highway Store: Opp. HP Petrol Bunk, Krishnagiri</span>
            </span>
            <span className="ks-topbar__sep">·</span>
            <span className="ks-topbar__item">
              <span>Open Daily: 6:00 AM – 10:30 PM</span>
            </span>
          </div>

          <div className="ks-topbar__right">
            <span
              className="ks-topbar__item ks-topbar__link"
              onClick={handlePreOrder}
              style={{ cursor: 'pointer' }}
            >
              <strong>Zero-Wait Counter Pickup</strong> — Pre-Order Online
            </span>
            <span className="ks-topbar__sep">·</span>
            <a
              href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets,%20I%20would%20like%20to%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="ks-topbar__item ks-topbar__link"
            >
              WhatsApp: +91 93448 93547
            </a>
          </div>

          {/* Clean Single-line Mobile Announcement */}
          <div className="ks-topbar__mobile">
            <span onClick={handlePreOrder} style={{ cursor: 'pointer' }}>
              <strong>Zero-Wait Counter Pickup</strong> on NH 44 · 6 AM – 10:30 PM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
