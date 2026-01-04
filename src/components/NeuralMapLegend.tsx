import { useState } from 'react';
import { HelpCircle, X, BookOpen, Minus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface NeuralMapLegendProps {
  nodeCount: number;
  edgeCount: number;
}

const NeuralMapLegend = ({ nodeCount, edgeCount }: NeuralMapLegendProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const legendContent = (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-cyan-400/20 rounded-xl blur-lg" />
        
        <div className="relative bg-slate-900/95 border border-cyan-400/30 rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200 text-sm font-medium">Neural Map Guide</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Nodes */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nodes</h4>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                <span className="text-sm text-slate-300">Each node represents a book in your collection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8),0_0_0_2px_rgba(34,211,238,0.3)]" />
                <span className="text-sm text-slate-300">Larger nodes = more connections</span>
              </div>
            </div>
            
            {/* Lines */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connections</h4>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-400/40" />
                <span className="text-sm text-slate-300">Lines show meaningful relationships</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                <span className="text-sm text-slate-300">Brighter/thicker = stronger connection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-cyan-400/60" />
                <span className="text-sm text-slate-300">Dashed = same literary era</span>
              </div>
            </div>
            
            {/* Connection types */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connection Types</h4>
              <ul className="text-sm text-slate-300 space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Same author</strong> - Books by the same writer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Shared themes</strong> - Similar conceptual tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Shared subgenres</strong> - Similar SF subgenres</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Same era</strong> - From the same literary period</span>
                </li>
              </ul>
            </div>
            
            {/* Interactions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interactions</h4>
              <ul className="text-sm text-slate-300 space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Tap node</strong> - View book details & connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Focus mode</strong> - Highlight a book's network</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Tag filters</strong> - Filter by theme/subgenre</span>
                </li>
              </ul>
            </div>
            
            {/* Stats */}
            <div className="pt-2 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{nodeCount} books</span>
                <span>·</span>
                <span>{edgeCount} connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-30 w-10 h-10 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all shadow-lg active:scale-95"
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      
      {isOpen && createPortal(legendContent, document.body)}
    </>
  );
};

export default NeuralMapLegend;
