import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getItemStockConfig } from '../../utils/unitConfig';

export default function ReturnStockModal({ isOpen, onClose, initialSweetId = null }) {
  const { inventory, returnStockToGodown } = useCart();
  const [selectedSweetId, setSelectedSweetId] = useState(initialSweetId || inventory[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [returnType, setReturnType] = useState('return'); // 'return' | 'wastage'
  const [note, setNote] = useState('End of shift remaining counter stock return');
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
      setNote(returnType === 'wastage' ? 'Damaged / expired quality rejection write-off' : 'End of shift remaining counter stock return');
    }
  }, [isOpen, initialSweetId, returnType]);

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

  const returnQty = parseFloat(quantity) || 0;
  const remainingCounter = Math.max(0, Math.round((currentCounter - returnQty) * 100) / 100);
  const projectedGodown = returnType === 'wastage'
    ? currentGodown
    : Math.round((currentGodown + returnQty) * 100) / 100;
  const isOverCounter = returnQty > currentCounter;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!returnQty || returnQty <= 0) {
      setErrorMsg('Please enter a valid quantity');
      return;
    }
    if (returnQty > currentCounter) {
      setErrorMsg(`Cannot return more than available Shop stock (${currentCounter} ${unitConfig.label})`);
      return;
    }

    returnStockToGodown({
      productId: currentSweet.id,
      quantity: returnQty,
      reason: returnType,
      note: note.trim() || (returnType === 'wastage' ? 'Shop spoilage write-off' : 'Returned to Company Godown'),
      performedBy: 'Company Manager',
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
            backgroundColor: returnType === 'wastage' ? '#fef2f2' : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: returnType === 'wastage' ? '#fee2e2' : '#fef3c7',
                color: returnType === 'wastage' ? '#dc2626' : '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: returnType === 'wastage' ? '1px solid #fecaca' : '1px solid #fde68a',
              }}
            >
              {returnType === 'wastage' ? '🗑️' : '↩️'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {returnType === 'wastage' ? 'Counter Spoilage / Wastage' : 'Return Stock to Godown'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#b45309' }}>
                {returnType === 'wastage' ? 'சேதம் / வீணான சரக்கு கழிவு' : 'கவுண்டரிலிருந்து கோடவுனுக்கு திரும்பப் பெறுதல்'}
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
          {/* Action Type Toggle */}
          <div
            style={{
              display: 'flex',
              padding: '4px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setReturnType('return');
                setNote('End of shift remaining counter stock return');
              }}
              style={{
                flex: 1,
                padding: '9px',
                background: returnType === 'return' ? '#ffffff' : 'transparent',
                color: returnType === 'return' ? '#92400e' : '#64748b',
                border: returnType === 'return' ? '1px solid #fde68a' : 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: returnType === 'return' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span>↩️ Return to Godown</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setReturnType('wastage');
                setNote('Damaged / expired quality rejection write-off');
              }}
              style={{
                flex: 1,
                padding: '9px',
                background: returnType === 'wastage' ? '#ffffff' : 'transparent',
                color: returnType === 'wastage' ? '#dc2626' : '#64748b',
                border: returnType === 'wastage' ? '1px solid #fecaca' : 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: returnType === 'wastage' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span>🗑️ Spoilage / Wastage</span>
            </button>
          </div>

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
                  {item.name || item.englishName} ({item.counterStock ?? item.stockKg ?? 0} {item.unit || 'kg'} in Counter)
                </option>
              ))}
            </select>
          </div>

          {/* Stock Balances Preview */}
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
                🏪 Shop Stock Remaining
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: isOverCounter ? '#dc2626' : '#059669',
                  marginTop: '4px',
                }}
              >
                {remainingCounter} <span style={{ fontSize: '12px', fontWeight: 600 }}>{unitConfig.label}</span>
              </div>
              {returnQty > 0 && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Was: {currentCounter} {unitConfig.label}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                {returnType === 'wastage' ? '⚠️ Written Off' : '📦 Returning to Godown'}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: returnType === 'wastage' ? '#dc2626' : '#d97706',
                  marginTop: '4px',
                }}
              >
                {returnQty}{' '}
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{unitConfig.label}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {returnType === 'wastage' ? 'Removed from stock' : 'Sent back to Godown'}
              </div>
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
                {returnType === 'wastage' ? 'Wastage Qty' : 'Return Qty'} in ({unitConfig.label})
              </label>
              <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>
                In Counter: {currentCounter} {unitConfig.label}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step={unitConfig.step}
                min={unitConfig.min}
                max={currentCounter}
                placeholder={`e.g. ${unitConfig.presets[0] || '5'}`}
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
                  border: isOverCounter
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

            {/* Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {unitConfig.presets.map((preset) => {
                const num = parseFloat(preset);
                if (num > currentCounter && currentCounter > 0) return null;
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
                    {preset} {unitConfig.label}
                  </button>
                );
              })}
              {currentCounter > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(String(currentCounter));
                    setErrorMsg('');
                  }}
                  style={{
                    background: quantity === String(currentCounter) ? '#d97706' : '#fffbeb',
                    color: quantity === String(currentCounter) ? '#fff' : '#b45309',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  All Counter ({currentCounter})
                </button>
              )}
            </div>
          </div>

          {/* Reason / Note */}
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
              Reason / Quality Note (காரணம்)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Returned to storage or spoiled during storage"
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
              disabled={isOverCounter || !returnQty}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor:
                  isOverCounter || !returnQty
                    ? '#94a3b8'
                    : returnType === 'wastage'
                    ? '#dc2626'
                    : '#d97706',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isOverCounter || !returnQty ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>
                {returnType === 'wastage' ? '🗑️ Write-off Wastage' : '↩️ Return to Godown'}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
