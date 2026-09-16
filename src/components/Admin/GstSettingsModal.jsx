import { useState } from 'react';
import { useCart, DEFAULT_TAX_SETTINGS } from '../../context/CartContext';
import './GstSettingsModal.css';

export default function GstSettingsModal({ isOpen, onClose }) {
  const { taxSettings, updateTaxSettings } = useCart();

  const [totalGst, setTotalGst] = useState(taxSettings?.totalGstRate ?? 5);
  const [cgst, setCgst] = useState(taxSettings?.cgstRate ?? 2.5);
  const [sgst, setSgst] = useState(taxSettings?.sgstRate ?? 2.5);
  const [gstin, setGstin] = useState(taxSettings?.gstin || '33AABCT9988Q1Z5');
  const [autoSplit, setAutoSplit] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTotalGstChange = (val) => {
    const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
    setTotalGst(num);
    if (autoSplit) {
      const half = Math.round((num / 2) * 100) / 100;
      setCgst(half);
      setSgst(half);
    }
  };

  const handleCgstChange = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setCgst(num);
    if (!autoSplit) {
      setTotalGst(Math.round((num + sgst) * 100) / 100);
    }
  };

  const handleSgstChange = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setSgst(num);
    if (!autoSplit) {
      setTotalGst(Math.round((cgst + num) * 100) / 100);
    }
  };

  const applyPreset = (total, c, s) => {
    setTotalGst(total);
    setCgst(c);
    setSgst(s);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateTaxSettings({
      totalGstRate: Number(totalGst),
      cgstRate: Number(cgst),
      sgstRate: Number(sgst),
      gstin: gstin.trim().toUpperCase(),
      taxEnabled: totalGst > 0,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    setTotalGst(DEFAULT_TAX_SETTINGS.totalGstRate);
    setCgst(DEFAULT_TAX_SETTINGS.cgstRate);
    setSgst(DEFAULT_TAX_SETTINGS.sgstRate);
    setGstin(DEFAULT_TAX_SETTINGS.gstin);
    setAutoSplit(true);
  };

  // Sample calculation preview on ₹1000 order
  const sampleSubtotal = 1000;
  const sampleCgstAmt = Math.round(sampleSubtotal * (cgst / 100) * 100) / 100;
  const sampleSgstAmt = Math.round(sampleSubtotal * (sgst / 100) * 100) / 100;
  const sampleTotalTax = Math.round((sampleCgstAmt + sampleSgstAmt) * 100) / 100;
  const sampleGrandTotal = Math.round(sampleSubtotal + sampleTotalTax);

  return (
    <div className="gst-modal-backdrop" onClick={onClose}>
      <div className="gst-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="gst-modal-header">
          <div className="gst-modal-title-group">
            <div className="gst-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <line x1="7" y1="15" x2="7.01" y2="15" />
                <line x1="11" y1="15" x2="13" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="gst-modal-title">GST &amp; Tax Configuration</h3>
              <p className="gst-modal-subtitle">
                Admin Control · Updates POS In-Store Register &amp; Online Store Checkout
              </p>
            </div>
          </div>
          <button type="button" className="gst-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {savedSuccess && (
          <div className="gst-success-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>GST Rates Updated Successfully! In-store register and tax receipts updated.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="gst-modal-body">
          {/* Quick Presets */}
          <div className="gst-section">
            <label className="gst-section-label">Quick GST Presets for Sweets &amp; Confectionery</label>
            <div className="gst-presets-grid">
              <button
                type="button"
                className={`gst-preset-btn ${totalGst === 5 && cgst === 2.5 && sgst === 2.5 ? 'active' : ''}`}
                onClick={() => applyPreset(5, 2.5, 2.5)}
              >
                <div className="preset-rate">5% GST</div>
                <div className="preset-sub">CGST 2.5% + SGST 2.5%</div>
                <span className="preset-badge">Standard for Milk Sweets</span>
              </button>

              <button
                type="button"
                className={`gst-preset-btn ${totalGst === 12 && cgst === 6 && sgst === 6 ? 'active' : ''}`}
                onClick={() => applyPreset(12, 6, 6)}
              >
                <div className="preset-rate">12% GST</div>
                <div className="preset-sub">CGST 6% + SGST 6%</div>
                <span className="preset-badge">Dry Fruits / Confectionery</span>
              </button>

              <button
                type="button"
                className={`gst-preset-btn ${totalGst === 18 && cgst === 9 && sgst === 9 ? 'active' : ''}`}
                onClick={() => applyPreset(18, 9, 9)}
              >
                <div className="preset-rate">18% GST</div>
                <div className="preset-sub">CGST 9% + SGST 9%</div>
                <span className="preset-badge">Packaged / Beverages</span>
              </button>

              <button
                type="button"
                className={`gst-preset-btn ${totalGst === 0 ? 'active' : ''}`}
                onClick={() => applyPreset(0, 0, 0)}
              >
                <div className="preset-rate">0% Nil</div>
                <div className="preset-sub">No Tax Added</div>
                <span className="preset-badge">Tax-Exempt</span>
              </button>
            </div>
          </div>

          {/* Rate Custom Inputs */}
          <div className="gst-section">
            <div className="gst-inputs-row">
              <div className="gst-input-group">
                <label>Total GST Rate (%)</label>
                <div className="gst-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={totalGst}
                    onChange={(e) => handleTotalGstChange(e.target.value)}
                    required
                  />
                  <span className="gst-unit">%</span>
                </div>
              </div>

              <div className="gst-input-group">
                <label>CGST Rate (%) <span className="label-note">(Central Tax)</span></label>
                <div className="gst-input-wrapper">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="50"
                    value={cgst}
                    disabled={autoSplit}
                    onChange={(e) => handleCgstChange(e.target.value)}
                    required
                  />
                  <span className="gst-unit">%</span>
                </div>
              </div>

              <div className="gst-input-group">
                <label>SGST Rate (%) <span className="label-note">(State Tax)</span></label>
                <div className="gst-input-wrapper">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="50"
                    value={sgst}
                    disabled={autoSplit}
                    onChange={(e) => handleSgstChange(e.target.value)}
                    required
                  />
                  <span className="gst-unit">%</span>
                </div>
              </div>
            </div>

            <label className="gst-autosplit-toggle">
              <input
                type="checkbox"
                checked={autoSplit}
                onChange={(e) => {
                  setAutoSplit(e.target.checked);
                  if (e.target.checked) {
                    const half = Math.round((totalGst / 2) * 100) / 100;
                    setCgst(half);
                    setSgst(half);
                  }
                }}
              />
              <span>Automatically split Total GST equally into 50% CGST + 50% SGST (Recommended for Tamil Nadu intra-state)</span>
            </label>
          </div>

          {/* Shop GSTIN */}
          <div className="gst-section">
            <div className="gst-input-group full-width">
              <label>Shop GSTIN (GST Identification Number)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 33AABCT9988Q1Z5"
                maxLength="15"
                className="gstin-input"
              />
              <span className="input-hint">Printed on all customer tax invoices and fiscal bills.</span>
            </div>
          </div>

          {/* Live Bill Impact Preview Card */}
          <div className="gst-preview-card">
            <div className="preview-header">
              <span className="preview-title">Live Tax Calculation Preview</span>
              <span className="preview-tag">Example ₹1,000 Purchase</span>
            </div>
            <div className="preview-grid">
              <div className="preview-row">
                <span>Items Subtotal:</span>
                <strong>₹{sampleSubtotal.toFixed(2)}</strong>
              </div>
              <div className="preview-row tax-item">
                <span>CGST @ {cgst}%:</span>
                <strong>+₹{sampleCgstAmt.toFixed(2)}</strong>
              </div>
              <div className="preview-row tax-item">
                <span>SGST @ {sgst}%:</span>
                <strong>+₹{sampleSgstAmt.toFixed(2)}</strong>
              </div>
              <div className="preview-row total-row">
                <span>Customer Grand Total:</span>
                <strong className="final-total">₹{sampleGrandTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="gst-modal-footer">
            <button
              type="button"
              className="gst-btn-reset"
              onClick={handleReset}
            >
              Reset to 5% Standard
            </button>
            <div className="gst-footer-right">
              <button
                type="button"
                className="gst-btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="gst-btn-save"
              >
                Save GST Rates
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
