import { useState, useEffect, Suspense, lazy } from 'react';
import './index.css';
import './App.css';

import LoadingScreen from './components/Loader/LoadingScreen';
import Navbar from './components/Nav/Navbar';
import HeroSection from './components/Hero/HeroSection';
import { useLenis } from './hooks/useLenis';
import { useScrollReveal } from './hooks/useAnimations';

// Lazy load heavy sections
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
    // Prevent scroll during loading
    if (!isLoaded) {
      document.body.style.overflow = 'hidden';
    }
  }, [isLoaded]);

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
    </>
  );
}

export default App;
