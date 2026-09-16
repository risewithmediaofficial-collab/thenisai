import { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';
import './App.css';

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

function AppContent({ isLoaded, handleLoadComplete }) {
  const { currentView, navigateTo } = useCart();
  const { isAdmin, isCashier } = useAuth();

  // Route to Admin Dashboard UI (Protected)
  if (currentView === 'admin') {
    if (!isAdmin) {
      return (
        <Suspense fallback={<ModuleLoader label="Loading Login..." />}>
          <StaffLoginModal initialRole="admin" onCancel={() => navigateTo('storefront')} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ModuleLoader label="Loading Admin Portal..." />}>
        <AdminDashboard />
        <InvoiceModal />
      </Suspense>
    );
  }

  // Route to In-Store Billing POS Counter UI (Protected)
  if (currentView === 'billing') {
    if (!isCashier) {
      return (
        <Suspense fallback={<ModuleLoader label="Loading Login..." />}>
          <StaffLoginModal initialRole="cashier" onCancel={() => navigateTo('storefront')} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ModuleLoader label="Loading POS Billing Counter..." />}>
        <BillingCounter />
        <InvoiceModal />
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

            <Suspense fallback={<div className="section-placeholder" />}>
              <BrandStory />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <SignaturePalkova />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <SweetsCollection />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <InteractiveSweet />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <IngredientsSection />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <TraditionSection />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <ProductShowcase />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <CustomerReviews />
            </Suspense>

            <Suspense fallback={<div className="section-placeholder" />}>
              <ContactSection />
            </Suspense>
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
      return hash.startsWith('#admin') || hash.startsWith('#billing') || path.endsWith('/admin') || path.endsWith('/billing');
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
