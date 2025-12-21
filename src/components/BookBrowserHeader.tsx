
import { StandardButton } from "./ui/standard-button";

interface BookBrowserHeaderProps {
  loading: boolean;
  onDiscover: () => void;
  userBooksCount?: number;
}

const BookBrowserHeader = ({ 
  loading, 
  onDiscover, 
  userBooksCount = 0 
}: BookBrowserHeaderProps) => {
  const isAiEnabled = userBooksCount >= 5;
  
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Signal Collection
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Discover your next science fiction transmission through the quantum field of possibilities
      </p>
      
      <div className="flex items-center justify-center gap-2">
        <StandardButton
          onClick={onDiscover}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <span>{loading ? 'Scanning Signals...' : 'Scan Signal Collection'}</span>
          {isAiEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded text-[10px] text-[#89b4fa] ml-2">
              ✨ AI
            </span>
          )}
        </StandardButton>
      </div>
    </div>
  );
};

export default BookBrowserHeader;
