import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ContactPage() {
  const { navigateTo } = useCart();
  const [inquiryType, setInquiryType] = useState('wedding');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
    <div className="thenisai-page">
      {/* Hero Banner Card */}
      <section className="thenisai-hero-wrap" style={{ marginTop: '24px' }}>
        <div className="thenisai-hero-card" style={{ minHeight: 'auto', gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="thenisai-hero-card__left" style={{ padding: '48px 40px' }}>
            <span className="thenisai-hero-card__script-tag">
              A Warm Welcome on NH 44
            </span>

            <h1 className="thenisai-hero-card__headline" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              VISIT OUR BOUTIQUE &amp; BULK PRE-ORDERS
            </h1>

            <p className="thenisai-hero-card__tagline">
              Highway Pitstop · Wedding &amp; Corporate Sweet Boxes · Nattamai Kottai, Krishnagiri
            </p>

            <button
              type="button"
              className="thenisai-hero-card__cta-btn"
              onClick={handleMaps}
            >
              <span>Get Directions</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </button>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src="/images/products/sweets_platter_hero.jpg"
              alt="Thenisai Highway Boutique"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Boutique Info Cards & Inquiry Form Grid */}
      <section className="thenisai-section" style={{ marginTop: '48px', marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {/* Left Column: Direct Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EFE8DE',
              borderRadius: '20px',
              padding: '24px',
            }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📍</span>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: '16px',
                textTransform: 'uppercase',
                color: '#1C0F08',
                margin: '0 0 6px 0',
              }}>
                BOUTIQUE ADDRESS
              </h3>
              <p style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '13.5px',
                color: '#5C4A3E',
                margin: '0 0 14px 0',
                lineHeight: 1.5,
              }}>
                Thenisai Palkova &amp; Sweets, Nattamai Kottai,<br />
                Opposite HP Petrol Bunk, NH 44 Highway,<br />
                Krishnagiri, Tamil Nadu &ndash; 635001.
              </p>
              <button
                type="button"
                onClick={handleMaps}
                style={{
                  background: 'var(--thenisai-yellow)',
                  color: '#1C0F08',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Open Google Maps ↗
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EFE8DE',
              borderRadius: '20px',
              padding: '24px',
            }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>⏰</span>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: '16px',
                textTransform: 'uppercase',
                color: '#1C0F08',
                margin: '0 0 6px 0',
              }}>
                STORE HOURS
              </h3>
              <p style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '13.5px',
                color: '#5C4A3E',
                margin: 0,
                lineHeight: 1.5,
              }}>
                Daily <strong>6:00 AM – 10:30 PM</strong><br />
                Fresh hot Palkova batches available starting 7:30 AM daily.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EFE8DE',
              borderRadius: '20px',
              padding: '24px',
            }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📞</span>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: '16px',
                textTransform: 'uppercase',
                color: '#1C0F08',
                margin: '0 0 6px 0',
              }}>
                PHONE &amp; WHATSAPP
              </h3>
              <p style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '13.5px',
                color: '#5C4A3E',
                margin: '0 0 14px 0',
                lineHeight: 1.5,
              }}>
                Counter &amp; Orders: <strong>+91 93448 93547</strong>
              </p>
              <a
                href="https://wa.me/919344893547"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#25D366',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Chat on WhatsApp ↗
              </a>
            </div>
          </div>

          {/* Right Column: Bulk Pre-Order / Festive Inquiries Form */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EFE8DE',
            borderRadius: '20px',
            padding: '32px 28px',
          }}>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: '20px',
              textTransform: 'uppercase',
              color: '#1C0F08',
              margin: '0 0 6px 0',
            }}>
              BULK &amp; FESTIVE ORDERS
            </h3>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: '13px',
              color: '#7A695B',
              fontWeight: 700,
              display: 'block',
              marginBottom: '20px',
            }}>
              Direct pricing for wedding trays, corporate gifts &amp; family celebrations.
            </span>

            {submitted ? (
              <div style={{
                background: '#E6F4EA',
                border: '1px solid #A8DAB5',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>✓</span>
                <h4 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 900,
                  color: '#137333',
                  margin: '0 0 4px 0',
                }}>
                  INQUIRY RECEIVED!
                </h4>
                <p style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '13px',
                  color: '#1E4620',
                  margin: '0 0 16px 0',
                }}>
                  Our Krishnagiri boutique manager will call you within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={handleGoToMenu}
                  style={{
                    background: '#1C0F08',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 20px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Browse Sweets Menu ↗
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['wedding', 'corporate', 'family'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInquiryType(type)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: inquiryType === type ? 'var(--thenisai-yellow)' : '#EFE8DE',
                        background: inquiryType === type ? 'var(--thenisai-yellow)' : '#FAF7F2',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#1C0F08',
                        cursor: 'pointer',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', color: '#1C0F08' }}>Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #D8CEC2',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', color: '#1C0F08' }}>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #D8CEC2',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', color: '#1C0F08' }}>Order Details / Quantity</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., 50 boxes of 500g Palkova & Mysore Pak for wedding on 24th Nov"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #D8CEC2',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#1C0F08',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '12px 24px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: '12.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  Submit Inquiry ↗
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
