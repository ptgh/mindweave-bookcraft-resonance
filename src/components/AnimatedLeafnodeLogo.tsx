
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedLeafnodeLogo = () => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logoRef.current) return;

    const ctx = gsap.context(() => {
      // Get all ring elements
      const rings = logoRef.current?.querySelectorAll('.ring');
      const outerRing = logoRef.current?.querySelector('.outer-ring');
      
      if (!rings) return;

      // Continuous rotation for the entire logo
      gsap.to(logoRef.current, {
        rotation: 360,
        duration: 40,
        ease: "none",
        repeat: -1
      });

      // Pulsation animation for each ring with stagger
      rings.forEach((ring, index) => {
        gsap.to(ring, {
          scale: 1.1,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.3 // Stagger the start times
        });
      });

      // Hover ripple effect
      const handleMouseEnter = () => {
        if (outerRing) {
          gsap.to(outerRing, {
            scale: 1.3,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
          });
        }
      };

      const handleMouseLeave = () => {
        if (outerRing) {
          gsap.to(outerRing, {
            scale: 1,
            opacity: 0.3,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      };

      logoRef.current?.addEventListener('mouseenter', handleMouseEnter);
      logoRef.current?.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        logoRef.current?.removeEventListener('mouseenter', handleMouseEnter);
        logoRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, logoRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={logoRef}
      id="leafnode-logo" 
      className="w-16 h-16 flex items-center justify-center cursor-pointer"
    >
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 64 64" 
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="cyanBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Outer ring */}
        <circle
          className="ring outer-ring"
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="url(#cyanBlueGradient)"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.3"
        />
        
        {/* Middle ring */}
        <circle
          className="ring"
          cx="32"
          cy="32"
          r="20"
          fill="none"
          stroke="url(#cyanBlueGradient)"
          strokeWidth="1.5"
          opacity="0.5"
        />
        
        {/* Inner ring */}
        <circle
          className="ring"
          cx="32"
          cy="32"
          r="12"
          fill="none"
          stroke="url(#cyanBlueGradient)"
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Center dot */}
        <circle
          className="ring"
          cx="32"
          cy="32"
          r="6"
          fill="url(#cyanBlueGradient)"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};

export default AnimatedLeafnodeLogo;
