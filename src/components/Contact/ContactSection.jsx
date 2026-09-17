import { motion } from 'framer-motion';
import './ContactSection.css';

const contactInfo = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: 'Store Location (Krishnagiri)',
    value: 'Nattamai Kottai, Near H.P. Petrol Bunk\nNH 44 (Bangalore–Salem Highway)\nKrishnagiri, Tamil Nadu - 635001',
    link: 'https://www.google.com/maps/search/?api=1&query=Thenisai+Palkova+and+Sweets+Nattamai+Kottai+Krishnagiri',
    actionText: '📍 Open in Google Maps',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    label: 'Orders & Customer Care',
    value: '+91 93448 93547\n+91 86818 58723',
    link: 'tel:+919344893547',
    actionText: '📞 Call for Orders & Delivery',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Shop Hours (All 7 Days)',
    value: 'Mon – Sun: 6:00 AM – 10:30 PM\nFresh Morning Batches from 6 AM',
    link: null,
    actionText: null,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
    label: 'NH 44 Highway Pitstop',
    value: 'Bangalore – Salem Highway\nEasy Parking next to HP Bunk\nIdeal gift box stop for travelers',
    link: 'https://www.google.com/maps/search/?api=1&query=Thenisai+Palkova+and+Sweets+Nattamai+Kottai+Krishnagiri',
    actionText: '🚗 Plan Highway Pitstop',
  },
];

const socialLinks = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    label: 'Instagram',
    href: 'https://www.instagram.com/thenisai_sweets/',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61593936555693',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    label: 'WhatsApp',
    href: 'https://wa.me/919344893547',
  },
];


export default function ContactSection() {
  return (
    <section id="contact" className="contact section">
      {/* Background image */}
      <div className="contact__bg">
        <img src="/images/products/palkova_hero.jpg" alt="" className="contact__bg-img" loading="lazy" aria-hidden="true" />
        <div className="contact__bg-overlay" />
      </div>

      <div className="container">
        <div className="contact__inner">
          {/* Header */}
          <motion.div
            className="contact__header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <span className="label contact__eyebrow">Since 2006 · Visit Us</span>
            <h2 className="display-md contact__title">Taste Thenisai</h2>
            <div className="gold-line" style={{ marginTop: 20 }} />
          </motion.div>

          {/* Info grid */}
          <div className="contact__grid">
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.label}
                className="contact__card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                <div className="contact__card-icon">{item.icon}</div>
                <div className="contact__card-label label">{item.label}</div>
                <p className="contact__card-value" style={{ whiteSpace: 'pre-line' }}>
                  {item.value}
                </p>
                {item.link && item.actionText && (
                  <a
                    href={item.link}
                    target={item.link.startsWith('http') ? '_blank' : undefined}
                    rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="contact__card-action"
                  >
                    {item.actionText}
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          {/* Local Catchment & Travel SEO Hub */}
          <motion.div
            className="contact__catchment"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="catchment__badge">
              <span>📍 Delivery Catchment &amp; Interstate Highway Service Hub</span>
            </div>
            <p className="catchment__description">
              Direct counter pickup, travel parcel packaging &amp; fast doorstep deliveries across Krishnagiri, Hosur, Tamil Nadu, and NH 44 interstate travelers:
            </p>
            <div className="catchment__tags">
              {/* 1st Preference: Krishnagiri, Hosur & Tamil Nadu State */}
              <span className="catchment__tag highlight">Krishnagiri (கிருஷ்ணகிரி)</span>
              <span className="catchment__tag highlight">Hosur &amp; SIPCOT (ஓசூர்)</span>
              <span className="catchment__tag highlight">Tamil Nadu State Wide</span>
              <span className="catchment__tag">Nattamai Kottai (நத்தமைக்கோட்டை)</span>
              <span className="catchment__tag">NH 44 Highway near HP Bunk</span>
              <span className="catchment__tag">Kaveripattinam (காவேரிப்பட்டினம்)</span>
              <span className="catchment__tag">Bargur (பர்கூர்)</span>
              <span className="catchment__tag">Veppanapalli (வேப்பனப்பள்ளி)</span>
              <span className="catchment__tag">Rayakottai (ராயக்கோட்டை)</span>
              <span className="catchment__tag">Uthangarai (ஊத்தங்கரை)</span>

              {/* 2nd Preference: Karnataka & Bangalore Highway Corridor */}
              <span className="catchment__tag highway">Karnataka / Bangalore NH 44</span>
              <span className="catchment__tag highway">Electronic City &amp; Attibele</span>

              {/* 3rd Preference: Kerala Highway Route */}
              <span className="catchment__tag highway">Kerala Travelers Route (via Salem)</span>
            </div>
            <p className="catchment__tamil-note">
              தேனிசை பால்கோவா &amp; ஸ்வீட்ஸ் — கிருஷ்ணகிரி, ஓசூர் மற்றும் தமிழ்நாடு முழுவதும் தூய பசும்பால் பால்கோவா, நெய் மைசூர்பாகு இனிப்புகள். Karnataka &amp; Kerala நெடுஞ்சாலை பயணிகளுக்கான விருப்பமான இனிப்பு நிறுத்தம்.
            </p>
          </motion.div>

          {/* Social */}
          <motion.div
            className="contact__social"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
          >
            {socialLinks.map((soc) => (
              <a
                key={soc.label}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="contact__social-btn"
                aria-label={soc.label}
              >
                {soc.icon}
                <span className="label">{soc.label}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
