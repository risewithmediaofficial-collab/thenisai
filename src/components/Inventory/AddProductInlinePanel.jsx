import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { DEFAULT_PRODUCT_CATEGORIES, DEFAULT_PRODUCT_UNITS } from '../../context/CartContext';

export default function AddProductInlinePanel({ isOpen, onClose, onAddProduct }) {
  const { allBillingProducts, getNextAvailableSkuCode, getAvailableSkuCodes, addNewProduct, allCategories: ctxCategories, allUnits: ctxUnits, customCategories, customUnits } = useCart();

  const allCategories = ctxCategories || [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories];
  const allUnits = ctxUnits || [...DEFAULT_PRODUCT_UNITS, ...customUnits];

  const [form, setForm] = useState({
    nameEn: '',
    nameTa: '',
    category: 'sweets',
    unit: 'kg',
    price: '',
    skuCode: '',
  });

  const [availableSkus, setAvailableSkus] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset and auto-suggest next SKU whenever panel opens
  useEffect(() => {
    if (isOpen) {
      const skus = getAvailableSkuCodes ? getAvailableSkuCodes(10) : [];
      setAvailableSkus(skus);
      const nextCode = skus.length > 0 ? String(skus[0]) : (getNextAvailableSkuCode ? getNextAvailableSkuCode() : '1');
      setForm({
        nameEn: '',
        nameTa: '',
        category: 'sweets',
        unit: 'kg',
        price: '',
        skuCode: nextCode,
      });
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'category') {
        if (value === 'beverages' && (prev.unit === 'kg' || prev.unit === 'g')) {
          updated.unit = '1 Cup';
        } else if ((value === 'sweets' || value === 'karam') && (prev.unit === '1 Cup' || prev.unit === 'Cup')) {
          updated.unit = 'kg';
        }
      }
      return updated;
    });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim()) {
      setErrorMsg('Please enter the product name in English.');
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid selling price per unit.');
      return;
    }

    const enteredSku = form.skuCode.trim();
    if (enteredSku) {
      const duplicate = (allBillingProducts || []).find((p) => {
        const raw = String(p.skuCode ?? p.itemNumber ?? '').trim();
        return raw && raw.toLowerCase() === enteredSku.toLowerCase();
      });
      if (duplicate) {
        const dupName = duplicate.englishName || duplicate.name.split('—')[0].trim();
        setErrorMsg(`SKU #${enteredSku} is already added for "${dupName}". Please choose a different SKU number.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const displayName = form.nameTa.trim()
        ? `${form.nameEn.trim()} — ${form.nameTa.trim()}`
        : form.nameEn.trim();

      const productPayload = {
        name: displayName,
        englishName: form.nameEn.trim(),
        tamilName: form.nameTa.trim(),
        category: form.category,
        unit: form.unit,
        price: priceNum,
        unitPrice: priceNum,
        skuCode: form.skuCode.trim() || undefined,
        hsn: form.skuCode.trim() || undefined,
        inStock: true,
      };

      if (onAddProduct) {
        await onAddProduct(productPayload);
      } else if (addNewProduct) {
        await addNewProduct(productPayload);
      }

      setSuccessMsg(`Successfully added "${form.nameEn.trim()}" to catalog!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add product. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="admin-add-product-inline-panel"
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="add-product-panel-header">
          <div className="panel-title-wrap">
            <div className="panel-badge-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="panel-main-title">Add New Product (In-Screen Master)</h3>
              <p className="panel-sub-text">Enter sweet / item details to immediately make it available for POS Billing &amp; Inventory</p>
            </div>
          </div>

          <button
            type="button"
            className="panel-close-btn"
            onClick={onClose}
            title="Close panel (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="panel-alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="panel-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-product-inline-form">
          <div className="form-grid-3col">
            {/* English Name */}
            <div className="form-field-group">
              <label htmlFor="prod-name-en">
                English Name <span className="req-star">*</span>
              </label>
              <input
                id="prod-name-en"
                type="text"
                name="nameEn"
                placeholder="e.g., Ghee Mysore Pak"
                value={form.nameEn}
                onChange={handleChange}
                className="panel-input"
                autoFocus
                required
              />
            </div>

            {/* Tamil Name */}
            <div className="form-field-group">
              <label htmlFor="prod-name-ta">
                Tamil Name (Optional)
              </label>
              <input
                id="prod-name-ta"
                type="text"
                name="nameTa"
                placeholder="e.g., நெய் மைசூர் பாக்"
                value={form.nameTa}
                onChange={handleChange}
                className="panel-input"
              />
            </div>

            {/* Selling Price */}
            <div className="form-field-group">
              <label htmlFor="prod-price">
                Selling Price (₹ per unit) <span className="req-star">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">₹</span>
                <input
                  id="prod-price"
                  type="number"
                  step="any"
                  name="price"
                  placeholder="e.g., 680"
                  value={form.price}
                  onChange={handleChange}
                  className="panel-input prefixed"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-field-group">
              <label htmlFor="prod-cat">Category</label>
              <select
                id="prod-cat"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="panel-select"
              >
                {allCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Default Unit */}
            <div className="form-field-group">
              <label htmlFor="prod-unit">Default Billing Unit</label>
              <select
                id="prod-unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="panel-select"
              >
                {allUnits.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* SKU / Code */}
            <div className="form-field-group">
              <label htmlFor="prod-sku">SKU / Item Code</label>
              <input
                id="prod-sku"
                type="text"
                name="skuCode"
                placeholder="e.g., 2, 42, SWT-76"
                value={form.skuCode}
                onChange={handleChange}
                className="panel-input"
              />
            </div>
          </div>

          {/* Available SKU Numbers Quick-Select */}
          {availableSkus && availableSkus.length > 0 && (
            <div
              className="available-skus-container"
              style={{
                margin: '0 0 16px',
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Available SKU Numbers:</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>(Click any number to auto-assign)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                  ✓ Unused &amp; restored numbers ready for use
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                {availableSkus.map((sku) => {
                  const isSelected = String(form.skuCode).trim() === String(sku);
                  return (
                    <button
                      key={sku}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, skuCode: String(sku) }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                        background: isSelected ? '#fef3c7' : '#ffffff',
                        color: isSelected ? '#92400e' : '#334155',
                        boxShadow: isSelected ? '0 1px 4px rgba(217, 119, 6, 0.2)' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'none',
                      }}
                      title={`Click to use available SKU #${sku}`}
                    >
                      #{sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="panel-action-bar">
            <div className="hint-text">
              Product will immediately be indexed for quick counter search and inventory tallying.
            </div>
            <div className="action-btns-group">
              <button
                type="button"
                className="panel-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="panel-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Saving Product...</span>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Save &amp; Add to Catalog</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
