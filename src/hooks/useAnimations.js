import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const triggers = [];

    elements.forEach((el) => {
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('revealed'),
        once: true,
      });
      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);
}

export function useMousePosition() {
  const mouseRef = useRef({ x: 0, y: 0, normX: 0, normY: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        normX: (e.clientX / window.innerWidth) * 2 - 1,
        normY: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return mouseRef;
}
