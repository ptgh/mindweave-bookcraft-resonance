
import { StandardButton } from "./ui/standard-button";

interface BookBrowserHeaderProps {
  loading: boolean;
  onDiscover: () => void;
  aiMode?: boolean;
  onAiModeToggle?: (enabled: boolean) => void;
  userBooksCount?: number;
}

const BookBrowserHeader = ({ 
  loading, 
  onDiscover, 
  aiMode = false, 
  onAiModeToggle,
  userBooksCount = 0 
}: BookBrowserHeaderProps) => {
  const showAiToggle = userBooksCount >= 5;
  
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Signal Collection
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Discover your next science fiction transmission through the quantum field of possibilities
      </p>
      
      <div className="flex items-center justify-center gap-4">
        <StandardButton
          onClick={onDiscover}
          disabled={loading}
          className="flex items-center space-x-1"
        >
          <span>{loading ? 'Scanning Signals...' : 'Discover Scan Signal Collection'}</span>
        </StandardButton>
        
        {showAiToggle && onAiModeToggle && (
          <button
            onClick={() => onAiModeToggle(!aiMode)}
            className={`px-4 py-2 rounded-lg text-xs transition-all ${
              aiMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-700/40 text-slate-400 border border-slate-600/40 hover:bg-slate-700/60'
            }`}
            title="AI analyzes your collection to suggest books that bridge your interests"
          >
            🧠 Neural {aiMode ? 'ON' : 'OFF'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookBrowserHeader;
