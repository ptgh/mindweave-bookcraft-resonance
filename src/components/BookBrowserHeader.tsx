
import { StandardButton } from "./ui/standard-button";

interface BookBrowserHeaderProps {
  loading: boolean;
  onDiscover: () => void;
}

const BookBrowserHeader = ({ loading, onDiscover }: BookBrowserHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Signal Archive
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
          <span>{loading ? 'Scanning the Archive...' : 'Discover Scan Signal Archive'}</span>
        </StandardButton>
      </div>
    </div>
  );
};

export default BookBrowserHeader;
