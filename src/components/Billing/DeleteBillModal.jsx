import { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import './DeleteBillModal.css';

const REASON_PRESETS = [
  'Customer Cancelled / Walked Away',
  'Wrong Items / Quantity Punched',
  'Duplicate Invoice Generated',
  'Payment Failed / Aborted at Counter',
  'Incorrect Weight / Unit Entered',
  'Test / Staff Training Bill',
];

export default function DeleteBillModal({ isOpen, bill, onClose, onConfirmDelete, user }) {
  useScrollLock(isOpen);

  const [selectedReason, setSelectedReason] = useState('Customer Cancelled / Walked Away');
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('Customer Cancelled / Walked Away');
      setCustomReason('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !bill) return null;

  const finalReason = customReason.trim() ? customReason.trim() : selectedReason;

  const handleConfirm = async () => {
    if (!finalReason) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(bill, finalReason);
      onClose();
    } catch (err) {
      console.error('Delete bill failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    // Note: Do NOT attach onClick={onClose} to overlay. Modal must only close via '✕' or 'Keep Bill'.
    <div className="delete-bill-overlay" role="dialog" aria-modal="true">
      <div className="delete-bill-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="delete-bill-header">
          <div className="delete-bill-header-left">
            <span className="delete-bill-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              DELETE INVOICE &amp; MOVE TO RECYCLE BIN
            </span>
            <h3 className="delete-bill-title">
              {bill.invoiceNumber || 'Counter Invoice'}
            </h3>
          </div>
          <button
            type="button"
            className="delete-bill-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="delete-bill-body">
          {/* Bill Summary Card */}
          <div className="delete-summary-card">
            <div className="delete-summary-top">
              <span className="delete-summary-cust">
                Customer: {bill.customer?.fullName || 'Walk-in Guest'}
                {bill.customer?.phone && ` (${bill.customer.phone})`}
              </span>
              <strong className="delete-summary-amt">
                ₹{bill.grandTotal}
              </strong>
            </div>

            <div className="delete-summary-meta">
              <span>Time: {bill.orderTime || 'Today'}</span>
              <span>Payment: <strong>{(bill.paymentMethod || 'cash').toUpperCase()}</strong></span>
              <span>Items: <strong>{bill.items?.length || 0}</strong></span>
            </div>

            {bill.items && bill.items.length > 0 && (
              <div className="delete-summary-items">
                {bill.items.slice(0, 4).map((it, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                    &bull; {it.name?.split('—')[0].trim()} ({it.weight || it.unit}) ×{it.quantity}
                  </span>
                ))}
                {bill.items.length > 4 && <span>+{bill.items.length - 4} more</span>}
              </div>
            )}
          </div>

          {/* Security & Audit Warning */}
          <div className="delete-policy-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Recycle Bin &amp; Admin Audit Policy:</strong> This bill will be deducted from daily sales revenue and safely stored in the <strong>Admin Recycle Bin for 30 days</strong>. The administrator will be notified with your deletion reason.
            </div>
          </div>

          {/* Mandatory Reason Selection */}
          <div className="delete-reason-section">
            <label className="delete-reason-label">
              Mandatory Reason for Deletion / நீக்குவதற்கான காரணம்:
            </label>
            <div className="delete-reason-pills">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`delete-reason-pill ${selectedReason === preset && !customReason ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedReason(preset);
                    setCustomReason('');
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="delete-custom-reason-input"
              placeholder="Or type custom justification (e.g. Duplicate order punched by trainee)..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>

          {/* User attribution note */}
          <div className="delete-attribution-note">
            Action logged by: <strong>{user?.name || 'Staff Cashier'}</strong> ({user?.role || 'staff'})
          </div>
        </div>

        {/* Modal Footer */}
        <div className="delete-bill-footer">
          <button
            type="button"
            className="btn-delete-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Keep Bill
          </button>
          <button
            type="button"
            className="btn-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting || !finalReason.trim()}
          >
            {isDeleting ? 'Moving to Recycle Bin...' : 'Confirm & Move to Recycle Bin (30 Days)'}
          </button>
        </div>
      </div>
    </div>
  );
}
