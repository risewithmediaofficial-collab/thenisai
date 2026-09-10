import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export function useScrollLock(isActive) {
  useEffect(() => {
    if (isActive) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [isActive]);
}
