import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { DEFAULT_PRODUCT_CATEGORIES, DEFAULT_PRODUCT_UNITS } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
export default function AddNewProductModal({ isOpen, onClose }) {
  const { addNewProduct, getNextAvailableSkuCode, getAvailableSkuCodes, allCategories: ctxCategories, allUnits: ctxUnits, customCategories, customUnits } = useCart();

  const allCategories = ctxCategories || [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories];
  const allUnits = ctxUnits || [...DEFAULT_PRODUCT_UNITS, ...customUnits];

  useScrollLock(isOpen);

  const [form, setForm] = useState({
    nameEn: '',
    nameTa: '',
    category: 'sweets',
    unit: 'kg',
    price: '',
    skuCode: '',
    hsn: '',
  });

  const [availableSkus, setAvailableSkus] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm({
        nameEn: '',
        nameTa: '',
        category: 'sweets',
        unit: 'kg',
        price: '',
        skuCode: '',
        hsn: '',
      });
      setErrorMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const skus = getAvailableSkuCodes ? getAvailableSkuCodes(10) : [];
    setAvailableSkus(skus);
    const nextCode = skus.length > 0 ? String(skus[0]) : (getNextAvailableSkuCode ? getNextAvailableSkuCode() : '1');
    setForm((prev) => ({
      ...prev,
      // Auto-fill only if empty so admin can override with a specific SKU
      skuCode: prev.skuCode || nextCode,
      hsn: prev.hsn || nextCode,
    }));
  }, [isOpen, getNextAvailableSkuCode, getAvailableSkuCodes]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim()) {
      setErrorMsg('Please enter the product name in English.');
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid selling price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const displayName = form.nameTa.trim()
        ? `${form.nameEn.trim()} — ${form.nameTa.trim()}`
        : form.nameEn.trim();

      const subcategoryMap = {
        beverages: 'Hot Beverages',
        sweets: 'Authentic Sweets',
        spices: 'Spices (Kara Vagai)',
        halwa: 'Halwa Specialties',
        other: 'Other Products',
      };

      await addNewProduct({
        name: displayName,
        englishName: form.nameEn.trim(),
        tamilName: form.nameTa.trim(),
        category: form.category,
        subcategory: subcategoryMap[form.category] || 'Specialty Sweets',
        unit: form.unit,
        skuCode: form.skuCode ? form.skuCode.trim() : undefined,
        hsn: form.hsn || form.skuCode || undefined,
        price: priceNum,
        unitPrice: priceNum,
      });

      onClose();
    } catch (err) {
      setErrorMsg('Failed to add product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stock-modal-portal">
      <motion.div
        className="stock-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="stock-modal add-stock-modal"
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
      >
        <div className="stock-modal__header">
          <div>
            <span className="stock-modal__badge">PRODUCT INVENTORY</span>
            <h3 className="stock-modal__title">Add New Product / புதிய பொருள்</h3>
            <p className="stock-modal__sub">Enter product details to add to POS counter catalog &amp; inventory</p>
          </div>
          <button type="button" className="stock-modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="stock-modal-error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="stock-modal__body">
            <div className="stock-form-row-2">
              <div className="stock-field">
                <label>
                  <span>Name (English) <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <input
                  type="text"
                  required
                  className="stock-input"
                  placeholder="e.g. Badam Halwa Special"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>

              <div className="stock-field">
                <label>
                  <span>Name (Tamil — தமிழ்)</span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="எ.கா. பாதாம் அல்வா ஸ்பெஷல்"
                  value={form.nameTa}
                  onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
                />
              </div>
            </div>

            <div className="stock-form-row-2">
              <div className="stock-field">
                <label>
                  <span>Category / வகை</span>
                </label>
                <select
                  className="stock-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {allCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="stock-field">
                <label>
                  <span>Sale Unit / அளவு அலகு</span>
                </label>
                <select
                  className="stock-select"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {allUnits.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="stock-form-row-2">
              <div className="stock-field">
                <label>
                  <span>Selling Price (₹) <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  className="stock-input"
                  placeholder="e.g. 500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="stock-field">
                <label>
                  <span>SKU Code (குறியீடு) <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '11px' }}>— editable</span></span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="Auto-generated — can edit"
                  value={form.skuCode}
                  onChange={(e) => setForm({ ...form, skuCode: e.target.value, hsn: e.target.value || form.hsn })}
                  style={{ background: '#fff' }}
                />
                {availableSkus && availableSkus.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>Available SKU Numbers:</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {availableSkus.map((sku) => {
                        const isSelected = String(form.skuCode).trim() === String(sku);
                        return (
                          <button
                            key={sku}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, skuCode: String(sku), hsn: String(sku) }))}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isSelected ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                              background: isSelected ? '#fef3c7' : '#f8fafc',
                              color: isSelected ? '#92400e' : '#334155',
                              boxShadow: isSelected ? '0 1px 3px rgba(217, 119, 6, 0.2)' : 'none',
                            }}
                            title={`Assign available SKU #${sku}`}
                          >
                            #{sku}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="stock-form-row-2">
              <div className="stock-field">
                <label>
                  <span>HSN Number <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '11px' }}>— editable</span></span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="Auto-generated HSN"
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                  style={{ background: '#fff' }}
                />
              </div>
            </div>
          </div>

          <div className="stock-modal__footer">
            <button type="button" className="btn-stock-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-stock-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Adding...</span>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Product to Catalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
