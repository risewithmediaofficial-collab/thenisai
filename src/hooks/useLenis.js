import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import ScrollTrigger from 'gsap/ScrollTrigger';

export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    let lenis = null;
    let unbindScroll = null;
    let rafId = null;

    const isNonStorefront = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const path = (window.location.pathname || '').toLowerCase();
      return (
        hash.startsWith('#admin') ||
        hash.startsWith('#billing') ||
        hash.startsWith('#inventory') ||
        hash.startsWith('#sales') ||
        hash.startsWith('#daily-revenue') ||
        hash.startsWith('#activity-logs') ||
        hash.startsWith('#recycle-bin') ||
        hash.startsWith('#orders') ||
        hash.startsWith('#dispatch') ||
        hash.startsWith('#shift-bills') ||
        path.endsWith('/admin') ||
        path.endsWith('/billing')
      );
    };

    const stopAndDestroyLenis = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (unbindScroll) {
        unbindScroll();
        unbindScroll = null;
      }
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      lenisRef.current = null;
      window.__lenis = null;
      document.body.style.overflow = '';
    };

    const initLenis = () => {
      if (isNonStorefront()) {
        stopAndDestroyLenis();
        return;
      }

      if (lenis) return;

      lenis = new Lenis({
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

      unbindScroll = lenis.on('scroll', () => {
        ScrollTrigger.update();
      });

      function raf(time) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    };

    if (isNonStorefront()) {
      document.body.style.overflow = '';
    } else {
      initLenis();
    }

    const handleHashChange = () => {
      if (isNonStorefront()) {
        stopAndDestroyLenis();
      } else {
        initLenis();
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      stopAndDestroyLenis();
    };
  }, []);

  return lenisRef;
}
