import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../../context/WishlistContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SWEETS_CATALOG, ALL_BILLING_ITEMS, SPECIAL_BOX } from '../../data/sweetsData';
export default function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingProductId,
    setPendingProductId,
    sendOtp,
    verifyOtpAndLogin,
  } = useWishlist();

  // Screen scroll lock when popup is active
  useScrollLock(isAuthModalOpen);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [timer, setTimer] = useState(60);

  const targetItem = [...SWEETS_CATALOG, ...ALL_BILLING_ITEMS, SPECIAL_BOX].find(
    (item) => item.id === pendingProductId
  );

  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Close on Escape key
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
        setPendingProductId(null);
        setStep('phone');
        setOtp('');
        setErrorMsg('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAuthModalOpen, setIsAuthModalOpen, setPendingProductId]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setPendingProductId(null);
    setStep('phone');
    setOtp('');
    setErrorMsg('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(clean);
      if (res.success) {
        setStep('otp');
        setTimer(60);
        if (res.devOtp) {
          setDevOtp(res.devOtp);
        }
      } else {
        setErrorMsg(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please make sure the server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg('Please enter the verification code sent to your mobile.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAndLogin(cleanPhone, cleanOtp, name);
      if (!res.success) {
        setErrorMsg(res.message || 'Verification failed. Please enter the correct code.');
      }
    } catch {
      setErrorMsg('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="cust-auth-overlay" onClick={handleClose}>
        <motion.div
          className="cust-auth-modal"
          data-lenis-prevent="true"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="cust-auth-header">
            <div className="cust-auth-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <button type="button" className="cust-auth-close-btn" onClick={handleClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="cust-auth-content">
            <h3 className="cust-auth-title">
              {step === 'phone' ? 'Save to Your Wishlist' : 'Verify Mobile Number'}
            </h3>
            <p className="cust-auth-subtitle">
              {step === 'phone'
                ? 'Enter your mobile number to create your customer account and store your favorite sweets.'
                : `Enter the 6-digit OTP sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
            </p>

            {targetItem && (
              <div className="cust-auth-item-preview">
                <span className="preview-label">Saving Item:</span>
                <span className="preview-item-name">{targetItem.name}</span>
                <span className="preview-item-price">
                  ₹{targetItem.price || targetItem.prices?.['500g'] || Object.values(targetItem.prices || {})[0]}
                </span>
              </div>
            )}

            {errorMsg && <div className="cust-auth-error">{errorMsg}</div>}

            {/* STEP 1: Phone & Name Input */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="cust-auth-form">
                <div className="cust-auth-field">
                  <label htmlFor="cust-phone">Mobile Number *</label>
                  <div className="cust-phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="cust-phone"
                      type="tel"
                      maxLength="10"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="cust-auth-field">
                  <label htmlFor="cust-name">Your Name (Optional)</label>
                  <input
                    id="cust-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="cust-text-input"
                  />
                </div>

                <button
                  type="submit"
                  className="cust-auth-submit-btn"
                  disabled={loading || phone.replace(/\D/g, '').length < 10}
                >
                  {loading ? (
                    'Sending Verification Code...'
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Send OTP &amp; Continue</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="cust-auth-form">
                <div className="cust-auth-field">
                  <div className="otp-label-row">
                    <label htmlFor="cust-otp">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      className="cust-change-phone-btn"
                      onClick={() => { setStep('phone'); setOtp(''); setErrorMsg(''); }}
                    >
                      Change Number
                    </button>
                  </div>

                  <input
                    id="cust-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="cust-otp-input"
                    autoFocus
                    required
                  />

                  {devOtp && (
                    <div className="cust-dev-otp-box">
                      <span>Demo Verification Code:</span>
                      <strong>{devOtp}</strong>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtp)}
                        className="btn-fill-otp"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                </div>

                <div className="cust-resend-row">
                  {timer > 0 ? (
                    <span className="resend-timer">Resend code in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="cust-auth-submit-btn"
                  disabled={loading || otp.trim().length < 4}
                >
                  {loading ? (
                    'Verifying Account...'
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Verify &amp; Save to Wishlist</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="cust-auth-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
            </svg>
            <span>Safe &amp; Secure verification via direct OTP. No passwords needed.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
