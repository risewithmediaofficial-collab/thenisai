import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS } from '../../data/sweetsData';
import './InvoiceModal.css';

export default function InvoiceModal() {
  const { activeInvoice, closeInvoice, taxSettings } = useCart();
  const invoiceRef = useRef();

  // Default format: 'thermal' (80mm POS slip) for counter POS, 'a4' for online deliveries
  const [billFormat, setBillFormat] = useState('thermal');

  useEffect(() => {
    if (activeInvoice) {
      setBillFormat(activeInvoice.source === 'online' ? 'a4' : 'thermal');
    }
  }, [activeInvoice]);

  useEffect(() => {
    const handleAfterPrint = () => {
      if (activeInvoice) {
        closeInvoice();
      }
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [activeInvoice, closeInvoice]);

  if (!activeInvoice) return null;

  const {
    invoiceNumber = 'POS-001',
    orderDate = new Date().toLocaleDateString('en-IN'),
    orderTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    customer = {},
    shippingAddress = {},
    giftNote = '',
    items = [],
    paymentMethod = 'cash',
    upiUtr = '',
    orderStatus = 'Completed',
  } = activeInvoice;

  const subtotal = Number(activeInvoice.subtotal) || 0;
  const deliveryFee = Number(activeInvoice.deliveryFee) || 0;
  const grandTotal = Number(activeInvoice.grandTotal) || (subtotal + deliveryFee);

  const rawTax = activeInvoice.taxBreakdown || {};
  const cgstRate = typeof rawTax.cgstRate === 'number' ? rawTax.cgstRate : (typeof taxSettings?.cgstRate === 'number' ? taxSettings.cgstRate : 2.5);
  const sgstRate = typeof rawTax.sgstRate === 'number' ? rawTax.sgstRate : (typeof taxSettings?.sgstRate === 'number' ? taxSettings.sgstRate : 2.5);
  const totalTaxRate = typeof rawTax.rate === 'number' ? rawTax.rate : (typeof taxSettings?.totalGstRate === 'number' ? taxSettings.totalGstRate : (cgstRate + sgstRate));
  const activeGstin = rawTax.gstin || taxSettings?.gstin || STORE_DETAILS.gstin;

  const taxBreakdown = {
    isInterState: Boolean(rawTax.isInterState),
    cgst: typeof rawTax.cgst === 'number' ? rawTax.cgst : (Number(rawTax.cgst) || Math.round(subtotal * (cgstRate / 100) * 100) / 100),
    sgst: typeof rawTax.sgst === 'number' ? rawTax.sgst : (Number(rawTax.sgst) || Math.round(subtotal * (sgstRate / 100) * 100) / 100),
    igst: typeof rawTax.igst === 'number' ? rawTax.igst : (Number(rawTax.igst) || 0),
    totalTax: typeof rawTax.totalTax === 'number' ? rawTax.totalTax : (Number(rawTax.totalTax) || Math.round(subtotal * (totalTaxRate / 100) * 100) / 100),
    cgstRate,
    sgstRate,
    totalTaxRate,
    gstin: activeGstin,
  };

  const handlePrint = () => {
    window.print();
  };

  const copiesToRender = ['customer'];

  // Pre-filled WhatsApp message
  const itemsText = items
    .map((item) => `• ${item.name} (${item.weight}) × ${item.quantity} = ₹${item.price * item.quantity}`)
    .join('\n');

  const fullAddress = shippingAddress?.doorNo
    ? `${shippingAddress.doorNo}, ${shippingAddress.street || ''}${shippingAddress.landmark ? `, Near ${shippingAddress.landmark}` : ''
    }, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} - ${shippingAddress.pincode || ''}`
    : 'In-Store Counter Walk-in';

  const whatsappMessage = encodeURIComponent(
    `🙏 *Namaste Thenisai Sweets!* \nI just placed an order on your website.\n\n` +
    `🧾 *Invoice No:* ${invoiceNumber}\n` +
    `👤 *Customer:* ${customer?.fullName || 'Walk-in Guest'}${customer?.phone ? ` (${customer.phone})` : ''}\n` +
    `📍 *Delivery Address:* ${fullAddress}\n\n` +
    `📦 *Order Items:*\n${itemsText}\n\n` +
    `💰 *Total Amount:* ₹${grandTotal}\n` +
    `💳 *Payment Mode:* ${paymentMethod === 'upi' ? `Instant UPI (UTR: ${upiUtr || 'Paid'})` : 'Pay on Delivery (COD)'}\n` +
    (giftNote ? `🎁 *Gift Note:* "${giftNote}"\n` : '') +
    `\nPlease confirm order packing and dispatch. Thank you!`
  );

  const whatsappUrl = `https://wa.me/${STORE_DETAILS.whatsappNumber}?text=${whatsappMessage}`;

  // Helper to render 80mm Thermal Receipt Copy
  const renderThermalReceiptCopy = (copyType, index) => {
    const isShopCopy = copyType === 'shop';

    return (
      <div key={copyType} className="thermal-single-copy-wrap">
        {index > 0 && (
          <div className="thermal-receipt-divider-cut">
            <span className="cut-icon">✂</span>
            <span className="cut-text">- - - - [ TEAR / CUT FOR SHOP COPY ] - - - -</span>
            <span className="cut-icon">✂</span>
          </div>
        )}

        <div className={`thermal-receipt-document copy-${copyType}`}>
          {/* Thermal Header - Compact, No Logo, High Visibility */}
          <div className="thermal-header">
            <h2 className="thermal-brand-name">{STORE_DETAILS.brandName}</h2>
            <p className="thermal-addr-line">NH 44, Nattamai Kottai, Krishnagiri · Ph: {STORE_DETAILS.phone.replace('+91 ', '')}</p>
            <p className="thermal-tax-line">
              GSTIN: <strong>{activeGstin}</strong> | FSSAI: <strong>{STORE_DETAILS.fssai}</strong>
            </p>
          </div>

          <div className="thermal-divider-dashed" />

          {/* Compact Title Bar */}
          <div className="thermal-title-bar">
            TAX INVOICE · {isShopCopy ? 'SHOP COPY' : 'CUSTOMER COPY'}
          </div>

          <div className="thermal-divider-dashed" />

          {/* Metadata */}
          <div className="thermal-meta-block">
            <div className="thermal-meta-row">
              <span>BILL: <strong>{invoiceNumber}</strong></span>
              <span>{orderDate} {orderTime}</span>
            </div>
            <div className="thermal-meta-row">
              <span>CUST: <strong>{customer.fullName || 'Walk-in Guest'}</strong>{customer.phone ? ` (${customer.phone})` : ''}</span>
              <span className="thermal-pay-mode-tag">
                {paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'CARD' : 'CASH'}
              </span>
            </div>
          </div>

          <div className="thermal-divider-dashed" />

          {/* Items Table - Clean & Compact */}
          <table className="thermal-items-table">
            <thead>
              <tr>
                <th className="text-left" style={{ width: '48%' }}>ITEM</th>
                <th className="text-center" style={{ width: '12%' }}>QTY</th>
                <th className="text-right" style={{ width: '18%' }}>RATE</th>
                <th className="text-right" style={{ width: '22%' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="thermal-item-title">
                    <span className="item-name">{item.name}</span>
                    {item.weight && <span className="item-wt"> ({item.weight})</span>}
                  </td>
                  <td className="text-center"><strong>{item.quantity}</strong></td>
                  <td className="text-right">{Number(item.price || 0).toFixed(0)}</td>
                  <td className="text-right"><strong>{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="thermal-divider-dashed" />

          {/* Totals Calculation */}
          <div className="thermal-totals-box">
            <div className="thermal-calc-row">
              <span>Items: <strong>{items.length}</strong> (Qty: <strong>{items.reduce((sum, it) => sum + (it.quantity || 1), 0)}</strong>)</span>
              <span>Subtotal: <strong>₹{subtotal.toFixed(2)}</strong></span>
            </div>

            {(taxBreakdown?.cgst > 0 || taxBreakdown?.sgst > 0) && (
              <div className="thermal-calc-row">
                <span>CGST ({taxBreakdown.cgstRate}%): ₹{taxBreakdown.cgst.toFixed(2)}</span>
                <span>SGST ({taxBreakdown.sgstRate}%): ₹{taxBreakdown.sgst.toFixed(2)}</span>
              </div>
            )}
            {taxBreakdown?.igst > 0 && (
              <div className="thermal-calc-row">
                <span>IGST ({taxBreakdown.totalTaxRate}%):</span>
                <span>₹{taxBreakdown.igst.toFixed(2)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="thermal-calc-row">
                <span>Delivery:</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="thermal-divider-solid" />

            <div className="thermal-grand-total">
              <span className="grand-lbl">NET PAYABLE:</span>
              <span className="grand-val">₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="thermal-divider-solid" />

            <div className="thermal-pay-info">
              <div className="thermal-pay-row">
                <span>Payment: <strong>{paymentMethod === 'upi' ? 'UPI QR DIGITAL' : paymentMethod === 'card' ? 'CARD / EDC' : 'CASH COUNTER'}</strong></span>
                <span>Status: <strong>{orderStatus}</strong></span>
              </div>
              {upiUtr && (
                <div className="thermal-pay-row">
                  <span>UTR: {upiUtr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shop Copy Audit Block */}
          {isShopCopy && (
            <div className="thermal-shop-audit-block">
              <div className="thermal-divider-dashed" />
              <div className="thermal-audit-row">
                <span>Desk: {activeInvoice.cashier?.counter || 'Counter 01'}</span>
                <span>Staff: {activeInvoice.cashier?.name || activeInvoice.cashier?.username || 'Staff'}</span>
              </div>
              <div className="thermal-audit-signatures">
                <div className="sign-line">Sign: __________________________</div>
              </div>
            </div>
          )}

          <div className="thermal-divider-dashed" />

          {/* Thermal Footer Notice - Compact */}
          <div className="thermal-footer-box">
            <p className="thermal-thank-you">*** THANK YOU! VISIT AGAIN ***</p>
            <p className="thermal-sub-msg">Goods once sold cannot be returned</p>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render A4 Tax Invoice Copy
  const renderA4InvoiceCopy = (copyType, index) => {
    const isShopCopy = copyType === 'shop';

    return (
      <div
        key={copyType}
        className={`invoice-document copy-${copyType} ${index > 0 ? 'page-break-before' : ''}`}
      >
        {/* Header */}
        <div className="inv-header">
          <div className="inv-brand-with-logo">
            <img src="/logo.png" alt="Thenisai Sweets Logo" className="inv-brand-logo-img" />
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
                <span>GSTIN: <strong>{activeGstin}</strong></span>
              </div>
            </div>
          </div>

          <div className="inv-title-block">
            <span className={`inv-tax-badge ${isShopCopy ? 'shop-badge' : ''}`}>
              {isShopCopy
                ? 'DUPLICATE FOR SUPPLIER (SHOP / STORE COPY)'
                : 'ORIGINAL FOR RECIPIENT (CUSTOMER COPY)'}
            </span>
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
                <span className="meta-val">{shippingAddress?.state || 'Tamil Nadu (33)'}</span>
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
            <h4 className="party-title">{shippingAddress?.doorNo ? 'Billed & Shipped To:' : 'Billed To (Counter):'}</h4>
            <p className="party-name">{customer?.fullName || 'Walk-in Guest'}</p>
            {shippingAddress?.doorNo && (
              <p className="party-line">{shippingAddress.doorNo}, {shippingAddress.street}</p>
            )}
            {shippingAddress?.landmark && (
              <p className="party-line">Landmark: {shippingAddress.landmark}</p>
            )}
            {shippingAddress?.city && (
              <p className="party-line">
                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              </p>
            )}
            <p className="party-contact">
              Mobile: <strong>{customer?.phone ? `+91 ${customer.phone}` : 'Walk-in Counter'}</strong>
              {customer?.email ? ` | Email: ${customer.email}` : ''}
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
                  <td className="text-right">{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
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
              <li>All disputes subject to krishnagiri jurisdiction only.</li>
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
                  <span>CGST @ {taxBreakdown.cgstRate}%</span>
                  <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                </div>
                <div className="total-row tax">
                  <span>SGST @ {taxBreakdown.sgstRate}%</span>
                  <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="total-row tax">
                <span>IGST @ {taxBreakdown.totalTaxRate}%</span>
                <span>₹{taxBreakdown.igst.toFixed(2)}</span>
              </div>
            )}

            <div className="total-row">
              <span>Delivery & Handling</span>
              <span>{deliveryFee <= 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
            </div>

            <div className="inv-grand-total">
              <span>Grand Total (INR)</span>
              <span className="grand-amount" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatory */}
        <div className="inv-bottom-sign">
          <div className="inv-sign-left">
            <span>
              {isShopCopy
                ? 'Store Verification & Cash Counter Records'
                : 'Authorized Signature / Computer Generated Bill'}
            </span>
          </div>
          <div className="inv-sign-right">
            <span>For <strong>{STORE_DETAILS.brandName}</strong></span>
            <div className="sign-stamp">
              {isShopCopy ? '[Store Accounts Verified]' : '[Kitchen Seal Approved]'}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          {/* Action Toolbar with Format Switcher & Quick Actions */}
          <div className="invoice-toolbar">
            <div className="invoice-toolbar-left">
              <span className="invoice-quick-inv-badge">{invoiceNumber}</span>

              {/* Format Switcher Pills */}
              <div className="invoice-format-switcher">
                <button
                  type="button"
                  className={`format-btn ${billFormat === 'thermal' ? 'active' : ''}`}
                  onClick={() => setBillFormat('thermal')}
                  title="POS thermal receipt printer layout"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="format-icon-svg">
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                    <path d="M8 7h8" />
                    <path d="M8 11h8" />
                    <path d="M8 15h5" />
                  </svg>
                  <span>Thermal</span>
                </button>
                <button
                  type="button"
                  className={`format-btn ${billFormat === 'a4' ? 'active' : ''}`}
                  onClick={() => setBillFormat('a4')}
                  title="Standard A4 tax invoice layout"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="format-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>A4 Invoice</span>
                </button>
              </div>
            </div>

            <div className="invoice-toolbar-actions">
              <button className="toolbar-btn print-btn" onClick={handlePrint}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Print {billFormat === 'thermal' ? 'Receipt' : 'Invoice'}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn whatsapp-btn"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.05 2c-5.48 0-9.93 4.45-9.93 9.93 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.75 1.21 5.48 0 9.93-4.45 9.93-9.93 0-5.48-4.45-9.9-9.93-9.9zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.57.12.16 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
                </svg>
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                className="toolbar-btn close-btn"
                onClick={closeInvoice}
                aria-label="Close"
                title="Close"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="printable-invoice-container" data-lenis-prevent>
            {billFormat === 'thermal' ? (
              <div
                className={`thermal-receipt-wrapper ${copiesToRender.length > 1 ? 'has-multiple' : ''}`}
                ref={invoiceRef}
              >
                {copiesToRender.map((copyType, index) => renderThermalReceiptCopy(copyType, index))}
              </div>
            ) : (
              <div
                className={`a4-invoices-wrapper ${copiesToRender.length > 1 ? 'has-multiple' : ''}`}
                ref={invoiceRef}
              >
                {copiesToRender.map((copyType, index) => renderA4InvoiceCopy(copyType, index))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
