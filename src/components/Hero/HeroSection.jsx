import { useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import PalkovaScene from './PalkovaScene';
import './HeroSection.css';

gsap.registerPlugin(ScrollTrigger);

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12 + 0.3,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function HeroSection() {
  const heroRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current.x = nx;
      mousePos.current.y = ny;
    };

    hero.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section id="hero" className="hero" ref={heroRef}>
      {/* Background atmospheric gradient */}
      <div className="hero__bg">
        <div className="hero__bg-gradient" />
        <div className="hero__bg-radial" />
        <div className="hero__bg-vignette" />
      </div>

      <div className="hero__container">
        <div className="hero__grid">
          {/* Left Column: Brand Identity & Narrative */}
          <div className="hero__info">
            {/* Eyebrow */}
            <motion.div
              className="hero__eyebrow label"
              custom={0}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              <span className="hero__eyebrow-line" />
              <span>Est. 2006 · Signature Palkova</span>
              <span className="hero__eyebrow-line" />
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="hero__title display-xl"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              THENISAI <span className="hero__title-accent">SWEETS</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="hero__subtitle"
              custom={2}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              The Taste of Tradition
            </motion.p>

            {/* Narrative */}
            <motion.p
              className="hero__narrative"
              custom={3}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              Handcrafted from 100% pure milk, slow-simmered for hours in authentic brass urulis into melt-in-the-mouth caramelized perfection.
            </motion.p>

            {/* Quality Badges */}
            <motion.div
              className="hero__badges"
              custom={4}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              <span className="hero__badge">
                <span className="hero__badge-dot" />
                Pure Milk
              </span>
              <span className="hero__badge-sep">/</span>
              <span className="hero__badge">
                <span className="hero__badge-dot" />
                No Preservatives
              </span>
              <span className="hero__badge-sep">/</span>
              <span className="hero__badge">
                <span className="hero__badge-dot" />
                Slow Cooked
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="hero__cta-wrap"
              custom={5}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              <a
                href="#collection"
                className="btn btn-primary hero__cta"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Explore Sweets</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </a>
              <a
                href="#story"
                className="btn btn-outline"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#story')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Our Story</span>
              </a>
            </motion.div>
          </div>

          {/* Right Column: Interactive 3D Photorealistic Palkova Uruli */}
          <div className="hero__visual">
            <div className="hero__visual-glow" />
            <div className="hero__canvas-wrap">
              <Suspense fallback={<div className="hero__canvas-placeholder" />}>
                <PalkovaScene mousePos={mousePos} />
              </Suspense>
            </div>
            <div className="hero__visual-hint">
              <span className="hero__visual-hint-dot" />
              <span>Interactive 3D · Move cursor to tilt &amp; illuminate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom scroll cue */}
      <div className="hero__scroll">
        <div className="hero__scroll-line" />
        <span className="label">Scroll</span>
      </div>
    </section>
  );
}
