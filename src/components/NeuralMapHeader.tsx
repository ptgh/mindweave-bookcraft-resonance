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
      {/* Title Overlay - Top Left */}
      <div className="fixed top-20 left-6 z-40 bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-xl px-5 py-3 shadow-lg">
        <h1 className="text-lg font-light text-slate-200 tracking-wider">
          Consciousness Network
        </h1>
        <p className="text-slate-400 text-[10px] mt-0.5">
          Organic neural representation
        </p>
      </div>

      {/* Statistics Overlay - Top Right */}
      <div className="fixed top-20 right-6 z-40 flex gap-2">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-slate-400 text-[9px]">Signals</span>
            <span className="text-slate-200 text-xs font-semibold">{nodeCount}</span>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-pulse"></div>
            <span className="text-slate-400 text-[9px]">Links</span>
            <span className="text-slate-200 text-xs font-semibold">{linkCount}</span>
          </div>
        </div>
      </div>

      {/* Theme Filters Overlay - Bottom Center */}
      {allTags.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/50 backdrop-blur-lg border border-slate-700/20 rounded-2xl px-6 py-4 shadow-2xl max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-slate-400 text-[10px] font-medium tracking-wide">FILTER BY THEME</span>
            {activeFilters.length > 0 && (
              <button
                onClick={onClearFilters}
                className="text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-0.5 bg-cyan-400/10 rounded-full"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={activeFilters.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-[10px] px-2.5 py-0.5 transition-all ${
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
        </div>
      )}
    </>
  );
};

export default NeuralMapHeader;
