import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getItemStockConfig } from '../../utils/unitConfig';

export default function DispatchStockModal({ isOpen, onClose, initialSweetId = null }) {
  const { inventory, dispatchStockToCounter } = useCart();
  const [selectedSweetId, setSelectedSweetId] = useState(initialSweetId || inventory[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('Fresh tray replenishment for POS counter');
  const [errorMsg, setErrorMsg] = useState('');

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      if (initialSweetId) {
        setSelectedSweetId(initialSweetId);
      } else if (!selectedSweetId && inventory.length > 0) {
        setSelectedSweetId(inventory[0].id);
      }
      setQuantity('');
      setErrorMsg('');
    }
  }, [isOpen, initialSweetId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSweet = inventory.find((i) => i.id === selectedSweetId) || inventory[0];
  const unitConfig = getItemStockConfig(currentSweet);
  const currentCounter = currentSweet?.counterStock ?? currentSweet?.stockKg ?? 0;
  const currentGodown = currentSweet?.godownStock ?? Math.round(currentCounter * 1.5);

  const dispatchQty = parseFloat(quantity) || 0;
  const remainingGodown = Math.max(0, Math.round((currentGodown - dispatchQty) * 100) / 100);
  const projectedCounter = Math.round((currentCounter + dispatchQty) * 100) / 100;
  const isOverStock = dispatchQty > currentGodown;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dispatchQty || dispatchQty <= 0) {
      setErrorMsg('Please enter a valid dispatch quantity');
      return;
    }
    if (dispatchQty > currentGodown) {
      setErrorMsg(`Cannot dispatch more than available Godown stock (${currentGodown} ${unitConfig.label})`);
      return;
    }

    dispatchStockToCounter({
      productId: currentSweet.id,
      quantity: dispatchQty,
      note: note.trim() || 'Replenished to counter tray',
      managerName: 'Company Manager',
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          color: '#0f172a',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: '1px solid #bfdbfe',
              }}
            >
              🚚
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Dispatch Stock to Counter
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#b45309' }}>
                கோடவுன் ➔ கவுண்டர் ட்ரே சரக்கு மாற்றம்
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
          {/* Select Product */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#475569',
                marginBottom: '8px',
              }}
            >
              Select Product (பொருள் தேர்வு)
            </label>
            <select
              value={selectedSweetId}
              onChange={(e) => {
                setSelectedSweetId(e.target.value);
                setQuantity('');
                setErrorMsg('');
              }}
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.englishName} ({item.godownStock ?? 0} {item.unit || 'kg'} in Godown)
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '18px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                🏭 Godown Remaining
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: isOverStock ? '#dc2626' : '#2563eb',
                  marginTop: '4px',
                }}
              >
                {remainingGodown} <span style={{ fontSize: '12px', fontWeight: 600 }}>{unitConfig.label}</span>
              </div>
              {dispatchQty > 0 && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Was: {currentGodown} {unitConfig.label}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                🛒 Counter Projected
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#059669',
                  marginTop: '4px',
                }}
              >
                {projectedCounter} <span style={{ fontSize: '12px', fontWeight: 600 }}>{unitConfig.label}</span>
              </div>
              {dispatchQty > 0 && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Was: {currentCounter} {unitConfig.label}
                </div>
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#475569',
                }}
              >
                Dispatch Quantity in Native Unit ({unitConfig.label})
              </label>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
                Max: {currentGodown} {unitConfig.label}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step={unitConfig.step}
                min={unitConfig.min}
                max={currentGodown}
                placeholder={`e.g. ${unitConfig.presets[1] || '10'}`}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingRight: '60px',
                  backgroundColor: '#ffffff',
                  border: isOverStock
                    ? '1.5px solid #dc2626'
                    : '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '18px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {unitConfig.label}
              </span>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {unitConfig.presets.map((preset) => {
                const num = parseFloat(preset);
                if (num > currentGodown && currentGodown > 0) return null;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setQuantity(preset);
                      setErrorMsg('');
                    }}
                    style={{
                      background: quantity === preset ? '#eff6ff' : '#f8fafc',
                      color: quantity === preset ? '#1d4ed8' : '#334155',
                      border: quantity === preset ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    +{preset} {unitConfig.label}
                  </button>
                );
              })}
              {currentGodown > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(String(currentGodown));
                    setErrorMsg('');
                  }}
                  style={{
                    background: quantity === String(currentGodown) ? '#2563eb' : '#eff6ff',
                    color: quantity === String(currentGodown) ? '#fff' : '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  All Godown ({currentGodown})
                </button>
              )}
            </div>
          </div>

          {/* Transfer Note */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Batch / Transfer Note (குறிப்பு)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Lunch rush counter refill"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOverStock || !dispatchQty}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: isOverStock || !dispatchQty ? '#94a3b8' : '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isOverStock || !dispatchQty ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isOverStock || !dispatchQty ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <span>🚚 Dispatch {dispatchQty > 0 ? `${dispatchQty} ${unitConfig.label}` : ''} to Counter</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
