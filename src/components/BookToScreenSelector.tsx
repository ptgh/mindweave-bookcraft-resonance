import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Film, Sparkles } from 'lucide-react';

export type FilterMode = 'all';

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
      {/* All Films indicator */}
      <div className="inline-flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-amber-400 bg-amber-500/20 border border-amber-500/40">
          <Film className="w-3.5 h-3.5" />
          All Films
        </div>
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
