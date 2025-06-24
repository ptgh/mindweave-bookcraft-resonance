
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

  // Function to add feature block refs
  const addFeatureBlockRef = (el: HTMLDivElement | null) => {
    if (el && !featureBlocksRef.current.includes(el)) {
      featureBlocksRef.current.push(el);
    }
  };

  useEffect(() => {
    // Only run animations if gsap is available
    if (typeof window === 'undefined' || !gsap) return;

    const ctx = gsap.context(() => {
      // 1. Page load animation - Fade in main container softly over 1.2 seconds
      if (mainContainerRef.current) {
        gsap.from(mainContainerRef.current, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.out"
        });
      }

      // 2. Hero title - Slide in from top with slight easing
      if (heroTitleRef.current) {
        gsap.from(heroTitleRef.current, {
          y: -50,
          opacity: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power2.out"
        });
      }

      // 3. Feature sections - Animate into view with ScrollTrigger
      featureBlocksRef.current.forEach((block, index) => {
        if (block) {
          gsap.from(block, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.1, // Stagger animation
            ease: "power2.out",
            scrollTrigger: {
              trigger: block,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          });
        }
      });

      // 4. Button hover effects - Scale up and soft glow
      const buttons = document.querySelectorAll('.cta-button, button, [role="button"]');
      buttons.forEach((button) => {
        const buttonEl = button as HTMLElement;
        
        // Mouse enter - scale up with glow
        const handleMouseEnter = () => {
          gsap.to(buttonEl, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
          });
        };

        // Mouse leave - return to normal
        const handleMouseLeave = () => {
          gsap.to(buttonEl, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "0 0 0 rgba(59, 130, 246, 0)"
          });
        };

        buttonEl.addEventListener('mouseenter', handleMouseEnter);
        buttonEl.addEventListener('mouseleave', handleMouseLeave);
      });

    });

    // Cleanup function
    return () => {
      ctx.revert();
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    };
  }, []);

  return {
    mainContainerRef,
    heroTitleRef,
    addFeatureBlockRef
  };
};
