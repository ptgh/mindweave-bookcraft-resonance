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
    <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/30 pt-16">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-light text-slate-200 mb-1 tracking-wider">
            Consciousness Network
          </h1>
          <p className="text-slate-400 text-xs">
            Explore the interconnected web of your literary consciousness
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="flex items-center justify-center gap-3">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div>
                <span className="text-slate-400 text-[10px]">Signals </span>
                <span className="text-slate-200 text-sm font-semibold">{nodeCount}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400/50 rounded-full animate-pulse"></div>
              <div>
                <span className="text-slate-400 text-[10px]">Connections </span>
                <span className="text-slate-200 text-sm font-semibold">{linkCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="space-y-2 max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-400 text-xs">Filter by Theme:</span>
              {activeFilters.length > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2 max-h-[4.5rem] overflow-hidden">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeFilters.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-all text-center justify-center ${
                    activeFilters.includes(tag) 
                      ? 'bg-slate-700/60 text-slate-200 border-slate-600 hover:bg-slate-700/80' 
                      : 'border-slate-600 text-slate-400 hover:border-cyan-400/60 hover:text-cyan-400'
                  } ${chatHighlights.tags.includes(tag) ? 'border-red-400 text-red-400 animate-pulse' : ''}`}
                  onClick={() => onTagFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeuralMapHeader;
