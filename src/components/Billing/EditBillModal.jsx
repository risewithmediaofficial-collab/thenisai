import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { ALL_BILLING_ITEMS } from '../../data/sweetsData';
export default function EditBillModal({
  isOpen,
  bill,
  onClose,
  onSuccess,
  currentUser,
}) {
  const { editBill, openInvoice } = useCart();

  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ fullName: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [editReason, setEditReason] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  // Initialize form state when bill opens
  useEffect(() => {
    if (bill && isOpen) {
      setItems((bill.items || []).map((it) => ({
        id: it.id,
        name: it.name,
        englishName: it.englishName || it.name,
        tamilName: it.tamilName || '',
        weight: it.weight || '1 Pc',
        unit: it.unit || 'Pc',
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        hsn: it.hsn || '2106',
        itemNumber: it.itemNumber || null,
        skuCode: it.skuCode || (it.itemNumber ? String(it.itemNumber) : ''),
      })));

      setCustomer({
        fullName: bill.customer?.fullName || '',
        phone: bill.customer?.phone || '',
      });

      const pm = (bill.paymentMethod || 'cash').toLowerCase();
      setPaymentMethod(pm);
      setSplitCash(bill.splitCash ?? bill.paymentDetails?.cash ?? '');
      setSplitUpi(bill.splitUpi ?? bill.paymentDetails?.upi ?? '');
      setEditReason('');
      setCatalogSearch('');
      setErrorNotice('');
    }
  }, [bill, isOpen]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  }, [items]);

  const originalGrandTotal = Number(bill?.grandTotal || 0);

  // Preserve tax percentage if originally billed with tax
  const taxRate = bill?.taxBreakdown?.rate || 0;
  const isTaxEnabled = Boolean(taxRate > 0);
  const totalTax = isTaxEnabled ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;
  const difference = Math.round((grandTotal - originalGrandTotal) * 100) / 100;

  // Filter catalog items to add
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase().trim();
    return (ALL_BILLING_ITEMS || [])
      .filter((sw) => {
        const n = (sw.name || '').toLowerCase();
        const en = (sw.englishName || '').toLowerCase();
        const tn = (sw.tamilName || '').toLowerCase();
        const num = String(sw.itemNumber || '');
        return n.includes(q) || en.includes(q) || tn.includes(q) || num === q;
      })
      .slice(0, 6);
  }, [catalogSearch]);

  const handleUpdateQty = (index, delta) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      const nextQty = target.quantity + delta;
      if (nextQty <= 0) {
        // Remove item if reduced to 0
        return prev.filter((_, i) => i !== index);
      }
      target.quantity = nextQty;
      updated[index] = target;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePrice = (index, newPrice) => {
    const num = parseFloat(newPrice);
    if (isNaN(num) || num < 0) return;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price: num };
      return updated;
    });
  };

  const handleAddCatalogItem = (sweet) => {
    setItems((prev) => [
      ...prev,
      {
        id: sweet.id,
        name: sweet.name,
        englishName: sweet.englishName || sweet.name,
        tamilName: sweet.tamilName || '',
        weight: sweet.unit === 'kg' ? '500g' : sweet.unit === 'Litre' ? '1 Litre' : sweet.unit === 'Cup' ? '1 Cup' : '1 Pc',
        unit: sweet.unit || 'kg',
        price: Number(sweet.price || 0),
        quantity: 1,
        hsn: sweet.hsn || '2106',
        itemNumber: sweet.itemNumber || null,
        skuCode: sweet.skuCode || (sweet.itemNumber ? String(sweet.itemNumber) : ''),
      },
    ]);
    setCatalogSearch('');
  };

  const handleSave = async () => {
    if (!editReason.trim()) {
      setErrorNotice('Please provide a mandatory reason for editing this bill.');
      return;
    }

    if (items.length === 0) {
      setErrorNotice('A bill must contain at least 1 item. If you wish to void the entire bill, please use Delete.');
      return;
    }

    if (paymentMethod === 'split') {
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      if (c + u < grandTotal) {
        setErrorNotice(`Split payment incomplete! Total: ₹${grandTotal}, entered: ₹${c + u}.`);
        return;
      }
    }

    setIsSaving(true);
    setErrorNotice('');

    try {
      const updatedData = {
        items,
        customer: {
          fullName: customer.fullName.trim() || 'Walk-in Customer',
          phone: customer.phone.trim() || 'Store Counter',
        },
        paymentMethod,
        subtotal,
        grandTotal,
        splitCash: paymentMethod === 'split' ? parseFloat(splitCash) || 0 : null,
        splitUpi: paymentMethod === 'split' ? parseFloat(splitUpi) || 0 : null,
        paymentDetails: {
          mode: paymentMethod,
          cash: paymentMethod === 'split' ? parseFloat(splitCash) || 0 : (paymentMethod === 'cash' ? grandTotal : 0),
          upi: paymentMethod === 'split' ? parseFloat(splitUpi) || 0 : (paymentMethod === 'upi' ? grandTotal : 0),
          card: paymentMethod === 'card' ? grandTotal : 0,
        },
      };

      const res = await editBill(bill.id || bill.invoiceNumber, updatedData, editReason.trim(), currentUser);
      if (res && res.success) {
        if (onSuccess) onSuccess(res.bill);
        onClose();
      } else {
        setErrorNotice(res?.message || 'Failed to update bill.');
      }
    } catch (err) {
      setErrorNotice(err.message || 'An error occurred while updating the bill.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !bill) return null;

  return (
    <AnimatePresence>
      <div className="edit-bill-overlay" role="dialog" aria-modal="true">
        <motion.div
          className="edit-bill-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* Header */}
          <div className="edit-bill-header">
            <div className="edit-bill-header-left">
              <div className="edit-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>EDIT INVOICE</span>
              </div>
              <h3 className="edit-bill-title">{bill.invoiceNumber}</h3>
              <span className="edit-bill-meta">
                Billed on {bill.orderDate} {bill.orderTime} by <strong>{bill.cashier?.name || 'Staff'}</strong>
              </span>
            </div>
            <button type="button" className="edit-bill-close-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {errorNotice && (
            <div className="edit-bill-error-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorNotice}</span>
            </div>
          )}

          <div className="edit-bill-body">
            {/* Customer Details Row */}
            <div className="edit-bill-section">
              <h4 className="edit-section-heading">1. Customer Information</h4>
              <div className="edit-cust-grid">
                <div className="edit-input-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customer.fullName}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="edit-input-group">
                  <label>Mobile Number (WhatsApp Bill)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customer.phone}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="edit-bill-section">
              <div className="items-section-header">
                <h4 className="edit-section-heading">2. Bill Items &amp; Quantities ({items.length})</h4>
                <div className="add-item-search-box">
                  <input
                    type="text"
                    placeholder="+ Add sweet or drink (e.g. Tea, Palkova)..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                  {filteredCatalog.length > 0 && (
                    <div className="add-item-dropdown">
                      {filteredCatalog.map((sw) => (
                        <div
                          key={sw.id}
                          className="add-item-opt"
                          onClick={() => handleAddCatalogItem(sw)}
                        >
                          <span className="sw-name">{sw.name}</span>
                          <span className="sw-price">₹{sw.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="edit-items-table-wrap">
                <table className="edit-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th>Weight / Size</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price (₹)</th>
                      <th className="text-right">Total (₹)</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={`${it.id}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong>{it.name}</strong>
                            {(it.skuCode || it.itemNumber) && (
                              <span style={{ fontSize: '0.70rem', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '1px 5px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700' }}>
                                SKU: {it.skuCode || it.itemNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="weight-tag">{it.weight}</span>
                        </td>
                        <td className="text-center">
                          <div className="edit-qty-control">
                            <button
                              type="button"
                              className="qty-btn dec"
                              onClick={() => handleUpdateQty(idx, -1)}
                              title="Reduce quantity"
                            >
                              −
                            </button>
                            <span className="qty-num">{it.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn inc"
                              onClick={() => handleUpdateQty(idx, 1)}
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            className="edit-price-input"
                            value={it.price}
                            onChange={(e) => handleUpdatePrice(idx, e.target.value)}
                            min="0"
                            step="1"
                          />
                        </td>
                        <td className="text-right">
                          <strong>₹{(it.price * it.quantity).toFixed(2)}</strong>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => handleRemoveItem(idx)}
                            title="Remove this item from bill"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="edit-bill-section">
              <h4 className="edit-section-heading">3. Payment Mode &amp; Drawer Tender</h4>
              <div className="edit-payment-pills">
                {['cash', 'upi', 'card', 'split'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    className={`pay-pill ${paymentMethod === pm ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(pm)}
                  >
                    {pm.toUpperCase()}
                  </button>
                ))}
              </div>

              {paymentMethod === 'split' && (
                <div className="split-inputs-row">
                  <div className="split-field">
                    <label>Cash Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                    />
                  </div>
                  <div className="split-field">
                    <label>UPI Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mandatory Reason for Edit */}
            <div className="edit-bill-section">
              <h4 className="edit-section-heading">
                4. Mandatory Reason for Edit <span className="req-star">*</span>
              </h4>
              <textarea
                className="edit-reason-input"
                rows="2"
                placeholder="Explain why this bill was modified (e.g. Customer added 1 more tea, weight correction, wrong payment method)..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Summary & Actions */}
          <div className="edit-bill-footer">
            <div className="edit-totals-comparison">
              <div className="comp-item">
                <span className="comp-lbl">Original Total</span>
                <span className="comp-old">₹{originalGrandTotal}</span>
              </div>
              <span className="comp-arrow" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
              <div className="comp-item">
                <span className="comp-lbl">Updated Total</span>
                <span className="comp-new">₹{grandTotal}</span>
              </div>
              {difference !== 0 && (
                <span className={`diff-pill ${difference > 0 ? 'increase' : 'decrease'}`}>
                  {difference > 0 ? `+₹${difference}` : `-₹${Math.abs(difference)}`}
                </span>
              )}
            </div>

            <div className="edit-actions-group">
              <button
                type="button"
                className="btn-edit-cancel"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-edit-save"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving Changes...' : 'Save & Update Bill'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
