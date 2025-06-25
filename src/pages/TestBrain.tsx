
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrainCanvas } from '@/components/BrainCanvas';
import { ChatBrainInterface } from '@/components/ChatBrainInterface';
import { useBrainMap } from '@/hooks/useBrainMap';
import { createBackgroundEnergyField } from '@/utils/synapticEffects';
import { MessageCircle, X } from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

const TestBrain = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { nodes, links, loading, error, allTags, remapConnections } = useBrainMap();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [remappingActive, setRemappingActive] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  // Initialize background energy field
  useEffect(() => {
    if (canvasRef.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        createBackgroundEnergyField(canvasRef);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [nodes]);

  const handleThemeFilter = (theme: string) => {
    setRemappingActive(true);
    
    if (activeFilters.includes(theme)) {
      setActiveFilters(activeFilters.filter(f => f !== theme));
    } else {
      setActiveFilters([...activeFilters, theme]);
    }
    
    setTimeout(() => {
      remapConnections(theme);
      setRemappingActive(false);
    }, 300);
  };

  const handleHighlightNodes = (nodeIds: string[]) => {
    setHighlightedNodes(nodeIds);
    // Reset highlights after 5 seconds
    setTimeout(() => setHighlightedNodes([]), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-cyan-400 animate-pulse relative">
            <div className="absolute inset-2 rounded-full border border-cyan-400/50 animate-ping"></div>
          </div>
          <p className="text-cyan-400 text-lg">Initializing neural consciousness web...</p>
          <p className="text-cyan-300/70 text-sm mt-2">Mapping thematic resonances</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-red-400 relative">
            <div className="absolute inset-4 rounded-full bg-red-400/20"></div>
          </div>
          <p className="text-red-400 mb-2 text-lg">Consciousness web disrupted</p>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors border border-red-500"
          >
            Reconnect Neural Pathways
          </button>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-cyan-400/50 relative">
            <div className="absolute inset-4 rounded-full border border-cyan-400/30"></div>
          </div>
          <p className="text-cyan-400 mb-2 text-lg">Neural network awaiting consciousness</p>
          <p className="text-cyan-300/70 text-sm leading-relaxed">
            Add science fiction transmissions to your library to witness the emergence of the neural web. 
            Each book becomes a node in the living consciousness matrix.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Enhanced CSS for holographic effects */}
      <style>{`
        .neural-particle {
          filter: blur(0.3px);
          animation: neural-drift 3s ease-in-out infinite alternate;
        }
        
        .background-energy-particle {
          filter: blur(0.8px);
        }
        
        .thought-node {
          position: relative;
          filter: drop-shadow(0 0 4px currentColor);
        }
        
        .thought-node::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: nucleus-pulse 2.5s ease-in-out infinite;
          z-index: 1;
        }
        
        @keyframes neural-drift {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-2px) scale(1.1); }
          100% { transform: translateY(0px) scale(1); }
        }
        
        @keyframes nucleus-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
        }
        
        .hover-ripple {
          position: absolute;
          border: 1px solid currentColor;
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
          animation: ripple-expand 1.5s ease-out infinite;
        }
        
        @keyframes ripple-expand {
          0% { width: 100%; height: 100%; opacity: 0.8; }
          100% { width: 300%; height: 300%; opacity: 0; }
        }
        
        .neural-background {
          background: 
            radial-gradient(circle at 20% 30%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(147, 112, 219, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(64, 224, 208, 0.02) 0%, transparent 50%);
        }
      `}</style>

      {/* Background energy field container */}
      <div className="neural-background absolute inset-0"></div>

      {/* Main brain canvas */}
      <div 
        ref={canvasRef}
        className="brain-canvas absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      <BrainCanvas 
        nodes={nodes}
        links={links}
        canvasRef={canvasRef}
        activeFilters={activeFilters}
      />

      {/* Enhanced thematic filter interface */}
      <div className="absolute top-4 left-4 z-20 space-y-4">
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 max-w-md">
          <h3 className="text-cyan-400 text-sm font-medium mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            Thematic Resonance Filters
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(theme => {
              const isActive = activeFilters.includes(theme);
              const displayName = theme.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <Badge
                  key={theme}
                  variant={isActive ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-all duration-300 ${
                    isActive 
                      ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50 shadow-lg shadow-cyan-400/20' 
                      : 'border-cyan-400/30 text-cyan-400/80 hover:bg-cyan-400/10 hover:text-cyan-300 hover:border-cyan-400/60'
                  }`}
                  onClick={() => handleThemeFilter(theme)}
                >
                  {displayName}
                </Badge>
              );
            })}
          </div>
        </div>
        
        <div className="text-cyan-400/60 text-xs bg-black/20 backdrop-blur-sm rounded px-3 py-2 border border-cyan-400/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            {activeFilters.length > 0 ? `Enhanced resonance: ${activeFilters.length} themes` : 'Neural web: all connections active'}
          </div>
          {remappingActive && (
            <div className="text-purple-400/80 flex items-center gap-1">
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
              Remapping consciousness pathways...
            </div>
          )}
        </div>
      </div>

      {/* Enhanced network statistics */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
                </div>
                <span className="text-cyan-300">Consciousness Nodes: {nodes.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400/60 rounded-full animate-pulse"></div>
              <span className="text-purple-300">Neural Links: {links.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-400/60 rounded-full animate-pulse"></div>
              <span className="text-teal-300">Active Themes: {allTags.length}</span>
            </div>
            
            {remappingActive && (
              <div className="flex items-center gap-2 pt-2 border-t border-cyan-400/20">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-spin"></div>
                <span className="text-orange-300 text-xs">Consciousness Flux Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface Toggle */}
      <div className="absolute bottom-4 right-4 z-20">
        <Button
          onClick={() => setShowChatInterface(!showChatInterface)}
          className="bg-cyan-600/80 hover:bg-cyan-700 text-white rounded-full p-3"
        >
          {showChatInterface ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </Button>
      </div>

      {/* Chat Interface */}
      {showChatInterface && (
        <div className="absolute bottom-20 right-4 z-30">
          <ChatBrainInterface
            nodes={nodes}
            links={links}
            onHighlightNodes={handleHighlightNodes}
          />
        </div>
      )}

      {/* Consciousness state indicator */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-black/20 backdrop-blur-sm border border-cyan-400/10 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400/70">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Science Fiction Neural Web: Active</span>
            {highlightedNodes.length > 0 && (
              <span className="text-orange-400 ml-2">
                • {highlightedNodes.length} nodes highlighted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBrain;
