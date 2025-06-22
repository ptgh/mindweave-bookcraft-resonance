
import { PublisherSeries } from "@/services/publisherService";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface PublisherSeriesSelectorProps {
  series: PublisherSeries[];
  selectedSeriesId?: string;
  onSeriesChange: (seriesId: string) => void;
}

const PublisherSeriesSelector = ({ series, selectedSeriesId, onSeriesChange }: PublisherSeriesSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSeries = series.find(s => s.id === selectedSeriesId);

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-light text-slate-200 mb-2">Select Publisher Series</h2>
        <p className="text-slate-400 text-sm">
          Explore publisher-curated classics and modern masterworks. Switch between series to discover new speculative frontiers.
        </p>
      </div>
      
      <div className="relative w-full max-w-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>{selectedSeries ? selectedSeries.name : "Choose a publisher series..."}</span>
            {selectedSeries && (
              <span className="text-slate-400 text-xs">({selectedSeries.publisher})</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
            {series.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSeriesChange(s.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors duration-150 flex items-center space-x-3 text-slate-200"
              >
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">{s.badge_emoji}</span>
                <div className="flex-1">
                  <span className="text-sm">{s.name}</span>
                  <span className="text-slate-400 text-xs ml-2">({s.publisher})</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PublisherSeriesSelector;
