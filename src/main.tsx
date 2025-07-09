import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/prefetch'

// Optimize performance on load
const container = document.getElementById("root")!;
const root = createRoot(container);

// Use concurrent features for better loading
root.render(<App />);
