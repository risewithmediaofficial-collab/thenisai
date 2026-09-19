import React from 'react';
import { STORE_DETAILS, ALL_BILLING_ITEMS } from '../../data/sweetsData';

export default function PosThermalReceipt({ invoice, copyType = 'customer', index = 0 }) {
  if (!invoice) return null;

  const isShopCopy = copyType === 'shop';

  const {
    invoiceNumber = 'POS-001',
    orderDate = new Date().toLocaleDateString('en-IN'),
    orderTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    items = [],
    paymentMethod = 'cash',
  } = invoice;

  const splitCash = invoice.splitCash ?? invoice.paymentDetails?.cash ?? 0;
  const splitUpi = invoice.splitUpi ?? invoice.paymentDetails?.upi ?? 0;
  const subtotal = Number(invoice.subtotal) || 0;
  const deliveryFee = Number(invoice.deliveryFee) || 0;
  const grandTotal = Number(invoice.grandTotal) || (subtotal + deliveryFee);

  const storeCell = STORE_DETAILS.phone ? STORE_DETAILS.phone.replace(/[^0-9]/g, '').slice(-10) : '9344893547';

  // Helper to format item weight/quantity, rate, and amount
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

  // Helper to get item inventory code / SKU
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

  // Calculate totals & stats
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

  return (
    <div className={`thermal-single-copy-wrap copy-${copyType} ${index > 0 ? 'page-break-before' : ''}`}>
      <div className={`thermal-receipt-document pos-slip-document copy-${copyType}`}>
        {/* Header */}
        <div className="pos-slip-header">
          <div className="pos-store-name">{STORE_DETAILS.brandName.toUpperCase()}</div>
          <div className="pos-store-sub">NATTAMAI KOTTAI, NH 44, KRISHNAGIRI</div>
          <div className="pos-store-cell">CELL: {storeCell}</div>
          <div className="pos-slip-title">
            {isShopCopy ? 'SALES RECEIPT · SHOP COPY' : 'SALES RECEIPT · CUSTOMER COPY'}
          </div>
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Bill & Date Row */}
        <div className="pos-slip-bill-row">
          <span className="pos-bill-no">BILL: {invoiceNumber}</span>
          <span className="pos-bill-date">{orderDate} {orderTime}</span>
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Table Header */}
        <div className="pos-slip-table-head">
          <span className="col-item">ITEM</span>
          <span className="col-wt">WT/QTY</span>
          <span className="col-price">PRICE</span>
          <span className="col-amt">AMT</span>
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Items List */}
        <div className="pos-slip-items">
          {items.map((item, idx) => {
            const code = getInventoryCode(item, idx);
            const { wtQty, rate, amt } = formatItemDetails(item);
            const displayName = getItemDisplayName(item);
            return (
              <div key={idx} className="pos-slip-item-row">
                <div className="pos-item-title-line">
                  <span className="pos-item-code">#{code}</span>
                  <span className="pos-item-name">{displayName}</span>
                </div>
                <div className="pos-item-math-line">
                  <span className="col-indent" />
                  <span className="col-wt">{wtQty}</span>
                  <span className="col-price">{rate}</span>
                  <span className="col-amt">{amt}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Net Rs */}
        <div className="pos-slip-net-row">
          <span className="net-lbl">Net Rs:</span>
          <span className="net-val">{grandTotal.toFixed(2)}</span>
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Packing Summary & Payment Mode */}
        <div className="pos-slip-stats-block">
          <div className="pos-stats-line">
            <span>Items: {items.length}</span>
            <span>Qty: {totalPieces}</span>
            <span>Weight: {totalWeightKg > 0 ? `${totalWeightKg.toFixed(3)} kg` : `${totalPieces} pcs`}</span>
          </div>
          {Number(roundOff) !== 0 && (
            <div className="pos-stats-line pos-stats-roundoff">
              <span>Round Off</span>
              <span>₹{roundOff}</span>
            </div>
          )}
          {paymentMethod === 'split' ? (
            <>
              <div className="pos-stats-line pos-slip-split-header">
                <span>PAY MODE:</span>
                <strong>SPLIT PAY</strong>
              </div>
              <div className="pos-stats-line pos-slip-split-line">
                <span>├ CASH PAID:</span>
                <strong>₹{Number(splitCash || 0).toFixed(2)}</strong>
              </div>
              <div className="pos-stats-line pos-slip-split-line">
                <span>└ UPI PAID:</span>
                <strong>₹{Number(splitUpi || 0).toFixed(2)}</strong>
              </div>
            </>
          ) : (
            <div className="pos-stats-line pos-slip-pay-line">
              <span>PAY MODE:</span>
              <strong>{(paymentMethod || 'CASH').toUpperCase()}</strong>
            </div>
          )}
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Online Order & Doorstep Delivery Note */}
        <div className="pos-slip-online-note">
          <div className="pos-online-label">FOR ONLINE ORDER & DOORSTEP DELIVERY VISIT</div>
          <div className="pos-online-web">www.thenisaisweets.com</div>
        </div>

        <div className="pos-slip-dashed-line" />

        {/* Footer message */}
        <div className="pos-slip-thank-you">
          !! THANK YOU..VISIT AGAIN !!
        </div>

        {/* Clean paper feed gap before auto-cutter blade */}
        <div className="pos-slip-cut-feed" aria-hidden="true" />
      </div>
    </div>
  );
}
