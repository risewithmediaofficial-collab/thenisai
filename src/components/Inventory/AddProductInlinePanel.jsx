import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

export default function AddProductInlinePanel({ isOpen, onClose, onAddProduct }) {
  const { getNextAvailableSkuCode, addNewProduct } = useCart();

  const [form, setForm] = useState({
    nameEn: '',
    nameTa: '',
    category: 'sweets',
    unit: 'kg',
    price: '',
    skuCode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset and auto-suggest next SKU whenever panel opens
  useEffect(() => {
    if (isOpen) {
      const nextCode = getNextAvailableSkuCode ? getNextAvailableSkuCode() : 'SWT-01';
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
  }, [isOpen, getNextAvailableSkuCode]);

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
                <option value="sweets">Traditional Sweets (இனிப்புகள்)</option>
                <option value="karam">Karam &amp; Savouries (கார வகைகள்)</option>
                <option value="bakery">Bakery &amp; Puffs (பேக்கரி)</option>
                <option value="beverages">Beverages &amp; Juices (பானங்கள்)</option>
                <option value="traditional">Special Traditional (பாரம்பரியம்)</option>
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
                <option value="kg">kg (Kilogram)</option>
                <option value="1 Cup">1 Cup (Cup / Hot Beverage)</option>
                <option value="1 Pc">1 Pc (Piece / Snack)</option>
                <option value="g">g (Gram - 250g / 500g)</option>
                <option value="pcs">pcs (Piece / Unit)</option>
                <option value="box">box (Gift Box / Pack)</option>
                <option value="L">L (Litre / ml)</option>
              </select>
            </div>

            {/* SKU / Code */}
            <div className="form-field-group">
              <label htmlFor="prod-sku">SKU / Item Code</label>
              <input
                id="prod-sku"
                type="text"
                name="skuCode"
                placeholder="e.g., SWT-76"
                value={form.skuCode}
                onChange={handleChange}
                className="panel-input"
              />
            </div>
          </div>

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
