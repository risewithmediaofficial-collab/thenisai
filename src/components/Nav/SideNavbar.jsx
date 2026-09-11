import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './SideNavbar.css';

export default function SideNavbar({
  currentSection, // 'pos-register' | 'pos-bills' | 'admin'
  onSelectSection,
  onOpenRefill,
  onOpenAddStock,
  onOpenOnlineOrders,
  pendingOnlineCount = 0,
  shiftBillsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const { user, logout } = useAuth();
  const { navigateTo } = useCart();

  const handleNav = (action) => {
    if (onCloseMobile) onCloseMobile();
    if (typeof action === 'function') {
      action();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="pos-sidebar-backdrop mobile-only"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`pos-sidebar ${isMobileOpen ? 'mobile-open' : ''}`} data-lenis-prevent>
        {/* Brand Header */}
        <div className="pos-sidebar__brand">
          <div className="sidebar-brand-icon">☕</div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">THENISAI</h2>
            <span className="sidebar-brand-subtitle">
              {currentSection === 'admin' ? 'Admin Portal' : 'Billing Counter'}
            </span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              className="sidebar-mobile-close mobile-only"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              ✕
            </button>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="pos-sidebar__nav">
          {/* Admin Workspace Tabs (Shown when in Admin module) */}
          {currentSection?.startsWith('admin') ? (
            <div className="sidebar-nav-group">
              <span className="sidebar-nav-label">ADMIN MODULES</span>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'admin-orders' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#admin';
                    if (onSelectSection) onSelectSection('admin-orders');
                  })
                }
              >
                <span className="nav-icon">📦</span>
                <span className="nav-text">Online Orders</span>
                {pendingOnlineCount > 0 && (
                  <span className="nav-badge alert">{pendingOnlineCount} New</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'admin-inventory' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#admin';
                    if (onSelectSection) onSelectSection('admin-inventory');
                  })
                }
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Kitchen Stock</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'admin-sales' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#admin';
                    if (onSelectSection) onSelectSection('admin-sales');
                  })
                }
              >
                <span className="nav-icon">📈</span>
                <span className="nav-text">Sales & Ledger</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-nav-group">
              <span className="sidebar-nav-label">POS WORKSPACE</span>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'pos-register' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#billing';
                    if (onSelectSection) onSelectSection('pos-register');
                  })
                }
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">POS Billing</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'pos-bills' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#billing/bills';
                    if (onSelectSection) onSelectSection('pos-bills');
                  })
                }
              >
                <span className="nav-icon">🧾</span>
                <span className="nav-text">Shift Bills</span>
                {shiftBillsCount > 0 && (
                  <span className="nav-badge">{shiftBillsCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${currentSection === 'pos-online' ? 'active' : ''}`}
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#billing/orders';
                    if (onSelectSection) onSelectSection('pos-online');
                  })
                }
              >
                <span className="nav-icon">🌐</span>
                <span className="nav-text">Online Orders</span>
                {pendingOnlineCount > 0 && (
                  <span className="nav-badge alert">{pendingOnlineCount} New</span>
                )}
              </button>
            </div>
          )}

          <div className="sidebar-nav-group">
            <span className="sidebar-nav-label">INVENTORY</span>

            <button
              type="button"
              className={`sidebar-nav-item ${currentSection === 'pos-inventory' ? 'active' : ''}`}
              onClick={() =>
                handleNav(() => {
                  window.location.hash = '#billing/inventory';
                  if (onSelectSection) onSelectSection('pos-inventory');
                })
              }
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Counter Stock</span>
            </button>

            {onOpenRefill && (
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => handleNav(onOpenRefill)}
              >
                <span className="nav-icon">🔄</span>
                <span className="nav-text">Refill Trays</span>
              </button>
            )}

            {onOpenAddStock && (
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => handleNav(onOpenAddStock)}
              >
                <span className="nav-icon">➕</span>
                <span className="nav-text">Add Stock</span>
              </button>
            )}
          </div>

          <div className="sidebar-nav-group">
            <span className="sidebar-nav-label">SWITCH VIEW</span>

            {currentSection?.startsWith('admin') ? (
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() =>
                  handleNav(() => {
                    window.location.hash = '#billing';
                  })
                }
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">POS Billing Counter</span>
              </button>
            ) : (
              user?.role === 'admin' && (
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      window.location.hash = '#admin';
                      if (onSelectSection) onSelectSection('admin');
                    })
                  }
                >
                  <span className="nav-icon">👑</span>
                  <span className="nav-text">Admin Dashboard</span>
                </button>
              )
            )}

            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() =>
                handleNav(() => {
                  window.location.hash = '';
                })
              }
            >
              <span className="nav-icon">🏪</span>
              <span className="nav-text">Customer Store</span>
            </button>
          </div>
        </nav>

        {/* Cashier / Staff Profile & Logout */}
        <div className="pos-sidebar__footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">👤</div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.name || 'Cashier Desk'}</span>
              <span className="sidebar-user-desk">
                {user?.role === 'admin' ? 'Administrator' : (user?.counter || 'Terminal 01')}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              logout();
              window.location.hash = '';
            }}
            title="End staff session"
          >
            <span className="logout-icon">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
