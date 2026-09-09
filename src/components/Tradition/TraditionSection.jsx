import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import './TraditionSection.css';

gsap.registerPlugin(ScrollTrigger);

export default function TraditionSection() {
  const sectionRef = useRef();
  const leftRef = useRef();
  const rightRef = useRef();
  const clipRef = useRef();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 1.2,
      },
    });

    tl.fromTo(
      clipRef.current,
      { clipPath: 'inset(0 50% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', ease: 'none' }
    );

    tl.fromTo(leftRef.current, { scale: 1.08 }, { scale: 1, ease: 'none' }, 0);
    tl.fromTo(rightRef.current, { scale: 1.12 }, { scale: 1.02, ease: 'none' }, 0);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section className="tradition section" ref={sectionRef}>
      <div className="tradition__split">
        {/* Left — Traditional */}
        <div className="tradition__side tradition__side--left" ref={leftRef}>
          <img
            src="/brand_story.jpg"
            alt="Traditional cooking"
            className="tradition__img"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="tradition__side-overlay" />
          <div className="tradition__side-text">
            <span className="label tradition__side-label">Traditional</span>
            <h3 className="tradition__side-heading">The Old Way</h3>
          </div>
        </div>

        {/* Right — Modern (clip-path reveal) */}
        <div className="tradition__side tradition__side--right" ref={clipRef}>
          <div ref={rightRef} className="tradition__right-inner">
            <img
              src="/sweet_box.jpg"
              alt="Modern Thenisai presentation"
              className="tradition__img"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="tradition__side-overlay tradition__side-overlay--right" />
            <div className="tradition__side-text">
              <span className="label tradition__side-label tradition__side-label--right">Modern</span>
              <h3 className="tradition__side-heading">Reimagined</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Center overlay text */}
      <div className="tradition__center">
        <motion.div
          className="tradition__center-content"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <div className="tradition__center-ornament">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="0.5" opacity="0.6"/>
              <circle cx="20" cy="20" r="10" stroke="#D4A843" strokeWidth="0.5" opacity="0.4"/>
              <circle cx="20" cy="20" r="3" fill="#D4A843" opacity="0.8"/>
            </svg>
          </div>
          <h2 className="display-lg tradition__heading">
            Tradition,<br/>
            <em>Reimagined.</em>
          </h2>
        </motion.div>
      </div>
    </section>
  );
}
