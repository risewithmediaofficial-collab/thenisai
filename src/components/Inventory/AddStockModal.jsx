import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG } from '../../data/sweetsData';
export default function AddStockModal({ isOpen, onClose }) {
  const { inventory, addInventoryStock, addNewProductStock } = useCart();
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

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
    sweetId: inventory[0]?.id || SWEETS_CATALOG[0]?.id || 'palkova',
    kg: '',
    batchNote: 'Fresh kitchen batch inward',
  });

  // New sweet form
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Ghee Sweets',
    stockKg: '15',
    minThreshold: '8',
    batchNote: 'New kitchen recipe introduction',
  });

  if (!isOpen) return null;

  const currentSweet = inventory.find((i) => i.id === existingForm.sweetId) ||
    SWEETS_CATALOG.find((s) => s.id === existingForm.sweetId);
  const currentKg = currentSweet?.stockKg || 0;
  const targetKg = currentKg + (parseFloat(existingForm.kg) || 0);

  const handleExistingSubmit = (e) => {
    e.preventDefault();
    if (!existingForm.kg || parseFloat(existingForm.kg) <= 0) return;
    addInventoryStock(existingForm.sweetId, existingForm.kg, existingForm.batchNote);
    onClose();
    setExistingForm((prev) => ({ ...prev, kg: '' }));
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
      minThreshold: '8',
      batchNote: 'New kitchen recipe introduction',
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
              Kitchen Stock Inward
            </span>
            <h3 className="stock-modal__title">Add Stock to Inventory</h3>
            <p className="stock-modal__sub">Record new production batches or introduce new sweet varieties</p>
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
            <span>Inward Existing Sweet</span>
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
                  <span>Select Sweet Variety</span>
                  <span className="stock-hint">Current: {currentKg} kg</span>
                </label>
                <select
                  className="stock-select"
                  value={existingForm.sweetId}
                  onChange={(e) =>
                    setExistingForm((prev) => ({ ...prev, sweetId: e.target.value }))
                  }
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stockKg} kg currently)
                    </option>
                  ))}
                  {/* Any catalog item not yet in inventory */}
                  {SWEETS_CATALOG.filter((s) => !inventory.some((i) => i.id === s.id)).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Not in tray)
                    </option>
                  ))}
                </select>
              </div>

              <div className="stock-field">
                <label>
                  <span>Quantity to Inward (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="stock-input"
                  placeholder="e.g. 15"
                  value={existingForm.kg}
                  onChange={(e) =>
                    setExistingForm((prev) => ({ ...prev, kg: e.target.value }))
                  }
                  onWheel={(e) => e.target.blur()}
                  required
                  autoFocus
                />
                <div className="stock-chips-row">
                  {['5', '10', '15', '20', '30', '50'].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      className={`stock-chip-btn ${existingForm.kg === kg ? 'active' : ''}`}
                      onClick={() => setExistingForm((prev) => ({ ...prev, kg }))}
                    >
                      +{kg} kg
                    </button>
                  ))}
                </div>
              </div>

              {existingForm.kg && (
                <div className="stock-preview-box">
                  <span>Inventory Level after Inward:</span>
                  <span className="stock-preview-val">{targetKg} kg</span>
                </div>
              )}

              <div className="stock-field">
                <label>
                  <span>Kitchen Production / Batch Note</span>
                </label>
                <input
                  type="text"
                  className="stock-input"
                  placeholder="e.g. Morning 6 AM Brass Uruli Batch"
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
                <span>Confirm Add Stock</span>
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
                  onChange={(e) =>
                    setNewForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  <option value="Spices (Kara Vagai)">Spices (Kara Vagai) · கார வகை</option>
                  <option value="Ghee Sweets">Traditional Ghee Sweets</option>
                  <option value="Milk & Khoa">Milk & Khoa Delicacies</option>
                  <option value="Cashew & Nut">Cashew & Nut Sweets</option>
                  <option value="Halwa & Soft">Halwa & Soft Confections</option>
                  <option value="Special Festival Box">Special Festival Assortment</option>
                </select>
              </div>

              <div className="stock-field">
                <label>
                  <span>Initial Batch Stock (kg)</span>
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
                  required
                />
              </div>

              <div className="stock-field">
                <label>
                  <span>Low Stock Alert Minimum (kg)</span>
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
                  required
                />
              </div>

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
                <span>Create &amp; Inward Item</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
