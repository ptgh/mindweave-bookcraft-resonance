import { X, BookOpen, ExternalLink, Network, Users, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainNode } from "@/pages/TestBrain";
import { NeuralMapEdge, ConnectionReason } from "@/hooks/useNeuralMapConnections";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

interface ConnectionBreakdown {
  sameAuthor: number;
  sharedThemes: string[];
  sharedSubgenres: string[];
  sharedEras: string[];
  total: number;
}

interface TopRelated {
  nodeId: string;
  score: number;
}

interface NeuralMapBottomSheetProps {
  node: BrainNode;
  allNodes: BrainNode[];
  connectionBreakdown: ConnectionBreakdown;
  topRelated: TopRelated[];
  onClose: () => void;
  onFocusNetwork: () => void;
  onSelectRelated: (nodeId: string) => void;
}

const NeuralMapBottomSheet = ({
  node,
  allNodes,
  connectionBreakdown,
  topRelated,
  onClose,
  onFocusNetwork,
  onSelectRelated
}: NeuralMapBottomSheetProps) => {
  const navigate = useNavigate();

  const handleSignalArchive = () => {
    navigate(`/book-browser?highlight=${node.transmissionId}&search=${encodeURIComponent(node.title)}`);
    onClose();
  };

  const getRelatedNode = (nodeId: string): BrainNode | undefined => {
    return allNodes.find(n => n.id === nodeId);
  };

  const content = (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop - translucent for consistency */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Bottom Sheet - unified translucent style */}
      <div className="relative w-full sm:max-w-md sm:mx-4 animate-in slide-in-from-bottom-4 sm:fade-in sm:zoom-in-95 duration-300">
        {/* Handle bar - mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-600/60 rounded-full" />
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-cyan-400/5 rounded-t-2xl sm:rounded-2xl blur-lg" />
        
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-t-2xl sm:rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-cyan-400/10 bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400/80 rounded-full animate-pulse" />
              <span className="text-slate-200 text-sm font-medium">Signal Details</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700/30 active:bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Book Info */}
          <div className="p-4 border-b border-cyan-400/10">
            <div className="flex gap-4">
              {/* Cover */}
              <div className="flex-shrink-0 w-16 h-22 rounded-lg border border-cyan-400/25 overflow-hidden relative">
                {node.coverUrl ? (
                  <img 
                    src={node.coverUrl} 
                    alt={node.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800/30">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-100 font-medium text-base leading-tight mb-1 line-clamp-2">
                  {node.title}
                </h3>
                <p className="text-cyan-400/70 text-sm mb-2">{node.author}</p>
                
                {/* Connection count */}
                <div className="flex items-center gap-2 text-xs text-cyan-300/60">
                  <Network className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>{connectionBreakdown.total} neural connections</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Breakdown */}
          {connectionBreakdown.total > 0 && (
            <div className="p-4 border-b border-cyan-400/10">
              <h4 className="text-xs font-medium text-slate-400/80 uppercase tracking-wider mb-3">
                Connection Reasons
              </h4>
              
              <div className="space-y-2">
                {connectionBreakdown.sameAuthor > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-cyan-400/80" />
                    <span className="text-slate-300/90">
                      Same author ({connectionBreakdown.sameAuthor} books)
                    </span>
                  </div>
                )}
                
                {connectionBreakdown.sharedThemes.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-cyan-400/80 mt-0.5" />
                    <div>
                      <span className="text-slate-300/90">Shared themes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {connectionBreakdown.sharedThemes.slice(0, 4).map((theme, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15"
                          >
                            {theme}
                          </span>
                        ))}
                        {connectionBreakdown.sharedThemes.length > 4 && (
                          <span className="text-xs text-slate-500/70">
                            +{connectionBreakdown.sharedThemes.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {connectionBreakdown.sharedSubgenres.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Layers className="w-4 h-4 text-cyan-400/80 mt-0.5" />
                    <div>
                      <span className="text-slate-300/90">Shared subgenres:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {connectionBreakdown.sharedSubgenres.slice(0, 3).map((subgenre, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15"
                          >
                            {subgenre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {connectionBreakdown.sharedEras.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 text-center text-cyan-400/80 text-xs">⏰</span>
                    <span className="text-slate-300/90">
                      Same era: {connectionBreakdown.sharedEras.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Books */}
          {topRelated.length > 0 && (
            <div className="p-4 border-b border-cyan-400/10">
              <h4 className="text-xs font-medium text-slate-400/80 uppercase tracking-wider mb-3">
                Most Connected
              </h4>
              
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {topRelated.map(({ nodeId, score }) => {
                  const relatedNode = getRelatedNode(nodeId);
                  if (!relatedNode) return null;
                  
                  return (
                    <button
                      key={nodeId}
                      onClick={() => onSelectRelated(nodeId)}
                      className="flex-shrink-0 w-14 group"
                    >
                      <div className="w-14 h-20 rounded-lg border border-cyan-400/20 overflow-hidden relative group-hover:border-cyan-400/40 transition-colors">
                        {relatedNode.coverUrl ? (
                          <img 
                            src={relatedNode.coverUrl} 
                            alt={relatedNode.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800/30">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1">
                          <div className="text-[8px] text-cyan-400/80 text-center">
                            {Math.round(score)}pts
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400/80 mt-1 line-clamp-2 text-center leading-tight group-hover:text-cyan-300/80 transition-colors">
                        {relatedNode.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="p-4 border-b border-cyan-400/10">
              <div className="flex flex-wrap gap-1.5">
                {node.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="p-4 space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onFocusNetwork}
                className="flex-1 bg-slate-800/50 hover:bg-slate-700/60 text-slate-200 border border-cyan-400/20"
              >
                <Network className="w-3.5 h-3.5 mr-1.5" />
                Focus Network
              </Button>
              <Button
                size="sm"
                onClick={handleSignalArchive}
                className="flex-1 bg-cyan-600/60 hover:bg-cyan-600/80 text-white border border-cyan-400/30"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Book
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default NeuralMapBottomSheet;
