
import { PublisherSeries } from "@/services/publisherService";

interface PublisherGridFiltersProps {
  series: PublisherSeries[];
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
}

const PublisherGridFilters = ({ series, activeFilters, onFilterToggle }: PublisherGridFiltersProps) => {
  const publishers = [...new Set(series.map(s => s.publisher))];

  const getPublisherIcon = (publisher: string) => {
    if (publisher.toLowerCase().includes('penguin')) return '📚';
    if (publisher.toLowerCase().includes('gollancz')) return '🏛️';
    if (publisher.toLowerCase().includes('tor')) return '⚡';
    if (publisher.toLowerCase().includes('oxford')) return '📜';
    return '📚';
  };

  const isActive = (id: string) => activeFilters.includes(id);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Publisher filters */}
        {publishers.map(publisher => (
          <button
            key={publisher}
            onClick={() => onFilterToggle(publisher)}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${
              isActive(publisher)
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/30 border-slate-600/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-sm">{getPublisherIcon(publisher)}</span>
            <span className="text-xs font-medium">{publisher}</span>
            {isActive(publisher) && (
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
        
        {/* Series filters */}
        {series.slice(0, 6).map(s => (
          <button
            key={s.id}
            onClick={() => onFilterToggle(s.id)}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs transition-all duration-300 ${
              isActive(s.id)
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/20 border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-400'
            }`}
          >
            <span>●</span>
            <span className="truncate max-w-20">{s.name}</span>
            {isActive(s.id) && (
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}

        {/* Clear filters */}
        {activeFilters.length > 0 && (
          <button
            onClick={() => activeFilters.forEach(filter => onFilterToggle(filter))}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-red-600/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 text-xs"
          >
            <span>×</span>
            <span>Clear All</span>
          </button>
        )}
      </div>

      {activeFilters.length === 0 && (
        <p className="text-center text-slate-500 text-xs mt-3">
          Select publishers or series to focus the consciousness web
        </p>
      )}
    </div>
  );
};

export default PublisherGridFilters;
