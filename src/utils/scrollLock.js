let lockCount = 0;
let savedScrollY = 0;

function isInsideScrollable(target) {
  if (!target || !target.closest) return false;

  // Never allow backdrop to pass scroll through
  if (target.closest('.cart-backdrop, .checkout-backdrop, .invoice-backdrop, .admin-modal-backdrop, .pos-mobile-backdrop')) {
    return false;
  }

  return Boolean(
    target.closest(
      '[data-lenis-prevent], .cart-drawer__content, .printable-invoice-container, .checkout-portal, .checkout-modal__body, .invoice-portal, .invoice-modal-wrap, .admin-modal-card, .restock-modal, .scale-modal, .pos-online-drawer, .pos-online-drawer__inner, .pos-online-orders-drawer, .mobile-menu, .pos-mobile-drawer, .pos-mobile-menu-drawer, .pos-mobile-cart-drawer'
    )
  );
}

function handleWheel(e) {
  // Check if wheel occurred inside an active scrollable popup element
  if (isInsideScrollable(e.target)) {
    return; // Allow popup to scroll internally
  }
  // Otherwise prevent screen from scrolling
  e.preventDefault();
}

function handleTouchMove(e) {
  if (isInsideScrollable(e.target)) {
    return; // Allow popup to scroll internally
  }
  e.preventDefault();
}

function handleKeyDown(e) {
  const scrollKeys = ['Space', ' ', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowUp', 'ArrowDown'];
  if (!scrollKeys.includes(e.key)) return;

  const target = e.target;
  const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (isEditable) return;

  if (isInsideScrollable(target)) {
    return;
  }

  e.preventDefault();
}

export function lockScroll() {
  lockCount++;
  if (lockCount === 1) {
    // 1. Capture exact current scroll position
    savedScrollY = window.__lenis?.scroll ?? window.scrollY ?? document.documentElement.scrollTop ?? 0;

    // 2. Freeze Lenis smooth scroll engine
    window.__lenis?.stop();

    // 3. Keep scroll locked in place
    if (window.__lenis) {
      window.__lenis.scrollTo(savedScrollY, { immediate: true });
    }

    document.body.classList.add('modal-open');

    // 4. Prevent wheel, touch, and key leaks to background
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
  }
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove('modal-open');

    // Clean up event listeners
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('keydown', handleKeyDown);

    // Resume Lenis smooth scroll engine and maintain exact section position
    if (window.__lenis) {
      window.__lenis.scrollTo(savedScrollY, { immediate: true });
      window.__lenis.start();
    } else {
      window.scrollTo(0, savedScrollY);
    }
  }
}

