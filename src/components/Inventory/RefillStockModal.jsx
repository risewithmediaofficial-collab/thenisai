import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
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
  const [refillKg, setRefillKg] = useState('5');
  const [refillNote, setRefillNote] = useState('Counter tray refill from kitchen');

  const getUnitLabel = (item) => {
    if (!item) return 'kg';
    const u = (item.unit || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    if (cat === 'beverages' || id.includes('tea') || id.includes('coffee') || id.includes('milk') || id.includes('boost') || id.includes('horlicks') || u.includes('cup')) return 'Cups';
    if (cat === 'snacks' || id === 'vada' || u.includes('pc')) return 'Pcs';
    if (u.includes('pkt')) return 'pkts';
    if (u.includes('bottle') || u.includes('litre') || u.includes('liter') || u === 'l') return 'bottles';
    return 'kg';
  };

  if (!isOpen) return null;

  const currentItem = inventory.find((it) => it.id === selectedSweetId) || inventory[0];
  const currentKg = currentItem ? currentItem.stockKg : 0;
  const targetKg = currentKg + (parseFloat(refillKg) || 0);
  const activeUnitLabel = getUnitLabel(currentItem);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!refillKg || parseFloat(refillKg) <= 0) return;
    addInventoryStock(selectedSweetId, refillKg, refillNote);
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
                  {currentKg <= (currentItem?.minThreshold || 8) ? (
                    <strong style={{ color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Low ({currentKg} {activeUnitLabel})
                    </strong>
                  ) : (
                    <span>Available: {currentKg} {activeUnitLabel}</span>
                  )}
                </span>
              </label>
              <select
                className="stock-select"
                value={selectedSweetId}
                onChange={(e) => setSelectedSweetId(e.target.value)}
              >
                {inventory.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} — {it.stockKg} {getUnitLabel(it)} {it.stockKg <= it.minThreshold ? '[LOW STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="stock-field">
              <label>
                <span>Refill Amount ({activeUnitLabel})</span>
                <span className="stock-hint">Select quick preset or enter custom</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="stock-input"
                value={refillKg}
                onChange={(e) => setRefillKg(e.target.value)}
                onWheel={(e) => e.target.blur()}
                required
                autoFocus
              />
              <div className="stock-chips-row">
                {['2', '5', '8', '10', '15', '20', '25'].map((kg) => (
                  <button
                    key={kg}
                    type="button"
                    className={`stock-chip-btn ${refillKg === kg ? 'active' : ''}`}
                    onClick={() => setRefillKg(kg)}
                  >
                    +{kg} kg
                  </button>
                ))}
              </div>
            </div>

            {refillKg && (
              <div className="stock-preview-box" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}>
                <span>Tray level after refill:</span>
                <span className="stock-preview-val" style={{ color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{currentKg} kg</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span>{targetKg} kg</span>
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
