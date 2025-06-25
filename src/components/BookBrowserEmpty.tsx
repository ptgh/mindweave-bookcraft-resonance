
interface BookBrowserEmptyProps {
  onScan: () => void;
}

const BookBrowserEmpty = ({ onScan }: BookBrowserEmptyProps) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
      </div>
      <h3 className="text-slate-300 text-lg font-medium mb-2">No Signals Found</h3>
      <p className="text-slate-400 text-sm mb-4">
        The archive scan returned empty. Try discovering new sci-fi signals.
      </p>
      <button
        onClick={onScan}
        className="bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] flex items-center space-x-1"
      >
        <span>Scan Archive</span>
      </button>
    </div>
  );
};

export default BookBrowserEmpty;
