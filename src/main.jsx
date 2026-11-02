import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './stardust.css'

// Brand Typography: Lato (Sans), Great Vibes (Script), Cormorant Garamond (Serif)
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
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


