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

  const billList = Array.isArray(bill) ? bill : bill ? [bill] : [];
  const isBulkDelete = billList.length > 1;

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

  if (!isOpen || billList.length === 0) return null;

  const targetBill = billList[0];
  const totalBillValue = billList.reduce((sum, item) => sum + Number(item?.grandTotal || 0), 0);
  const finalReason = customReason.trim() ? customReason.trim() : selectedReason;

  const handleConfirm = async () => {
    if (!finalReason) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(isBulkDelete ? billList : targetBill, finalReason);
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
              {isBulkDelete ? `${billList.length} Selected Invoices` : (targetBill?.invoiceNumber || 'Counter Invoice')}
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
                {isBulkDelete ? `Bills selected: ${billList.length}` : `Customer: ${targetBill?.customer?.fullName || 'Walk-in Guest'}${targetBill?.customer?.phone ? ` (${targetBill.customer.phone})` : ''}`}
              </span>
              <strong className="delete-summary-amt">
                ₹{isBulkDelete ? totalBillValue.toLocaleString('en-IN') : Number(targetBill?.grandTotal || 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="delete-summary-meta">
              <span>{isBulkDelete ? 'Bulk counter cleanup' : `Time: ${targetBill?.orderTime || 'Today'}`}</span>
              <span>
                {isBulkDelete ? 'Payment mix: multiple' : (
                  <>Payment: <strong>{(targetBill?.paymentMethod || 'cash').toUpperCase()}</strong></>
                )}
              </span>
              <span>Items: <strong>{billList.reduce((sum, item) => sum + (item?.items?.length || 0), 0)}</strong></span>
            </div>

            {isBulkDelete ? (
              <div className="delete-summary-items">
                {billList.slice(0, 4).map((item, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                    &bull; {item.invoiceNumber || item.id}
                  </span>
                ))}
                {billList.length > 4 && <span>+{billList.length - 4} more</span>}
              </div>
            ) : targetBill?.items && targetBill.items.length > 0 ? (
              <div className="delete-summary-items">
                {targetBill.items.slice(0, 4).map((it, idx) => (
                  <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                    &bull; {it.name?.split('—')[0].trim()} ({it.weight || it.unit}) ×{it.quantity}
                  </span>
                ))}
                {targetBill.items.length > 4 && <span>+{targetBill.items.length - 4} more</span>}
              </div>
            ) : null}
          </div>

          {/* Security & Audit Warning */}
          <div className="delete-policy-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Recycle Bin &amp; Admin Audit Policy:</strong> {isBulkDelete ? 'These invoices will be deducted from daily sales revenue and safely stored in the Admin Recycle Bin for 30 days.' : 'This bill will be deducted from daily sales revenue and safely stored in the Admin Recycle Bin for 30 days.'} The administrator will be notified with your deletion reason.
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
            {isBulkDelete ? 'Keep Bills' : 'Keep Bill'}
          </button>
          <button
            type="button"
            className="btn-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting || !finalReason.trim()}
          >
            {isDeleting ? 'Moving to Recycle Bin...' : isBulkDelete ? `Confirm & Move ${billList.length} Bills to Recycle Bin` : 'Confirm & Move to Recycle Bin (30 Days)'}
          </button>
        </div>
      </div>
    </div>
  );
}
