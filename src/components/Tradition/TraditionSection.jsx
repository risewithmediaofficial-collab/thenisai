import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
export default function TraditionSection() {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const onTouchMove = useCallback((e) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <section className="tradition section" id="tradition">
      <div className="tradition__container">
        <div
          className="tradition__comparison-wrap"
          ref={containerRef}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
        >
          {/* Base Layer: Traditional / The Old Way (Left/Background) */}
          <div className="tradition__layer tradition__layer--base">
            <img
              src="/images/story/brand_story.webp"
              alt="Traditional cooking in brass uruli"
              className="tradition__layer-img"
              width="800"
              height="500"
              loading="lazy"
              decoding="async"
            />
            <div className="tradition__layer-overlay tradition__layer-overlay--base" />
            
            <div className="tradition__badge tradition__badge--left">
              <span className="tradition__badge-sub">Heritage</span>
              <span className="tradition__badge-title">The Old Way</span>
            </div>
          </div>

          {/* Clipped Layer: Reimagined / Modern (Right/Top) */}
          <div
            className="tradition__layer tradition__layer--reveal"
            style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
          >
            <img
              src="/images/products/sweet_box.webp"
              alt="Thenisai luxury sweet presentation"
              className="tradition__layer-img"
              width="800"
              height="500"
              loading="lazy"
              decoding="async"
            />
            <div className="tradition__layer-overlay tradition__layer-overlay--reveal" />

            <div className="tradition__badge tradition__badge--right">
              <span className="tradition__badge-sub">Modern Luxury</span>
              <span className="tradition__badge-title">Reimagined</span>
            </div>
          </div>

          {/* Draggable Divider Line & Handle */}
          <div
            className="tradition__slider-divider"
            style={{ left: `${sliderPos}%` }}
            onMouseDown={onMouseDown}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="tradition__slider-line" />
            <div className="tradition__slider-handle" aria-label="Slide to compare">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Center Title Badge */}
          <div className="tradition__center-badge">
            <motion.div
              className="tradition__center-inner"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="tradition__center-icon">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="1" opacity="0.6"/>
                  <circle cx="20" cy="20" r="9" stroke="#D4A843" strokeWidth="1" opacity="0.4"/>
                  <circle cx="20" cy="20" r="3" fill="#D4A843" opacity="0.9"/>
                </svg>
              </div>
              <h2 className="tradition__center-heading">
                Tradition, <em>Reimagined.</em>
              </h2>
              <span className="tradition__center-hint">Slide or touch to compare</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
