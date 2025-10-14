
import React from 'react';
import { Transmission } from '@/services/transmissionsService';

interface MindMapProps {
  transmissions: Transmission[];
}

const MindMap: React.FC<MindMapProps> = ({ transmissions }) => {
  // Group transmissions by tags to create clusters
  const tagClusters = transmissions.reduce((clusters, transmission) => {
    transmission.tags.forEach(tag => {
      if (!clusters[tag]) {
        clusters[tag] = [];
      }
      clusters[tag].push(transmission);
    });
    return clusters;
  }, {} as Record<string, Transmission[]>);

  // Create a central node position (smaller dimensions)
  const centerX = 300;
  const centerY = 200;
  const radius = 120;

  // Generate positions for tag clusters around the center
  const tagPositions = Object.keys(tagClusters).map((tag, index) => {
    const angle = (index * 2 * Math.PI) / Object.keys(tagClusters).length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { tag, x, y, books: tagClusters[tag] };
  });

  return (
    <div className="relative w-full h-[400px] bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Draw connections from center to tag clusters */}
        {tagPositions.map(({ tag, x, y }) => (
          <line
            key={`line-${tag}`}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="rgb(100 116 139)"
            strokeWidth="1"
            opacity="0.3"
            className="animate-pulse"
            style={{ animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 2}s` }}
          />
        ))}
        
        {/* Draw connections between related books */}
        {tagPositions.map(({ tag, x, y, books }) => 
          books.map((book, bookIndex) => {
            const bookAngle = (bookIndex * 2 * Math.PI) / books.length;
            const bookX = x + 40 * Math.cos(bookAngle);
            const bookY = y + 40 * Math.sin(bookAngle);
            
            return (
              <line
                key={`book-line-${book.id}-${bookIndex}`}
                x1={x}
                y1={y}
                x2={bookX}
                y2={bookY}
                stroke="rgb(148 163 184)"
                strokeWidth="0.5"
                opacity="0.2"
                className="animate-pulse"
                style={{ animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }}
              />
            );
          })
        )}
      </svg>

      {/* Central consciousness node - centered with consistent border */}
      <div 
        className="absolute bg-blue-500 rounded-full w-8 h-8 shadow-lg border-2 border-blue-300 animate-pulse flex items-center justify-center"
        style={{ 
          left: centerX - 16, 
          top: centerY - 16,
          animationDuration: '2s'
        }}
      >
        <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-30"></div>
      </div>

      {/* Tag cluster nodes */}
      {tagPositions.map(({ tag, x, y, books }, index) => (
        <div key={tag}>
          {/* Tag cluster center */}
          <div 
            className="absolute bg-purple-600 rounded-full w-6 h-6 shadow-md border-2 border-purple-400 animate-pulse flex items-center justify-center"
            style={{ 
              left: x - 12, 
              top: y - 12,
              animationDelay: `${index * 0.3}s`,
              animationDuration: `${2.5 + Math.random()}s`
            }}
          >
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-20"></div>
          </div>
          
          {/* Individual book nodes around each tag cluster */}
          {books.slice(0, 6).map((book, bookIndex) => {
            const bookAngle = (bookIndex * 2 * Math.PI) / Math.min(books.length, 6);
            const bookX = x + 40 * Math.cos(bookAngle);
            const bookY = y + 40 * Math.sin(bookAngle);
            
            return (
              <div
                key={book.id}
                className="absolute bg-slate-700 rounded-full w-3 h-3 shadow-sm border border-slate-600 animate-pulse flex items-center justify-center"
                style={{ 
                  left: bookX - 6, 
                  top: bookY - 6,
                  animationDelay: `${bookIndex * 0.2 + Math.random()}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping opacity-40"></div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend - kept but simplified */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 rounded-lg p-3 text-xs text-slate-300">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Consciousness Core</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
            <span>Conceptual Clusters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>Individual Transmissions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMap;
