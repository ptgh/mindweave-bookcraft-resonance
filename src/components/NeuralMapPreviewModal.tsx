import { Link, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainNode, BookLink } from "@/pages/TestBrain";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

interface NeuralMapPreviewModalProps {
  node: BrainNode;
  connections: BookLink[];
  onClose: () => void;
}

const NeuralMapPreviewModal = ({ 
  node, 
  connections, 
  onClose,
}: NeuralMapPreviewModalProps) => {
  const navigate = useNavigate();
  
  const connectionCount = connections.filter(
    link => link.fromId === node.id || link.toId === node.id
  ).length;

  const handleSignalArchive = () => {
    // Navigate to Signal Archive with highlight and search
    navigate(`/book-browser?highlight=${node.transmissionId}&search=${encodeURIComponent(node.title)}`);
    onClose();
  };

  const modal = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-cyan-400/5 rounded-2xl blur-lg" />
        
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-cyan-400/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400/80 rounded-full animate-pulse" />
              <span className="text-slate-200 text-sm font-medium">Signal Preview</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-5">
            <div className="flex gap-4">
              {/* Book cover */}
              <div className="flex-shrink-0 w-16 h-22 sm:w-20 sm:h-28 rounded-lg border border-cyan-400/25 overflow-hidden relative">
                {node.coverUrl ? (
                  <>
                    <img 
                      src={node.coverUrl} 
                      alt={node.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-slate-500 bg-slate-800/30">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800/30">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              {/* Book info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-100 font-medium text-base sm:text-lg leading-tight mb-1 line-clamp-2">
                  {node.title}
                </h3>
                <p className="text-cyan-400/70 text-sm mb-3">{node.author}</p>
                
                {/* Connection badge */}
                <div className="flex items-center gap-2 text-xs text-cyan-300/60 mb-3">
                  <Link className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>{connectionCount} neural connections</span>
                </div>
                
                {/* Tags */}
                {node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {node.tags.slice(0, 3).map((tag, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15"
                      >
                        {tag}
                      </span>
                    ))}
                    {node.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-slate-500/70">
                        +{node.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Description if available */}
            {node.description && (
              <div className="mt-4 pt-4 border-t border-cyan-400/10">
                <p className="text-slate-400/80 text-sm leading-relaxed line-clamp-3">
                  {node.description}
                </p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 border-cyan-400/20 text-slate-300 hover:bg-slate-700/30 bg-transparent"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSignalArchive}
              className="flex-1 bg-cyan-600/60 hover:bg-cyan-600/80 text-white border border-cyan-400/30"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Signal Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default NeuralMapPreviewModal;
