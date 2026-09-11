import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS } from '../../data/sweetsData';
import './InvoiceModal.css';

export default function InvoiceModal() {
  const { activeInvoice, closeInvoice } = useCart();
  const invoiceRef = useRef();

  // Default format: 'thermal' (80mm POS slip) for counter POS, 'a4' for online deliveries
  const [billFormat, setBillFormat] = useState('thermal');

  useEffect(() => {
    if (activeInvoice) {
      setBillFormat(activeInvoice.source === 'online' ? 'a4' : 'thermal');
    }
  }, [activeInvoice]);

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
      <div className={`invoice-portal format-${billFormat}`} data-lenis-prevent>
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
          className={`invoice-modal-wrap ${billFormat === 'thermal' ? 'wrap-thermal' : 'wrap-a4'}`}
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
              <h3 className="success-banner-title">
                {billFormat === 'thermal' ? '80mm POS Thermal Receipt' : 'Official GST Tax Invoice'}
              </h3>
              <p className="success-banner-sub">
                Bill No: <strong>{invoiceNumber}</strong> · Billed to <strong>{customer.fullName}</strong>
              </p>
            </div>
            <button className="invoice-close-icon" onClick={closeInvoice} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Action Toolbar with Format Switcher */}
          <div className="invoice-toolbar">
            {/* Format Switcher Pills */}
            <div className="invoice-format-switcher">
              <button
                type="button"
                className={`format-btn ${billFormat === 'thermal' ? 'active' : ''}`}
                onClick={() => setBillFormat('thermal')}
                title="Switch to 80mm / 58mm POS thermal receipt printer layout"
              >
                <span className="format-icon">🧾</span>
                <span>Thermal Receipt (80mm)</span>
              </button>
              <button
                type="button"
                className={`format-btn ${billFormat === 'a4' ? 'active' : ''}`}
                onClick={() => setBillFormat('a4')}
                title="Switch to standard A4/A5 formal tax invoice layout"
              >
                <span className="format-icon">📄</span>
                <span>Standard A4 Invoice</span>
              </button>
            </div>

            <div className="invoice-toolbar-actions">
              <button className="toolbar-btn print-btn" onClick={handlePrint}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 14h12v8H6z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{billFormat === 'thermal' ? 'Print Thermal Bill (80mm)' : 'Print A4 Invoice'}</span>
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
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="printable-invoice-container" data-lenis-prevent>
            {billFormat === 'thermal' ? (
              <div className="thermal-receipt-document" ref={invoiceRef}>
                {/* Thermal Header */}
                <div className="thermal-header">
                  <div className="thermal-decor-stars">★ ★ ★ ★ ★</div>
                  <h2 className="thermal-brand-name">{STORE_DETAILS.brandName}</h2>
                  <p className="thermal-brand-tag">{STORE_DETAILS.tagline}</p>
                  <p className="thermal-addr-line">{STORE_DETAILS.addressLine1}</p>
                  <p className="thermal-addr-line">{STORE_DETAILS.cityStatePin}</p>
                  <p className="thermal-contact-line">TEL: {STORE_DETAILS.phone}</p>
                  <div className="thermal-tax-regs">
                    <div>GSTIN: <strong>{STORE_DETAILS.gstin}</strong></div>
                    <div>FSSAI: <strong>{STORE_DETAILS.fssai}</strong></div>
                  </div>
                </div>

                <div className="thermal-divider-double" />

                <div className="thermal-title-bar">
                  <span>TAX INVOICE / CASH MEMO</span>
                </div>

                <div className="thermal-divider-single" />

                {/* Metadata */}
                <div className="thermal-meta-block">
                  <div className="thermal-meta-row">
                    <span>BILL NO : <strong>{invoiceNumber}</strong></span>
                    <span>{orderDate}</span>
                  </div>
                  <div className="thermal-meta-row">
                    <span>TIME    : {orderTime}</span>
                    <span className="thermal-source-tag">
                      {activeInvoice.source === 'online' ? 'ONLINE' : 'POS'}
                    </span>
                  </div>
                  {activeInvoice.cashier && (
                    <div className="thermal-meta-row">
                      <span>CASHIER : {activeInvoice.cashier.name || activeInvoice.cashier.username}</span>
                      <span>{activeInvoice.cashier.counter || 'Desk 01'}</span>
                    </div>
                  )}
                  <div className="thermal-meta-row">
                    <span>CUSTOMER: {customer.fullName || 'Walk-in Guest'}</span>
                    {customer.phone && <span>PH: {customer.phone}</span>}
                  </div>
                </div>

                <div className="thermal-divider-dashed" />

                {/* Items Table */}
                <table className="thermal-items-table">
                  <thead>
                    <tr>
                      <th className="text-left" style={{ width: '48%' }}>ITEM</th>
                      <th className="text-center" style={{ width: '12%' }}>QTY</th>
                      <th className="text-right" style={{ width: '20%' }}>RATE</th>
                      <th className="text-right" style={{ width: '20%' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="thermal-item-title">
                          <div className="item-name">{item.name}</div>
                          <div className="item-wt">({item.weight})</div>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{item.price.toFixed(2)}</td>
                        <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="thermal-divider-dashed" />

                {/* Totals Calculation */}
                <div className="thermal-totals-box">
                  <div className="thermal-calc-row">
                    <span>Total Items: <strong>{items.length}</strong></span>
                    <span>Total Qty: <strong>{items.reduce((sum, it) => sum + (it.quantity || 1), 0)}</strong></span>
                  </div>
                  <div className="thermal-calc-row">
                    <span>Taxable Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {taxBreakdown?.cgst > 0 && (
                    <div className="thermal-calc-row">
                      <span>CGST (2.5%):</span>
                      <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                    </div>
                  )}
                  {taxBreakdown?.sgst > 0 && (
                    <div className="thermal-calc-row">
                      <span>SGST (2.5%):</span>
                      <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                    </div>
                  )}
                  {taxBreakdown?.igst > 0 && (
                    <div className="thermal-calc-row">
                      <span>IGST (5.0%):</span>
                      <span>₹{taxBreakdown.igst.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="thermal-calc-row">
                      <span>Delivery Fee:</span>
                      <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="thermal-divider-double" />

                  <div className="thermal-grand-total">
                    <span className="grand-lbl">NET PAYABLE:</span>
                    <span className="grand-val">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="thermal-divider-double" />

                  <div className="thermal-pay-info">
                    <div className="thermal-pay-row">
                      <span>Payment Mode:</span>
                      <strong>
                        {paymentMethod === 'upi' ? 'UPI QR DIGITAL' : paymentMethod === 'card' ? 'CARD / EDC POS' : 'CASH COUNTER'}
                      </strong>
                    </div>
                    {upiUtr && (
                      <div className="thermal-pay-row">
                        <span>UTR / Ref:</span>
                        <span>{upiUtr}</span>
                      </div>
                    )}
                    <div className="thermal-pay-row">
                      <span>Order Status:</span>
                      <strong>{orderStatus}</strong>
                    </div>
                  </div>
                </div>

                <div className="thermal-divider-dashed" />

                {/* Barcode representation */}
                <div className="thermal-barcode-wrap">
                  <div className="thermal-barcode-art">
                    ||||| ||| ||||||| |||| || |||||| ||||| ||||||
                  </div>
                  <span className="thermal-barcode-text">*{invoiceNumber}*</span>
                </div>

                {/* Thermal Footer Notice */}
                <div className="thermal-footer-box">
                  <p className="thermal-thank-you">*** THANK YOU! VISIT AGAIN! ***</p>
                  <p className="thermal-sub-msg">Authentic Traditional Delicacies & Pure Ghee Preparations</p>
                  <p className="thermal-sub-msg">Keep sweets in cool place · Quality Guaranteed</p>
                  <p className="thermal-sub-msg">Goods once sold cannot be returned</p>
                  <p className="thermal-domain">www.thenisaisweets.com</p>
                  <div className="thermal-paper-tear-gap" />
                </div>
              </div>
            ) : (
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
                      {activeInvoice.cashier && (
                        <div>
                          <span className="meta-label">Billed By:</span>
                          <span className="meta-val">
                            {activeInvoice.cashier.name || activeInvoice.cashier.username} ({activeInvoice.cashier.counter || 'Counter Desk'})
                          </span>
                        </div>
                      )}
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
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
