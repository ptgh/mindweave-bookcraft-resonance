import { BookOpen, Users, Sparkles, Layers, Network } from "lucide-react";
import { BrainNode } from "@/pages/TestBrain";

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

interface BottomSheetDetailsTabProps {
  node: BrainNode;
  allNodes: BrainNode[];
  connectionBreakdown: ConnectionBreakdown;
  topRelated: TopRelated[];
  typedConnections: Array<{ nodeId: string; label: string; nodeTitle: string }>;
  onSelectRelated: (nodeId: string) => void;
}

const BottomSheetDetailsTab = ({
  node,
  allNodes,
  connectionBreakdown,
  topRelated,
  typedConnections,
  onSelectRelated
}: BottomSheetDetailsTabProps) => {
  const getRelatedNode = (nodeId: string): BrainNode | undefined => {
    return allNodes.find(n => n.id === nodeId);
  };

  return (
    <>
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
                <span className="text-slate-300/90">Same author ({connectionBreakdown.sameAuthor} books)</span>
              </div>
            )}
            {connectionBreakdown.sharedThemes.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400/80 mt-0.5" />
                <div>
                  <span className="text-slate-300/90">Shared themes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {connectionBreakdown.sharedThemes.slice(0, 4).map((theme, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15">
                        {theme}
                      </span>
                    ))}
                    {connectionBreakdown.sharedThemes.length > 4 && (
                      <span className="text-xs text-slate-500/70">+{connectionBreakdown.sharedThemes.length - 4} more</span>
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
                      <span key={i} className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15">
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
                <span className="text-slate-300/90">Same era: {connectionBreakdown.sharedEras.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Typed Connections List */}
      {typedConnections.length > 0 && (
        <div className="p-4 border-b border-cyan-400/10">
          <h4 className="text-xs font-medium text-slate-400/80 uppercase tracking-wider mb-3">
            Connections
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {typedConnections.map(({ nodeId, label, nodeTitle }, i) => (
              <button
                key={i}
                onClick={() => onSelectRelated(nodeId)}
                className="w-full text-left flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-cyan-400/5 transition-colors"
              >
                <Network className="w-3 h-3 text-cyan-400/60 flex-shrink-0" />
                <span className="text-slate-400/80">{label}</span>
                <span className="text-cyan-300/80 truncate font-medium">{nodeTitle}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Most Connected */}
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
                <button key={nodeId} onClick={() => onSelectRelated(nodeId)} className="flex-shrink-0 w-14 group">
                  <div className="w-14 h-20 rounded-lg border border-cyan-400/20 overflow-hidden relative group-hover:border-cyan-400/40 transition-colors">
                    {relatedNode.coverUrl ? (
                      <img src={relatedNode.coverUrl} alt={relatedNode.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800/30">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-1">
                      <div className="text-[8px] text-cyan-400/80 text-center">{Math.round(score)}pts</div>
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
        <div className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-xs bg-cyan-400/10 text-cyan-300/80 rounded-full border border-cyan-400/15">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomSheetDetailsTab;
