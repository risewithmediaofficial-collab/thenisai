import React from 'react';
import { STORE_DETAILS } from '../../data/sweetsData';

export default function PosBillCompletedCard({
  bill,
  onStartNextSale,
  onReprint,
  onViewA4,
  onDismiss,
}) {
  if (!bill) return null;

  const invoiceNumber = bill.invoiceNumber || bill.id || 'POS-001';
  const orderDate = bill.orderDate || new Date().toLocaleDateString('en-IN');
  const orderTime = bill.orderTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const items = bill.items || [];
  const grandTotal = Number(bill.grandTotal || bill.total || 0);
  const paymentMethod = bill.paymentMethod || 'cash';
  const splitCash = bill.splitCash ?? bill.paymentDetails?.cash ?? 0;
  const splitUpi = bill.splitUpi ?? bill.paymentDetails?.upi ?? 0;
  const customerName = bill.customer?.fullName?.trim() || 'Walk-in Customer';
  const customerPhone = bill.customer?.phone?.trim() || '';

  const formattedTotal = grandTotal % 1 === 0 ? grandTotal.toFixed(0) : grandTotal.toFixed(2);

  // WhatsApp sharing link
  const itemsText = items
    .map((item) => `• ${item.name} (${item.weight || item.unit || '1 Pc'}) × ${item.quantity} = ₹${(Number(item.price || 0) * Number(item.quantity || 1))}`)
    .join('\n');
  const whatsappMessageText =
    `🙏 *Namaste! Thank you for shopping at Thenisai Sweets!*\n\n` +
    `🧾 *Invoice No:* ${invoiceNumber}\n` +
    `📅 *Date:* ${orderDate} ${orderTime}\n` +
    `👤 *Customer:* ${customerName}${customerPhone ? ` (${customerPhone})` : ''}\n\n` +
    `📦 *Items:*\n${itemsText}\n\n` +
    `💰 *Total Amount:* ₹${formattedTotal}\n` +
    `💳 *Payment:* ${paymentMethod.toUpperCase()}\n\n` +
    `🌐 Order online for doorstep delivery: https://www.thenisaisweets.com\n📞 Helpline: +91 93448 93547`;
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const targetPhone = cleanPhone.length >= 10
    ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone)
    : STORE_DETAILS.whatsappNumber;
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMessageText)}`;

  return (
    <div className="pos-bill-completed-card" data-lenis-prevent>
      {/* Top Status Header */}
      <div className="completed-card-header">
        <div className="completed-status-badge">
          <span className="status-check-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="status-texts">
            <span className="status-label">SALE COMPLETED</span>
            <span className="status-time">{orderTime} · Just now</span>
          </div>
        </div>

        <button
          type="button"
          className="completed-dismiss-btn"
          onClick={onDismiss || onStartNextSale}
          title="Dismiss card (Esc)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bill & Customer Key Info */}
      <div className="completed-bill-meta">
        <div className="meta-row">
          <span className="meta-label">Bill Number</span>
          <span className="meta-val highlight-bill-no">{invoiceNumber}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Customer</span>
          <span className="meta-val">{customerName} {customerPhone ? `(${customerPhone})` : ''}</span>
        </div>
      </div>

      {/* Prominent Amount & Payment Mode Display */}
      <div className="completed-amount-banner">
        <div className="amount-col">
          <span className="amount-caption">TOTAL SETTLED</span>
          <span className="amount-figure">₹{formattedTotal}</span>
        </div>
        <div className="mode-col">
          <span className="mode-caption">PAY MODE</span>
          <span className="mode-pill">
            {paymentMethod === 'split' ? (
              <>Split: ₹{splitCash} Cash + ₹{splitUpi} UPI</>
            ) : paymentMethod === 'upi' ? (
              <>UPI / QR</>
            ) : paymentMethod === 'card' ? (
              <>Card / POS</>
            ) : (
              <>Cash Counter</>
            )}
          </span>
        </div>
      </div>

      {/* Item summary preview */}
      <div className="completed-items-summary">
        <div className="summary-title">
          <span>Purchased Items ({items.length})</span>
          <span>Qty / Wt</span>
        </div>
        <div className="summary-list">
          {items.map((item, idx) => (
            <div key={idx} className="summary-item-row">
              <span className="item-name-text">
                <strong>{item.quantity}×</strong> {item.name}
              </span>
              <span className="item-details-text">
                <span className="item-wt">{item.weight || item.unit || '1 Pc'}</span>
                <span className="item-cost">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="completed-actions-panel">
        {/* Primary Instant Next Sale button */}
        <button
          type="button"
          className="btn-next-sale-primary"
          onClick={onStartNextSale}
          title="Clear and immediately start next customer sale (F2 / Enter)"
        >
          <span className="btn-icon">⚡</span>
          <span className="btn-text">
            <strong>Next Sale</strong>
            <small>Press F2 or start typing</small>
          </span>
        </button>

        {/* Secondary Actions Grid */}
        <div className="completed-sub-actions">
          <button
            type="button"
            className="sub-action-btn reprint-btn"
            onClick={onReprint}
            title="Print receipt copy on thermal roll printer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Slip</span>
          </button>

          <button
            type="button"
            className="sub-action-btn a4-btn"
            onClick={onViewA4}
            title="Open detailed A4 invoice drawer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>A4 Bill</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sub-action-btn wa-btn"
            title="Send bill details via WhatsApp"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.05 2c-5.48 0-9.93 4.45-9.93 9.93 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.75 1.21 5.48 0 9.93-4.45 9.93-9.93 0-5.48-4.45-9.9-9.93-9.9zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.57.12.16 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
