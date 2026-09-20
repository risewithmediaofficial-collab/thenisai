import { useState } from 'react';
import { useCart } from '../../context/CartContext';
export default function StaffSwitcher() {
  const { currentView, navigateTo, pendingOrdersCount } = useCart();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`staff-switcher-root ${collapsed ? 'collapsed' : ''}`}>
      <div className="staff-switcher__inner">
        <div className="staff-switcher__brand">
          <span className="staff-dot" />
          <span className="staff-label">Staff Portal</span>
          <button
            type="button"
            className="staff-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand staff portal' : 'Minimize staff portal'}
          >
            {collapsed ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="staff-switcher__links">
            <button
              type="button"
              className={`staff-link ${currentView === 'storefront' ? 'active' : ''}`}
              onClick={() => navigateTo('storefront')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Storefront</span>
            </button>

            <button
              type="button"
              className={`staff-link ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => navigateTo('admin')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Admin</span>
              {pendingOrdersCount > 0 && (
                <span className="staff-badge">{pendingOrdersCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`staff-link ${currentView === 'billing' ? 'active' : ''}`}
              onClick={() => navigateTo('billing')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M16 8h-8" />
                <path d="M16 12h-8" />
                <path d="M10 16h-2" />
              </svg>
              <span>POS Billing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
