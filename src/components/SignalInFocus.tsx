
import { Circle } from "lucide-react";
import MiniBrainVisual from "./MiniBrainVisual";

interface SignalInFocusProps {
  book: {
    title: string;
    author: string;
    coverUrl?: string;
  };
}

const SignalInFocus = ({ book }: SignalInFocusProps) => {
  return (
    <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-sm font-medium tracking-wider">
          SIGNAL IN FOCUS
        </h2>
        <div className="flex items-center space-x-2">
          <Circle className="w-4 h-4 text-blue-400" />
          <Circle className="w-3 h-3 text-blue-300" />
          <Circle className="w-2 h-2 text-blue-200" />
        </div>
      </div>
      
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-20 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
          {book.coverUrl ? (
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover rounded" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-200 text-lg font-medium mb-1">
            {book.title}
          </h3>
          <p className="text-slate-400 text-sm">
            {book.author}
          </p>
        </div>
      </div>

      {/* Mini Brain Visual */}
      <div className="mt-4 border-t border-slate-700/50 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium tracking-wider">
            CONSCIOUSNESS WEB
          </span>
          <span className="text-slate-500 text-xs">
            Live Network
          </span>
        </div>
        <MiniBrainVisual />
      </div>
    </div>
  );
};

export default SignalInFocus;
