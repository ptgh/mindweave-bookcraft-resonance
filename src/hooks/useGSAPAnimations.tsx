
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
      // 1. Page load animation - Fade in main container with elegant easing
      if (mainContainerRef.current) {
        gsap.from(mainContainerRef.current, {
          opacity: 0,
          y: 20,
          duration: 1.4,
          ease: "power3.out"
        });
      }

      // 2. Hero title - Scale and fade in with sophisticated timing
      if (heroTitleRef.current) {
        gsap.from(heroTitleRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 1.2,
          delay: 0.2,
          ease: "power3.out"
        });
      }

      // 3. Feature sections - Staggered reveal with smooth easing
      featureBlocksRef.current.forEach((block, index) => {
        if (block) {
          gsap.from(block, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            delay: index * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: block,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          });
        }
      });

      // 4. Enhanced standardized button hover effects
      const standardButtons = document.querySelectorAll('button[class*="border-[rgba(255,255,255,0.15)]"], .cta-button, button, [role="button"]');
      standardButtons.forEach((button) => {
        const buttonEl = button as HTMLElement;
        
        // Mouse enter - elegant glow and scale effect
        const handleMouseEnter = () => {
          gsap.to(buttonEl, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "0 0 20px rgba(137, 180, 250, 0.4)"
          });
        };

        // Mouse leave - smooth return
        const handleMouseLeave = () => {
          gsap.to(buttonEl, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "0 0 0 rgba(137, 180, 250, 0)"
          });
        };

        // Click animation - subtle press effect
        const handleClick = () => {
          gsap.to(buttonEl, {
            scale: 0.98,
            duration: 0.1,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
          });
        };

        buttonEl.addEventListener('mouseenter', handleMouseEnter);
        buttonEl.addEventListener('mouseleave', handleMouseLeave);
        buttonEl.addEventListener('click', handleClick);
      });

      // 5. Card hover animations for enhanced interactivity
      const cards = document.querySelectorAll('[class*="hover:bg-slate-800"]');
      cards.forEach((card) => {
        const cardEl = card as HTMLElement;
        
        const handleCardEnter = () => {
          gsap.to(cardEl, {
            y: -4,
            duration: 0.4,
            ease: "power2.out"
          });
        };

        const handleCardLeave = () => {
          gsap.to(cardEl, {
            y: 0,
            duration: 0.4,
            ease: "power2.out"
          });
        };

        cardEl.addEventListener('mouseenter', handleCardEnter);
        cardEl.addEventListener('mouseleave', handleCardLeave);
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
