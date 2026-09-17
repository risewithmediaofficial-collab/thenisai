import { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

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
    <div className="pos-price-modal-backdrop" onClick={onClose}>
      <div className="pos-price-modal-box delete-bill-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Modal Header */}
        <div className="pos-price-modal-header" style={{ borderBottomColor: '#fee2e2', background: '#fff5f5' }}>
          <div>
            <span className="modal-eyebrow" style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              DELETE INVOICE &amp; MOVE TO RECYCLE BIN
            </span>
            <h3 className="modal-title" style={{ color: '#991b1b' }}>
              {bill.invoiceNumber || 'Counter Invoice'}
            </h3>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="pos-price-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Bill Summary Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                Customer: {bill.customer?.fullName || 'Walk-in Guest'}
                {bill.customer?.phone && ` (${bill.customer.phone})`}
              </span>
              <strong style={{ fontSize: '16px', color: '#b45309', fontFamily: 'monospace' }}>
                ₹{bill.grandTotal}
              </strong>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px' }}>
              <span>Time: {bill.orderTime || 'Today'}</span>
              <span>Payment: <strong>{(bill.paymentMethod || 'cash').toUpperCase()}</strong></span>
              <span>Items: <strong>{bill.items?.length || 0}</strong></span>
            </div>

            {bill.items && bill.items.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', color: '#475569' }}>
                {bill.items.slice(0, 4).map((it, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                    &bull; {it.name?.split('—')[0].trim()} ({it.weight}) ×{it.quantity}
                  </span>
                ))}
                {bill.items.length > 4 && <span>+{bill.items.length - 4} more</span>}
              </div>
            )}
          </div>

          {/* Security & Audit Warning */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Recycle Bin &amp; Admin Audit Policy:</strong> This bill will be deducted from daily sales revenue and safely stored in the <strong>Admin Recycle Bin for 30 days</strong>. The administrator will be notified with your deletion reason.
            </div>
          </div>

          {/* Mandatory Reason Selection */}
          <div className="override-reason-field">
            <label className="override-reason-label" style={{ color: '#0f172a' }}>
              Mandatory Reason for Deletion / நீக்குவதற்கான காரணம்:
            </label>
            <div className="reason-quick-pills">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn-reason-pill ${selectedReason === preset && !customReason ? 'active' : ''}`}
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
              className="custom-reason-input"
              placeholder="Or type custom justification (e.g. Duplicate order punched by trainee)..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          {/* User attribution note */}
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
            Action logged by: <strong>{user?.name || 'Staff Cashier'}</strong> ({user?.role || 'staff'})
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pos-price-modal-footer">
          <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={isDeleting}>
            Keep Bill
          </button>
          <button
            type="button"
            className="btn-modal-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting || !finalReason.trim()}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isDeleting || !finalReason.trim() ? 'not-allowed' : 'pointer',
              opacity: isDeleting || !finalReason.trim() ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDeleting ? 'Moving to Recycle Bin...' : 'Confirm & Move to Recycle Bin (30 Days)'}
          </button>
        </div>
      </div>
    </div>
  );
}
