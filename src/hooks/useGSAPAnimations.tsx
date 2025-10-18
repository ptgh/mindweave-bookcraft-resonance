import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useGSAPAnimations = () => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const featureBlocksRef = useRef<HTMLDivElement[]>([]);
  const isAnimationEnabled = useRef(true);

  // Function to add feature block refs
  const addFeatureBlockRef = (el: HTMLDivElement | null) => {
    if (el && !featureBlocksRef.current.includes(el)) {
      featureBlocksRef.current.push(el);
    }
  };

  useEffect(() => {
    // Skip animations on slow connections or low-end devices
    if (typeof window === 'undefined' || !gsap) return;
    
    // Check for slow connection or reduced motion preference
    const connection = (navigator as any).connection;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    if (prefersReducedMotion || isSlowConnection) {
      isAnimationEnabled.current = false;
      return;
    }

    // Defer animations to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // 1. Faster page load animation
        if (mainContainerRef.current) {
          gsap.from(mainContainerRef.current, {
            opacity: 0,
            y: 10,
            duration: 0.6,
            ease: "power2.out"
          });
        }

        // 2. Faster hero title animation
        if (heroTitleRef.current) {
          gsap.from(heroTitleRef.current, {
            scale: 0.95,
            opacity: 0,
            duration: 0.5,
            delay: 0.1,
            ease: "power2.out"
          });
        }

        // 3. Faster feature sections with reduced delays
        featureBlocksRef.current.forEach((block, index) => {
          if (block) {
            // Ensure block is visible by default (fallback)
            gsap.set(block, { opacity: 1, y: 0 });
            
            // Only animate on larger screens to avoid mobile issues
            if (window.innerWidth >= 768) {
              gsap.from(block, {
                y: 20,
                opacity: 0,
                duration: 0.4,
                delay: index * 0.05,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: block,
                  start: "top 95%",
                  end: "bottom 5%",
                  toggleActions: "play none none reverse",
                  once: false
                }
              });
            }
          }
        });

        // 4. Simplified button hover effects (only for desktop)
        if (window.matchMedia('(hover: hover)').matches) {
          const standardButtons = document.querySelectorAll('button, [role="button"]');
          standardButtons.forEach((button) => {
            const buttonEl = button as HTMLElement;
            
            const handleMouseEnter = () => {
              gsap.to(buttonEl, {
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out"
              });
            };

            const handleMouseLeave = () => {
              gsap.to(buttonEl, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
              });
            };

            buttonEl.addEventListener('mouseenter', handleMouseEnter);
            buttonEl.addEventListener('mouseleave', handleMouseLeave);
          });
        }

      });

      return () => {
        ctx.revert();
        if (ScrollTrigger) {
          ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        }
      };
    }, 50); // Defer by 50ms to allow initial render

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    mainContainerRef,
    heroTitleRef,
    addFeatureBlockRef
  };
};