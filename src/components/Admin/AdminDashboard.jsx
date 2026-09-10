import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG } from '../../data/sweetsData';
import AddStockModal from '../Inventory/AddStockModal';
import RefillStockModal from '../Inventory/RefillStockModal';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    inventory,
    acceptOrder,
    updateOrderStatus,
    addInventoryStock,
    openInvoice,
    navigateTo,
  } = useCart();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'sales'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'New' | 'Accepted' | 'Dispatched' | 'Delivered'
  const [searchTerm, setSearchTerm] = useState('');

  // Stock Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  useScrollLock(isAddStockOpen || isRefillOpen);

  // Calculate high-level KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const onlineOrders = orders.filter((o) => o.source === 'online');
  const counterSales = orders.filter((o) => o.source === 'walk-in');
  const pendingOrders = onlineOrders.filter((o) => o.status === 'New');
  const lowStockItems = inventory.filter((item) => item.stockKg <= item.minThreshold);

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      orderFilter === 'all'
        ? true
        : order.status?.toLowerCase() === orderFilter.toLowerCase();

    const matchesSearch =
      searchTerm.trim() === '' ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });



  return (
    <div className="admin-root">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header__brand">
          <h1 className="admin-title">Thenisai Sweets · Admin Portal</h1>
        </div>

        <div className="stock-header-actions">
          <div className="staff-logged-badge admin">
            <span>👑</span>
            <span>{user?.name || 'Admin'}</span>
          </div>

          <button
            type="button"
            className="btn-stock-action add"
            onClick={() => setIsAddStockOpen(true)}
            title="Add new kitchen batches or sweet varieties"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Stock</span>
          </button>

          <button
            type="button"
            className="btn-stock-action refill"
            onClick={() => setIsRefillOpen(true)}
            title="Quick refill of counter display trays"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Refill Stock</span>
          </button>

          <button
            type="button"
            className="btn-staff-logout"
            onClick={() => {
              logout();
              window.location.hash = '';
            }}
            title="Log out of Admin Portal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="admin-container">
        {/* KPI Cards Grid */}
        <section className="admin-kpi-grid">
          <div className="kpi-card revenue">
            <span className="kpi-label">Total Revenue</span>
            <div className="kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <span className="kpi-sub">Online + Store Counter</span>
          </div>

          <div className={`kpi-card pending ${pendingOrders.length > 0 ? 'pulse' : ''}`}>
            <span className="kpi-label">Pending Online Orders</span>
            <div className="kpi-value">{pendingOrders.length}</div>
            <span className="kpi-sub">
              {pendingOrders.length > 0 ? 'Requires immediate packing' : 'All clear'}
            </span>
          </div>

          <div className="kpi-card online">
            <span className="kpi-label">Total Online Orders</span>
            <div className="kpi-value">{onlineOrders.length}</div>
            <span className="kpi-sub">Deliveries across TN</span>
          </div>

          <div className={`kpi-card stock ${lowStockItems.length > 0 ? 'alert' : ''}`}>
            <span className="kpi-label">Low Stock Alerts</span>
            <div className="kpi-value">{lowStockItems.length}</div>
            <span className="kpi-sub">
              {lowStockItems.length > 0 ? `${lowStockItems.map((s) => s.name).join(', ')}` : 'Ample stock available'}
            </span>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>Online Orders</span>
            {pendingOrders.length > 0 && (
              <span className="tab-pill alert">{pendingOrders.length} New</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span>Kitchen Inventory & Batches</span>
            {lowStockItems.length > 0 && (
              <span className="tab-pill warning">{lowStockItems.length} Low</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <span>All Sales & Billing Log</span>
            <span className="tab-pill">{orders.length}</span>
          </button>
        </div>

        {/* =========================================
            TAB 1: ONLINE ORDERS PROCESSING
           ========================================= */}
        {activeTab === 'orders' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <div className="filter-chips">
                {['all', 'New', 'Accepted', 'Dispatched', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-chip ${orderFilter === st ? 'active' : ''}`}
                    onClick={() => setOrderFilter(st)}
                  >
                    {st === 'all' ? 'All Orders' : st}
                    {st === 'New' && pendingOrders.length > 0 && ` (${pendingOrders.length})`}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-tab-state">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3>No Orders Found</h3>
                <p>No orders currently match the selected filter.</p>
              </div>
            ) : (
              <div className="orders-cards-list">
                {filteredOrders.map((ord) => (
                  <div key={ord.id} className={`order-admin-card status-${ord.status?.toLowerCase()}`}>
                    <div className="order-admin-card__top">
                      <div className="order-id-group">
                        <span className="order-invoice-no">{ord.invoiceNumber}</span>
                        <span className="order-time-stamp">
                          {ord.orderDate} at {ord.orderTime}
                        </span>
                        <span className={`source-pill ${ord.source}`}>
                          {ord.source === 'online' ? '🌐 Online Delivery' : '🏪 In-Store Walk-in'}
                        </span>
                      </div>

                      <div className="order-status-badge">
                        <span className={`status-tag ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="order-admin-card__grid">
                      {/* Customer & Address */}
                      <div className="order-col customer">
                        <span className="col-heading">Customer & Dispatch Address</span>
                        <div className="customer-name">{ord.customer?.fullName}</div>
                        <div className="customer-contact">
                          <a href={`tel:${ord.customer?.phone}`}>📞 +91 {ord.customer?.phone}</a>
                          {ord.customer?.email && <span> · {ord.customer?.email}</span>}
                        </div>
                        {ord.shippingAddress && (
                          <div className="customer-address">
                            📍 {ord.shippingAddress.doorNo}, {ord.shippingAddress.street},{' '}
                            {ord.shippingAddress.city}, {ord.shippingAddress.state} -{' '}
                            {ord.shippingAddress.pincode}
                          </div>
                        )}
                        {ord.giftNote && (
                          <div className="gift-banner">
                            🎁 <em>"{ord.giftNote}"</em>
                          </div>
                        )}
                      </div>

                      {/* Items Ordered */}
                      <div className="order-col items">
                        <span className="col-heading">Items Ordered</span>
                        <div className="admin-items-list">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="admin-item-row">
                              <span className="it-name">{it.name}</span>
                              <span className="it-weight">({it.weight})</span>
                              <span className="it-qty">× {it.quantity}</span>
                              <span className="it-price">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-bar">
                          <span>Total Amount:</span>
                          <span className="total-amount-highlight">₹{ord.grandTotal}</span>
                          <span className="payment-pill-small">
                            {ord.paymentMethod === 'upi' ? 'Direct UPI' : 'Pay on Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Operations Actions */}
                      <div className="order-col actions">
                        <span className="col-heading">Actions & Processing</span>
                        <div className="admin-actions-group">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              className="act-btn accept"
                              onClick={() => acceptOrder(ord.id)}
                            >
                              ✓ Accept Order
                            </button>
                          )}

                          {ord.status === 'Accepted' && (
                            <button
                              type="button"
                              className="act-btn dispatch"
                              onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                              </svg>
                              Mark Dispatched
                            </button>
                          )}

                          {ord.status === 'Dispatched' && (
                            <button
                              type="button"
                              className="act-btn deliver"
                              onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Mark Delivered
                            </button>
                          )}

                          <button
                            type="button"
                            className="act-btn invoice"
                            onClick={() => openInvoice(ord)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                              <path d="M16 8h-8" />
                              <path d="M16 12h-8" />
                              <path d="M10 16h-2" />
                            </svg>
                            View / Print Tax Bill
                          </button>

                          {ord.customer?.phone && (
                            <a
                              href={`https://wa.me/91${ord.customer.phone}?text=Namaste%20${encodeURIComponent(
                                ord.customer.fullName
                              )},%20Thenisai%20Sweets%20has%20confirmed%20your%20order%20${ord.invoiceNumber}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="act-btn whatsapp"
                            >
                              💬 WhatsApp Customer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            TAB 2: KITCHEN INVENTORY & BATCHES
           ========================================= */}
        {activeTab === 'inventory' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <div className="toolbar-info">
                <h3 className="section-title">Fresh Sweet Batches & Daily Stock</h3>
                <p className="section-desc">
                  Inventory is automatically deducted when online or store counter orders are placed.
                </p>
              </div>

              <div className="stock-header-actions">
                <button
                  type="button"
                  className="btn-stock-action add"
                  onClick={() => setIsAddStockOpen(true)}
                  title="Add new kitchen production batches or sweet varieties"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Stock</span>
                </button>
                <button
                  type="button"
                  className="btn-stock-action refill"
                  onClick={() => setIsRefillOpen(true)}
                  title="Quick refill of counter display trays"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Refill Stock</span>
                </button>
              </div>
            </div>

            <div className="inventory-grid">
              {inventory.map((item) => {
                const isLow = item.stockKg <= item.minThreshold;
                const isCritical = item.stockKg <= item.minThreshold / 2;
                const catalogMatch = SWEETS_CATALOG.find((s) => s.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`inventory-card ${isCritical ? 'critical' : isLow ? 'low' : 'healthy'}`}
                  >
                    <div className="inv-card__header">
                      {catalogMatch?.image && (
                        <img
                          src={catalogMatch.image}
                          alt={item.name}
                          className="inv-card__thumb"
                        />
                      )}
                      <div>
                        <h4 className="inv-card__title">{item.name}</h4>
                        <span className="inv-card__hsn">HSN: {catalogMatch?.hsn || '2106'}</span>
                      </div>

                      <span className={`stock-status-pill ${isCritical ? 'critical' : isLow ? 'low' : 'healthy'}`}>
                        {isCritical ? 'Critical Low' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    <div className="inv-card__body">
                      <div className="stock-number-row">
                        <span className="stock-number">{item.stockKg}</span>
                        <span className="stock-unit">kg available</span>
                      </div>

                      <div className="stock-progress-track">
                        <div
                          className="stock-progress-bar"
                          style={{
                            width: `${Math.min(100, Math.round((item.stockKg / 50) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="batch-meta">
                        <span>Last Batch: <strong>{item.batchDate}</strong></span>
                        <span>Note: <em>{item.batchNote}</em></span>
                      </div>
                    </div>

                    <div className="inv-card__actions">
                      <span className="quick-add-label">Quick Restock:</span>
                      <div className="quick-add-chips">
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 5, 'Quick +5kg Uruli Batch')}
                        >
                          +5 kg
                        </button>
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 10, 'Quick +10kg Uruli Batch')}
                        >
                          +10 kg
                        </button>
                        <button
                          type="button"
                          className="quick-kg-btn"
                          onClick={() => addInventoryStock(item.id, 25, 'Kitchen Bulk Batch')}
                        >
                          +25 kg
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================
            TAB 3: ALL SALES & BILLING LOG
           ========================================= */}
        {activeTab === 'sales' && (
          <section className="tab-content">
            <div className="tab-toolbar">
              <h3 className="section-title">Complete Sales & Tax Invoices Log</h3>
              <div className="sales-stats-strip">
                <span>Total Bills: <strong>{orders.length}</strong></span>
                <span>Online Deliveries: <strong>{onlineOrders.length}</strong></span>
                <span>Counter Sales: <strong>{counterSales.length}</strong></span>
              </div>
            </div>

            <div className="sales-table-card">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date & Time</th>
                    <th>Source</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <strong>{ord.invoiceNumber}</strong>
                      </td>
                      <td>{ord.orderDate} {ord.orderTime}</td>
                      <td>
                        <span className={`source-pill ${ord.source}`}>
                          {ord.source === 'online' ? 'Online' : 'In-Store'}
                        </span>
                      </td>
                      <td>
                        <strong>{ord.customer?.fullName || 'Walk-in Customer'}</strong>
                        {ord.customer?.phone && <div className="sub-phone">📞 {ord.customer.phone}</div>}
                      </td>
                      <td>
                        {ord.items?.length} items ({ord.items?.map((it) => it.name).join(', ')})
                      </td>
                      <td>
                        {ord.paymentMethod === 'upi' ? 'UPI' : ord.paymentMethod === 'card' ? 'Card' : 'Cash'}
                      </td>
                      <td>
                        <strong>₹{ord.grandTotal}</strong>
                      </td>
                      <td>
                        <span className={`status-tag ${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-invoice-btn"
                          onClick={() => openInvoice(ord)}
                        >
                          Print Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Universal Stock Modals */}
      <AnimatePresence>
        {isAddStockOpen && (
          <AddStockModal
            isOpen={isAddStockOpen}
            onClose={() => setIsAddStockOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRefillOpen && (
          <RefillStockModal
            isOpen={isRefillOpen}
            onClose={() => setIsRefillOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
