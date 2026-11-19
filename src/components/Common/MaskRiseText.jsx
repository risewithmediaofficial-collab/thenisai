import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * MaskRiseText Component
 * -----------------------------------------------------------------------------
 * Provides the signature luxury editorial "mask rise" text reveal effect.
 * Each line or text block is held within an overflow-clipped container (the mask)
 * and smoothly translates upwards into full view as the user scrolls.
 *
 * Props:
 * - as: HTML tag to render (e.g. 'h1', 'h2', 'h3', 'p', 'span', 'div')
 * - lines: Array of strings to render with automatic line-by-line staggered masks
 * - children: React node or string (used when lines is not provided)
 * - delay: Initial delay in seconds (default: 0)
 * - stagger: Delay between consecutive lines in seconds (default: 0.08)
 * - duration: Animation duration in seconds (default: 0.75)
 * - className: Outer container class name
 * - lineClassName: Inner line text class name
 * - once: Whether the reveal triggers once (default: true)
 */
export default function MaskRiseText({
  as: Component = 'div',
  lines,
  children,
  delay = 0,
  stagger = 0.08,
  duration = 0.75,
  className = '',
  lineClassName = '',
  once = true,
  margin = '0px 0px -8% 0px',
  ...props
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once, margin });
  const shouldReduceMotion = useReducedMotion();

  // Strong ease-out curve for high-end UI/editorial typography
  const luxuryEase = [0.23, 1, 0.32, 1];

  // If explicit lines array is provided, render each line in its own overflow mask
  if (Array.isArray(lines) && lines.length > 0) {
    return (
      <Component ref={containerRef} className={`${className}`} {...props}>
        {lines.map((line, idx) => {
          const lineDelay = delay + idx * stagger;
          return (
            <span
              key={idx}
              className="block overflow-hidden pb-1 -mb-1"
              style={{ verticalAlign: 'bottom' }}
            >
              <motion.span
                className={`block ${lineClassName}`}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { transform: 'translateY(115%)', opacity: 0 }
                }
                animate={
                  isInView
                    ? shouldReduceMotion
                      ? { opacity: 1 }
                      : { transform: 'translateY(0%)', opacity: 1 }
                    : shouldReduceMotion
                    ? { opacity: 0 }
                    : { transform: 'translateY(115%)', opacity: 0 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0.3 : duration,
                  delay: lineDelay,
                  ease: luxuryEase,
                }}
              >
                {line}
              </motion.span>
            </span>
          );
        })}
      </Component>
    );
  }

  // Single-line or arbitrary children
  return (
    <Component ref={containerRef} className={`${className}`} {...props}>
      <span
        className="inline-block overflow-hidden pb-1 -mb-1 max-w-full"
        style={{ verticalAlign: 'bottom' }}
      >
        <motion.span
          className={`inline-block ${lineClassName}`}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { transform: 'translateY(115%)', opacity: 0 }
          }
          animate={
            isInView
              ? shouldReduceMotion
                ? { opacity: 1 }
                : { transform: 'translateY(0%)', opacity: 1 }
              : shouldReduceMotion
              ? { opacity: 0 }
              : { transform: 'translateY(115%)', opacity: 0 }
          }
          transition={{
            duration: shouldReduceMotion ? 0.3 : duration,
            delay,
            ease: luxuryEase,
          }}
        >
          {children}
        </motion.span>
      </span>
    </Component>
  );
}
