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

  return (
    <div className="stardust-page stardust-page--contact">
      {/* Header Banner with Exact Font Pairings */}
      <section className="stardust-story-hero">
        <div className="stardust-container">
          <span className="stardust-story-tag font-lato">HIGHWAY BOUTIQUE &amp; INQUIRIES</span>
          <span className="font-script" style={{ fontSize: '40px', color: '#E8C06A', display: 'block', marginBottom: '6px' }}>
            A Warm Welcome on NH 44
          </span>
          <h1 className="stardust-story-title font-garamond" style={{ marginBottom: '8px' }}>
            Visit Us &amp; Bulk Pre-Orders
          </h1>
          <p className="font-garamond italic" style={{ fontSize: '20px', color: '#E8C06A', margin: '8px 0 0' }}>
            Boutique Storefront · Wedding &amp; Corporate Sweet Boxes · NH 44 Krishnagiri
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="stardust-section stardust-section--contact-body font-lato">
        <div className="stardust-container">
          <div className="stardust-contact-grid">
            {/* Left: Boutique Information & Directions */}
            <div className="stardust-contact-info-col">
              <span className="stardust-pill-badge">Boutique Information</span>
              <span className="font-script" style={{ fontSize: '28px', color: '#C59334', display: 'block', marginTop: '10px' }}>
                Krishnagiri Landmark
              </span>
              <h2 className="stardust-section__title font-garamond" style={{ marginTop: '2px', marginBottom: '24px' }}>
                Highway Pitstop Experience
              </h2>

              <div className="stardust-info-cards">
                <div className="stardust-info-card">
                  <div className="stardust-info-icon">📍</div>
                  <div>
                    <h3 className="stardust-info-label">Address</h3>
                    <p className="stardust-info-val">
                      Thenisai Palkova &amp; Sweets, Nattamai Kottai,<br />
                      Near HP Petrol Bunk, Bangalore–Salem Highway (NH 44),<br />
                      Krishnagiri, Tamil Nadu &ndash; 635001.
                    </p>
                    <a
                      href="https://maps.google.com/?q=Thenisai+Sweets+Krishnagiri"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="stardust-link-btn"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                </div>

                <div className="stardust-info-card">
                  <div className="stardust-info-icon">⏰</div>
                  <div>
                    <h3 className="stardust-info-label">Store Hours</h3>
                    <p className="stardust-info-val">
                      Monday &ndash; Sunday: <strong>6:00 AM &ndash; 10:30 PM</strong><br />
                      Fresh hot Palkova batches available starting 7:30 AM daily.
                    </p>
                  </div>
                </div>

                <div className="stardust-info-card">
                  <div className="stardust-info-icon">📞</div>
                  <div>
                    <h3 className="stardust-info-label">Direct Contact</h3>
                    <p className="stardust-info-val">
                      Counter / Orders: <strong>+91 93448 93547</strong><br />
                      WhatsApp: <strong>+91 93448 93547</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <a href="tel:+919344893547" className="stardust-btn stardust-btn--primary" style={{ padding: '7px 16px', fontSize: '12px' }}>
                        Call Boutique
                      </a>
                      <a href="https://wa.me/919344893547" target="_blank" rel="noopener noreferrer" className="stardust-btn stardust-btn--outline-dark" style={{ padding: '7px 16px', fontSize: '12px' }}>
                        WhatsApp Us
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Bulk / Wedding Pre-Order Form */}
            <div className="stardust-contact-form-col">
              <div className="stardust-card" style={{ padding: '32px' }}>
                <span className="stardust-story-tag">SPECIAL OCCASIONS</span>
                <span className="font-script" style={{ fontSize: '24px', color: '#C59334', display: 'block', marginTop: '4px' }}>
                  Auspicious Celebrations
                </span>
                <h3 className="stardust-card__title font-garamond" style={{ fontSize: '26px', marginTop: '2px', marginBottom: '8px' }}>
                  Wedding &amp; Bulk Pre-Order
                </h3>
                <p style={{ color: '#687B72', fontSize: '13.5px', marginBottom: '22px' }}>
                  Planning an auspicious event? Pre-order custom gift boxes, signature Palkova trays, or travel snack hampers.
                </p>

                {submitted ? (
                  <div className="stardust-circle__success" style={{ background: '#FBF3E2', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(197, 147, 52, 0.25)' }}>
                    <h4 className="font-garamond" style={{ fontSize: '22px', color: '#1C0F08', margin: '0 0 8px' }}>
                      Inquiry Received!
                    </h4>
                    <p style={{ color: '#6B5749', fontSize: '13.5px', margin: '0 0 16px' }}>
                      Thank you, {name}. Our sweet master will call you at {phone} within 2 hours to confirm menu and tasting samples.
                    </p>
                    <button type="button" className="stardust-btn stardust-btn--primary" onClick={handleGoToMenu}>
                      Browse Pre-Order Menu
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                        Event Type
                      </label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="stardust-form-input"
                      >
                        <option value="wedding">Wedding / Reception (Kalyanam Sweets)</option>
                        <option value="corporate">Corporate / Festival Gifting (Diwali / Pongal)</option>
                        <option value="family">Family Function / Seemantham / Birthday</option>
                        <option value="travel">NH 44 Travel Bulk Pack</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className="stardust-form-input"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile"
                          className="stardust-form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                          Event / Pickup Date
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="stardust-form-input"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                          Approx. Quantity (kg / boxes)
                        </label>
                        <input
                          type="text"
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          placeholder="e.g. 25 kg / 100 boxes"
                          className="stardust-form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#31443B', display: 'block', marginBottom: '6px' }}>
                        Special Requests or Selected Sweets
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tell us your preferences (e.g. Signature Palkova, Kaju Katli, Mysore Pak, Spicy Seedai...)"
                        className="stardust-form-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button type="submit" className="stardust-btn stardust-btn--primary" style={{ width: '100%', marginTop: '6px' }}>
                      Submit Bulk Pre-Order Request
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
