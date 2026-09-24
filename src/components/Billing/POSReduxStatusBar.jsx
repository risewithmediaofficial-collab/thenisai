import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setScannerActive,
  setActiveWeightPreset,
  setPaymentMethod,
} from '../../store/slices/posSlice';
import { selectInventorySummary } from '../../store/slices/inventorySlice';
import { showToast } from '../../store/slices/uiSlice';

/**
 * High-performance POS Status Bar powered by Redux.
 * Memoized to prevent re-renders during high-speed typing and cart mutations.
 */
function POSReduxStatusBar({ onOpenInventory, onOpenPreOrders }) {
  const dispatch = useAppDispatch();

  // Fast selectors from Redux
  const inventorySummary = useAppSelector(selectInventorySummary);
  const scannerActive = useAppSelector((state) => state.pos.scannerActive);
  const activeWeightPreset = useAppSelector((state) => state.pos.activeWeightPreset);
  const paymentMethod = useAppSelector((state) => state.pos.paymentMethod);

  // Pulse animation ref for stock updates
  const pulseRef = useRef(null);
  const prevCountRef = useRef(inventorySummary.totalProducts);

  useEffect(() => {
    if (prevCountRef.current !== inventorySummary.totalProducts) {
      prevCountRef.current = inventorySummary.totalProducts;
      if (pulseRef.current) {
        pulseRef.current.style.transform = 'scale(1.08)';
        setTimeout(() => {
          if (pulseRef.current) pulseRef.current.style.transform = 'scale(1)';
        }, 180);
      }
    }
  }, [inventorySummary.totalProducts]);

  const handleToggleScanner = useCallback(() => {
    const next = !scannerActive;
    dispatch(setScannerActive(next));
    dispatch(
      showToast({
        message: next ? 'Barcode Scanner Activated' : 'Barcode Scanner Paused',
        type: next ? 'success' : 'info',
      })
    );
  }, [dispatch, scannerActive]);

  const handleSelectPreset = useCallback(
    (preset) => {
      dispatch(setActiveWeightPreset(preset));
    },
    [dispatch]
  );

  const handleSelectPayment = useCallback(
    (method) => {
      dispatch(setPaymentMethod(method));
    },
    [dispatch]
  );

  const presets = ['100g', '250g', '500g', '1kg'];
  const methods = [
    { id: 'CASH', label: '💵 Cash' },
    { id: 'UPI', label: '📱 UPI' },
    { id: 'CARD', label: '💳 Card' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '12px',
        color: '#475569',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Left: Inventory Summary from Redux Store */}
      <div
        ref={pulseRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          transition: 'transform 0.18s ease',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          POS Active
        </span>

        <span style={{ color: '#cbd5e1' }}>|</span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          Catalog: <strong style={{ color: '#0f172a' }}>{inventorySummary.totalProducts}</strong> items
        </span>

        {inventorySummary.lowCounter > 0 && (
          <button
            type="button"
            onClick={onOpenInventory}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '9999px',
              color: '#b45309',
              fontWeight: 600,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            ⚠️ {inventorySummary.lowCounter} Low Counter
          </button>
        )}

        {inventorySummary.outOfStock > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '9999px',
              color: '#b91c1c',
              fontWeight: 600,
              fontSize: '11px',
            }}
          >
            🚫 {inventorySummary.outOfStock} Out of Stock
          </span>
        )}
      </div>

      {/* Right: Quick Toggles (Scanner, Presets, Fast Payment) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Weight Preset Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Weight:</span>
          {presets.map((p) => {
            const isSelected = activeWeightPreset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #b45309' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#fffbeb' : '#f8fafc',
                  color: isSelected ? '#b45309' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <span style={{ color: '#cbd5e1' }}>|</span>

        {/* Quick Payment Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {methods.map((m) => {
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectPayment(m.id)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #16a34a' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                  color: isSelected ? '#15803d' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <span style={{ color: '#cbd5e1' }}>|</span>

        {/* Barcode Scanner Toggle */}
        <button
          type="button"
          onClick={handleToggleScanner}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: scannerActive ? '1px solid #10b981' : '1px solid #cbd5e1',
            backgroundColor: scannerActive ? '#ecfdf5' : '#f1f5f9',
            color: scannerActive ? '#065f46' : '#64748b',
            transition: 'all 0.15s ease',
          }}
          title="Toggle hardware barcode scanner input listener"
        >
          📷 {scannerActive ? 'Scanner Active' : 'Scanner Off'}
        </button>
      </div>
    </div>
  );
}

export default memo(POSReduxStatusBar);
