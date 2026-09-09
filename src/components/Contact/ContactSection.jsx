import { motion } from 'framer-motion';
import './ContactSection.css';

const contactInfo = [
  {
    icon: '📍',
    label: 'Location',
    value: '123 Sweet Street, Madurai, Tamil Nadu',
    link: null,
  },
  {
    icon: '📞',
    label: 'Phone',
    value: '+91 98765 43210',
    link: 'tel:+919876543210',
  },
  {
    icon: '🕐',
    label: 'Hours',
    value: 'Mon–Sat: 9AM – 9PM\nSun: 10AM – 8PM',
    link: null,
  },
];

const socialLinks = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    label: 'Instagram',
    href: 'https://instagram.com/thenisai',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    label: 'WhatsApp',
    href: 'https://wa.me/919876543210',
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="contact section">
      {/* Background image */}
      <div className="contact__bg">
        <img src="/palkova_hero.jpg" alt="" className="contact__bg-img" loading="lazy" aria-hidden="true" />
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
            <span className="label contact__eyebrow">Visit Us</span>
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
                {item.link ? (
                  <a href={item.link} className="contact__card-value">
                    {item.value}
                  </a>
                ) : (
                  <p className="contact__card-value" style={{ whiteSpace: 'pre-line' }}>
                    {item.value}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

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
