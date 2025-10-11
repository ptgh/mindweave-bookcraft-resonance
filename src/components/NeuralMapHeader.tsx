import { Badge } from "./ui/badge";

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
}

const NeuralMapHeader = ({ 
  nodeCount, 
  linkCount, 
  activeFilters, 
  allTags,
  onTagFilter,
  onClearFilters,
  chatHighlights
}: NeuralMapHeaderProps) => {
  return (
    <>
      {/* Consolidated Footer Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/50 backdrop-blur-lg border border-slate-700/20 rounded-full px-4 py-2 shadow-2xl max-w-7xl">
        <div className="flex items-center gap-4">
          {/* Consciousness Network Title */}
          <div className="flex items-center gap-2 px-2 border-r border-slate-700/30">
            <h1 className="text-[11px] font-light text-slate-300 tracking-wide whitespace-nowrap">
              Consciousness Network
            </h1>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-3 px-2 border-r border-slate-700/30">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-[9px]">Signals</span>
              <span className="text-slate-200 text-[10px] font-semibold">{nodeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-cyan-400/50 rounded-full animate-pulse"></div>
              <span className="text-slate-400 text-[9px]">Links</span>
              <span className="text-slate-200 text-[10px] font-semibold">{linkCount}</span>
            </div>
          </div>

          {/* Theme Filters */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[9px] font-medium tracking-wide whitespace-nowrap">THEMES</span>
              <div className="flex flex-wrap gap-1 max-w-4xl">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={activeFilters.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer text-[9px] px-2 py-0 h-5 transition-all ${
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
                  className="text-[8px] text-cyan-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 bg-cyan-400/10 rounded-full ml-1 whitespace-nowrap"
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
