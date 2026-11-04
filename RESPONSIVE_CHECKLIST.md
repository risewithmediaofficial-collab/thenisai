# Project-Wide Responsive Checklist: Thenisai Sweets

This inventory covers every route, page, subtab, shared layout, and modal component across the entire Thenisai Sweets platform for all target viewports:
- **320px** (Ultra-compact mobile: iPhone SE 1st gen, small Androids)
- **375px** (Compact mobile: iPhone SE 2nd/3rd gen, iPhone mini)
- **390px** (Standard mobile: iPhone 12/13/14/15/16, modern Android flagships)
- **768px** (Tablet portrait: iPad mini, iPad 9th/10th gen)
- **1024px** (Tablet landscape / compact laptops: iPad Pro, MacBook Air)
- **1440px** (Desktop widescreen & POS counter monitors)

## Summary of Core Architecture Enhancements Applied
1. **Global Viewport & Touch Optimization:**
   - Added `-webkit-tap-highlight-color: transparent` and `-webkit-text-size-adjust: 100%` on `html`.
   - Bound safe-area insets (`--sat`, `--sab`, `--sal`, `--sar`) to `:root` for edge-to-edge iOS and Android gesture-bar support.
   - Enforced `font-size: 16px !important;` on all input, select, and textarea fields for screens `<= 768px` / `@media (pointer: coarse)` to prevent iOS Safari auto-zoom from breaking layouts.
   - Enforced `touch-action: manipulation;` on all buttons, links, inputs, and interactive controls to eliminate the 300ms tap delay.
   - Guarded all images, videos, canvas, and svg tags with `max-width: 100%; height: auto;`.
2. **Customer Pre-Order Menu Fixes:**
   - **Removed `display: none !important;` on prices**: restored prices (`.menu-list-price-wrap`, `.price-display-wrap`) so users always see sweet prices before ordering on mobile.
   - Applied `calc(12px + var(--sab, env(safe-area-inset-bottom, 0px)))` to `.mobile-floating-tray-bar` so it stays above system home indicators.
   - Enabled `90dvh` and `overscroll-behavior: contain` on `.preorder-modal-card` and `.preorder-success-card`.
3. **Contact & Story Pages:**
   - Replaced fixed two-column grid inline styles with `.stardust-form-row-2col` reflowing to 1 column on `< 560px`.
   - Prevented oversized padding in `.stardust-card` on mobile (`padding: clamp(18px, 4vw, 32px)`).
   - Wrapped action buttons (`flex-wrap: wrap`) to prevent overflowing narrow phone viewports.
4. **POS Billing Counter:**
   - Guarded desktop resize column split with `window.innerWidth >= 1024` so desktop minmax width never leaks into mobile/tablet flex mode.
   - Preserved `pos-mobile-strip` and tab toggle (`catalog` vs `bill`) with responsive steppers and quick payment chips.
5. **Modals & Drawers:**
   - Standardized `StaffLoginModal` with responsive padding (`px-4 sm:px-7 pt-6 sm:pt-8 pb-5 sm:pb-6`) and `EditBillModal` with `< 480px` rules.
   - Upgraded mobile hamburger and sidebar close buttons to conform to >= 44x44px touch targets.
   - Contained all data tables with `overflow-x: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;`.

---

## Inventory & Status Matrix

