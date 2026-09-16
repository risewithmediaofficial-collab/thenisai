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
          <div className="sidebar-brand-icon">
            <img src="/logo-icon.png" alt="Thenisai" className="sidebar-brand-logo-img" />
          </div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">THENISAI</h2>
            <span className="sidebar-brand-subtitle">
              {user?.role === 'admin'
                ? (currentSection?.startsWith('admin') ? 'Admin Portal' : 'Billing Counter')
                : 'Billing Counter'}
            </span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              className="sidebar-mobile-close mobile-only"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="pos-sidebar__nav">
          {user?.role === 'admin' ? (
            <>
              {/* 1. ADMIN MANAGEMENT (ONLINE ORDERS, SALES & LEDGER, DAILY REVENUE) */}
              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">ADMIN MANAGEMENT</span>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-orders' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-orders');
                      else navigateTo('admin', 'orders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="nav-text">Online Orders</span>
                  {pendingOnlineCount > 0 && (
                    <span className="nav-badge alert">{pendingOnlineCount} New</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-sales' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-sales');
                      else navigateTo('admin', 'sales');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <span className="nav-text">Sales &amp; Ledger</span>
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-daily-revenue' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-daily-revenue');
                      else navigateTo('admin', 'daily-revenue');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                  </svg>
                  <span className="nav-text">Daily Revenue</span>
                </button>
              </div>

              {/* 2. POS COUNTER WORKSPACE */}
              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">POS BILLING COUNTER</span>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-register' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-register');
                      else navigateTo('billing', 'register');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span className="nav-text">POS Billing</span>
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-bills' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-bills');
                      else navigateTo('billing', 'bills');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
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
                      if (onSelectSection) onSelectSection('pos-online');
                      else navigateTo('billing', 'orders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span className="nav-text">Dispatch Queue</span>
                  {pendingOnlineCount > 0 && (
                    <span className="nav-badge alert">{pendingOnlineCount} New</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-daily-sales' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-daily-sales');
                      else navigateTo('billing', 'daily-sales');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                  </svg>
                  <span className="nav-text">Day Settlement</span>
                </button>
              </div>

              {/* 3. STORE ACCESS */}
              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">STORE ACCESS</span>

                <button
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('storefront');
                      else navigateTo('storefront');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                    <path d="M2 7h20"/>
                  </svg>
                  <span className="nav-text">Customer Store</span>
                </button>
              </div>
            </>
          ) : (
            /* CASHIER ONLY VIEW */
            <>
              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">POS WORKSPACE</span>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-register' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-register');
                      else navigateTo('billing', 'register');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span className="nav-text">POS Billing</span>
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-bills' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-bills');
                      else navigateTo('billing', 'bills');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
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
                      if (onSelectSection) onSelectSection('pos-online');
                      else navigateTo('billing', 'orders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span className="nav-text">Online Orders</span>
                  {pendingOnlineCount > 0 && (
                    <span className="nav-badge alert">{pendingOnlineCount} New</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-daily-sales' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-daily-sales');
                      else navigateTo('billing', 'daily-sales');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                  </svg>
                  <span className="nav-text">Daily Revenue</span>
                </button>
              </div>

              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">STORE ACCESS</span>

                <button
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('storefront');
                      else navigateTo('storefront');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                    <path d="M2 7h20"/>
                  </svg>
                  <span className="nav-text">Customer Store</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Cashier / Staff Profile & Logout */}
        <div className="pos-sidebar__footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.name || 'Staff'}</span>
              <span className="sidebar-user-desk">
                {user?.role === 'admin' ? 'Administrator' : 'Billing Cashier'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={async () => {
              await logout();
              navigateTo('storefront');
            }}
            title="Log out of system"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-icon-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
