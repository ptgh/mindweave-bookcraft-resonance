
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface GSAPPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const GSAPPagination = ({ currentPage, totalPages, onPageChange }: GSAPPaginationProps) => {
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: "power2.out"
      });
    }

    // Setup hover animations for buttons
    const buttons = [prevButtonRef.current, nextButtonRef.current].filter(Boolean);
    
    buttons.forEach((button) => {
      if (button && !button.disabled) {
        const handleMouseEnter = () => {
          gsap.to(button, {
            scale: 1.1,
            duration: 0.3,
            ease: "power2.out"
          });
        };

        const handleMouseLeave = () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        };

        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);

        // Store cleanup function
        (button as any)._gsapCleanup = () => {
          button.removeEventListener('mouseenter', handleMouseEnter);
          button.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    });

    return () => {
      buttons.forEach((button) => {
        if (button && (button as any)._gsapCleanup) {
          (button as any)._gsapCleanup();
        }
      });
    };
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div ref={containerRef} className="mt-4 flex items-center justify-center space-x-4">
      <button
        ref={prevButtonRef}
        onClick={handlePrevious}
        disabled={currentPage === 0}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 touch-manipulation ${
          currentPage === 0 
            ? 'text-slate-600 cursor-not-allowed opacity-50' 
            : 'text-cyan-400 hover:text-cyan-300'
        }`}
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>
      
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-slate-400 text-sm font-medium">
          {currentPage + 1} of {totalPages}
        </span>
        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
      </div>
      
      <button
        ref={nextButtonRef}
        onClick={handleNext}
        disabled={currentPage === totalPages - 1}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 touch-manipulation ${
          currentPage === totalPages - 1 
            ? 'text-slate-600 cursor-not-allowed opacity-50' 
            : 'text-cyan-400 hover:text-cyan-300'
        }`}
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>
    </div>
  );
};

export default GSAPPagination;
