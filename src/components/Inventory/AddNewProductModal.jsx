import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import './StockModals.css';

export default function AddNewProductModal({ isOpen, onClose }) {
  const { addNewProduct } = useCart();

  useScrollLock(isOpen);

  const [form, setForm] = useState({
    nameEn: '',
    nameTa: '',
    category: 'sweets',
    unit: 'kg',
    price: '',
    stockKg: '20',
    minThreshold: '8',
    description: '',
  });

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
        stockKg: '20',
        minThreshold: '8',
        description: '',
      });
      setErrorMsg('');
    }
  }, [isOpen]);

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
      };

      await addNewProduct({
        name: displayName,
        englishName: form.nameEn.trim(),
        tamilName: form.nameTa.trim(),
        category: form.category,
        subcategory: subcategoryMap[form.category] || 'Specialty Sweets',
        unit: form.unit,
        price: priceNum,
        unitPrice: priceNum,
        stockKg: parseFloat(form.stockKg) || 10,
        minThreshold: parseFloat(form.minThreshold) || 8,
        description: form.description.trim() || 'Fresh handcrafted specialty',
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
                  <option value="sweets">Authentic Sweets (இனிப்புகள்)</option>
                  <option value="beverages">Tea &amp; Beverages (டீ &amp; பானங்கள்)</option>
                  <option value="spices">Spices &amp; Kara (கார வகைகள்)</option>
                  <option value="halwa">Halwa Specialties (அல்வா)</option>
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
                  <option value="kg">kg (Weighted in g / kg)</option>
                  <option value="Litre">Litre (Volume in ml / L)</option>
                  <option value="1 Cup">1 Cup (Fast seller cup)</option>
                  <option value="1 Pc">1 Pc (Single piece)</option>
                  <option value="1 Pkt">1 Pkt (Packaged packet)</option>
                  <option value="Bottle">Bottle (பாட்டில்)</option>
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
                  <span>Initial Stock / ஆரம்ப இருப்பு</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="stock-input"
                  placeholder="e.g. 20"
                  value={form.stockKg}
                  onChange={(e) => setForm({ ...form, stockKg: e.target.value })}
                />
              </div>
            </div>

            <div className="stock-field">
              <label>
                <span>Kitchen Description / குறிப்பு</span>
              </label>
              <input
                type="text"
                className="stock-input"
                placeholder="e.g. Fresh pure ghee batch prepared daily"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
