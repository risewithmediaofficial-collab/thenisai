import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { STORE_DETAILS, ALL_BILLING_ITEMS } from '../../data/sweetsData';
import PosThermalReceipt from './PosThermalReceipt';
export default function InvoiceModal() {
  const { activeInvoice, closeInvoice, taxSettings } = useCart();
  const invoiceRef = useRef();

  // Format: 'thermal' (standard thermal roll), 'a4' (A4 sheet)
  const [billFormat, setBillFormat] = useState(() => {
    const saved = localStorage.getItem('thenisai_pos_roll_format');
    return saved === 'a4' ? 'a4' : 'thermal';
  });

  // Default: always print 2 copies (Customer Copy + Shop Copy)
  const [printCopies, setPrintCopies] = useState('both'); // 'both' | 'customer'

  const handleSelectFormat = (fmt) => {
    setBillFormat(fmt);
    localStorage.setItem('thenisai_pos_roll_format', fmt);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (activeInvoice) {
      if (activeInvoice.source === 'online') {
        setBillFormat('a4');
      } else {
        setBillFormat('thermal');
      }
      setPrintCopies('both'); // Default is always 2 copies (Customer + Shop)
    }
  }, [activeInvoice]);

  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('is-printing-invoice');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-invoice');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-invoice');
    };
  }, []);

  const handleClose = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (typeof closeInvoice === 'function') {
      closeInvoice();
    }
  };

  // Keyboard shortcut: Press Escape to close invoice modal, Ctrl+P to print
  useEffect(() => {
    if (!activeInvoice) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose(e);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const splitCash = activeInvoice.splitCash ?? activeInvoice.paymentDetails?.cash ?? 0;
  const splitUpi = activeInvoice.splitUpi ?? activeInvoice.paymentDetails?.upi ?? 0;

  const subtotal = Number(activeInvoice.subtotal) || 0;
  const deliveryFee = Number(activeInvoice.deliveryFee) || 0;
  const grandTotal = Number(activeInvoice.grandTotal) || (subtotal + deliveryFee);

  const activeGstin = '';
  const taxBreakdown = {
    isInterState: false,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
    cgstRate: 0,
    sgstRate: 0,
    totalTaxRate: 0,
    gstin: '',
  };


  // Determine copies to render:
  // When printingTarget is active during print execution, ONLY render that single bill to printer!
  const copiesToRender = printCopies === 'shop'
    ? ['shop']
    : printCopies === 'customer'
    ? ['customer']
    : ['customer', 'shop'];

  // Determine if this is a Counter/POS bill or an Online Website order
  const isOnlineOrder = activeInvoice.source === 'online';
  const isPosSale = !isOnlineOrder || String(invoiceNumber).startsWith('POS-');

  // Customer name & phone formatting
  const rawCustomerName = (customer?.fullName || '').trim();
  const rawCustomerPhone = (customer?.phone || '').trim();
  const hasCustomerName = rawCustomerName && rawCustomerName.toLowerCase() !== 'walk-in customer';
  const hasCustomerPhone = rawCustomerPhone && rawCustomerPhone.toLowerCase() !== 'store counter' && rawCustomerPhone.toLowerCase() !== 'counter desk 01';

  const customerDisplay = hasCustomerName
    ? `${rawCustomerName}${hasCustomerPhone ? ` (${rawCustomerPhone})` : ''}`
    : (hasCustomerPhone ? rawCustomerPhone : 'Walk-in Customer');

  const greetingName = hasCustomerName ? rawCustomerName : '';

  // Formatted items list for message
  const itemsText = items
    .map((item) => `• ${item.name} (${item.weight || item.unit || '1 Pc'}) × ${item.quantity} = ₹${(Number(item.price || 0) * Number(item.quantity || 1))}`)
    .join('\n');

  const fullAddress = shippingAddress?.doorNo
    ? `${shippingAddress.doorNo}, ${shippingAddress.street || ''}${shippingAddress.landmark ? `, Near ${shippingAddress.landmark}` : ''
    }, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} - ${shippingAddress.pincode || ''}`
    : 'In-Store Counter Walk-in';

  // Accurate Payment Mode label (no accidental "Pay on Delivery" on Cash counter bills)
  const paymentModeLabel = paymentMethod === 'split'
    ? `Split Payment (Cash: ₹${splitCash} + UPI: ₹${splitUpi})`
    : paymentMethod === 'cash' || paymentMethod === 'Cash'
    ? 'Cash (Paid at Counter)'
    : paymentMethod === 'upi' || paymentMethod === 'UPI'
    ? `UPI / QR (${upiUtr || 'Paid'})`
    : paymentMethod === 'card' || paymentMethod === 'Card'
    ? 'Card / POS'
    : isPosSale
    ? 'Cash (Paid at Counter)'
    : 'Pay on Delivery (COD)';

  const formattedTotal = Number(grandTotal) % 1 === 0 ? Number(grandTotal).toFixed(0) : Number(grandTotal).toFixed(2);

  // Separate message templates:
  // 1) In-Store POS Bill: Thank the customer, provide bill summary, and promote online order with doorstep delivery
  // 2) Online Web Order: Order confirmation for delivery
  const whatsappMessageText = isPosSale
    ? `${greetingName ? `🙏 *Namaste ${greetingName}!*` : `🙏 *Namaste!*`}\n` +
      `Thank you for shopping at *Thenisai Sweets*! 🍯✨\n\n` +
      `🧾 *Invoice No:* ${invoiceNumber}\n` +
      `📅 *Date:* ${orderDate} ${orderTime}\n` +
      `👤 *Customer:* ${customerDisplay}\n\n` +
      `📦 *Order Items:*\n${itemsText}\n\n` +
      `💰 *Total Amount:* ₹${formattedTotal}\n` +
      `💳 *Payment Mode:* ${paymentModeLabel}\n\n` +
      `🚚 *Order Online & Get Doorstep Delivery!* 📦\n` +
      `Did you know? You can now order your favorite traditional sweets & savouries online at *www.thenisaisweets.com* and get doorstep delivery right to your home across India!\n\n` +
      `🌐 *Order Online:* https://www.thenisaisweets.com\n` +
      `📞 *Counter & Orders Helpline:* +91 93448 93547\n\n` +
      `Thank you! Visit us again! 🙏✨`
    : `🙏 *Namaste Thenisai Sweets!*\n` +
      `I just placed an online order on your website.\n\n` +
      `🧾 *Invoice No:* ${invoiceNumber}\n` +
      `👤 *Customer:* ${customerDisplay}\n` +
      `📍 *Delivery Address:* ${fullAddress}\n\n` +
      `📦 *Order Items:*\n${itemsText}\n\n` +
      `💰 *Total Amount:* ₹${formattedTotal}\n` +
      `💳 *Payment Mode:* ${paymentModeLabel}\n` +
      (giftNote ? `🎁 *Gift Note:* "${giftNote}"\n` : '') +
      `\nPlease confirm order packing and dispatch for delivery. Thank you!`;

  const whatsappMessage = encodeURIComponent(whatsappMessageText);

  // If customer's 10-digit phone number is entered, open chat with customer; otherwise open store WhatsApp
  const cleanPhone = (hasCustomerPhone ? rawCustomerPhone : '').replace(/\D/g, '');
  const targetPhone = isPosSale && cleanPhone.length >= 10
    ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone)
    : STORE_DETAILS.whatsappNumber;

  const whatsappUrl = `https://wa.me/${targetPhone}?text=${whatsappMessage}`;

  // Helper to format item weight/quantity, rate, and amount matching the authentic sweet shop POS layout
  const formatItemDetails = (item) => {
    let wtQty = '1x';
    let rate = Number(item.price || 0).toFixed(2);
    const amt = (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2);

    const wt = String(item.weight || '').toLowerCase().trim();
    const qty = Number(item.quantity || 1);

    if (wt.includes('kg')) {
      const num = parseFloat(wt) || 1;
      wtQty = (num * qty).toFixed(3);
      rate = (Number(item.price || 0) / num).toFixed(2);
    } else if (wt.includes('g')) {
      const grams = parseFloat(wt) || 250;
      const kg = grams / 1000;
      wtQty = (kg * qty).toFixed(3);
      rate = (Number(item.price || 0) / kg).toFixed(2);
    } else {
      wtQty = `${qty}x`;
      rate = Number(item.price || 0).toFixed(2);
    }

    return { wtQty, rate, amt };
  };

  // Helper to get official inventory item number / SKU code
  const getInventoryCode = (item, idx) => {
    if (item.skuCode) return String(item.skuCode);
    if (item.itemNumber) return String(item.itemNumber).padStart(2, '0');
    if (item.code) return String(item.code).padStart(2, '0');
    if (item.id && Array.isArray(ALL_BILLING_ITEMS)) {
      const match = ALL_BILLING_ITEMS.find(
        (s) => s.id === item.id || s.name?.toLowerCase() === item.name?.toLowerCase()
      );
      if (match?.skuCode) return String(match.skuCode);
      if (match?.itemNumber) return String(match.itemNumber).padStart(2, '0');
    }
    return String(idx + 1).padStart(2, '0');
  };

  // Calculate stats for the footer line
  const totalWeightKg = items.reduce((sum, item) => {
    const wt = String(item.weight || '').toLowerCase().trim();
    const qty = Number(item.quantity || 1);
    if (wt.includes('kg')) {
      return sum + (parseFloat(wt) || 1) * qty;
    } else if (wt.includes('g')) {
      return sum + ((parseFloat(wt) || 250) / 1000) * qty;
    }
    return sum;
  }, 0);

  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const roundOff = (Math.round(grandTotal) - grandTotal).toFixed(2);
  const storeCell = STORE_DETAILS.phone.replace(/[^0-9]/g, '').slice(-10);

  // Helper to clean item title (uppercase English name matching authentic POS thermal style)
  const getItemDisplayName = (item) => {
    if (item.englishName) return item.englishName.toUpperCase();
    if (item.id && Array.isArray(ALL_BILLING_ITEMS)) {
      const match = ALL_BILLING_ITEMS.find(
        (s) => s.id === item.id || s.name?.toLowerCase() === item.name?.toLowerCase()
      );
      if (match?.englishName) return match.englishName.toUpperCase();
    }
    const raw = item.name || '';
    const cleaned = raw.split('—')[0].split('-')[0].trim();
    return (cleaned || raw).toUpperCase();
  };

  // Helper to render POS Thermal Receipt Copy (Authentic Indian Sweet Shop Format)
  const renderThermalReceiptCopy = (copyType, index) => {
    return (
      <PosThermalReceipt
        key={copyType}
        invoice={activeInvoice}
        copyType={copyType}
        index={index}
      />
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
            <img src="/images/branding/logo.png" alt="Thenisai Sweets Logo" className="inv-brand-logo-img" />
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
            <p className="party-name">{customer?.fullName || 'Walk-in Customer'}</p>
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
                {paymentMethod === 'split'
                  ? 'Split Payment (Cash + UPI)'
                  : paymentMethod === 'upi'
                  ? 'Direct UPI (GPay / PhonePe)'
                  : paymentMethod === 'card'
                  ? 'Card / POS Terminal'
                  : 'Cash / COD'}
              </strong>
            </p>
            {paymentMethod === 'split' && (
              <div className="a4-split-breakdown" style={{ display: 'flex', gap: '8px', margin: '4px 0 6px' }}>
                <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Cash: ₹{Number(splitCash || 0).toFixed(2)}
                </span>
                <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  UPI: ₹{Number(splitUpi || 0).toFixed(2)}
                </span>
              </div>
            )}
            {upiUtr && <p className="party-line">Ref / Details: <strong>{upiUtr}</strong></p>}
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
              <li>For online orders & doorstep delivery across India, visit: <strong>www.thenisaisweets.com</strong></li>
              <li>All disputes subject to Krishnagiri jurisdiction only.</li>
            </ol>
          </div>

          <div className="inv-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

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
      <div className={`invoice-portal invoice-docked-mode format-${billFormat}`} data-lenis-prevent>
        {/* Subtle click-outside scrim (does not obscure the screen) */}
        <motion.div
          className="invoice-drawer-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Fixed Right-Docked In-Screen Drawer Panel */}
        <motion.aside
          className={`invoice-modal-wrap invoice-docked-drawer ${billFormat === 'a4' ? 'wrap-a4' : 'wrap-thermal'}`}
          role="dialog"
          aria-label="Invoice Viewer Drawer"
          data-lenis-prevent
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          {/* Action Toolbar with Format Switcher & Quick Actions */}
          <div className="invoice-toolbar">
            <div className="invoice-toolbar-top-row">
              <span className="invoice-quick-inv-badge">{invoiceNumber}</span>

              {/* Format Switcher Pills */}
              <div className="invoice-format-switcher">
                <button
                  type="button"
                  className={`format-btn ${billFormat === 'thermal' ? 'active' : ''}`}
                  onClick={() => handleSelectFormat('thermal')}
                  title="POS thermal receipt roll"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="format-icon-svg">
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                    <path d="M8 7h8" />
                    <path d="M8 11h8" />
                    <path d="M8 15h5" />
                  </svg>
                  <span>Thermal</span>
                </button>
                <button
                  type="button"
                  className={`format-btn ${billFormat === 'a4' ? 'active' : ''}`}
                  onClick={() => handleSelectFormat('a4')}
                  title="Standard A4 sheet layout"
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

              {/* Copies Switcher (Default: 2 Copies) */}
              <div className="invoice-copies-switcher">
                <button
                  type="button"
                  className={`copies-pill-btn ${printCopies === 'both' ? 'active' : ''}`}
                  onClick={() => setPrintCopies('both')}
                  title="Default: 2 copies (Customer Copy + Shop Copy)"
                >
                  <span>2 Copies (Customer + Shop)</span>
                </button>
                <button
                  type="button"
                  className={`copies-pill-btn ${printCopies === 'customer' ? 'active' : ''}`}
                  onClick={() => setPrintCopies('customer')}
                  title="Single copy: Customer Copy Only"
                >
                  <span>1 Copy (Customer)</span>
                </button>
              </div>
            </div>

            <div className="invoice-toolbar-actions">
              <button
                type="button"
                className="toolbar-btn print-btn"
                onClick={handlePrint}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>{printCopies === 'both' ? 'Print 2 Copies' : 'Print Receipt'}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn whatsapp-btn"
                title={isPosSale && hasCustomerPhone ? `Send bill & online delivery link to ${customerDisplay} on WhatsApp` : 'Share Bill on WhatsApp'}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.05 2c-5.48 0-9.93 4.45-9.93 9.93 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.75 1.21 5.48 0 9.93-4.45 9.93-9.93 0-5.48-4.45-9.9-9.93-9.9zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.7 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.57.12.16 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
                </svg>
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                className="toolbar-btn close-btn"
                onClick={handleClose}
                aria-label="Close"
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="printable-invoice-container" data-lenis-prevent>
            {billFormat === 'a4' ? (
              <div
                className={`a4-invoices-wrapper ${copiesToRender.length > 1 ? 'has-multiple' : ''}`}
                ref={invoiceRef}
              >
                {copiesToRender.map((copyType, index) => renderA4InvoiceCopy(copyType, index))}
              </div>
            ) : (
              <div
                className={`thermal-receipt-wrapper ${copiesToRender.length > 1 ? 'has-multiple' : ''}`}
                ref={invoiceRef}
              >
                {copiesToRender.map((copyType, index) => renderThermalReceiptCopy(copyType, index))}
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
