import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ResetBillSequenceModal({ isOpen, onClose, onResetSuccess }) {
  useScrollLock(isOpen);
  const { resetBillSequence } = useCart();
  const { user } = useAuth();

  const [archiveToRecycleBin, setArchiveToRecycleBin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const res = await resetBillSequence(
        { archiveToRecycleBin },
        user || { name: 'Admin', role: 'admin' }
      );
      setSuccessMsg(res?.message || 'Bill sequence reset! Next invoice starts from AA001.');
      if (onResetSuccess) {
        try { await onResetSuccess(); } catch {}
      }
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('[Reset Sequence] Failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to reset bill sequence.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="delete-bill-overlay"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
    >
      <div
        className="delete-bill-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#b45309',
                  display: 'block',
                }}
              >
                Admin Bill Control
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Reset Bill Number Sequence
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Target Next Sequence Preview Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Next Generated Invoice Number
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                padding: '8px 24px',
                borderRadius: '10px',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
              }}
            >
              <span>AA001</span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              All subsequent counter sales will increment sequentially: AA001 ➔ AA002 ➔ AA003 ...
            </p>
          </div>

          {/* Safety Archive Option */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={archiveToRecycleBin}
                onChange={(e) => setArchiveToRecycleBin(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '16px',
                  height: '16px',
                  accentColor: '#16a34a',
                  cursor: 'pointer',
                }}
              />
              <div>
                <strong style={{ fontSize: '13px', color: '#166534', display: 'block' }}>
                  Safely move existing active bills to 30-Day Recycle Bin (Recommended)
                </strong>
                <span style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.4', display: 'block', marginTop: '2px' }}>
                  Preserves past bills for audits and financial reports. You can view or restore them from the Recycle Bin at any time.
                </span>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
            Clicking <strong>Confirm Reset</strong> will reset the sequence counter on all terminals. Any cashier creating a sale will immediately issue bill <strong>#01 (AA001)</strong>.
          </p>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isResetting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-reset-bill-sequence-btn"
            onClick={handleConfirmReset}
            disabled={isResetting || Boolean(successMsg)}
            style={{
              background: isResetting
                ? '#94a3b8'
                : 'linear-gradient(135deg, #d97706, #b45309)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isResetting ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {isResetting ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset Bill Number to AA001</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
