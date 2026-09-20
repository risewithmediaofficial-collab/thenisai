import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { DEFAULT_PRODUCT_CATEGORIES, DEFAULT_PRODUCT_UNITS } from '../../context/CartContext';
export default function AddNewProductModal({ isOpen, onClose, onAddProduct }) {
  const { getNextAvailableSkuCode, getAvailableSkuCodes, allCategories: ctxCategories, allUnits: ctxUnits, customCategories, customUnits } = useCart();

  const allCategories = ctxCategories || [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories];
  const allUnits = ctxUnits || [...DEFAULT_PRODUCT_UNITS, ...customUnits];
  const [formData, setFormData] = useState({
    name: '',
    tamilName: '',
    category: 'sweets',
    subcategory: '',
    unit: 'kg',
    price: '',
    hsn: '',
  });

  const [availableSkus, setAvailableSkus] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const skus = getAvailableSkuCodes ? getAvailableSkuCodes(10) : [];
    setAvailableSkus(skus);
    const nextCode = skus.length > 0 ? String(skus[0]) : (getNextAvailableSkuCode ? getNextAvailableSkuCode() : '1');
    setFormData((prev) => ({
      ...prev,
      // Auto-fill only if empty — admin can override with a deleted SKU number
      hsn: prev.hsn || nextCode,
    }));
  }, [isOpen, getNextAvailableSkuCode, getAvailableSkuCodes]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Product name is mandatory.');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid selling price per unit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullDisplayName = formData.tamilName.trim()
        ? `${formData.name.trim()} — ${formData.tamilName.trim()}`
        : formData.name.trim();

      await onAddProduct({
        ...formData,
        name: fullDisplayName,
        englishName: formData.name.trim(),
        tamilName: formData.tamilName.trim(),
        price: priceNum,
        unitPrice: priceNum,
      });

      onClose();
      // Reset form
      setFormData({
        name: '',
        tamilName: '',
        category: 'sweets',
        subcategory: '',
        unit: 'kg',
        price: '',
        hsn: '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Add New Product to Catalog</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                New item will be instantly available across POS Counter &amp; Inventory.
              </p>
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Product Name (English) *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Dry Fruit Halwa"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Tamil Name (தமிழ் பெயர்)
              </label>
              <input
                type="text"
                name="tamilName"
                placeholder="எ.கா. உலர் பழ அல்வா"
                value={formData.tamilName}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
              >
                {allCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Billing Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
              >
                {allUnits.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Master Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="1"
                step="any"
                placeholder="e.g. 560"
                value={formData.price}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                SKU / HSN Code
                <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>— auto-generated, editable</span>
              </label>
              <input
                type="text"
                name="hsn"
                value={formData.hsn}
                onChange={handleChange}
                placeholder="Auto-generated — can override"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
              />
              {availableSkus && availableSkus.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Available SKU Numbers (click to select):</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {availableSkus.map((sku) => {
                      const isSelected = String(formData.hsn).trim() === String(sku);
                      return (
                        <button
                          key={sku}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hsn: String(sku) }))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Saving Product...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save &amp; Activate Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
