import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getItemStockConfig } from '../../utils/unitConfig';

export default function RefillStockModal({ isOpen, onClose, initialSweetId }) {
  const { inventory, addInventoryStock } = useCart();

  const [selectedSweetId, setSelectedSweetId] = useState(
    initialSweetId || inventory[0]?.id || 'tea'
  );

  // Screen scroll lock when modal is open
  useScrollLock(isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialSweetId) {
      setSelectedSweetId(initialSweetId);
    }
  }, [initialSweetId, isOpen]);

  const currentItem = inventory.find((it) => it.id === selectedSweetId) || inventory[0];
  const unitConfig = getItemStockConfig(currentItem);

  const [refillQty, setRefillQty] = useState('5');
  const [refillNote, setRefillNote] = useState('Counter tray refill from kitchen');

  useEffect(() => {
    if (unitConfig?.presets?.[1]) {
      setRefillQty(unitConfig.presets[1]);
    }
  }, [selectedSweetId]);

  if (!isOpen) return null;

  const currentStock = currentItem ? (currentItem.counterStock ?? currentItem.stockKg ?? 0) : 0;
  const targetStock = currentStock + (parseFloat(refillQty) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!refillQty || parseFloat(refillQty) <= 0) return;
    addInventoryStock(selectedSweetId, refillQty, refillNote);
    onClose();
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
        className="stock-modal refill-stock-modal"
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
      >
        <div className="stock-modal__header">
          <div>
            <span className="stock-modal__eyebrow" style={{ color: '#059669' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Fast Tray Replenishment
            </span>
            <h3 className="stock-modal__title">Refill Counter Tray Stock</h3>
            <p className="stock-modal__sub">Quickly top up sweets in the front counter trays</p>
          </div>
          <button type="button" className="stock-modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="stock-modal__body">
            <div className="stock-field">
              <label>
                <span>Select Item to Refill</span>
                <span className="stock-hint">
                  {currentStock <= (currentItem?.minThreshold || 8) ? (
                    <strong style={{ color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Low ({currentStock} {unitConfig.label})
                    </strong>
                  ) : (
                    <span>Available: {currentStock} {unitConfig.label}</span>
                  )}
                </span>
              </label>
              <select
                className="stock-select"
                value={selectedSweetId}
                onChange={(e) => setSelectedSweetId(e.target.value)}
              >
                {inventory.map((it) => {
                  const cfg = getItemStockConfig(it);
                  const st = it.counterStock ?? it.stockKg ?? 0;
                  return (
                    <option key={it.id} value={it.id}>
                      {it.name} — {st} {cfg.label} {st <= it.minThreshold ? '[LOW STOCK]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="stock-field">
              <label>
                <span>Refill Amount in {unitConfig.label} ({unitConfig.singular})</span>
                <span className="stock-hint">Select quick preset or enter custom</span>
              </label>
              <input
                type="number"
                step={unitConfig.step}
                min={unitConfig.min}
                className="stock-input"
                value={refillQty}
                onChange={(e) => setRefillQty(e.target.value)}
                onWheel={(e) => e.target.blur()}
                required
                autoFocus
              />
              <div className="stock-chips-row">
                {unitConfig.presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`stock-chip-btn ${refillQty === val ? 'active' : ''}`}
                    onClick={() => setRefillQty(val)}
                  >
                    +{val} {unitConfig.label}
                  </button>
                ))}
              </div>
            </div>

            {refillQty && (
              <div className="stock-preview-box" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}>
                <span>Tray level after refill:</span>
                <span className="stock-preview-val" style={{ color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{currentStock} {unitConfig.label}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span>{targetStock} {unitConfig.label}</span>
                </span>
              </div>
            )}

            <div className="stock-field">
              <label>
                <span>Refill Note</span>
              </label>
              <input
                type="text"
                className="stock-input"
                value={refillNote}
                onChange={(e) => setRefillNote(e.target.value)}
              />
            </div>
          </div>

          <div className="stock-modal__footer">
            <button type="button" className="btn-stock-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-stock-submit"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderColor: '#047857' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Confirm Tray Refill</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
