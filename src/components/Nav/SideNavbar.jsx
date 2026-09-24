import React, { useLayoutEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
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
  const { navigateTo, recycleBinBills, recycleBinProducts, pendingPreOrdersCount = 0 } = useCart();
  const sidebarRef = useRef(null);

  // Admin and POS are separate route views. Preserve the sidebar position when
  // changing between them so a navigation click never throws the menu to top.
  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return undefined;

    const savedPosition = Number(sessionStorage.getItem('thenisai_sidebar_scroll_top'));
    if (Number.isFinite(savedPosition)) sidebar.scrollTop = savedPosition;

    const savePosition = () => {
      sessionStorage.setItem('thenisai_sidebar_scroll_top', String(sidebar.scrollTop));
    };
    sidebar.addEventListener('scroll', savePosition, { passive: true });
    return () => {
      savePosition();
      sidebar.removeEventListener('scroll', savePosition);
    };
  }, []);

  const handleNav = (action) => {
    if (onCloseMobile) onCloseMobile();
    if (typeof action === 'function') {
      action();
    }
  };

  const handleSidebarAction = (action) => (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    handleNav(action);
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

      <aside ref={sidebarRef} className={`pos-sidebar ${isMobileOpen ? 'mobile-open' : ''}`} data-lenis-prevent>
        {/* Brand Header */}
        <div className="pos-sidebar__brand">
          <div className="sidebar-brand-icon">
            <img src="/images/branding/logo-icon.webp" alt="Thenisai" className="sidebar-brand-logo-img" />
          </div>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-brand-title">THENISAI</h2>
            <span className="sidebar-brand-subtitle">
              {(user?.role === 'admin' && !currentSection?.startsWith('pos')) ? 'Admin Portal' : 'Billing Counter'}
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
          {((user?.role === 'admin' && !currentSection?.startsWith('pos')) || currentSection?.startsWith('admin')) ? (
            /* ADMIN VIEW: UNIFIED STORE & COUNTER MANAGEMENT WORKSPACE */
            <>
              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">COUNTER &amp; PRE-ORDERS</span>

                {/* 1. POS Billing */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-billing' || currentSection === 'pos-register' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-billing');
                      else navigateTo('admin', 'billing');
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

                {/* 2. Pre-Orders (Customer Website) */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-preorders' || currentSection === 'pos-preorders' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-preorders');
                      else navigateTo('admin', 'preorders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="nav-text">Pre-Orders</span>
                  {pendingPreOrdersCount > 0 && (
                    <span className="nav-badge alert" style={{ background: '#d97706', color: '#fff' }}>
                      {pendingPreOrdersCount} New
                    </span>
                  )}
                </button>

                {/* 3. Shift Bills & Daily Revenue */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-shift-bills' || currentSection === 'admin-daily-revenue' || currentSection === 'pos-daily-sales' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-shift-bills');
                      else navigateTo('admin', 'shift-bills');
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
                  <span className="nav-text">Shift Bills</span>
                </button>
              </div>

              <div className="sidebar-nav-group">
                <span className="sidebar-nav-label">STORE &amp; AUDIT</span>

                {/* 4. Products & Inventory */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-inventory' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-inventory');
                      else navigateTo('admin', 'inventory');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="nav-text">Products &amp; Inventory</span>
                </button>

                {/* 4b. Company Manager / Godown Stock Portal */}
                <button
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() =>
                    handleNav(() => {
                      navigateTo('manager');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="nav-text">Godown Stock Portal</span>
                </button>

                {/* 5. Sales & Ledger */}
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

                {/* 6. Activity Audit Logs */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-activity-logs' || currentSection === 'admin-price-logs' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-activity-logs');
                      else navigateTo('admin', 'activity-logs');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                  </svg>
                  <span className="nav-text">Activity Audit Logs</span>
                </button>

                {/* 7. Recycle Bin (30 Days) */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-recycle-bin' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-recycle-bin');
                      else navigateTo('admin', 'recycle-bin');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span className="nav-text">Recycle Bin (30 Days)</span>
                  {((recycleBinBills?.length || 0) + (recycleBinProducts?.length || 0)) > 0 && (
                    <span className="nav-badge" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                      {(recycleBinBills?.length || 0) + (recycleBinProducts?.length || 0)}
                    </span>
                  )}
                </button>

                {/* 8. Staff Accounts */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'admin-staff' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('admin-staff');
                      else navigateTo('admin', 'staff');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="nav-text">Staff Accounts</span>
                </button>
              </div>
            </>
          ) : (
            /* POS BILLING VIEW: CLEAN POS COUNTER WORKSPACE */
            <>
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

                {/* Pre-Orders (Customer Website) */}
                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-preorders' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-preorders');
                      else navigateTo('billing', 'preorders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="nav-text">Pre-Orders</span>
                  {pendingPreOrdersCount > 0 && (
                    <span className="nav-badge alert" style={{ background: '#d97706', color: '#fff' }}>
                      {pendingPreOrdersCount} New
                    </span>
                  )}
                </button>

                {user?.role !== 'admin' && (
                  <button
                    type="button"
                    className={`sidebar-nav-item ${currentSection === 'pos-inventory' ? 'active' : ''}`}
                    onClick={() =>
                      handleNav(() => {
                        if (onSelectSection) onSelectSection('pos-inventory');
                        else navigateTo('billing', 'inventory');
                      })
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span className="nav-text">Products &amp; Inventory</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-daily-sales' || currentSection === 'pos-bills' ? 'active' : ''}`}
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
                  <span className="nav-text">{user?.role === 'admin' ? 'Shift Bills & Daily Revenue' : "Today's Shift Bills & Revenue"}</span>
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${currentSection === 'pos-preorders' || currentSection === 'admin-preorders' ? 'active' : ''}`}
                  onClick={() =>
                    handleNav(() => {
                      if (onSelectSection) onSelectSection('pos-preorders');
                      else navigateTo('billing', 'preorders');
                    })
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="nav-text">Pre-Orders</span>
                  {pendingPreOrdersCount > 0 && (
                    <span className="nav-badge alert" style={{ background: '#d97706', color: '#fff' }}>
                      {pendingPreOrdersCount} New
                    </span>
                  )}
                </button>
              </div>

            </>
          )}

          {/* STORE ACCESS (Always shown) */}
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
              <span className="sidebar-user-name">
                {(user?.role === 'admin' && !currentSection?.startsWith('pos')) ? (user?.name || 'S. Ramanathan') : (user?.role === 'cashier' ? (user?.name || 'M. Kannan') : 'M. Kannan')}
              </span>
              <span className="sidebar-user-desk">
                {(user?.role === 'admin' && !currentSection?.startsWith('pos')) ? 'Kitchen Operations Head' : 'Counter Cashier'}
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
