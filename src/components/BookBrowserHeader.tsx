
import { Button } from "@/components/ui/button";

interface BookBrowserHeaderProps {
  loading: boolean;
  onDiscover: () => void;
}

const BookBrowserHeader = ({ loading, onDiscover }: BookBrowserHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Sci-Fi Book Browser
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Discover your next science fiction transmission through the quantum field of possibilities
      </p>
      
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={onDiscover}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Scanning the Archive...' : 'Discover Sci-Fi Books'}
        </Button>
      </div>
    </div>
  );
};

export default BookBrowserHeader;
