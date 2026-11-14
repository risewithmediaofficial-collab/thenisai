import { useState } from 'react';

const INSTA_IMAGES = [
  { img: '/images/products/palkova_hero.webp', label: 'Signature Palkova' },
  { img: '/images/products/mysore_pak.webp', label: 'Royal Mysore Pak' },
  { img: '/images/products/kaju_katli_real.jpg', label: 'Pure Kaju Katli' },
  { img: '/images/products/panipuri_real.jpg', label: 'Highway Pani Puri' },
  { img: '/images/products/savories_boondi_real.jpg', label: 'Spicy Kara Boondi' },
  { img: '/images/products/tea_real.jpg', label: 'Fresh Brewed Tea' },
];

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
    <section className="thenisai-insta-section">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 className="thenisai-section__headline">FOLLOW US ON INSTAGRAM</h2>
        <span style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#8C7769',
          display: 'block',
          marginTop: '6px',
        }}>
          @THENISAISWEETS · NH 44 KRISHNAGIRI
        </span>
      </div>

      {/* 6 Photo Grid */}
      <div className="thenisai-insta-grid">
        {INSTA_IMAGES.map((item, idx) => (
          <a
            key={idx}
            href="https://instagram.com/thenisai_sweets"
            target="_blank"
            rel="noopener noreferrer"
            className="thenisai-insta-item"
            title={`Follow @thenisaisweets - ${item.label}`}
          >
            <img
              src={item.img}
              alt={item.label}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/products/sweets_platter_hero.jpg';
              }}
            />
          </a>
        ))}
      </div>

      {/* Newsletter / Highway Fresh Batch Alert Strip */}
      <div style={{
        marginTop: '36px',
        background: '#FAF7F2',
        border: '1px solid #EFE8DE',
        borderRadius: '20px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900,
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            color: '#1C0F08',
            margin: '0 0 4px 0',
          }}>
            GET FRESH BATCH &amp; HIGHWAY ALERTS
          </h3>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: '12.5px',
            color: '#7A695B',
            fontWeight: 700,
          }}>
            Receive notifications when hot Palkova is freshly simmered on NH 44.
          </span>
        </div>

        {submitted ? (
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: '13px',
            color: '#0E3B33',
          }}>
            ✓ SUBBED! WE WILL ALERT YOU ON WHATSAPP/EMAIL.
          </span>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Enter email or WhatsApp..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #D8CEC2',
                borderRadius: '9999px',
                padding: '10px 18px',
                fontFamily: "'Lato', sans-serif",
                fontSize: '13px',
                color: '#1C0F08',
                outline: 'none',
                minWidth: '220px',
              }}
              required
            />
            <button
              type="submit"
              style={{
                background: '#1C0F08',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '10px 22px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              Subscribe ↗
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
