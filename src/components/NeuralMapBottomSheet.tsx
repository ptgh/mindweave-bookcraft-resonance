import { useState, useMemo } from "react";
import { X, BookOpen, ExternalLink, Network, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainNode } from "@/pages/TestBrain";
import { NeuralMapEdge, ConnectionReason } from "@/hooks/useNeuralMapConnections";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import BottomSheetDetailsTab from "@/components/neural-map/BottomSheetDetailsTab";
import BottomSheetMiniGraph from "@/components/neural-map/BottomSheetMiniGraph";
import BottomSheetAskTab from "@/components/neural-map/BottomSheetAskTab";
import { useNeuralMapDiscovery, DiscoveryResult } from "@/hooks/useNeuralMapDiscovery";

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
  typedConnections: Array<{ nodeId: string; label: string; nodeTitle: string }>;
  onClose: () => void;
  onFocusNetwork: () => void;
  onSelectRelated: (nodeId: string) => void;
}

type TabId = 'details' | 'graph' | 'ask';

const TABS: { id: TabId; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'graph', label: 'Graph' },
  { id: 'ask', label: 'Ask' },
];

const NeuralMapBottomSheet = ({
  node,
  allNodes,
  connectionBreakdown,
  topRelated,
  typedConnections,
  onClose,
  onFocusNetwork,
  onSelectRelated
}: NeuralMapBottomSheetProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('details');
  
  const existingTitles = useMemo(() => allNodes.map(n => n.title), [allNodes]);
  const { results: discoveryResults, loading: discoveryLoading, error: discoveryError, findSimilar } = useNeuralMapDiscovery(existingTitles);

  const handleSignalArchive = () => {
    navigate(`/book-browser?highlight=${node.transmissionId}&search=${encodeURIComponent(node.title)}`);
    onClose();
  };

  const content = (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-md sm:mx-4 mb-3 animate-in slide-in-from-bottom-4 sm:fade-in sm:zoom-in-95 duration-300">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-600/60 rounded-full" />
        </div>
        
        <div className="absolute -inset-1 bg-cyan-400/5 rounded-2xl blur-lg" />
        
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] max-h-[85vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-cyan-400/10 bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400/80 rounded-full animate-pulse" />
              <span className="text-slate-200 text-sm font-medium">Signal Details</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700/30 active:bg-slate-700/50">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-cyan-400/10">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-300 border-b-2 border-cyan-400/60'
                    : 'text-slate-500/70 hover:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Book Info (always visible) */}
          <div className="p-4 border-b border-cyan-400/10">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 h-22 rounded-lg border border-cyan-400/25 overflow-hidden relative">
                {node.coverUrl ? (
                  <img src={node.coverUrl} alt={node.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800/30">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-100 font-medium text-base leading-tight mb-1 line-clamp-2">{node.title}</h3>
                <p className="text-cyan-400/70 text-sm mb-2">{node.author}</p>
                <div className="flex items-center gap-2 text-xs text-cyan-300/60">
                  <Network className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>{connectionBreakdown.total} neural connections</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <BottomSheetDetailsTab
              node={node}
              allNodes={allNodes}
              connectionBreakdown={connectionBreakdown}
              topRelated={topRelated}
              typedConnections={typedConnections}
              onSelectRelated={onSelectRelated}
            />
          )}

          {activeTab === 'graph' && (
            <BottomSheetMiniGraph
              node={node}
              allNodes={allNodes}
              neighbors={topRelated}
              onSelectNode={onSelectRelated}
            />
          )}

          {activeTab === 'ask' && (
            <BottomSheetAskTab node={node} allNodes={allNodes} />
          )}
          
          {/* Actions */}
          <div className="p-4 space-y-2 border-t border-cyan-400/10">
            {/* Discovery strip */}
            {discoveryResults.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-medium text-slate-400/80 uppercase tracking-wider mb-2">Similar Books</h4>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {discoveryResults.map((r, i) => (
                    <div key={i} className="flex-shrink-0 w-14 text-center">
                      <div className="w-14 h-20 rounded-lg border border-cyan-400/20 overflow-hidden bg-slate-800/30">
                        {r.cover_url ? (
                          <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400/80 mt-1 line-clamp-2 leading-tight">{r.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => findSimilar(node)}
                disabled={discoveryLoading}
                className="flex-1 bg-slate-800/50 hover:bg-slate-700/60 text-slate-200 border border-cyan-400/20"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                {discoveryLoading ? '...' : 'Similar'}
              </Button>
              <Button size="sm" onClick={handleSignalArchive} className="flex-1 bg-cyan-600/60 hover:bg-cyan-600/80 text-white border border-cyan-400/30">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View
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
