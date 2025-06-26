
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedLeafnodeLogo = () => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logoRef.current) return;

    const ctx = gsap.context(() => {
      // Get all elements
      const allLines = logoRef.current?.querySelectorAll('.line');
      const innerCircle = logoRef.current?.querySelector('.inner-circle');
      
      if (!allLines) return;

      // Convert NodeList to Array for easier manipulation
      const lines = Array.from(allLines);

      // Main rotation animation - slower and more elegant
      gsap.to(logoRef.current, {
        rotation: 360,
        duration: 60,
        ease: "none",
        repeat: -1
      });

      // Staggered line animations - each line animates in sequence
      lines.forEach((line, index) => {
        // Individual line rotation with stagger
        gsap.to(line, {
          rotation: 360,
          duration: 30,
          ease: "none",
          repeat: -1,
          delay: index * 0.1
        });

        // Opacity pulse animation with stagger
        gsap.to(line, {
          opacity: 0.3,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.05
        });

        // Scale animation for breathing effect
        gsap.to(line, {
          scaleY: 0.7,
          duration: 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: index * 0.08
        });
      });

      // Inner circle pulsing animation
      if (innerCircle) {
        gsap.to(innerCircle, {
          scale: 1.2,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });

        gsap.to(innerCircle, {
          opacity: 0.6,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }

      // Hover effects
      const handleMouseEnter = () => {
        gsap.to(lines, {
          scaleY: 1.3,
          opacity: 0.9,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.02
        });

        if (innerCircle) {
          gsap.to(innerCircle, {
            scale: 1.5,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out"
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(lines, {
          scaleY: 1,
          opacity: 0.7,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.02
        });

        if (innerCircle) {
          gsap.to(innerCircle, {
            scale: 1,
            opacity: 0.8,
            duration: 0.6,
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

  // Generate lines arranged in a circle (like Optikka's radial design)
  const generateLines = () => {
    const lines = [];
    const totalLines = 36; // More lines for denser pattern
    
    for (let i = 0; i < totalLines; i++) {
      const angle = (i * 360) / totalLines;
      const length = 18 + (i % 3) * 4; // Varying line lengths
      const opacity = 0.4 + (i % 4) * 0.15; // Varying opacity
      
      lines.push(
        <line
          key={i}
          className="line"
          x1="32"
          y1="32"
          x2="32"
          y2={32 - length}
          stroke="url(#leafnodeGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={opacity}
          transform={`rotate(${angle} 32 32)`}
        />
      );
    }
    return lines;
  };

  return (
    <div 
      ref={logoRef}
      className="w-16 h-16 flex items-center justify-center cursor-pointer"
    >
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 64 64" 
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="leafnodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" opacity="0.9" />
            <stop offset="70%" stopColor="#3b82f6" opacity="0.7" />
            <stop offset="100%" stopColor="#1e40af" opacity="0.5" />
          </radialGradient>
        </defs>
        
        {/* Radial lines */}
        {generateLines()}
        
        {/* Inner circle */}
        <circle
          className="inner-circle"
          cx="32"
          cy="32"
          r="6"
          fill="url(#centerGradient)"
          opacity="0.8"
        />
        
        {/* Center dot */}
        <circle
          cx="32"
          cy="32"
          r="2"
          fill="#06b6d4"
          opacity="1"
        />
      </svg>
    </div>
  );
};

export default AnimatedLeafnodeLogo;
