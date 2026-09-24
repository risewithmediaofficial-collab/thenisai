import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG } from '../../data/sweetsData';
import { getItemStockConfig, isProductUnlimitedStock } from '../../utils/unitConfig';

export default function AddStockModal({ isOpen, onClose, initialSweetId = null }) {
  const { inventory, addInventoryStock, addNewProductStock, inwardStock, toggleProductUnlimitedStock } = useCart();
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

  // Screen scroll lock when modal is open
  useScrollLock(isOpen);

  // Sync initial sweet id when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSweetId) {
        setExistingForm((prev) => ({ ...prev, sweetId: initialSweetId, quantity: '' }));
      }
    }
  }, [isOpen, initialSweetId]);

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

  // Prevent mouse wheel from inadvertently changing number input values while scrolling modal
  useEffect(() => {
    const handleWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Existing sweet form
  const [existingForm, setExistingForm] = useState({
    sweetId: initialSweetId || inventory[0]?.id || SWEETS_CATALOG[0]?.id || 'palkova',
    quantity: '',
    batchNote: 'Shop stock verified and added',
  });

  // New sweet form
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Ghee Sweets',
    stockKg: '15',
    unit: 'kg',
    minThreshold: '8',
    batchNote: 'New sweet variety added to shop',
    isUnlimitedStock: false,
  });

  if (!isOpen) return null;

  const currentSweet = inventory.find((i) => i.id === existingForm.sweetId) ||
    SWEETS_CATALOG.find((s) => s.id === existingForm.sweetId);
  const isUnlimited = isProductUnlimitedStock(currentSweet);
  const unitConfig = getItemStockConfig(currentSweet);
  const currentStock = currentSweet?.counterStock ?? currentSweet?.stockKg ?? 0;
  const targetStock = currentStock + (parseFloat(existingForm.quantity) || 0);

  const handleExistingSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(existingForm.quantity);
    if (!qty || qty <= 0) return;

    if (typeof inwardStock === 'function') {
      inwardStock({
        productId: existingForm.sweetId,
        quantity: qty,
        unit: unitConfig.label,
        note: existingForm.batchNote,
      });
    } else {
      addInventoryStock(existingForm.sweetId, qty, existingForm.batchNote);
    }
    onClose();
    setExistingForm((prev) => ({ ...prev, quantity: '' }));
  };

  const handleNewSubmit = (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    addNewProductStock(newForm);
    onClose();
    setNewForm({
      name: '',
      category: 'Ghee Sweets',
      stockKg: '15',
      unit: 'kg',
      minThreshold: '8',
      batchNote: 'New recipe introduction from Godown',
      isUnlimitedStock: false,
    });
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
            <span className="stock-modal__eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              🏪 Shop Inventory Addition
            </span>
            <h3 className="stock-modal__title">+ Add Stock to Shop</h3>
            <p className="stock-modal__sub">Check current shop stock and add new stock balance ready for selling</p>
          </div>
          <button type="button" className="stock-modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="stock-modal__tabs">
          <button
            type="button"
            className={`stock-tab-btn ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            <span>+ Add to Existing Item</span>
          </button>
          <button
            type="button"
            className={`stock-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <span>+ Add New Sweet Item</span>
          </button>
        </div>

        {activeTab === 'existing' ? (
          <form onSubmit={handleExistingSubmit}>
            <div className="stock-modal__body">
              <div className="stock-field">
                <label>
                  <span>Select Sweet / Item Variety</span>
                  <span className="stock-hint">
                    Current Shop Stock: {isUnlimited ? (
                      <strong style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        Unlimited (∞)
                      </strong>
                    ) : (
                      <span>{currentStock} {unitConfig.label}</span>
                    )}
                  </span>
                </label>
                <select
                  className="stock-select"
                  value={existingForm.sweetId}
                  onChange={(e) =>
                    setExistingForm((prev) => ({ ...prev, sweetId: e.target.value }))
                  }
                >
                  {inventory.map((item) => {
                    const cfg = getItemStockConfig(item);
                    const unlim = isProductUnlimitedStock(item);
                    const sStock = item.counterStock ?? item.stockKg ?? 0;
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} — {unlim ? 'Shop Stock: Unlimited (∞)' : `Shop Stock: ${sStock} ${cfg.label}`}
                      </option>
                    );
                  })}
                  {/* Any catalog item not yet in inventory */}
                  {SWEETS_CATALOG.filter((s) => !inventory.some((i) => i.id === s.id)).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Not in shop stock)
                    </option>
                  ))}
                </select>

                {/* Unlimited Stock Toggle for current item */}
                <div style={{ marginTop: '10px', padding: '10px 14px', background: isUnlimited ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: isUnlimited ? '1px solid #bbf7d0' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isUnlimited ? '#047857' : '#0f172a' }}>
                      {isUnlimited ? '∞ Unlimited Stock Enabled' : 'Counted Stock Item'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {isUnlimited ? 'Never depletes on billing (ideal for freshly brewed tea, coffee, hot beverages)' : 'Stock is decremented when customer bills are completed'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProductUnlimitedStock(existingForm.sweetId, !isUnlimited)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: isUnlimited ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                      backgroundColor: isUnlimited ? '#ecfdf5' : '#ffffff',
                      color: isUnlimited ? '#047857' : '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isUnlimited ? 'Switch to Tracked' : '∞ Make Unlimited'}
                  </button>
                </div>
              </div>

              <div className="stock-field">
                <label>
                  <span>Quantity to Add in {unitConfig.label} ({unitConfig.singular})</span>
                  <span className="stock-hint">
                    {unitConfig.type === 'pcs' ? 'Enter exact piece count' : unitConfig.type === 'litre' ? 'Enter volume in litres' : unitConfig.type === 'cup' ? 'Enter cup count' : 'Enter weight in kg'}
                  </span>
                </label>
                <input
                  type="number"
                  step={unitConfig.step}
                  min={unitConfig.min}
                  className="stock-input"
                  placeholder={`e.g. ${unitConfig.presets[1] || '10'}`}
                  value={existingForm.quantity}
                  onChange={(e) =>
                    setExistingForm((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  onWheel={(e) => e.target.blur()}
                  required
                  autoFocus
                />
                <div className="stock-chips-row">
                  {unitConfig.presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`stock-chip-btn ${existingForm.quantity === val ? 'active' : ''}`}
                      onClick={() => setExistingForm((prev) => ({ ...prev, quantity: val }))}
                    >
                      +{val} {unitConfig.label}
                    </button>
                  ))}
                </div>
              </div>

              {existingForm.quantity && (
                <div className="stock-preview-box">
                  <span>Shop Stored Stock after Adding:</span>
                  <span className="stock-preview-val">
                    {currentStock} {unitConfig.label} &rarr; <strong>{targetStock} {unitConfig.label}</strong>
                  </span>
                </div>
              )}

              <div className="stock-field">
                <label>
                  <span>Verification / Batch Note</span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="e.g. Shop stock verified and added"
                  value={existingForm.batchNote}
                  onChange={(e) =>
                    setExistingForm((prev) => ({ ...prev, batchNote: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="stock-modal__footer">
              <button type="button" className="btn-stock-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-stock-submit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Confirm &amp; Add Stock to Shop</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleNewSubmit}>
            <div className="stock-modal__body">
              <div className="stock-field">
                <label>
                  <span>New Sweet Name</span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="e.g. Royal Dry Fruit Halwa"
                  value={newForm.name}
                  onChange={(e) =>
                    setNewForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </div>

              <div className="stock-field">
                <label>
                  <span>Category</span>
                </label>
                <select
                  className="stock-select"
                  value={newForm.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setNewForm((prev) => ({
                      ...prev,
                      category: cat,
                      unit: cat === 'Beverages' ? '1 Cup' : prev.unit,
                      isUnlimitedStock: cat === 'Beverages' ? true : prev.isUnlimitedStock,
                    }));
                  }}
                >
                  <option value="Beverages">Beverages · பானங்கள் (Tea, Coffee, Hot Milk)</option>
                  <option value="Spices (Kara Vagai)">Spices (Kara Vagai) · கார வகை</option>
                  <option value="Ghee Sweets">Traditional Ghee Sweets</option>
                  <option value="Milk & Khoa">Milk & Khoa Delicacies</option>
                  <option value="Cashew & Nut">Cashew & Nut Sweets</option>
                  <option value="Halwa & Soft">Halwa & Soft Confections</option>
                  <option value="Special Festival Box">Special Festival Assortment</option>
                </select>
              </div>

              {/* Unlimited Stock Checkbox */}
              <div className="stock-field" style={{ padding: '12px 14px', background: newForm.isUnlimitedStock ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: newForm.isUnlimitedStock ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: newForm.isUnlimitedStock ? '#047857' : '#0f172a', fontSize: '13px' }}>
                      ∞ Unlimited Stock (முடிவிலா இருப்பு)
                    </span>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                      Item is served continuously on-demand (e.g. freshly brewed tea, coffee, hot milk)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newForm.isUnlimitedStock}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, isUnlimitedStock: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {!newForm.isUnlimitedStock && (
                <>
                  <div className="stock-field">
                    <label>
                      <span>Initial Batch Stock (kg / items)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="stock-input"
                      placeholder="e.g. 20"
                      value={newForm.stockKg}
                      onChange={(e) =>
                        setNewForm((prev) => ({ ...prev, stockKg: e.target.value }))
                      }
                      onWheel={(e) => e.target.blur()}
                      required={!newForm.isUnlimitedStock}
                    />
                  </div>

                  <div className="stock-field">
                    <label>
                      <span>Low Stock Alert Minimum</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="stock-input"
                      value={newForm.minThreshold}
                      onChange={(e) =>
                        setNewForm((prev) => ({ ...prev, minThreshold: e.target.value }))
                      }
                      onWheel={(e) => e.target.blur()}
                      required={!newForm.isUnlimitedStock}
                    />
                  </div>
                </>
              )}

              <div className="stock-field">
                <label>
                  <span>Batch / Recipe Note</span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="e.g. First trial festival batch"
                  value={newForm.batchNote}
                  onChange={(e) =>
                    setNewForm((prev) => ({ ...prev, batchNote: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="stock-modal__footer">
              <button type="button" className="btn-stock-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-stock-submit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create &amp; Add to Shop</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
