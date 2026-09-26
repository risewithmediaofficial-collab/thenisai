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
    if (clean.length !== 10) { setErrorMsg('Please enter a valid 10-digit Indian mobile number.'); return; }
    setLoading(true);
    try {
      const res = await sendOtp(clean);
      if (res.success) {
        setStep('otp');
        setTimer(60);
        if (res.devOtp) setDevOtp(res.devOtp);
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
    if (!cleanOtp || cleanOtp.length < 4) { setErrorMsg('Please enter the verification code sent to your mobile.'); return; }
    setLoading(true);
    try {
      const res = await verifyOtpAndLogin(cleanPhone, cleanOtp, name);
      if (!res.success) setErrorMsg(res.message || 'Verification failed. Please enter the correct code.');
    } catch {
      setErrorMsg('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input style ── */
  const inputCls = 'w-full bg-black/35 border-[1.5px] border-[rgba(212,168,67,0.25)] rounded-[10px] text-[#FFF8EF] outline-none transition-all duration-200 focus:border-[#D4A843] focus:shadow-[0_0_0_3px_rgba(212,168,67,0.18)] focus:bg-black/50';

  return (
    <AnimatePresence>
      {/* ── Backdrop overlay ── */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden touch-none overscroll-contain"
        style={{ background: 'rgba(10,5,2,0.76)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      >
        <style>{`
          .cust-phone-input:focus { outline:none; border-color:#D4A843 !important; box-shadow:0 0 0 3px rgba(212,168,67,0.18) !important; background:rgba(0,0,0,0.5) !important; }
          .cust-otp-field:focus   { outline:none; border-color:#D4A843 !important; box-shadow:0 0 0 4px rgba(212,168,67,0.2) !important; }
          .cust-text-field:focus  { outline:none; border-color:#D4A843 !important; box-shadow:0 0 0 3px rgba(212,168,67,0.18) !important; background:rgba(0,0,0,0.5) !important; }
          .cust-submit-btn:hover:not(:disabled){ filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 6px 20px rgba(200,148,58,0.45) !important; }
          .cust-submit-btn:disabled{ opacity:0.55; cursor:not-allowed; }
          .cust-close-btn:hover{ background:rgba(212,168,67,0.15) !important; color:#D4A843 !important; transform:rotate(90deg); }
          .fill-otp-btn:hover { background:rgba(82,196,116,0.35); color:#fff; }
          .resend-link:hover { text-decoration:underline; }
          .change-num-btn:hover { text-decoration:underline; }
          @keyframes custSpin { to{transform:rotate(360deg)} }
        `}</style>

        {/* ── Modal card ── */}
        <motion.div
          className="relative w-full max-w-[440px] max-h-[90dvh] flex flex-col overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain"
          style={{
            background: 'linear-gradient(180deg,#1C120C 0%,#100804 100%)',
            borderRadius: '18px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.75), 0 4px 20px rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.25)',
            WebkitOverflowScrolling: 'touch',
          }}
          data-lenis-prevent="true"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Header ── */}
          <div className="flex justify-between items-center px-6 pt-[22px] pb-3.5">
            {/* Heart icon badge */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212,168,67,0.12)',
                border: '1px solid rgba(212,168,67,0.3)',
                color: '#D4A843',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* Close button */}
            <button
              type="button"
              className="cust-close-btn w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,168,67,0.2)',
                color: '#E8D3B0',
              }}
              onClick={handleClose}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Content ── */}
          <div className="px-6 pt-1.5 pb-6">
            <h3 className="font-sans text-[1.45rem] font-semibold text-[#FFF6EA] mb-1.5 mt-0">
              {step === 'phone' ? 'Save to Your Wishlist' : 'Verify Mobile Number'}
            </h3>
            <p className="text-[0.86rem] text-[#C8B39B] leading-[1.45] mb-4 mt-0">
              {step === 'phone'
                ? 'Enter your mobile number to create your customer account and store your favorite sweets.'
                : `Enter the 6-digit OTP sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
            </p>

            {/* Item preview */}
            {targetItem && (
              <div
                className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 mb-4 text-[0.84rem]"
                style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.25)' }}
              >
                <span className="text-[#D4A843] text-[0.74rem] font-semibold uppercase tracking-[0.05em]">Saving Item:</span>
                <span className="flex-1 font-semibold text-[#FFF8EF] truncate">{targetItem.name}</span>
                <span className="font-bold text-[#F5D37E] font-sans">
                  ₹{targetItem.price || targetItem.prices?.['500g'] || Object.values(targetItem.prices || {})[0]}
                </span>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div
                className="rounded-lg px-3.5 py-2.5 text-[0.82rem] font-semibold mb-4 text-[#FCA5A5]"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}
              >
                {errorMsg}
              </div>
            )}

            {/* ── STEP 1: Phone & Name ── */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cust-phone" className="text-[0.78rem] font-semibold text-[#E8D3B0] tracking-[0.02em]">
                    Mobile Number *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[0.92rem] font-bold text-[#D4A843] pointer-events-none">+91</span>
                    <input
                      id="cust-phone"
                      type="tel"
                      maxLength="10"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                      className={`cust-phone-input ${inputCls} pl-[50px] pr-3.5 py-3 text-[0.95rem] font-semibold tracking-[0.05em]`}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cust-name" className="text-[0.78rem] font-semibold text-[#E8D3B0] tracking-[0.02em]">
                    Your Name (Optional)
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`cust-text-field ${inputCls} px-3.5 py-[11px] text-[0.88rem]`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length < 10}
                  className="cust-submit-btn w-full py-3.5 rounded-xl border-none font-sans text-[0.97rem] font-semibold text-[#160D07] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg,#C8943A 0%,#DFB76C 100%)', boxShadow: '0 4px 16px rgba(200,148,58,0.35)' }}
                >
                  {loading ? 'Sending Verification Code...' : (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span>Send OTP &amp; Continue</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP Verify ── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="cust-otp" className="text-[0.78rem] font-semibold text-[#E8D3B0] tracking-[0.02em]">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      className="change-num-btn bg-none border-none text-[#D4A843] text-[0.78rem] font-semibold cursor-pointer p-0"
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
                    autoFocus
                    required
                    className={`cust-otp-field ${inputCls} py-3.5 px-3.5 text-[1.5rem] font-extrabold text-[#F5D37E] text-center tracking-[0.35em] font-[Inter,monospace]`}
                    style={{ borderWidth: '2px' }}
                  />

                  {/* Dev OTP helper */}
                  {devOtp && (
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2 mt-2 text-[0.8rem] text-[#72D888]"
                      style={{ background: 'rgba(82,196,116,0.1)', border: '1px dashed rgba(82,196,116,0.4)' }}
                    >
                      <span>Demo Verification Code:</span>
                      <strong className="text-[0.95rem] tracking-[0.1em] text-[#A3E635]">{devOtp}</strong>
                      <button
                        type="button"
                        className="fill-otp-btn rounded-md px-2 py-1 text-[0.72rem] font-bold cursor-pointer transition-all duration-150 text-[#72D888]"
                        style={{ background: 'rgba(82,196,116,0.2)', border: '1px solid rgba(82,196,116,0.4)' }}
                        onClick={() => setOtp(devOtp)}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                </div>

                {/* Resend row */}
                <div className="flex justify-end text-[0.8rem]">
                  {timer > 0 ? (
                    <span className="text-[#8C7560] font-medium">Resend code in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      className="resend-link bg-none border-none text-[#D4A843] font-semibold cursor-pointer p-0"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || otp.trim().length < 4}
                  className="cust-submit-btn w-full py-3.5 rounded-xl border-none font-sans text-[0.97rem] font-semibold text-[#160D07] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg,#C8943A 0%,#DFB76C 100%)', boxShadow: '0 4px 16px rgba(200,148,58,0.35)' }}
                >
                  {loading ? 'Verifying Account...' : (
                    <span className="inline-flex items-center justify-center gap-1.5">
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

          {/* ── Footer ── */}
          <div
            className="flex items-center gap-2 px-6 py-3.5 text-[0.76rem] mt-auto"
            style={{
              borderTop: '1px solid rgba(212,168,67,0.12)',
              background: 'rgba(0,0,0,0.2)',
              color: '#8C7560',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
            </svg>
            <span>Safe &amp; Secure verification via direct OTP. No passwords needed.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
