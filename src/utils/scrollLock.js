let lockCount = 0;
let savedScrollY = 0;

function isInsideScrollable(target) {
  if (!target || !target.closest) return false;

  // Never allow backdrop or full-screen overlay backgrounds to pass scroll through
  if (
    target.classList?.contains('cust-auth-overlay') ||
    target.classList?.contains('cust-auth-backdrop') ||
    target.closest(
      '.cust-auth-backdrop, .cart-backdrop, .cart-drawer__backdrop, .checkout-backdrop, .invoice-backdrop, .admin-modal-backdrop, .pos-mobile-backdrop, .pos-sidebar-backdrop, .stock-modal-backdrop'
    )
  ) {
    return false;
  }

  // Allow internal scroll only for designated modal content cards / drawer bodies
  return Boolean(
    target.closest(
      '.cust-auth-modal, .cart-drawer, .cart-drawer__content, .wishlist-drawer, .checkout-modal, .checkout-modal__body, .invoice-modal-wrap, .printable-invoice-container, .admin-modal-card, .stock-modal, .refill-stock-modal, .add-stock-modal, .pos-online-drawer, .pos-online-drawer__inner, .pos-online-orders-drawer, .pos-mobile-drawer, .pos-mobile-menu-drawer, .pos-mobile-cart-drawer, .mobile-menu'
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

function handleScroll() {
  if (lockCount > 0 && typeof savedScrollY === 'number') {
    if (window.__lenis) {
      window.__lenis.scrollTo(savedScrollY, { immediate: true });
    } else if (Math.abs(window.scrollY - savedScrollY) > 1) {
      window.scrollTo(0, savedScrollY);
    }
  }
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
    document.documentElement.classList.add('modal-open');

    // 4. Prevent wheel, touch, key, and scroll leaks to background
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');

    // Clean up event listeners
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('scroll', handleScroll);

    // Resume Lenis smooth scroll engine and maintain exact section position
    if (window.__lenis) {
      window.__lenis.scrollTo(savedScrollY, { immediate: true });
      window.__lenis.start();
    } else {
      window.scrollTo(0, savedScrollY);
    }
  }
}

