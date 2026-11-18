import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ContactPage() {
  const { navigateTo } = useCart();
  const [inquiryType, setInquiryType] = useState('wedding');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitted(true);
  };

  const handleGoToMenu = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMaps = () => {
    window.open('https://maps.google.com/?q=Thenisai+Palkova+and+Sweets+Krishnagiri', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ks-page">
      {/* 1. Header Banner (Kanti Sweets Style) */}
      <section style={{
        background: 'linear-gradient(135deg, #FFF9EE 0%, #FAF2E3 100%)',
        borderBottom: '1px solid var(--ks-border)',
        padding: 'clamp(36px, 5vw, 56px) 0',
      }}>
        <div className="ks-container">
          <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '6px' }}>
            Store Location &amp; Contact
          </span>
          <h1 style={{
            fontFamily: 'var(--ks-font-serif)',
            fontSize: 'clamp(30px, 4vw, 48px)',
            fontWeight: 700,
            color: 'var(--ks-charcoal)',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
          }}>
            Visit Thenisai Sweets at Krishnagiri
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--ks-muted)',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.6,
          }}>
            Located directly on the Bangalore–Salem Highway (NH 44) opposite HP Petrol Bunk. Stop by for fresh hot Palkova, tea, or order bulk sweet boxes for your celebrations.
          </p>
        </div>
      </section>

      {/* 2. Main Grid: Store Details & Bulk Inquiry Form */}
      <section className="ks-section">
        <div className="ks-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
          }}>
            {/* Left Column: Boutique Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--ks-border)',
                borderRadius: 'var(--ks-radius-md)',
                padding: '24px',
                boxShadow: 'var(--ks-card-shadow)',
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>📍</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ks-charcoal)', margin: '0 0 8px 0' }}>
                  HIGHWAY BOUTIQUE ADDRESS
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ks-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  Thenisai Palkova &amp; Sweets, Nattamai Kottai,<br />
                  Opposite to HP Petrol Bunk, Bangalore–Salem Highway (NH 44),<br />
                  Krishnagiri, Tamil Nadu &ndash; 635001.
                </p>
                <button
                  type="button"
                  onClick={handleMaps}
                  className="ks-hero__btn-primary"
                  style={{ padding: '9px 20px', fontSize: '12.5px' }}
                >
                  <span>Open in Google Maps</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                </button>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--ks-border)',
                borderRadius: 'var(--ks-radius-md)',
                padding: '24px',
                boxShadow: 'var(--ks-card-shadow)',
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>⏰</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ks-charcoal)', margin: '0 0 8px 0' }}>
                  OPERATING TIMINGS
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ks-muted)', lineHeight: 1.6, margin: 0 }}>
                  Monday &ndash; Sunday: <strong>6:00 AM &ndash; 10:30 PM Daily</strong><br />
                  Fresh hot morning Palkova batches available starting 7:30 AM every morning.
                </p>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--ks-border)',
                borderRadius: 'var(--ks-radius-md)',
                padding: '24px',
                boxShadow: 'var(--ks-card-shadow)',
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>📞</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ks-charcoal)', margin: '0 0 8px 0' }}>
                  DIRECT CONTACT &amp; WHATSAPP
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ks-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  Counter &amp; Order Desk: <strong>+91 93448 93547</strong>
                </p>
                <a
                  href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ks-hero__btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    fontSize: '12.5px',
                  }}
                >
                  <span>Chat on WhatsApp</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Column: Bulk Inquiries & Gifting Form */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--ks-border)',
              borderRadius: 'var(--ks-radius-md)',
              padding: 'clamp(24px, 4vw, 36px)',
              boxShadow: 'var(--ks-card-shadow)',
            }}>
              <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '4px' }}>
                Festive &amp; Corporate Desk
              </span>
              <h2 style={{
                fontFamily: 'var(--ks-font-serif)',
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--ks-charcoal)',
                margin: '0 0 10px 0',
              }}>
                Wedding &amp; Bulk Orders Inquiry
              </h2>
              <p style={{
                fontSize: '13.5px',
                color: 'var(--ks-muted)',
                margin: '0 0 24px 0',
                lineHeight: 1.5,
              }}>
                Get direct boutique quotes for custom sweet boxes, wedding return gifts, and company festive hampers.
              </p>

              {submitted ? (
                <div style={{
                  background: 'var(--ks-primary-light)',
                  border: '1px solid var(--ks-primary)',
                  borderRadius: 'var(--ks-radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>✓</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ks-primary-dark)', margin: '0 0 6px 0' }}>
                    Inquiry Received!
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--ks-charcoal)', margin: '0 0 16px 0' }}>
                    Our Krishnagiri boutique manager will call you within 2 hours with customized sweet box options and bulk pricing.
                  </p>
                  <button
                    type="button"
                    className="ks-hero__btn-primary"
                    onClick={handleGoToMenu}
                    style={{ fontSize: '12.5px', padding: '9px 20px' }}
                  >
                    Browse Sweets Menu ↗
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                      Inquiry Category
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['wedding', 'corporate', 'family'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInquiryType(type)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--ks-radius-sm)',
                            border: '1px solid',
                            borderColor: inquiryType === type ? 'var(--ks-primary)' : 'var(--ks-border)',
                            background: inquiryType === type ? 'var(--ks-primary-light)' : '#FFFFFF',
                            color: inquiryType === type ? 'var(--ks-primary-dark)' : 'var(--ks-charcoal)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: 'var(--ks-radius-sm)',
                        border: '1px solid var(--ks-border)',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: 'var(--ks-radius-sm)',
                        border: '1px solid var(--ks-border)',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 'var(--ks-radius-sm)',
                          border: '1px solid var(--ks-border)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                        Box Quantity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100 boxes"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 'var(--ks-radius-sm)',
                          border: '1px solid var(--ks-border)',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ks-charcoal)' }}>
                      Specific Sweets or Customization Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="E.g., 500g boxes with Signature Palkova, Mysore Pak, and Kaju Katli for wedding on NH 44"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: 'var(--ks-radius-sm)',
                        border: '1px solid var(--ks-border)',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="ks-hero__btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  >
                    <span>Submit Bulk Inquiry</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
