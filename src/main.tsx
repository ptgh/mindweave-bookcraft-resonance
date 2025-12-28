import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/prefetch'
import './services/manualEnrichmentService'
import { enableIOSScrollFix, ensureTouchTargets } from './utils/accessibility'
import { reportWebVitals } from './utils/webVitals'
import { applyReducedMotionCSS, configureGSAPForReducedMotion } from './utils/reducedMotion'
import { analytics } from './utils/analytics'
import { setupAppUpdateRecovery } from './utils/appUpdateRecovery'
import { setupRuntimeDiagnostics } from './utils/runtimeDiagnostics'

// Recover from stale-cache / chunk-load failures after deploys (common on Safari)
setupAppUpdateRecovery();

// Capture runtime error details (for diagnosing ErrorBoundary crashes)
setupRuntimeDiagnostics();

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
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ensure proper touch targets after initial render
setTimeout(() => {
  ensureTouchTargets();
}, 100);

// Initialize Web Vitals monitoring
reportWebVitals();
