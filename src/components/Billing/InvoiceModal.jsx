import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS } from '../../data/sweetsData';
import './InvoiceModal.css';

export default function InvoiceModal() {
  const { activeInvoice, closeInvoice } = useCart();
  const invoiceRef = useRef();

  if (!activeInvoice) return null;

  const {
    invoiceNumber,
    orderDate,
    orderTime,
    customer,
    shippingAddress,
    giftNote,
    items,
    subtotal,
    taxBreakdown,
    deliveryFee,
    grandTotal,
    paymentMethod,
    upiUtr,
    orderStatus,
  } = activeInvoice;

  const handlePrint = () => {
    window.print();
  };

  // Pre-filled WhatsApp message
  const itemsText = items
    .map((item) => `• ${item.name} (${item.weight}) × ${item.quantity} = ₹${item.price * item.quantity}`)
    .join('\n');

  const fullAddress = `${shippingAddress.doorNo}, ${shippingAddress.street}${
    shippingAddress.landmark ? `, Near ${shippingAddress.landmark}` : ''
  }, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`;

  const whatsappMessage = encodeURIComponent(
    `🙏 *Namaste Thenisai Sweets!* \nI just placed an order on your website.\n\n` +
      `🧾 *Invoice No:* ${invoiceNumber}\n` +
      `👤 *Customer:* ${customer.fullName} (${customer.phone})\n` +
      `📍 *Delivery Address:* ${fullAddress}\n\n` +
      `📦 *Order Items:*\n${itemsText}\n\n` +
      `💰 *Total Amount:* ₹${grandTotal}\n` +
      `💳 *Payment Mode:* ${paymentMethod === 'upi' ? `Instant UPI (UTR: ${upiUtr || 'Paid'})` : 'Pay on Delivery (COD)'}\n` +
      (giftNote ? `🎁 *Gift Note:* "${giftNote}"\n` : '') +
      `\nPlease confirm order packing and dispatch. Thank you!`
  );

  const whatsappUrl = `https://wa.me/${STORE_DETAILS.whatsappNumber}?text=${whatsappMessage}`;

  return (
    <AnimatePresence>
      <div className="invoice-portal" data-lenis-prevent>
        {/* Backdrop */}
        <motion.div
          className="invoice-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeInvoice}
        />

        {/* Modal Window */}
        <motion.div
          className="invoice-modal-wrap"
          data-lenis-prevent
          initial={{ opacity: 0, scale: 0.94, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 25 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Top Celebration Bar */}
          <div className="invoice-success-banner">
            <div className="success-icon-wrap">✓</div>
            <div>
              <h3 className="success-banner-title">Order Placed Successfully!</h3>
              <p className="success-banner-sub">
                Thank you, <strong>{customer.fullName}</strong>. Your official GST Tax Invoice has been generated.
              </p>
            </div>
            <button className="invoice-close-icon" onClick={closeInvoice} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="invoice-toolbar">
            <button className="toolbar-btn print-btn" onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 14h12v8H6z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Download / Print Bill</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="toolbar-btn whatsapp-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.05 2c-5.48 0-9.93 4.45-9.93 9.93 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.75 1.21 5.48 0 9.93-4.45 9.93-9.93 0-5.48-4.45-9.9-9.93-9.9zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.57.12.16 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
              </svg>
              <span>Confirm on WhatsApp</span>
            </a>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="printable-invoice-container" data-lenis-prevent>
            <div className="invoice-document" ref={invoiceRef}>
              {/* Header */}
              <div className="inv-header">
                <div className="inv-brand">
                  <h1 className="inv-brand-name">{STORE_DETAILS.brandName}</h1>
                  <p className="inv-brand-sub">{STORE_DETAILS.tagline}</p>
                  <p className="inv-brand-address">
                    {STORE_DETAILS.addressLine1}, {STORE_DETAILS.cityStatePin}
                  </p>
                  <p className="inv-brand-meta">
                    Tel: {STORE_DETAILS.phone} | Sec: {STORE_DETAILS.secondaryPhone} | Email: {STORE_DETAILS.email}
                  </p>
                  <div className="inv-reg-badges">
                    <span>Est: <strong>2006</strong></span>
                    <span>FSSAI Lic: <strong>{STORE_DETAILS.fssai}</strong></span>
                    <span>GSTIN: <strong>{STORE_DETAILS.gstin}</strong></span>
                  </div>
                </div>

                <div className="inv-title-block">
                  <span className="inv-tax-badge">ORIGINAL TAX INVOICE</span>
                  <div className="inv-meta-table">
                    <div>
                      <span className="meta-label">Invoice No:</span>
                      <span className="meta-val highlight">{invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="meta-label">Date:</span>
                      <span className="meta-val">{orderDate} ({orderTime})</span>
                    </div>
                    <div>
                      <span className="meta-label">State of Supply:</span>
                      <span className="meta-val">{shippingAddress.state}</span>
                    </div>
                    <div>
                      <span className="meta-label">Status:</span>
                      <span className="meta-val status-pill">{orderStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="inv-divider" />

              {/* Billed To / Shipped To */}
              <div className="inv-parties">
                <div className="inv-party-card">
                  <h4 className="party-title">Billed & Shipped To:</h4>
                  <p className="party-name">{customer.fullName}</p>
                  <p className="party-line">{shippingAddress.doorNo}, {shippingAddress.street}</p>
                  {shippingAddress.landmark && (
                    <p className="party-line">Landmark: {shippingAddress.landmark}</p>
                  )}
                  <p className="party-line">
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  </p>
                  <p className="party-contact">
                    Mobile: <strong>+91 {customer.phone}</strong> | Email: {customer.email}
                  </p>
                </div>

                <div className="inv-party-card payment-mode-card">
                  <h4 className="party-title">Payment & Dispatch Info:</h4>
                  <p className="party-line">
                    Mode:{' '}
                    <strong>
                      {paymentMethod === 'upi' ? 'Direct UPI (GPay / PhonePe)' : 'Cash / UPI on Delivery (COD)'}
                    </strong>
                  </p>
                  {upiUtr && <p className="party-line">UPI UTR Ref: <strong>{upiUtr}</strong></p>}
                  {giftNote && (
                    <p className="party-line gift-note">
                      Gift Message: <em>"{giftNote}"</em>
                    </p>
                  )}
                  <p className="party-line dispatch-tip">
                    Dispatch: Fresh daily batch packaged in tamper-proof seal.
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: '6%' }}>#</th>
                      <th style={{ width: '42%' }}>Item Description</th>
                      <th style={{ width: '12%' }}>HSN</th>
                      <th style={{ width: '12%' }}>Weight</th>
                      <th style={{ width: '10%' }} className="text-right">Qty</th>
                      <th style={{ width: '18%' }} className="text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.id}-${item.weight}`}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{item.name}</strong>
                          <span className="item-sub-desc">Handmade pure ghee preparation</span>
                        </td>
                        <td>{item.hsn}</td>
                        <td>{item.weight}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="inv-footer-calc">
                <div className="inv-notes">
                  <p className="note-title">Terms & Conditions:</p>
                  <ol>
                    <li>Perishable sweets: Keep in cool place or refrigerate after opening.</li>
                    <li>Goods once sold are freshly prepared and dispatched directly from kitchen.</li>
                    <li>All disputes subject to Madurai jurisdiction only.</li>
                  </ol>
                </div>

                <div className="inv-totals">
                  <div className="total-row">
                    <span>Taxable Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {!taxBreakdown.isInterState ? (
                    <>
                      <div className="total-row tax">
                        <span>CGST @ 2.5%</span>
                        <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                      </div>
                      <div className="total-row tax">
                        <span>SGST @ 2.5%</span>
                        <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="total-row tax">
                      <span>IGST @ 5.0%</span>
                      <span>₹{taxBreakdown.igst.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="total-row">
                    <span>Delivery & Handling</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                  </div>

                  <div className="inv-grand-total">
                    <span>Grand Total (INR)</span>
                    <span className="grand-amount" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                      ₹{grandTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatory */}
              <div className="inv-bottom-sign">
                <div className="inv-sign-left">
                  <span>Authorized Signature / Computer Generated Bill</span>
                </div>
                <div className="inv-sign-right">
                  <span>For <strong>{STORE_DETAILS.brandName}</strong></span>
                  <div className="sign-stamp">[Kitchen Seal Approved]</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
