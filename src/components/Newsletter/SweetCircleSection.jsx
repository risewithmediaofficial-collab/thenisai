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
    <section id="contact" className="stardust-section stardust-section--circle">
      <div className="stardust-container">
        <div className="stardust-circle__box font-lato">
          <div className="stardust-pill-badge" style={{ marginBottom: '14px' }}>
            <span>Loved by 2,000+ sweet lovers across NH 44</span>
          </div>

          <h2 className="stardust-section__title font-garamond" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '8px' }}>
            Join Our Sweet Circle
          </h2>

          <span className="font-script" style={{ fontSize: '24px', color: '#C59334', display: 'block', marginBottom: '24px' }}>
            Fresh Batches · Highway Specials · Festive Gift Boxes
          </span>

          {/* Form */}
          {submitted ? (
            <div className="stardust-circle__success font-lato">
              <span>✓ Thank you! We have received your contact. Visit us on NH 44 near HP Bunk!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stardust-circle__form">
              <input
                type="text"
                placeholder="Enter your phone or email..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="stardust-circle__input font-lato"
                required
              />
              <button type="submit" className="stardust-btn stardust-btn--primary">
                <span>Subscribe</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </form>
          )}

          {/* Quick Highway Info */}
          <div className="stardust-circle__meta font-lato">
            <span>📍 Nattamai Kottai, Near HP Bunk, NH 44, Krishnagiri</span>
            <span>·</span>
            <span>📞 +91 93448 93547</span>
            <span>·</span>
            <span>⏰ 6:00 AM – 10:30 PM Daily</span>
          </div>
        </div>
      </div>
    </section>
  );
}
