
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
          <StandardButton
            onClick={() => onAiModeToggle(!aiMode)}
            variant="standard"
            size="default"
            className={aiMode ? 'border-[#89b4fa] text-[#89b4fa] shadow-[0_0_10px_rgba(137,180,250,0.3)]' : ''}
            title="AI analyzes your collection to suggest books that bridge your interests"
          >
            Neural {aiMode ? 'ON' : 'OFF'}
          </StandardButton>
        )}
      </div>
    </div>
  );
};

export default BookBrowserHeader;
