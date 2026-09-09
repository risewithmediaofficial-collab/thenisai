import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import './BrandStory.css';

gsap.registerPlugin(ScrollTrigger);

const frames = [
  {
    id: 'frame-1',
    label: 'The Source',
    caption: 'Fresh whole milk',
    bg: 'rgba(245,237,216,0.05)',
  },
  {
    id: 'frame-2',
    label: 'The Vessel',
    caption: 'Traditional brass uruli',
    bg: 'rgba(212,168,67,0.05)',
  },
  {
    id: 'frame-3',
    label: 'The Process',
    caption: 'Slow stirred for hours',
    bg: 'rgba(42,24,16,0.1)',
  },
  {
    id: 'frame-4',
    label: 'The Craft',
    caption: 'Finished Palkova',
    bg: 'rgba(212,168,67,0.08)',
  },
];

export default function BrandStory() {
  const sectionRef = useRef();
  const trackRef = useRef();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    // Slide each frame
    tl.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
    });

    // Reveal images as they come into view
    const images = track.querySelectorAll('.story__frame-img');
    images.forEach((img, i) => {
      tl.from(img, { scale: 1.15, ease: 'none' }, i * 0.25);
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section id="story" className="story" ref={sectionRef}>
      <div className="story__header">
        <motion.span
          className="label story__eyebrow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Our Craft
        </motion.span>
        <motion.h2
          className="display-md story__title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          Made the Traditional Way
        </motion.h2>
        <motion.p
          className="story__sub body-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          Slow cooked. Richly crafted. Truly Thenisai.
        </motion.p>
      </div>

      <div className="story__scroll-track-wrap">
        <div className="story__track" ref={trackRef}>
          {frames.map((frame, i) => (
            <div key={frame.id} className="story__frame">
              <div className="story__frame-img-wrap">
                {i === 2 ? (
                  <img
                    src="/brand_story.jpg"
                    alt={frame.caption}
                    className="story__frame-img"
                    loading="lazy"
                  />
                ) : i === 3 ? (
                  <img
                    src="/palkova_hero.jpg"
                    alt={frame.caption}
                    className="story__frame-img"
                    loading="lazy"
                  />
                ) : i === 0 ? (
                  <img
                    src="/ingredients.jpg"
                    alt={frame.caption}
                    className="story__frame-img"
                    loading="lazy"
                  />
                ) : (
                  <img
                    src="/palkova_card.jpg"
                    alt={frame.caption}
                    className="story__frame-img"
                    loading="lazy"
                  />
                )}
                <div className="story__frame-overlay" />
              </div>
              <div className="story__frame-label">
                <span className="story__frame-number">0{i + 1}</span>
                <h3 className="story__frame-title">{frame.label}</h3>
                <p className="story__frame-caption">{frame.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="story__hint">
        <span className="label">Scroll to explore</span>
        <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
          <path d="M0 6h38M32 1l6 5-6 5" stroke="var(--gold)" strokeWidth="0.8" opacity="0.6"/>
        </svg>
      </div>
    </section>
  );
}
