import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { DEFAULT_PRODUCT_CATEGORIES, DEFAULT_PRODUCT_UNITS } from '../../context/CartContext';

export default function CatalogSettingsModal({ isOpen, onClose }) {
  const {
    allCategories,
    allUnits,
    addCustomCategory,
    updateCategory,
    removeCustomCategory,
    addCustomUnit,
    updateUnit,
    removeCustomUnit,
  } = useCart();

  const [activeTab, setActiveTab] = useState('categories');

  const [catLabel, setCatLabel] = useState('');
  const [catValue, setCatValue] = useState('');
  const [catError, setCatError] = useState('');

  const [unitLabel, setUnitLabel] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [unitError, setUnitError] = useState('');

  // Inline editing states
  const [editingCatValue, setEditingCatValue] = useState(null);
  const [editCatLabel, setEditCatLabel] = useState('');

  const [editingUnitValue, setEditingUnitValue] = useState(null);
  const [editUnitLabel, setEditUnitLabel] = useState('');

  if (!isOpen) return null;

  const currentCategories = allCategories || DEFAULT_PRODUCT_CATEGORIES;
  const currentUnits = allUnits || DEFAULT_PRODUCT_UNITS;

  const slugify = (str) =>
    str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleAddCategory = (e) => {
    e.preventDefault();
    const label = catLabel.trim();
    if (!label) { setCatError('Category name is required.'); return; }
    const value = catValue.trim() || slugify(label);
    if (!value) { setCatError('Category ID cannot be empty.'); return; }
    if (currentCategories.some((c) => c.value === value)) {
      setCatError(`Category "${value}" already exists.`);
      return;
    }
    addCustomCategory({ value, label });
    setCatLabel(''); setCatValue(''); setCatError('');
  };

  const handleSaveCatEdit = (val) => {
    const trimmed = editCatLabel.trim();
    if (!trimmed) return;
    updateCategory(val, { label: trimmed });
    setEditingCatValue(null);
  };

  const handleAddUnit = (e) => {
    e.preventDefault();
    const label = unitLabel.trim();
    if (!label) { setUnitError('Unit name is required.'); return; }
    const value = unitValue.trim() || label;
    if (!value) { setUnitError('Unit value cannot be empty.'); return; }
    if (currentUnits.some((u) => u.value === value)) {
      setUnitError(`Unit "${value}" already exists.`);
      return;
    }
    addCustomUnit({ value, label });
    setUnitLabel(''); setUnitValue(''); setUnitError('');
  };

  const handleSaveUnitEdit = (val) => {
    const trimmed = editUnitLabel.trim();
    if (!trimmed) return;
    updateUnit(val, { label: trimmed });
    setEditingUnitValue(null);
  };

  const listItemStyle = (isDefault) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: '10px',
    background: isDefault ? '#f8fafc' : '#f0fdf4',
    border: `1px solid ${isDefault ? '#e2e8f0' : '#bbf7d0'}`,
    gap: '10px',
  });

  const badgeStyle = (isDefault) => ({
    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
    background: isDefault ? '#e2e8f0' : '#dcfce7',
    color: isDefault ? '#64748b' : '#15803d',
    whiteSpace: 'nowrap',
  });

  const editBtn = {
    width: '28px', height: '28px', borderRadius: '6px',
    background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease',
  };

  const deleteBtn = {
    width: '28px', height: '28px', borderRadius: '6px',
    background: '#fee2e2', border: 'none', color: '#dc2626',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const CancelIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              position: 'relative', zIndex: 1201, width: '100%', maxWidth: '660px',
              background: '#fff', borderRadius: '18px',
              boxShadow: '0 32px 64px rgba(15,23,42,0.3)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              maxHeight: 'calc(100vh - 48px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px 16px',
              background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>Catalog Settings</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Manage &amp; edit product categories &amp; units</p>
                </div>
              </div>
              <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
              {[{ id: 'categories', label: 'Categories', count: currentCategories.length }, { id: 'units', label: 'Units', count: currentUnits.length }].map((tab) => (
                <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setEditingCatValue(null); setEditingUnitValue(null); }} style={{ padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '13px', color: activeTab === tab.id ? '#d97706' : '#64748b', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid #d97706' : '2px solid transparent', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  {tab.label}
                  <span style={{ background: activeTab === tab.id ? '#fef3c7' : '#e2e8f0', color: activeTab === tab.id ? '#92400e' : '#64748b', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

              {/* CATEGORIES */}
              {activeTab === 'categories' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '10px' }}>Add Custom Category</div>
                  {catError && <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '12px' }}>{catError}</div>}
                  <form onSubmit={handleAddCategory} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '8px', alignItems: 'flex-end' }}>
                      <div>
                        <input type="text" placeholder="Category name (e.g. Pickles & Jams)" value={catLabel} onChange={(e) => { setCatLabel(e.target.value); setCatValue(slugify(e.target.value)); setCatError(''); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Auto ID: <strong>{catValue || '…'}</strong></div>
                      </div>
                      <input type="text" placeholder="Custom ID (optional)" value={catValue} onChange={(e) => { setCatValue(slugify(e.target.value)); setCatError(''); }} style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      <button type="submit" style={{ padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                    </div>
                  </form>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    All Categories ({currentCategories.length}) — click Edit to change display name
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentCategories.map((cat) => {
                      const isDefault = DEFAULT_PRODUCT_CATEGORIES.some((d) => d.value === cat.value);
                      const isEditing = editingCatValue === cat.value;

                      return (
                        <div key={cat.value} style={listItemStyle(isDefault)}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <input
                                type="text"
                                value={editCatLabel}
                                onChange={(e) => setEditCatLabel(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCatEdit(cat.value);
                                  if (e.key === 'Escape') setEditingCatValue(null);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '7px 10px',
                                  fontSize: '13px',
                                  border: '1.5px solid #2563eb',
                                  borderRadius: '6px',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCatEdit(cat.value)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  background: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Save Changes"
                              >
                                <CheckIcon /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCatValue(null)}
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Cancel"
                              >
                                <CancelIcon />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{cat.label}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>ID: {cat.value}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={badgeStyle(isDefault)}>{isDefault ? 'BUILT-IN' : 'CUSTOM'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatValue(cat.value);
                                    setEditCatLabel(cat.label);
                                  }}
                                  style={editBtn}
                                  title="Edit category name"
                                >
                                  <EditIcon />
                                </button>
                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomCategory(cat.value)}
                                    style={deleteBtn}
                                    title="Remove category"
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UNITS */}
              {activeTab === 'units' && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '10px' }}>Add Custom Unit</div>
                  {unitError && <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '12px' }}>{unitError}</div>}
                  <form onSubmit={handleAddUnit} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '8px', alignItems: 'flex-end' }}>
                      <div>
                        <input type="text" placeholder="Unit label (e.g. 500ml Bottle)" value={unitLabel} onChange={(e) => { setUnitLabel(e.target.value); setUnitValue(e.target.value.trim()); setUnitError(''); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Value: <strong>{unitValue || '…'}</strong></div>
                      </div>
                      <input type="text" placeholder="Value (optional)" value={unitValue} onChange={(e) => { setUnitValue(e.target.value.trim()); setUnitError(''); }} style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      <button type="submit" style={{ padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                    </div>
                  </form>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    All Units ({currentUnits.length}) — click Edit to change display name
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentUnits.map((unit) => {
                      const isDefault = DEFAULT_PRODUCT_UNITS.some((d) => d.value === unit.value);
                      const isEditing = editingUnitValue === unit.value;

                      return (
                        <div key={unit.value} style={listItemStyle(isDefault)}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <input
                                type="text"
                                value={editUnitLabel}
                                onChange={(e) => setEditUnitLabel(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveUnitEdit(unit.value);
                                  if (e.key === 'Escape') setEditingUnitValue(null);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '7px 10px',
                                  fontSize: '13px',
                                  border: '1.5px solid #2563eb',
                                  borderRadius: '6px',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveUnitEdit(unit.value)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  background: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Save Changes"
                              >
                                <CheckIcon /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUnitValue(null)}
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Cancel"
                              >
                                <CancelIcon />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{unit.label}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>value: {unit.value}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={badgeStyle(isDefault)}>{isDefault ? 'BUILT-IN' : 'CUSTOM'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUnitValue(unit.value);
                                    setEditUnitLabel(unit.label);
                                  }}
                                  style={editBtn}
                                  title="Edit unit name"
                                >
                                  <EditIcon />
                                </button>
                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomUnit(unit.value)}
                                    style={deleteBtn}
                                    title="Remove unit"
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '9px 22px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