| Path / Route | Page / Component | Responsive Audit & Issues Addressed | Fix Status | Verification Status |
|---|---|---|---|---|
| `*` (Global) | **Root Viewport & Document Layer** (`index.html`, `src/index.css`) | Touch target sizing, `-webkit-tap-highlight-color`, input auto-zoom (<16px on iOS), safe-area insets (`env(safe-area-inset-*)`), horizontal overflow guards | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Storefront Navigation** (`Navbar.jsx`) | Desktop menu vs mobile hamburger drawer, logo scaling, safe-area top padding, touch targets >=44px, sticky header backdrop | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Hero Section** (`HeroSection.jsx`) | Title typography wrapping on 320px-390px, hero badge scaling, CTAs stack on narrow screens, hero image aspect ratio | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Top Bar Banner** (`PreOrderTopBar.jsx`) | Scrolling text / badge wrapping on 320px, close button touch target, safe-area alignment | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Floating Pre-Order Widget** (`PreOrderAlert.jsx`) | Floating bottom pill placement, modal dialog scaling on 320px-390px, mobile safe-area bottom offset | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Sweets Collection** (`SweetsCollection.jsx`) | Category filter chip overflow-x scroll, product grid column counts (1 col on <=480px, 2 col on 768px, 4 col on desktop), card action buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Stats Banner** (`StatsBanner.jsx`) | 4-column metric grid reflows to 2x2 on tablet and stacked 1-col on <=375px, number truncation prevention | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Values Section** (`ValuesSection.jsx`) | 3-column value cards wrap cleanly to 1-column on mobile, icon & typography scaling | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Customer Reviews** (`CustomerReviews.jsx`) | Review cards layout, testimonial carousel/grid wrapping without horizontal page blowout | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Newsletter & Sweet Circle** (`SweetCircleSection.jsx`) | Email input + submit button inline form stacks on 320px-420px, full-width button | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `/` or `#storefront` | **Footer** (`Footer.jsx`) | 4-column link grid stacks to 1-column on mobile, contact links and copyright text wrapping | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#menu` | **Customer Pre-Order Menu Page** (`CustomerMenuPage.jsx`) | Sticky category navigation pills, sweets product cards, portion selector buttons, mobile floating cart bar, search input font-size >=16px | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#menu` | **Customer Pre-Order Checkout Modal** (`CustomerMenuPage.jsx`) | Bottom sheet on mobile (100dvh max height, internal scroll, pinned checkout button with safe-area-inset-bottom), form fields stack | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#menu` | **Customer Pre-Order Confirmation Modal** (`CustomerMenuPage.jsx`) | Order placed celebration popup, order token display, copy & WhatsApp buttons on 320px | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#story` | **Our Story & Heritage Page** (`StoryPage.jsx`) | Hero banner, story narrative cards, historical timeline reflow on mobile, imagery scaling | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#contact` | **Visit & Contact Page** (`ContactPage.jsx`) | Highway directions, Google Map embed container scaling (100% width, no fixed iframe width), contact form inputs stack | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing` | **POS Billing Counter Shell** (`BillingCounter.jsx`) | Desktop side layout vs mobile view (`isMobileView`), header bar actions, mobile tabs toggle (`catalog` vs `bill`), no document overflow | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing` (POS) | **POS Catalog & Search** (`BillingCounter.jsx`) | Category pill scrollbar, catalog product tiles touch targets, barcode/search input (16px font to prevent zoom), quick category filters | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing` (POS) | **POS Active Bill Sheet** (`BillingCounter.jsx`) | Bill items list, quantity stepper buttons (min 44px touch target), rate & amount text, quick cash suggestions, settlement modal | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing` (POS) | **Customer Phone Suggestion Dropdown** (`BillingCounter.jsx`) | Dropdown positioned properly above or below input, prevents viewport overflow, tap-friendly customer cards | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing/preorders` | **Customer Pre-Orders Queue** (`BillingCounter.jsx`) | KPI metric cards wrap (2x2 on mobile, 4x1 on desktop), order cards with items, buttons stack on narrow screens, search bar full width | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing/daily-sales` | **Shift Invoices & Daily Sales** (`BillingCounter.jsx`) | Revenue breakdown KPI strip, shift bills table / card presentation on mobile, search & payment filters wrapping | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing/inventory` | **Counter Stock Availability** (`BillingCounter.jsx`) | Product stock list, active/inactive toggle switch touch size, refill button, search and category filters | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#billing/expenses` | **Counter Daily Expenses** (`BillingCounter.jsx`) | Expense entry form, category selector, daily expenses table/list with delete action | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin` | **Admin Portal Layout & Sidebar** (`AdminDashboard.jsx`, `SideNavbar.jsx`) | Responsive collapsible side navigation (`SideNavbar`), mobile hamburger drawer, backdrop overlay, header ops bar | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/inventory` | **Admin Master Inventory** (`AdminDashboard.jsx`) | Inventory cards grid, category chips, master price inputs, inline Add Product panel, bulk actions | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/sales` | **Admin Sales & Ledger** (`AdminDashboard.jsx`) | Date range filter buttons wrap, summary cards (Total, Cash, UPI, Card), ledger table with contained horizontal scroll on mobile | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/shift-bills` | **Admin Shift Revenue Breakdown** (`AdminDashboard.jsx`) | Cashier sales breakdown cards, shift invoices list, tax invoice action buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/company-stock` | **Admin Godown & Stock Transfer** (`AdminDashboard.jsx`) | Inward stock cards, stock transfer logs table, dispatch and return buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/activity-logs` | **Admin Audit Trail Logs** (`AdminDashboard.jsx`) | Activity filters, audit timeline table/list with contained scroll, timestamp and staff details formatting | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/recycle-bin` | **Admin 30-Day Recycle Bin** (`AdminDashboard.jsx`) | Deleted bills & products tab switcher, bulk select checkboxes, restore & permanent delete action bar | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/staff` | **Admin Staff Accounts Management** (`StaffManagement.jsx`) | Staff role cards, add staff form, pin/credential management on mobile | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#admin/expenses` | **Admin Comprehensive Expenses** (`ExpensesPage.jsx`) | Monthly expense metrics, expense category breakdown, expense entry modal/table | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| `#manager` | **Company Manager Godown Portal** (`CompanyManagerDashboard.jsx`) | Godown stock management dashboard, stock inward form, dispatch to counter, transfer logs | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Modal | **Staff Login Modal** (`StaffLoginModal.jsx`) | Centered modal on desktop, bottom sheet / full-width card on mobile (<=480px), PIN & role selector buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Modal | **Invoice & Receipt Modal** (`InvoiceModal.jsx`) | Thermal receipt preview, TVSE printer preview, action buttons (Print, Download PDF, WhatsApp, Close), mobile landscape support | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Modal | **Online Checkout Modal** (`CheckoutModal.jsx`) | Shipping address form, payment options, order summary on mobile | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Drawer | **Wishlist Drawer** (`WishlistDrawer.jsx`) | Slide-over drawer, max width on desktop, 100vw on mobile, items list, add-to-cart actions | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Modal | **Customer Auth Modal** (`CustomerAuthModal.jsx`) | Mobile phone & OTP entry dialog, touch buttons, keyboard-friendly layout | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **Add Stock / Refill Modal** (`AddStockModal.jsx`, `RefillStockModal.jsx`) | Stock amount input, unit selector, supplier/batch notes, touch submit buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **Stock Details Modal** (`StockDetailsModal.jsx`) | Item analytics, inward vs outward history, stock threshold configuration | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **Dispatch & Return Stock Modals** (`DispatchStockModal.jsx`, `ReturnStockModal.jsx`) | Transfer quantity stepper, godown vs counter balance, reason input | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **GST & Tax Settings Modal** (`GstSettingsModal.jsx`) | GSTIN input, tax rates selector, toggle switches on mobile | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **Catalog & Unit Settings Modal** (`CatalogSettingsModal.jsx`) | Custom category & custom unit creation forms, category list with delete buttons | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Admin Modal | **Reset Bill Sequence Modal** (`ResetBillSequenceModal.jsx`) | Sequence reset confirmation warning dialog, PIN confirmation input | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Billing Modal | **Delete Bill Prompt Modal** (`DeleteBillModal.jsx`) | Deletion reason selector chips, staff authorization PIN input | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Billing Modal | **Edit Bill Modal** (`EditBillModal.jsx`) | Existing bill items table, quantity adjustment, recalculation preview | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Overlay | **Loading Screen** (`LoadingScreen.jsx`) | Centered branding spinner, scales on all viewports without scrollbars | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Status | **Redux Status Bar & Toasts** (`POSReduxStatusBar.jsx`, `ReduxToast.jsx`) | Fixed bottom toast notifications, mobile safe-area padding, swipe/tap to dismiss | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
| Global Banner | **Sandbox Mode Banner** (`App.jsx`) | Sticky top test banner, text wrapping on 320px, exit button positioning | Complete | Passed (320, 375, 390, 768, 1024, 1440) |
