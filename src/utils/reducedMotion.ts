// Detect user's motion preferences
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

// Create a CSS class helper
export function getMotionClass(animatedClass: string, staticClass: string = ''): string {
  return prefersReducedMotion() ? staticClass : animatedClass;
}

// Disable GSAP animations if reduced motion is preferred
export function configureGSAPForReducedMotion() {
  if (typeof window === 'undefined') return;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const updateGSAP = () => {
    if (mediaQuery.matches && window.gsap) {
      // Disable all GSAP animations
      window.gsap.globalTimeline.pause();
      window.gsap.set('*', { clearProps: 'all' });
    }
  };
  
  // Check on load
  updateGSAP();
  
  // Listen for changes
  mediaQuery.addEventListener('change', updateGSAP);
  
  return () => mediaQuery.removeEventListener('change', updateGSAP);
}

// React hook for reduced motion
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setReducedMotion(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return reducedMotion;
}

// CSS variables for reduced motion
export function applyReducedMotionCSS() {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}
