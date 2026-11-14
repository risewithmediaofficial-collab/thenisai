import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function PreOrderTopBar() {
  const { navigateTo, currentView } = useCart();
  const [closed, setClosed] = useState(false);

  if (closed || currentView === 'menu') return null;

  const tickerItems = [
    '⚡ EXPRESS NH 44 HIGHWAY COUNTER PICKUP',
    '100% PURE COW MILK PALKOVA',
    'SLOW-SIMMERED IN BRASS URULIS SINCE 2006',
    'ZERO WAITING TIME ON NH 44',
    'PRE-ORDER SWEETS ONLINE FOR INSTANT STORE PICKUP',
  ];

  return (
    <div
      className="thenisai-ticker"
      onClick={() => {
        window.location.hash = '#menu';
        navigateTo('menu');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      style={{ cursor: 'pointer' }}
      title="Click to Pre-Order Sweets Online"
    >
      <div className="thenisai-ticker__track">
        {/* Double array for seamless loop */}
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="thenisai-ticker__item">
            <span>{item}</span>
            <span className="thenisai-ticker__dot">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
