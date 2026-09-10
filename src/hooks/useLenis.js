import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import ScrollTrigger from 'gsap/ScrollTrigger';

export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    const unbindScroll = lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (unbindScroll) unbindScroll();
      window.__lenis = null;
      lenis.destroy();
    };
  }, []);

  return lenisRef;
}
