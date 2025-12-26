import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Film, Sparkles } from 'lucide-react';

export type FilterMode = 'all' | 'criterion' | 'arrow';

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
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const indicatorRef = useRef<HTMLDivElement>(null);

  const buttons: { id: FilterMode; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Films', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'criterion', label: 'Criterion', icon: <img src="/images/criterion-logo.jpg" alt="" className="h-3.5 w-auto rounded-sm" /> },
    { id: 'arrow', label: 'Arrow', icon: <span className="text-[10px] font-bold text-red-500">▶</span> },
  ];

  useEffect(() => {
    const selectedButton = buttonsRef.current.get(selected);
    const indicator = indicatorRef.current;
    
    if (selectedButton && indicator) {
      gsap.to(indicator, {
        x: selectedButton.offsetLeft,
        width: selectedButton.offsetWidth,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [selected]);

  return (
    <div className={`flex items-center gap-3 flex-wrap justify-center ${className}`}>
      {/* Filter Buttons */}
      <div className="relative inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        {/* Sliding indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-1 h-[calc(100%-8px)] bg-amber-500/20 border border-amber-500/40 rounded-md transition-colors"
          style={{ width: 0 }}
        />
        
        {buttons.map((button) => (
          <button
            key={button.id}
            ref={(el) => { if (el) buttonsRef.current.set(button.id, el); }}
            onClick={() => onSelect(button.id)}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selected === button.id
                ? 'text-amber-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {button.icon}
            {button.label}
          </button>
        ))}
      </div>

      {/* AI Scan Button */}
      <button
        onClick={onAIScan}
        disabled={isAILoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-300 hover:from-violet-500/30 hover:to-fuchsia-500/30 hover:text-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className={`w-3.5 h-3.5 ${isAILoading ? 'animate-pulse' : ''}`} />
        {isAILoading ? 'Scanning...' : 'Scan Signal Collection ✨ AI'}
      </button>
    </div>
  );
};

export default BookToScreenSelector;
