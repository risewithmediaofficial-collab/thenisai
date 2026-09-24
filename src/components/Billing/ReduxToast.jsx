import React, { memo, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideToast } from '../../store/slices/uiSlice';

/**
 * Lightweight, memoized toast notifications system connected to Redux uiSlice.
 * Prevents full component tree re-rendering when alerts are triggered.
 */
function ReduxToast() {
  const dispatch = useAppDispatch();
  const toastMessage = useAppSelector((state) => state.ui.toastMessage);
  const toastType = useAppSelector((state) => state.ui.toastType);
  const timerRef = useRef(null);

  useEffect(() => {
    if (toastMessage) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch(hideToast());
      }, 2600);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toastMessage, dispatch]);

  if (!toastMessage) return null;

  const bgMap = {
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: bgMap[toastType] || '#0f172a',
        color: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 700 }}>{iconMap[toastType] || 'ℹ'}</span>
      <span>{toastMessage}</span>
      <button
        type="button"
        onClick={() => dispatch(hideToast())}
        style={{
          marginLeft: '8px',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          opacity: 0.8,
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0 4px',
        }}
      >
        ×
      </button>
    </div>
  );
}

export default memo(ReduxToast);
