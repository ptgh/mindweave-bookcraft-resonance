import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface NeuralMapHeaderProps {
  nodeCount: number;
  linkCount: number;
  activeFilters: string[];
  allTags: string[];
  onTagFilter: (tag: string) => void;
  onClearFilters: () => void;
  chatHighlights: {
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  };
  // New props for v2
  focusedBookId?: string | null;
  onExitFocus?: () => void;
  visibleNodeCount?: number;
  visibleEdgeCount?: number;
}

const NeuralMapHeader = ({ 
  nodeCount, 
  linkCount, 
  activeFilters, 
  allTags,
  onTagFilter,
  onClearFilters,
  chatHighlights,
  focusedBookId,
  onExitFocus,
  visibleNodeCount,
  visibleEdgeCount
}: NeuralMapHeaderProps) => {
  const displayNodeCount = visibleNodeCount ?? nodeCount;
  const displayLinkCount = visibleEdgeCount ?? linkCount;
  const isFiltered = activeFilters.length > 0;
  const isFocused = !!focusedBookId;

  return (
    <>
      {/* Exit Focus Button - Top right when in focus mode */}
      {isFocused && onExitFocus && (
        <button
          onClick={onExitFocus}
          className="fixed top-[70px] right-3 sm:right-4 z-40 px-3 py-1.5 bg-slate-800/90 backdrop-blur-sm border border-cyan-400/50 rounded-full text-cyan-300 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-700 transition-colors shadow-lg active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
          Exit Focus
        </button>
      )}

      {/* Filter Active Overlay - Shows counts when filtering */}
      {isFiltered && (
        <div className="fixed top-[70px] left-3 sm:left-4 z-40 px-3 py-1.5 bg-slate-800/90 backdrop-blur-sm border border-cyan-400/30 rounded-full text-slate-300 text-xs flex items-center gap-2 shadow-lg">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span>{displayNodeCount} books · {displayLinkCount} connections</span>
        </div>
      )}

      {/* Consolidated Footer Bar - Mobile Responsive */}
      <div className="fixed bottom-1 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/60 backdrop-blur-lg border border-slate-700/30 rounded-full px-1.5 sm:px-4 py-1 sm:py-2 shadow-2xl shadow-slate-900/20 w-[calc(100vw-80px)] sm:max-w-7xl">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap justify-center">
          {/* Consciousness Network Title - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 px-2 border-r border-slate-700/30">
            <h1 className="text-[11px] font-light text-slate-300 tracking-wide whitespace-nowrap">
              Consciousness Network
            </h1>
          </div>

          {/* Statistics - Compact on mobile */}
          <div className="flex items-center gap-1 sm:gap-3 px-0.5 sm:px-2 border-r border-slate-700/30">
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-[7px] sm:text-[9px] hidden sm:inline">Signals</span>
              <span className="text-slate-200 text-[8px] sm:text-[10px] font-semibold">{displayNodeCount}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-cyan-400/50 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-[7px] sm:text-[9px] hidden sm:inline">Links</span>
              <span className="text-slate-200 text-[8px] sm:text-[10px] font-semibold">{displayLinkCount}</span>
            </div>
          </div>

          {/* Theme Filters - Scrollable on mobile */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-2 flex-1 min-w-0 overflow-hidden pr-1">
              <span className="text-slate-400 text-[7px] sm:text-[9px] font-medium tracking-wide whitespace-nowrap hidden sm:inline">Nodes</span>
              <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide flex-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={activeFilters.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer text-[7px] sm:text-[9px] px-1 sm:px-2 py-0 h-3.5 sm:h-5 transition-all flex-shrink-0 ${
                      activeFilters.includes(tag) 
                        ? 'bg-slate-700/40 text-slate-200 border-slate-600/50 hover:bg-slate-700/60' 
                        : 'border-slate-600/40 text-slate-400 hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-slate-800/30'
                    } ${chatHighlights.tags.includes(tag) ? 'border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}
                    onClick={() => onTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {activeFilters.length > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-[7px] sm:text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors px-1 sm:px-2 py-0.5 sm:py-1 bg-cyan-400/10 rounded-full whitespace-nowrap flex-shrink-0 ml-1 active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NeuralMapHeader;
