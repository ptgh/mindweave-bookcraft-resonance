
import { useState, useEffect } from "react";
import { PublisherSeries } from "@/services/publisherService";

interface PublisherMindMapProps {
  series: PublisherSeries[];
  selectedSeriesId?: string;
  onSeriesChange: (seriesId: string) => void;
}

const PublisherMindMap = ({ series, selectedSeriesId, onSeriesChange }: PublisherMindMapProps) => {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [randomizedPositions, setRandomizedPositions] = useState<{[key: string]: {x: number, y: number, angle: number}}>({});

  // Generate randomized positions for each series
  useEffect(() => {
    const positions: {[key: string]: {x: number, y: number, angle: number}} = {};
    const centerX = 200;
    const centerY =150;
    const radius = 80;
    
    series.forEach((s, index) => {
      // Add some randomization to the positions
      const baseAngle = (index * 2 * Math.PI) / series.length;
      const randomOffset = (Math.random() - 0.5) * 0.8;
      const angle = baseAngle + randomOffset;
      const randomRadius = radius + (Math.random() - 0.5) * 20;
      
      positions[s.id] = {
        x: centerX + randomRadius * Math.cos(angle),
        y: centerY + randomRadius * Math.sin(angle),
        angle: angle
      };
    });
    
    setRandomizedPositions(positions);
  }, [series]);

  const getPublisherColor = (publisher: string) => {
    if (publisher.toLowerCase().includes('penguin')) return 'bg-orange-400';
    if (publisher.toLowerCase().includes('gollancz')) return 'bg-purple-400';
    if (publisher.toLowerCase().includes('tor')) return 'bg-red-400';
    if (publisher.toLowerCase().includes('oxford')) return 'bg-blue-400';
    return 'bg-green-400';
  };

  const getPublisherIcon = (name: string) => {
    if (name.toLowerCase().includes('penguin')) return '📚';
    if (name.toLowerCase().includes('gollancz')) return '🏛️';
    if (name.toLowerCase().includes('tor')) return '🗲';
    if (name.toLowerCase().includes('oxford')) return '📜';
    return '📚';
  };

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-light text-slate-200 mb-2">Publisher Consciousness Web</h2>
        <p className="text-slate-400 text-sm">
          Navigate the interconnected realms of curated literature. Each node pulses with the essence of its publisher's vision.
        </p>
      </div>
      
      <div className="relative w-full h-[300px] bg-slate-800/20 rounded-lg border border-slate-700/30 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Draw connections from center to each publisher */}
          {series.map((s) => {
            const pos = randomizedPositions[s.id];
            if (!pos) return null;
            
            return (
              <line
                key={`line-${s.id}`}
                x1="200"
                y1="150"
                x2={pos.x}
                y2={pos.y}
                stroke={selectedSeriesId === s.id ? "rgb(168 85 247)" : "rgb(100 116 139)"}
                strokeWidth={selectedSeriesId === s.id ? "2" : "1"}
                opacity={selectedSeriesId === s.id ? "0.8" : "0.3"}
                className="animate-pulse"
                style={{ 
                  animationDelay: `${Math.random() * 2}s`, 
                  animationDuration: `${2 + Math.random() * 2}s` 
                }}
              />
            );
          })}
          
          {/* Draw inter-publisher connections */}
          {series.map((s1, i) => 
            series.slice(i + 1).map((s2) => {
              const pos1 = randomizedPositions[s1.id];
              const pos2 = randomizedPositions[s2.id];
              if (!pos1 || !pos2) return null;
              
              return (
                <line
                  key={`connection-${s1.id}-${s2.id}`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="rgb(71 85 105)"
                  strokeWidth="0.5"
                  opacity="0.1"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${Math.random() * 4}s`, 
                    animationDuration: `${4 + Math.random() * 2}s` 
                  }}
                />
              );
            })
          )}
        </svg>

        {/* Central consciousness node */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center animate-pulse"
          style={{ left: '200px', top: '150px', animationDuration: '2s' }}
        >
          <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-40"></div>
        </div>

        {/* Publisher nodes */}
        {series.map((s, index) => {
          const pos = randomizedPositions[s.id];
          if (!pos) return null;
          
          const isSelected = selectedSeriesId === s.id;
          const isHovered = hoveredSeries === s.id;
          const colorClass = getPublisherColor(s.publisher);
          
          return (
            <div key={s.id}>
              {/* Publisher node */}
              <button
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isSelected 
                    ? `border-purple-400 ${colorClass}/30 shadow-lg shadow-purple-400/20` 
                    : `border-slate-600 ${colorClass}/10 hover:border-slate-500`
                } animate-pulse`}
                style={{ 
                  left: `${pos.x}px`, 
                  top: `${pos.y}px`,
                  animationDelay: `${index * 0.3}s`,
                  animationDuration: `${2.5 + Math.random()}s`
                }}
                onClick={() => onSeriesChange(s.id)}
                onMouseEnter={() => setHoveredSeries(s.id)}
                onMouseLeave={() => setHoveredSeries(null)}
              >
                <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white text-xs animate-ping opacity-30 absolute`}></div>
                <span className="text-lg relative z-10">{getPublisherIcon(s.name)}</span>
              </button>
              
              {/* Publisher label */}
              {(isSelected || isHovered) && (
                <div 
                  className="absolute transform -translate-x-1/2 bg-slate-800/90 border border-slate-600/50 rounded px-2 py-1 text-xs text-slate-200 whitespace-nowrap z-20 animate-fade-in"
                  style={{ 
                    left: `${pos.x}px`, 
                    top: `${pos.y + 35}px`
                  }}
                >
                  {s.name}
                  <div className="text-slate-400 text-xs">{s.publisher}</div>
                </div>
              )}
              
              {/* Orbiting title nodes for selected publisher */}
              {isSelected && (
                <div className="absolute" style={{ left: `${pos.x}px`, top: `${pos.y}px` }}>
                  {[0, 1, 2].map((orbit) => (
                    <div
                      key={orbit}
                      className="absolute w-2 h-2 bg-slate-300 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${25 * Math.cos((orbit * 2 * Math.PI) / 3 + Date.now() / 1000)}px`,
                        top: `${25 * Math.sin((orbit * 2 * Math.PI) / 3 + Date.now() / 1000)}px`,
                        animationDelay: `${orbit * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 rounded-lg p-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Central Consciousness</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Publisher Nodes</span>
          </div>
        </div>

        {/* Selected series info */}
        {selectedSeriesId && (
          <div className="absolute top-3 right-3 bg-slate-900/80 rounded-lg p-3 text-xs text-slate-300 max-w-xs">
            {(() => {
              const selected = series.find(s => s.id === selectedSeriesId);
              return selected ? (
                <div>
                  <div className="font-medium text-slate-200 mb-1">{selected.name}</div>
                  <div className="text-slate-400 text-xs">{selected.publisher}</div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherMindMap;
