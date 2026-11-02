import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function PreOrderTopBar() {
  const { navigateTo, currentView } = useCart();
  const [closed, setClosed] = useState(false);

  if (closed || currentView === 'menu') return null;

  return (
    <div className="stardust-topbar font-lato">
      <div className="stardust-topbar__inner">
        <div className="stardust-topbar__content">
          <span className="stardust-topbar__badge">PRE-ORDERS OPEN</span>
          <span className="stardust-topbar__msg">
            Fresh morning batches available! Pre-order online for zero-wait pickup at our Krishnagiri NH 44 counter.
          </span>
        </div>
        <button
          type="button"
          className="stardust-topbar__cta"
          onClick={() => {
            window.location.hash = '#menu';
            navigateTo('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span>Click to Pre-Order</span>
          <span className="stardust-topbar__arrow">↗</span>
        </button>
      </div>
      <button
        type="button"
        className="stardust-topbar__close"
        onClick={() => setClosed(true)}
        aria-label="Close announcement"
      >
        ✕
      </button>
    </div>
  );
}

