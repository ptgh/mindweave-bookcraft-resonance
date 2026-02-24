import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface NeuralMapLegendProps {
  nodeCount: number;
  edgeCount: number;
  bookCount?: number;
  authorCount?: number;
  protagonistCount?: number;
}

const NeuralMapLegend = ({ nodeCount, edgeCount, bookCount, authorCount, protagonistCount }: NeuralMapLegendProps) => {
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
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-amber-400/20 to-purple-400/20 rounded-xl blur-lg" />
        
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
            {/* Node Types */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Node Types</h4>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
                <span className="text-sm text-slate-300"><strong className="text-cyan-300">Book</strong> — Your transmissions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-[20%] bg-slate-700 border-2 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                <span className="text-sm text-slate-300"><strong className="text-amber-300">Author</strong> — SF writers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-purple-400/50 shadow-[0_0_8px_rgba(192,132,252,0.3)]" />
                <span className="text-sm text-slate-300"><strong className="text-purple-300">Protagonist</strong> — Characters</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.5)]" />
                <span className="text-sm text-slate-300">Larger glow = more connections</span>
              </div>
            </div>
            
            {/* Lines */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connection Lines</h4>
              <div className="flex items-center gap-3">
                <div className="w-8 h-[2px] bg-cyan-400" />
                <span className="text-sm text-slate-300"><strong className="text-cyan-300">Cyan</strong> — Same author / theme</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1.5px] bg-amber-400" />
                <span className="text-sm text-slate-300"><strong className="text-amber-300">Amber</strong> — Author wrote book</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-400/70" />
                <span className="text-sm text-slate-300"><strong className="text-purple-300">Purple</strong> — Protagonist appears in</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 border-t-2 border-dotted border-cyan-400/70" />
                <span className="text-sm text-slate-300"><strong className="text-cyan-300">Dotted</strong> — Shared subgenre</span>
              </div>
            </div>
            
            {/* Interactions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interactions</h4>
              <ul className="text-sm text-slate-300 space-y-1.5 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Tap node</strong> - View details & connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span><strong className="text-cyan-300">Hover</strong> - Preview & highlight network</span>
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
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {bookCount ?? nodeCount} books
                </span>
                {authorCount !== undefined && authorCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-[20%] bg-amber-400"></span>
                    {authorCount} authors
                  </span>
                )}
                {protagonistCount !== undefined && protagonistCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    {protagonistCount} chars
                  </span>
                )}
                <span>{edgeCount} links</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-24 left-3 sm:left-4 z-30 w-10 h-10 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all shadow-lg active:scale-95"
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      
      {isOpen && createPortal(legendContent, document.body)}
    </>
  );
};

export default NeuralMapLegend;
