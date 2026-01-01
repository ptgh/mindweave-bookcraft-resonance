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

      {/* AI Scan Button */}
      <div className="inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        <button
          onClick={onAIScan}
          disabled={isAILoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 hover:text-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAILoading ? 'animate-pulse' : ''}`} />
          AI Scan
        </button>
      </div>
    </div>
  );
};

export default BookToScreenSelector;
