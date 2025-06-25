
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useBrainMap, BrainNode } from '@/hooks/useBrainMap';
import BrainCanvas from '@/components/BrainCanvas';

interface NodeTooltip {
  node: BrainNode;
  x: number;
  y: number;
}

const TestBrain = () => {
  const { nodes, links, loading, error, allTags, remapConnections } = useBrainMap();
  const [tooltip, setTooltip] = useState<NodeTooltip | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [remappingActive, setRemappingActive] = useState(false);

  const handleTagFilter = (tag: string) => {
    setRemappingActive(true);
    
    let newFilters: string[];
    if (activeFilters.includes(tag)) {
      newFilters = activeFilters.filter(f => f !== tag);
    } else {
      newFilters = [...activeFilters, tag];
    }
    setActiveFilters(newFilters);
    
    setTimeout(() => {
      remapConnections(tag, newFilters);
      setRemappingActive(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-pulse opacity-60"></div>
          </div>
          <p className="text-cyan-400 animate-pulse">Initializing neural consciousness...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-red-400" />
          <p className="text-red-400 mb-2">Error loading transmissions</p>
          <p className="text-red-300 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400 opacity-60" />
          <p className="text-cyan-400 mb-2">No transmissions found</p>
          <p className="text-cyan-300 text-sm opacity-70">Add some books to your library to see the neural network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Enhanced holographic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/20 to-violet-900/10 pointer-events-none" />
      
      <BrainCanvas
        nodes={nodes}
        links={links}
        activeFilters={activeFilters}
        onTooltipChange={setTooltip}
      />

      {/* Enhanced filter controls */}
      <div className="absolute top-4 left-4 z-30 space-y-4">
        <div className="flex flex-wrap gap-2 max-w-md">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeFilters.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer text-xs transition-all duration-300 backdrop-blur-sm ${
                activeFilters.includes(tag) 
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-black hover:from-cyan-300 hover:to-violet-300 shadow-lg shadow-cyan-400/30' 
                  : 'border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/20 hover:border-cyan-300 hover:text-cyan-300 hover:shadow-md hover:shadow-cyan-400/20'
              }`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="text-cyan-400/70 text-xs backdrop-blur-sm bg-black/20 rounded px-2 py-1">
          Click tags to remap connections • {activeFilters.length > 0 ? 'Filtered view' : 'All connections'}
        </div>
      </div>

      {/* Enhanced status display */}
      <div className="absolute top-4 right-4 z-30 text-cyan-400 text-sm">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-cyan-400/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full">
                <div className="w-full h-full rounded-full animate-pulse bg-cyan-400/60"></div>
              </div>
              <span>Neurons: {nodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-violet-400 to-cyan-400 rounded-full opacity-60">
                <div className="w-full h-full rounded-full animate-pulse bg-violet-400/40"></div>
              </div>
              <span>Synapses: {links.length}</span>
            </div>
          </div>
          {remappingActive && (
            <div className="text-cyan-300 text-xs mt-1 animate-pulse">Neural remapping...</div>
          )}
        </div>
      </div>

      {/* Enhanced tooltip with fade-in and float animation */}
      {tooltip && (
        <div 
          className="absolute z-40 pointer-events-none animate-fade-in"
          style={{ 
            left: tooltip.x - 100, 
            top: tooltip.y,
            transform: 'translateX(-50%)',
            animation: 'fadeInFloat 0.3s ease-out'
          }}
        >
          <div className="bg-slate-900/95 border border-cyan-400/60 rounded-lg p-4 max-w-xs shadow-2xl shadow-cyan-400/20 backdrop-blur-md">
            <div className="flex items-start space-x-4">
              {tooltip.node.coverUrl && (
                <div className="w-12 h-16 bg-slate-800/80 rounded border border-slate-600/60 overflow-hidden flex-shrink-0">
                  <img 
                    src={tooltip.node.coverUrl} 
                    alt={tooltip.node.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-cyan-400 text-sm mb-1 leading-tight">{tooltip.node.title}</h4>
                <p className="text-xs text-slate-300/80 mb-2">{tooltip.node.author}</p>
                
                <div className="text-xs text-cyan-300/70">
                  {links.filter(link => link.fromId === tooltip.node.id || link.toId === tooltip.node.id).length} synaptic connections
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS animations for enhanced effects */}
      <style>{`
        @keyframes fadeInFloat {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.95);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TestBrain;
