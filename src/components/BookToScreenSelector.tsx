import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Film, Sparkles, FileText } from 'lucide-react';

export type FilterMode = 'all' | 'has_script';

interface BookToScreenSelectorProps {
  selected: FilterMode;
  onSelect: (mode: FilterMode) => void;
  onAIScan: () => void;
  isAILoading?: boolean;
  className?: string;
}

export const BookToScreenSelector: React.FC<BookToScreenSelectorProps> = ({
  selected,
  onSelect,
  onAIScan,
  isAILoading = false,
  className = '',
}) => {
  const scanButtonRef = useRef<HTMLButtonElement>(null);
  const scanTextRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // GSAP scanning animation when AI is loading
  useEffect(() => {
    if (isAILoading && scanButtonRef.current) {
      // Create pulsing glow effect on button
      animationRef.current = gsap.timeline({ repeat: -1 });
      
      animationRef.current
        .to(scanButtonRef.current, {
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)',
          duration: 0.6,
          ease: 'power2.inOut',
        })
        .to(scanButtonRef.current, {
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.1)',
          duration: 0.6,
          ease: 'power2.inOut',
        });

      // Animate scanning dots
      if (dotsRef.current) {
        gsap.to(dotsRef.current, {
          opacity: 1,
          duration: 0.3,
        });
        
        const dotAnimation = gsap.timeline({ repeat: -1 });
        dotAnimation
          .to(dotsRef.current, { text: '.', duration: 0.3, ease: 'none' })
          .to(dotsRef.current, { text: '..', duration: 0.3, ease: 'none' })
          .to(dotsRef.current, { text: '...', duration: 0.3, ease: 'none' })
          .to(dotsRef.current, { text: '', duration: 0.3, ease: 'none' });
      }

    } else {
      // Cleanup animation
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      if (scanButtonRef.current) {
        gsap.set(scanButtonRef.current, { boxShadow: 'none' });
      }
      if (dotsRef.current) {
        gsap.set(dotsRef.current, { opacity: 0 });
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [isAILoading]);

  return (
    <div className={`flex items-center gap-3 flex-wrap justify-center ${className}`}>
      {/* All Films toggle */}
      <div className="inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        <button
          onClick={() => onSelect('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            selected === 'all'
              ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          All Films
        </button>
      </div>

      {/* Has Script filter */}
      <div className="inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        <button
          onClick={() => onSelect('has_script')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            selected === 'has_script'
              ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Has Script
        </button>
      </div>

      {/* AI Scan Button with GSAP animation */}
      <div className="inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        <button
          ref={scanButtonRef}
          onClick={onAIScan}
          disabled={isAILoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 hover:text-violet-200 transition-all disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAILoading ? 'animate-pulse' : ''}`} />
          <span ref={scanTextRef}>
            {isAILoading ? 'Scanning' : 'AI Scan'}
          </span>
          <span 
            ref={dotsRef} 
            className="w-4 text-left opacity-0"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
};

export default BookToScreenSelector;
