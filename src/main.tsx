import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/prefetch'
import './services/manualEnrichmentService'
import { enableIOSScrollFix, ensureTouchTargets } from './utils/accessibility'
import { reportWebVitals } from './utils/webVitals'

// Apply iOS accessibility fixes on load
enableIOSScrollFix();

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
