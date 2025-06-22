
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

  // Create a central node position
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  // Generate positions for tag clusters around the center
  const tagPositions = Object.keys(tagClusters).map((tag, index) => {
    const angle = (index * 2 * Math.PI) / Object.keys(tagClusters).length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { tag, x, y, books: tagClusters[tag] };
  });

  return (
    <div className="relative w-full h-[600px] bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
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
            opacity="0.5"
          />
        ))}
        
        {/* Draw connections between related books */}
        {tagPositions.map(({ tag, x, y, books }) => 
          books.map((book, bookIndex) => {
            const bookAngle = (bookIndex * 2 * Math.PI) / books.length;
            const bookX = x + 60 * Math.cos(bookAngle);
            const bookY = y + 60 * Math.sin(bookAngle);
            
            return (
              <line
                key={`book-line-${book.id}-${bookIndex}`}
                x1={x}
                y1={y}
                x2={bookX}
                y2={bookY}
                stroke="rgb(148 163 184)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })
        )}
      </svg>

      {/* Central consciousness node */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-blue-300"
        style={{ left: centerX, top: centerY }}
      >
        <div className="text-white text-xs font-medium text-center">
          Consciousness<br/>Core
        </div>
      </div>

      {/* Tag cluster nodes */}
      {tagPositions.map(({ tag, x, y, books }) => (
        <div key={tag}>
          {/* Tag cluster center */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center shadow-md border border-purple-400 group cursor-pointer hover:scale-110 transition-transform"
            style={{ left: x, top: y }}
          >
            <div className="text-white text-xs font-medium text-center px-1">
              {tag}
            </div>
            
            {/* Tooltip showing book count */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {books.length} transmission{books.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Individual book nodes around each tag cluster */}
          {books.slice(0, 4).map((book, bookIndex) => {
            const bookAngle = (bookIndex * 2 * Math.PI) / Math.min(books.length, 4);
            const bookX = x + 60 * Math.cos(bookAngle);
            const bookY = y + 60 * Math.sin(bookAngle);
            
            return (
              <div
                key={book.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-700 rounded w-8 h-8 flex items-center justify-center shadow-sm border border-slate-600 group cursor-pointer hover:scale-125 transition-transform"
                style={{ left: bookX, top: bookY }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                
                {/* Book tooltip */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap max-w-32 text-center">
                  {book.title}
                  <br />
                  <span className="text-slate-400">{book.author}</span>
                </div>
              </div>
            );
          })}
          
          {/* Show "+X more" indicator if there are more books */}
          {books.length > 4 && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-600 rounded w-6 h-6 flex items-center justify-center shadow-sm border border-slate-500 text-white text-xs"
              style={{ left: x + 80, top: y }}
            >
              +{books.length - 4}
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 rounded-lg p-3 text-xs text-slate-300">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Consciousness Core</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span>Conceptual Clusters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Individual Transmissions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMap;
