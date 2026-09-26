import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Self-hosted fonts — optimized to core required weights for fast critical path render
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/plus-jakarta-sans/600.css'

import { Provider } from 'react-redux';
import { store } from './store';

// Global fallbacks for payment metrics to prevent legacy cached bundle reference errors
if (typeof window !== 'undefined') {
  window.totalCardRevenue = 0;
  window.totalCashRevenue = 0;
  window.totalUpiRevenue = 0;
}

const root = createRoot(document.getElementById('root'));

// StrictMode in dev only — it double-renders every component which makes
// routing feel 2x slower in development. Production runs single-render.
const AppTree = (
  <Provider store={store}>
    <App />
  </Provider>
);

root.render(
  import.meta.env.DEV ? <StrictMode>{AppTree}</StrictMode> : AppTree
);


