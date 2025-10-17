import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/prefetch'
import './services/manualEnrichmentService'
import { enableIOSScrollFix, ensureTouchTargets } from './utils/accessibility'
import { reportWebVitals } from './utils/webVitals'
import { applyReducedMotionCSS, configureGSAPForReducedMotion } from './utils/reducedMotion'
import { analytics } from './utils/analytics'

// Apply iOS accessibility fixes on load
enableIOSScrollFix();

// Apply reduced motion CSS
applyReducedMotionCSS();

// Configure GSAP for reduced motion
configureGSAPForReducedMotion();

// Track initial page load
analytics.page('App Load', {
  userAgent: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
});

// Optimize performance on load
const container = document.getElementById("root")!;
const root = createRoot(container);

// Use concurrent features for better loading
root.render(<App />);

// Ensure proper touch targets after initial render
setTimeout(() => {
  ensureTouchTargets();
}, 100);

// Initialize Web Vitals monitoring
reportWebVitals();
