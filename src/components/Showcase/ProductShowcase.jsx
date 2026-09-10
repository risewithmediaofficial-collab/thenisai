import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useCart } from '../../context/CartContext';
import { SPECIAL_BOX } from '../../data/sweetsData';
import './ProductShowcase.css';

gsap.registerPlugin(ScrollTrigger);

export default function ProductShowcase() {
  const { addToCart, setIsCartOpen } = useCart();
  const sectionRef = useRef();
  const imgRef = useRef();
  const particlesRef = useRef();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Slow rotation on scroll
    gsap.to(imgRef.current, {
      rotateY: 15,
      rotateX: -5,
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 2,
      },
    });

    // Float particles up
    const particles = particlesRef.current?.querySelectorAll('.showcase__particle');
    particles?.forEach((p, i) => {
      gsap.to(p, {
        y: -(80 + Math.random() * 120),
        opacity: 0,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 2,
        repeat: -1,
        ease: 'power1.out',
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section className="showcase section" ref={sectionRef}>
      {/* Particle field */}
      <div className="showcase__particles" ref={particlesRef}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="showcase__particle"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 30}%`,
              '--size': `${Math.random() * 5 + 2}px`,
            }}
          />
        ))}
      </div>

      {/* Radial gold glow */}
      <div className="showcase__glow" />

      <div className="container">
        <div className="showcase__inner">
          {/* Product image */}
          <motion.div
            className="showcase__img-wrap"
            ref={imgRef}
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img
              src="/sweet_box.jpg"
              alt="Thenisai premium sweet box"
              className="showcase__img"
              loading="lazy"
            />
            {/* Shadow */}
            <div className="showcase__img-shadow" />
          </motion.div>

          {/* Text */}
          <motion.div
            className="showcase__text"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <span className="label showcase__eyebrow">Limited Edition</span>
            <h2 className="display-lg showcase__title">
              A Box Full of Happiness.
            </h2>
            <p className="showcase__subtitle" style={{ color: 'rgba(255, 248, 238, 0.8)', fontSize: '15px', marginTop: '12px', lineHeight: '1.6' }}>
              Handpicked assortments of Palkova, Royal Mysore Pak, Kaju Katli, and Badam Halwa.
            </p>
            <div className="showcase__price-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '20px 0 24px' }}>
              <span className="showcase__price" style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', color: '#D4A843', fontWeight: '700', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                ₹{SPECIAL_BOX.price}
              </span>
              <span className="label" style={{ background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843', padding: '4px 10px', borderRadius: '4px' }}>
                1 kg Premium Gift Box
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                addToCart(SPECIAL_BOX, SPECIAL_BOX.weight, SPECIAL_BOX.price, 1);
                setIsCartOpen(true);
              }}
            >
              <span>Order Special Box</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
