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
          </div>
          <button type="button" className="stock-modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="stock-modal-error-banner" style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', margin: '0 20px 15px', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stock-form">
          <div className="stock-form__grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="stock-form__group">
              <label className="stock-form__label">
                Name (English) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="stock-form__input"
                placeholder="e.g. Badam Halwa Special"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>

            <div className="stock-form__group">
              <label className="stock-form__label">
                Name (Tamil — தமிழ்)
              </label>
              <input
                type="text"
                className="stock-form__input"
                placeholder="எ.கா. பாதாம் அல்வா ஸ்பெஷல்"
                value={form.nameTa}
                onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
              />
            </div>
          </div>

          <div className="stock-form__grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div className="stock-form__group">
              <label className="stock-form__label">Category / வகை</label>
              <select
                className="stock-form__input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="sweets">Authentic Sweets (இனிப்புகள்)</option>
                <option value="beverages">Tea &amp; Beverages (டீ &amp; பானங்கள்)</option>
                <option value="spices">Spices &amp; Kara (கார வகைகள்)</option>
                <option value="halwa">Halwa Specialties (அல்வா)</option>
              </select>
            </div>

            <div className="stock-form__group">
              <label className="stock-form__label">Sale Unit / அளவு அலகு</label>
              <select
                className="stock-form__input"
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

          <div className="stock-form__grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div className="stock-form__group">
              <label className="stock-form__label">
                Selling Price (₹) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="stock-form__input"
                placeholder="e.g. 500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div className="stock-form__group">
              <label className="stock-form__label">Initial Stock / ஆரம்ப இருப்பு</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="stock-form__input"
                placeholder="e.g. 20"
                value={form.stockKg}
                onChange={(e) => setForm({ ...form, stockKg: e.target.value })}
              />
            </div>
          </div>

          <div className="stock-form__group" style={{ marginTop: '10px' }}>
            <label className="stock-form__label">Kitchen Description / குறிப்பு</label>
            <input
              type="text"
              className="stock-form__input"
              placeholder="e.g. Fresh pure ghee batch prepared daily"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="stock-modal__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="stock-btn secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="stock-btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Product to Catalog'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
