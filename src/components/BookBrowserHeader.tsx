
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
        <button
          onClick={onDiscover}
          disabled={loading}
          className="bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] flex items-center space-x-1"
        >
          <span>{loading ? 'Scanning the Archive...' : 'Discover Scan Signal Archive'}</span>
        </button>
      </div>
    </div>
  );
};

export default BookBrowserHeader;
