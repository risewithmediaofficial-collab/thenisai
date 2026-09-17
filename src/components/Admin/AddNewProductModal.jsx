import { useState } from 'react';
import './AdminDashboard.css';

export default function AddNewProductModal({ isOpen, onClose, onAddProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    tamilName: '',
    category: 'sweets',
    subcategory: 'Special Sweets',
    unit: 'kg',
    price: '',
    stockKg: '25',
    minThreshold: '5',
    hsn: '2106',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        stockKg: parseFloat(formData.stockKg) || 15,
        minThreshold: parseFloat(formData.minThreshold) || 5,
      });

      onClose();
      // Reset form
      setFormData({
        name: '',
        tamilName: '',
        category: 'sweets',
        subcategory: 'Special Sweets',
        unit: 'kg',
        price: '',
        stockKg: '25',
        minThreshold: '5',
        hsn: '2106',
        description: '',
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
                <option value="sweets">Sweets (இனிப்புகள்)</option>
                <option value="savouries">Savouries / Mixtures (கார வகைகள்)</option>
                <option value="ghee-bakery">Pure Ghee &amp; Bakery</option>
                <option value="traditional-rice-dal">Traditional Rice &amp; Dals</option>
                <option value="spices-masalas">Spices &amp; Podi Varieties</option>
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
                <option value="kg">kg (கிலோ)</option>
                <option value="litre">litre (லிட்டர்)</option>
                <option value="box">box (பெட்டி)</option>
                <option value="packet">packet (பாக்கெட்)</option>
                <option value="piece">piece (எண்ணிக்கை)</option>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Initial Stock ({formData.unit})
              </label>
              <input
                type="number"
                name="stockKg"
                min="0"
                step="any"
                value={formData.stockKg}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                name="minThreshold"
                min="1"
                value={formData.minThreshold}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                HSN Code
              </label>
              <input
                type="text"
                name="hsn"
                value={formData.hsn}
                onChange={handleChange}
                placeholder="2106"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Description / Ingredients
            </label>
            <textarea
              name="description"
              rows="2"
              placeholder="Fresh farm-sourced traditional preparation..."
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
            />
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
