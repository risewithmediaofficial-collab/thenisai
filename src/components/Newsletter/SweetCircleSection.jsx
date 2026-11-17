import { useState } from 'react';

export default function SweetCircleSection() {
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContact('');
    }, 4000);
  };

  return (
    <section className="ks-section" style={{ paddingBottom: 0 }}>
      <div className="ks-container">
        <div style={{
          background: 'linear-gradient(135deg, #FFF9EE 0%, #FAF2E3 100%)',
          border: '1px solid var(--ks-border)',
          borderRadius: 'var(--ks-radius-lg)',
          padding: 'clamp(28px, 4vw, 44px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          <div>
            <span className="ks-section-header__sub" style={{ textAlign: 'left', marginBottom: '4px' }}>
              Stay Updated
            </span>
            <h3 style={{
              fontFamily: 'var(--ks-font-serif)',
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 700,
              color: 'var(--ks-charcoal)',
              margin: '0 0 6px 0',
            }}>
              Join Thenisai Sweet Circle
            </h3>
            <p style={{
              fontSize: '13.5px',
              color: 'var(--ks-muted)',
              margin: 0,
            }}>
              Receive fresh morning batch alerts &amp; festive sweet box offers directly on WhatsApp or Email.
            </p>
          </div>

          {submitted ? (
            <span style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--ks-maroon)',
            }}>
              ✓ Thank you! We will alert you about fresh batches on NH 44.
            </span>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Enter email or WhatsApp number..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                style={{
                  padding: '11px 18px',
                  borderRadius: 'var(--ks-radius-pill)',
                  border: '1px solid var(--ks-border)',
                  background: '#FFFFFF',
                  fontFamily: 'var(--ks-font-ui)',
                  fontSize: '13px',
                  color: 'var(--ks-charcoal)',
                  outline: 'none',
                  minWidth: '240px',
                }}
                required
              />
              <button
                type="submit"
                className="ks-hero__btn-primary"
                style={{ padding: '11px 24px', fontSize: '13px' }}
              >
                Subscribe ↗
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
