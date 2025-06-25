
import { AlertCircle, RefreshCw } from "lucide-react";

interface BookBrowserErrorProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

const BookBrowserError = ({ error, onRetry, isRetrying = false }: BookBrowserErrorProps) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-slate-300 text-lg font-medium mb-2">Archive Scan Failed</h3>
      <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
        {error || "Unable to connect to the consciousness archive. The quantum field may be disrupted."}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Retrying Scan...' : 'Retry Archive Scan'}</span>
      </button>
    </div>
  );
};

export default BookBrowserError;
