import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generate .gz files at build time — nginx serves them via gzip_static on
    viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    // Also generate .br (brotli) for modern browsers
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
  ],
  server: {
    host: '0.0.0.0',
    port: 92,
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 92,
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Target modern browsers for better tree-shaking
    target: 'es2020',
    // Raise chunk warning threshold — billing/admin are intentionally large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Granular manual chunk splitting for optimal parallel loading
        manualChunks(id) {
          // ── Node modules ──────────────────────────────────────────────────
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'vendor-animation';
            }
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            if (id.includes('@fontsource')) {
              return 'vendor-fonts';
            }
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'vendor-redux';
            }
            return 'vendor-libs';
          }

          // ── App modules ───────────────────────────────────────────────────
          // Heavy admin dashboard & reports → own chunk
          if (
            id.includes('AdminDashboard') ||
            id.includes('DailyRevenueReport') ||
            id.includes('StaffManagement') ||
            id.includes('CompanyManagerDashboard')
          ) {
            return 'chunk-admin';
          }

          // Billing POS counter → own chunk (largest component)
          if (id.includes('BillingCounter')) {
            return 'chunk-billing';
          }

          // Expenses, Inventory, CatalogSettings grouped together
          if (
            id.includes('ExpensesPage') ||
            id.includes('CatalogSettingsModal') ||
            id.includes('EditBillModal') ||
            id.includes('SideNavbar')
          ) {
            return 'chunk-billing-ui';
          }

          // Invoice, Checkout modals → together (opened together always)
          if (id.includes('InvoiceModal') || id.includes('CheckoutModal')) {
            return 'chunk-invoices';
          }

          // Auth modals
          if (id.includes('StaffLoginModal') || id.includes('CustomerAuthModal')) {
            return 'chunk-auth';
          }

          // Customer menu / wishlist
          if (
            id.includes('CustomerMenuPage') ||
            id.includes('WishlistDrawer') ||
            id.includes('WishlistContext')
          ) {
            return 'chunk-menu';
          }

          // Storefront sections (lazy deferred)
          if (
            id.includes('BrandStory') ||
            id.includes('SignaturePalkova') ||
            id.includes('SweetsCollection') ||
            id.includes('InteractiveSweet') ||
            id.includes('IngredientsSection') ||
            id.includes('TraditionSection') ||
            id.includes('ProductShowcase') ||
            id.includes('CustomerReviews') ||
            id.includes('ContactSection')
          ) {
            return 'chunk-storefront';
          }
        },
      },
    },
  },
})
