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
    <div className="text-center mb-8 space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
          Consciousness Network
        </h1>
        <p className="text-slate-400 text-sm mb-4">
          Explore the interconnected web of your literary consciousness
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="flex items-center justify-center gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <div>
              <div className="text-slate-400 text-xs">Signals</div>
              <div className="text-slate-200 text-lg font-semibold">{nodeCount}</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-cyan-400/50 rounded-full animate-pulse"></div>
            <div>
              <div className="text-slate-400 text-xs">Connections</div>
              <div className="text-slate-200 text-lg font-semibold">{linkCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="text-slate-400 text-sm">Filter by Theme:</span>
            {activeFilters.length > 0 && (
              <button
                onClick={onClearFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
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
  );
};

export default NeuralMapHeader;
