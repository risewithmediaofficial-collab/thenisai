import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Simulate asset loading progress
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            setIsDone(true);
            setTimeout(onComplete, 800);
          }, 400);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 60);

    return () => clearInterval(intervalRef.current);
  }, [onComplete]);

  const WORDS = [
    { text: 'THENISAI', letters: 'THENISAI'.split(''), startIndex: 0 },
    { text: 'SWEETS', letters: 'SWEETS'.split(''), startIndex: 8 },
  ];

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated milk particle background */}
          <div className="loader__particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="loader__particle" style={{
                '--delay': `${i * 0.15}s`,
                '--x': `${Math.random() * 100}%`,
                '--size': `${Math.random() * 6 + 2}px`,
              }} />
            ))}
          </div>

          {/* Central content */}
          <div className="loader__content">
            {/* Logo Emblem */}
            <motion.div
              className="loader__emblem-wrap"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src="/images/branding/logo-icon.png" alt="Thenisai Logo" className="loader__emblem-img" />
            </motion.div>

            {/* Logo letters grouped by word for responsive wrapping */}
            <div className="loader__logo" aria-label="THENISAI SWEETS">
              {WORDS.map((word, wIdx) => (
                <span key={wIdx} className="loader__word">
                  {word.letters.map((letter, i) => {
                    const letterIndex = word.startIndex + i;
                    return (
                      <motion.span
                        key={i}
                        className="loader__letter"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: letterIndex * 0.06,
                          duration: 0.6,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        {letter}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </div>

            <motion.p
              className="loader__tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              The Taste of Tradition
            </motion.p>

            {/* Progress bar */}
            <div className="loader__progress-wrap">
              <div className="loader__progress-track">
                <motion.div
                  className="loader__progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="loader__progress-num">
                {Math.min(Math.round(progress), 100)}
              </span>
            </div>
          </div>

          {/* Bottom label */}
          <motion.div
            className="loader__bottom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span>Pure · Rich · Traditional</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
