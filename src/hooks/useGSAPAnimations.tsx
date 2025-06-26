
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export const useGSAPAnimations = () => {
  const mainContainerRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const addFeatureBlockRef = (element: HTMLDivElement | null) => {
    if (element && !element.classList.contains('animated')) {
      element.classList.add('animated');
      
      gsap.fromTo(element, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true
          }
        }
      );
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero title animation
      if (heroTitleRef.current) {
        gsap.fromTo(heroTitleRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.3 }
        );
      }

      // Animate hero dots with GSAP
      const heroDots = document.querySelectorAll('.hero-dot');
      heroDots.forEach((dot, index) => {
        gsap.to(dot, {
          scale: 1.2,
          opacity: 0.7,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.5
        });
      });

      // Animate feature card icons
      const featureIcons = document.querySelectorAll('.feature-icon');
      featureIcons.forEach((icon) => {
        // Idle floating animation
        gsap.to(icon, {
          y: -5,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });

        // Hover animations
        const parent = icon.closest('.feature-link');
        if (parent) {
          parent.addEventListener('mouseenter', () => {
            gsap.to(icon, {
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            });
          });

          parent.addEventListener('mouseleave', () => {
            gsap.to(icon, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          });
        }
      });

      // Animate status indicator dots
      const statusDots = document.querySelectorAll('.status-dot');
      statusDots.forEach((dot, index) => {
        gsap.to(dot, {
          scale: 1.3,
          opacity: 0.8,
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.3
        });
      });

    }, mainContainerRef);

    return () => ctx.revert();
  }, []);

  return {
    mainContainerRef,
    heroTitleRef,
    addFeatureBlockRef
  };
};
