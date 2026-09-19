import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import LoadingScreen from './components/Loader/LoadingScreen';
import Navbar from './components/Nav/Navbar';
import HeroSection from './components/Hero/HeroSection';
import CartDrawer from './components/Cart/CartDrawer';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLenis } from './hooks/useLenis';
import { useScrollReveal } from './hooks/useAnimations';

// Lazy load heavy admin, billing & modal modules for fast storefront load
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const BillingCounter = lazy(() => import('./components/Billing/BillingCounter'));
const StaffLoginModal = lazy(() => import('./components/Auth/StaffLoginModal'));

// Read-only banner shown to demo/viewer accounts
function ViewerBanner({ onLogout }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 20px', fontSize: '12px', fontWeight: 600,
      letterSpacing: '0.04em', fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        READ-ONLY DEMO MODE — All write actions are disabled. No data will be created or modified.
      </span>
      <button
        onClick={onLogout}
        style={{
          background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)',
          color: '#fff', borderRadius: '6px', padding: '3px 12px', cursor: 'pointer',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
        }}
      >
        EXIT DEMO
      </button>
    </div>
  );
}
const CheckoutModal = lazy(() => import('./components/Billing/CheckoutModal'));
const InvoiceModal = lazy(() => import('./components/Billing/InvoiceModal'));
const WishlistDrawer = lazy(() => import('./components/Wishlist/WishlistDrawer'));
const CustomerAuthModal = lazy(() => import('./components/Wishlist/CustomerAuthModal'));

// Lazy load heavy storefront sections
const BrandStory = lazy(() => import('./components/Story/BrandStory'));
const SignaturePalkova = lazy(() => import('./components/Signature/SignaturePalkova'));
const SweetsCollection = lazy(() => import('./components/Collection/SweetsCollection'));
const InteractiveSweet = lazy(() => import('./components/Interactive/InteractiveSweet'));
const IngredientsSection = lazy(() => import('./components/Ingredients/IngredientsSection'));
const TraditionSection = lazy(() => import('./components/Tradition/TraditionSection'));
const ProductShowcase = lazy(() => import('./components/Showcase/ProductShowcase'));
const CustomerReviews = lazy(() => import('./components/Reviews/CustomerReviews'));
const ContactSection = lazy(() => import('./components/Contact/ContactSection'));
const Footer = lazy(() => import('./components/Footer/Footer'));

function ModuleLoader({ label = 'Loading Thenisai...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#120904',
      color: '#d4a843',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: 38,
        height: 38,
        border: '3px solid rgba(212,168,67,0.2)',
        borderTopColor: '#d4a843',
        borderRadius: '50%',
        animation: 'thenisaiSpin 0.8s linear infinite',
        marginBottom: 16
      }} />
      <style>{`@keyframes thenisaiSpin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,248,238,0.75)' }}>{label}</span>
    </div>
  );
}

function DeferredSection({ children, minHeight = 320 }) {
  const ref = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: isNearViewport ? undefined : minHeight }}>
      {isNearViewport && <Suspense fallback={<div className="section-placeholder" />}>{children}</Suspense>}
    </div>
  );
}

function AppContent({ isLoaded, handleLoadComplete }) {
  const { currentView, navigateTo } = useCart();
  const { isAdmin, isCashier, isViewer, logout } = useAuth();
  const [currentHash, setCurrentHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash.toLowerCase() : ''));

  useEffect(() => {
    const handleHash = () => {
      setCurrentHash(window.location.hash.toLowerCase());
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) void import('./components/Billing/BillingCounter');
  }, [isAdmin]);

  // Route to Admin Dashboard UI (Protected)
  if (currentView === 'admin') {
    if (!isAdmin && !isViewer) {
      return (
        <Suspense fallback={<ModuleLoader label="Loading Login..." />}>
          <StaffLoginModal initialRole="admin" onCancel={() => navigateTo('storefront')} />
        </Suspense>
      );
    }

    const isAdminBilling =
      currentHash === '#admin/billing' ||
      currentHash.startsWith('#admin/billing') ||
      currentHash === '#admin/pos' ||
      currentHash.startsWith('#admin/pos');

    if (isAdminBilling) {
      return (
        <Suspense fallback={<ModuleLoader label="Loading POS Billing Counter..." />}>
          {isViewer && <ViewerBanner onLogout={() => { logout(); navigateTo('storefront'); }} />}
          <div style={isViewer ? { marginTop: 38, pointerEvents: 'none', userSelect: 'none' } : undefined}>
            <BillingCounter />
            <InvoiceModal />
          </div>
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<ModuleLoader label="Loading Admin Portal..." />}>
        {isViewer && <ViewerBanner onLogout={() => { logout(); navigateTo('storefront'); }} />}
        <div style={isViewer ? { marginTop: 38, pointerEvents: 'none', userSelect: 'none' } : undefined}>
          <AdminDashboard />
          <InvoiceModal />
        </div>
      </Suspense>
    );
  }

  // Route to In-Store Billing POS Counter UI (Protected - Requires Cashier Login)
  if (currentView === 'billing') {
    if (!isCashier && !isViewer) {
      return (
        <Suspense fallback={<ModuleLoader label="Loading Login..." />}>
          <StaffLoginModal initialRole="cashier" onCancel={() => navigateTo('storefront')} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ModuleLoader label="Loading POS Billing Counter..." />}>
        {isViewer && <ViewerBanner onLogout={() => { logout(); navigateTo('storefront'); }} />}
        <div style={isViewer ? { marginTop: 38, pointerEvents: 'none', userSelect: 'none' } : undefined}>
          <BillingCounter />
          <InvoiceModal />
        </div>
      </Suspense>
    );
  }

  // Default Customer Storefront UI
  return (
    <>
      {/* Loading screen */}
      <LoadingScreen onComplete={handleLoadComplete} />

      {/* Main site */}
      {isLoaded && (
        <div className="site">
          <Navbar />

          <main>
            <HeroSection />

            <DeferredSection><BrandStory /></DeferredSection>
            <DeferredSection><SignaturePalkova /></DeferredSection>
            <DeferredSection minHeight={680}><SweetsCollection /></DeferredSection>
            <DeferredSection><InteractiveSweet /></DeferredSection>
            <DeferredSection><IngredientsSection /></DeferredSection>
            <DeferredSection><TraditionSection /></DeferredSection>
            <DeferredSection><ProductShowcase /></DeferredSection>
            <DeferredSection><CustomerReviews /></DeferredSection>
            <DeferredSection><ContactSection /></DeferredSection>
          </main>

          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
      )}

      {/* Cart Drawer, Wishlist Drawer, Customer Auth & Tax Invoice Portals */}
      <CartDrawer />
      <Suspense fallback={null}>
        <WishlistDrawer />
        <CustomerAuthModal />
        <CheckoutModal />
        <InvoiceModal />
      </Suspense>
    </>
  );
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize smooth scroll
  useLenis();

  // Initialize scroll reveal animations
  useScrollReveal();

  const handleLoadComplete = () => {
    setIsLoaded(true);
    // Allow body scroll after loading
    document.body.style.overflow = '';
  };

  useEffect(() => {
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

    if (isNonStorefront()) {
      document.body.style.overflow = '';
      return;
    }

    // Prevent scroll during loading on storefront only
    if (!isLoaded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const onHashChange = () => {
      if (isNonStorefront()) {
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isLoaded]);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppContent isLoaded={isLoaded} handleLoadComplete={handleLoadComplete} />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
