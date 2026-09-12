import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import {
  STORE_DETAILS,
  GST_RATE,
  STANDARD_DELIVERY_FEE,
} from '../../data/sweetsData';
import api from '../../utils/api';
import './CheckoutModal.css';

const INDIAN_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi',
  'Puducherry',
  'Gujarat',
  'Other State',
];

export default function CheckoutModal() {
  const {
    cart,
    isCheckoutOpen,
    closeCheckout,
    subtotal,
    isFreeDelivery,
    clearCart,
    openInvoice,
    placeOnlineOrder,
  } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    doorNo: '',
    street: '',
    landmark: '',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '',
    giftNote: '',
  });

  // Mobile OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verificationToken, setVerificationToken] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi'
  const [upiUtr, setUpiUtr] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  if (!isCheckoutOpen) return null;

  // Taxes & Pricing
  const isInterState = formData.state !== 'Tamil Nadu';
  const taxAmount = Math.round(subtotal * GST_RATE * 100) / 100;
  const cgst = !isInterState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const sgst = !isInterState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const igst = isInterState ? taxAmount : 0;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const grandTotal = Math.round(subtotal + taxAmount + deliveryFee);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: val }));
    if (isPhoneVerified) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setDevOtpHint('');
      setVerificationToken('');
    }
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit mobile number' }));
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/api/otp/send', { phone: cleanPhone });
      setOtpSent(true);
      setOtpCountdown(60);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setErrors((prev) => ({ ...prev, phone: null }));
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = typeof codeToVerify === 'string' ? codeToVerify : otpCode;
    if (!code || code.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const res = await api.post('/api/otp/verify', { phone: cleanPhone, otp: code.trim() });
      if (res.verified) {
        setIsPhoneVerified(true);
        setVerificationToken(res.verificationToken || '');
        setOtpError('');
        setErrors((prev) => ({ ...prev, phone: null }));
      } else {
        setOtpError(res.message || 'Incorrect OTP code. Please try again.');
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Please enter your full name';

    // 10 digit Indian mobile number validation
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Enter valid 10-digit mobile number';
    } else if (!isPhoneVerified) {
      errs.phone = 'Please verify your mobile number via OTP before placing order';
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter valid email for receiving invoice';
    }

    if (!formData.doorNo.trim()) errs.doorNo = 'Required';
    if (!formData.street.trim()) errs.street = 'Street address required';
    if (!formData.city.trim()) errs.city = 'City required';

    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      errs.pincode = 'Enter 6-digit PIN code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `THN-${year}-${randomSeq}`;
    const now = new Date();

    const invoiceData = {
      invoiceNumber,
      orderDate: now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      orderTime: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      customer: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        phoneVerified: true,
        verificationToken,
      },
      shippingAddress: {
        doorNo: formData.doorNo,
        street: formData.street,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      giftNote: formData.giftNote,
      items: [...cart],
      subtotal,
      taxBreakdown: {
        rate: 5,
        isInterState,
        cgst,
        sgst,
        igst,
        totalTax: taxAmount,
      },
      deliveryFee,
      grandTotal,
      paymentMethod,
      upiUtr: paymentMethod === 'upi' ? upiUtr.trim() : null,
      orderStatus: paymentMethod === 'upi' ? 'UPI Verification Pending' : 'Confirmed (Pay on Delivery)',
    };

    try {
      const placedOrder = placeOnlineOrder ? await placeOnlineOrder(invoiceData) : invoiceData;
      setIsSubmitting(false);
      clearCart();
      closeCheckout();
      openInvoice(placedOrder || invoiceData);
    } catch (err) {
      console.error('Order submission error:', err);
      setIsSubmitting(false);
      clearCart();
      closeCheckout();
      openInvoice(invoiceData);
    }
  };

  return (
    <AnimatePresence>
      <div className="checkout-portal" data-lenis-prevent>
        {/* Backdrop */}
        <motion.div
          className="checkout-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCheckout}
        />

        {/* Modal Window */}
        <motion.div
          className="checkout-modal"
          data-lenis-prevent
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="checkout-modal__header">
            <div>
              <span className="checkout-modal__eyebrow">✦ Secure Checkout</span>
              <h2 className="checkout-modal__title">Billing & Delivery Details</h2>
            </div>
            <button
              className="checkout-modal__close"
              onClick={closeCheckout}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body: Form + Order Summary */}
          <div className="checkout-modal__body" data-lenis-prevent>
            <form id="checkout-form" className="checkout-form" onSubmit={handlePlaceOrder}>
              {/* Customer Contact */}
              <div className="form-section">
                <h3 className="form-section__title">1. Customer Contact</h3>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? 'error' : ''}
                    />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>

                  <div className="form-field phone-field-container">
                    <div className="form-field-header">
                      <label>Mobile Number (WhatsApp) *</label>
                      {isPhoneVerified && (
                        <span className="phone-verified-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Verified via OTP
                        </span>
                      )}
                    </div>
                    <div className="phone-input-wrap">
                      <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        maxLength="10"
                        placeholder="9344893547"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        disabled={isPhoneVerified}
                        className={errors.phone ? 'error' : ''}
                      />
                      {!isPhoneVerified ? (
                        <button
                          type="button"
                          className="btn-send-otp"
                          onClick={handleSendOtp}
                          disabled={otpLoading || formData.phone.length < 10 || otpCountdown > 0}
                        >
                          {otpLoading
                            ? 'Sending...'
                            : otpCountdown > 0
                            ? `Resend (${otpCountdown}s)`
                            : otpSent
                            ? 'Resend OTP'
                            : 'Send OTP'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-change-phone"
                          onClick={() => {
                            setIsPhoneVerified(false);
                            setOtpSent(false);
                            setOtpCode('');
                            setDevOtpHint('');
                            setVerificationToken('');
                          }}
                          title="Change phone number"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    {errors.phone && <span className="field-error">{errors.phone}</span>}

                    {/* OTP verification box when OTP has been sent and phone is not yet verified */}
                    {otpSent && !isPhoneVerified && (
                      <motion.div
                        className="otp-verify-box"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="otp-box-header">
                          <span className="otp-box-title">Enter 6-Digit OTP Code</span>
                          {otpCountdown > 0 && <span className="otp-timer">Resend in {otpCountdown}s</span>}
                        </div>

                        <div className="otp-input-row">
                          <input
                            type="text"
                            maxLength="6"
                            className="otp-code-input"
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtpCode(val);
                              if (otpError) setOtpError('');
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-verify-otp"
                            onClick={() => handleVerifyOtp()}
                            disabled={otpLoading || otpCode.length !== 6}
                          >
                            {otpLoading ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>

                        {devOtpHint && (
                          <div className="otp-dev-helper">
                            <span className="otp-helper-badge">✦ Demo OTP</span>
                            <span className="otp-helper-code">{devOtpHint}</span>
                            <button
                              type="button"
                              className="otp-autofill-btn"
                              onClick={() => {
                                setOtpCode(devOtpHint);
                                handleVerifyOtp(devOtpHint);
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              Auto-Fill &amp; Verify
                            </button>
                          </div>
                        )}

                        {otpError && (
                          <div className="otp-error-msg">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            {otpError}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label>Email Address (for Tax Invoice PDF) *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="ramesh@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="form-section">
                <h3 className="form-section__title">2. Delivery Address</h3>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Door / Flat / House No. *</label>
                    <input
                      type="text"
                      name="doorNo"
                      placeholder="No. 14/B, Gokulam"
                      value={formData.doorNo}
                      onChange={handleChange}
                      className={errors.doorNo ? 'error' : ''}
                    />
                    {errors.doorNo && <span className="field-error">{errors.doorNo}</span>}
                  </div>

                  <div className="form-field">
                    <label>Street / Area / Locality *</label>
                    <input
                      type="text"
                      name="street"
                      placeholder="KK Nagar Main Road"
                      value={formData.street}
                      onChange={handleChange}
                      className={errors.street ? 'error' : ''}
                    />
                    {errors.street && <span className="field-error">{errors.street}</span>}
                  </div>
                </div>

                <div className="form-field">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="Near Meenakshi Amman Temple / Opposite Bank"
                    value={formData.landmark}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-grid-3">
                  <div className="form-field">
                    <label>City / District *</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Madurai"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="field-error">{errors.city}</span>}
                  </div>

                  <div className="form-field">
                    <label>State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>PIN Code *</label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength="6"
                      placeholder="625020"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={errors.pincode ? 'error' : ''}
                    />
                    {errors.pincode && <span className="field-error">{errors.pincode}</span>}
                  </div>
                </div>

                <div className="form-field">
                  <label>Gift Message / Packaging Note (Optional)</label>
                  <textarea
                    name="giftNote"
                    rows="2"
                    placeholder="Add a special festive greeting message or sweet box note..."
                    value={formData.giftNote}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-section">
                <h3 className="form-section__title">3. Payment Preference</h3>
                <div className="payment-options">
                  <label
                    className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div className="payment-card__info">
                      <div className="payment-card__title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="2" />
                            <path d="M6 12h.01M18 12h.01" />
                          </svg>
                          Pay on Delivery (Cash / UPI)
                        </span>
                        <span className="payment-pill">Popular</span>
                      </div>
                      <p className="payment-card__desc">
                        Pay with Cash or scan courier UPI QR code when sweet box reaches your doorstep.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`payment-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                    />
                    <div className="payment-card__info">
                      <div className="payment-card__title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                          </svg>
                          Instant UPI (GPay / PhonePe)
                        </span>
                        <span className="payment-pill gold">Fast Dispatch</span>
                      </div>
                      <p className="payment-card__desc">
                        Scan our official Thenisai UPI QR or pay to UPI ID for direct priority kitchen dispatch.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Direct UPI details accordion */}
                {paymentMethod === 'upi' && (
                  <motion.div
                    className="upi-instructions-box"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="upi-box__header">
                      <span>Thenisai Official Merchant UPI</span>
                    </div>
                    <div className="upi-box__content">
                      <div className="upi-id-badge">
                        <code>{STORE_DETAILS.upiId}</code>
                        <button
                          type="button"
                          className="upi-copy-btn"
                          onClick={() => {
                            navigator.clipboard?.writeText(STORE_DETAILS.upiId);
                            alert('Thenisai UPI ID copied!');
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="upi-tip">
                        Pay <strong>₹{grandTotal}</strong> using Google Pay, PhonePe, or Paytm, then enter your 12-digit UTR/UPI Ref number below:
                      </p>
                      <input
                        type="text"
                        placeholder="Enter 12-digit UPI Reference / UTR Number (Optional)"
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        className="upi-utr-input"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </form>

            {/* Right: Order & Tax Calculation Summary */}
            <div className="checkout-summary">
              <h3 className="checkout-summary__title">Order Summary</h3>

              {/* Items scroll */}
              <div className="checkout-summary__items">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="checkout-item">
                    <img src={item.image} alt={item.name} className="checkout-item__img" />
                    <div className="checkout-item__info">
                      <span className="checkout-item__name">{item.name}</span>
                      <span className="checkout-item__meta">
                        {item.weight} × {item.quantity}
                      </span>
                    </div>
                    <span className="checkout-item__price">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="gold-divider" />

              {/* Calculation Rows */}
              <div className="checkout-calc">
                <div className="calc-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="calc-row">
                  <span>
                    GST (5%)
                    <small className="calc-sub">
                      {!isInterState ? ' (CGST 2.5% + SGST 2.5%)' : ' (IGST 5%)'}
                    </small>
                  </span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="calc-row">
                  <span>
                    Delivery Charge
                    {isFreeDelivery && <span className="free-badge">FREE</span>}
                  </span>
                  <span>{deliveryFee === 0 ? '₹0.00' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>

                <div className="gold-divider" />

                <div className="calc-row total">
                  <span>Total Payable</span>
                  <span className="total-value" style={{ fontFamily: "var(--font-num, 'Inter', sans-serif)", fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || cart.length === 0}
                className="btn btn-gold checkout-submit-btn"
              >
                {isSubmitting ? (
                  <span>Generating Bill...</span>
                ) : (
                  <>
                    <span>Place Order & Generate Bill</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>

              <div className="checkout-badges">
                <span>✦ FSSAI Certified Kitchen</span>
                <span>✦ Authentic Madurai Recipe</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
