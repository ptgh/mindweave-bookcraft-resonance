
import { useState, useEffect, useRef } from "react";
import { PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import PublisherGridFilters from "./PublisherGridFilters";
import BookNodeModal from "./BookNodeModal";

interface GridNode {
  id: string;
  type: 'publisher' | 'series' | 'book';
  x: number;
  y: number;
  data: PublisherSeries | EnrichedPublisherBook;
  connections: string[];
  isFiltered: boolean;
}

interface PublisherConsciousnessGridProps {
  series: PublisherSeries[];
  books: EnrichedPublisherBook[];
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const PublisherConsciousnessGrid = ({ 
  series, 
  books, 
  activeFilters, 
  onFilterToggle, 
  onAddBook 
}: PublisherConsciousnessGridProps) => {
  const [nodes, setNodes] = useState<GridNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate grid positions and nodes
  useEffect(() => {
    const gridNodes: GridNode[] = [];
    const gridWidth = 800;
    const gridHeight = 600;
    
    // Create publisher nodes (larger, central positions)
    const publishers = [...new Set(series.map(s => s.publisher))];
    publishers.forEach((publisher, index) => {
      const angle = (index * 2 * Math.PI) / publishers.length;
      const radius = 150;
      const x = gridWidth / 2 + radius * Math.cos(angle);
      const y = gridHeight / 2 + radius * Math.sin(angle);
      
      const publisherSeries = series.filter(s => s.publisher === publisher);
      gridNodes.push({
        id: `publisher-${publisher}`,
        type: 'publisher',
        x,
        y,
        data: publisherSeries[0], // Use first series as representative
        connections: publisherSeries.map(s => `series-${s.id}`),
        isFiltered: activeFilters.length === 0 || activeFilters.includes(publisher)
      });
    });

    // Create series nodes (medium, orbiting publishers)
    series.forEach((s, index) => {
      const publisherNode = gridNodes.find(n => n.id === `publisher-${s.publisher}`);
      if (publisherNode) {
        const angle = (index * 1.5 * Math.PI) / series.length;
        const orbitRadius = 80 + Math.random() * 40;
        const x = publisherNode.x + orbitRadius * Math.cos(angle);
        const y = publisherNode.y + orbitRadius * Math.sin(angle);
        
        const seriesBooks = books.filter(b => b.series_id === s.id);
        gridNodes.push({
          id: `series-${s.id}`,
          type: 'series',
          x,
          y,
          data: s,
          connections: seriesBooks.map(b => `book-${b.id}`),
          isFiltered: activeFilters.length === 0 || activeFilters.includes(s.publisher) || activeFilters.includes(s.id)
        });
      }
    });

    // Create book nodes (smaller, distributed around series)
    books.forEach((book, index) => {
      const seriesNode = gridNodes.find(n => n.id === `series-${book.series_id}`);
      if (seriesNode) {
        const angle = (index * 2.5 * Math.PI) / books.length;
        const orbitRadius = 60 + Math.random() * 30;
        const x = Math.max(30, Math.min(gridWidth - 30, seriesNode.x + orbitRadius * Math.cos(angle)));
        const y = Math.max(30, Math.min(gridHeight - 30, seriesNode.y + orbitRadius * Math.sin(angle)));
        
        gridNodes.push({
          id: `book-${book.id}`,
          type: 'book',
          x,
          y,
          data: book,
          connections: [],
          isFiltered: activeFilters.length === 0 || activeFilters.includes(book.series_id)
        });
      }
    });

    setNodes(gridNodes);
  }, [series, books, activeFilters]);

  const getNodeColor = (node: GridNode) => {
    if (!node.isFiltered) return 'rgb(71 85 105)'; // Dimmed
    
    switch (node.type) {
      case 'publisher': return 'rgb(34 211 238)'; // Cyan
      case 'series': return 'rgb(168 85 247)'; // Purple
      case 'book': return 'rgb(34 197 94)'; // Green
      default: return 'rgb(148 163 184)';
    }
  };

  const getNodeSize = (node: GridNode) => {
    switch (node.type) {
      case 'publisher': return 24;
      case 'series': return 16;
      case 'book': return 12;
      default: return 12;
    }
  };

  const handleNodeClick = (node: GridNode) => {
    if (node.type === 'book') {
      setSelectedBook(node.data as EnrichedPublisherBook);
    }
  };

  return (
    <div className="relative">
      <PublisherGridFilters
        series={series}
        activeFilters={activeFilters}
        onFilterToggle={onFilterToggle}
      />
      
      <div 
        ref={canvasRef}
        className="relative w-full h-[600px] bg-slate-900/50 rounded-lg border border-slate-700/30 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Grid connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map(node => 
            node.connections.map(connectionId => {
              const targetNode = nodes.find(n => n.id === connectionId);
              if (!targetNode || (!node.isFiltered && !targetNode.isFiltered)) return null;
              
              const isHighlighted = hoveredNode === node.id || hoveredNode === connectionId;
              
              return (
                <line
                  key={`${node.id}-${connectionId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? 'rgb(34 211 238)' : 'rgb(100 116 139)'}
                  strokeWidth={isHighlighted ? '2' : '1'}
                  opacity={isHighlighted ? '0.8' : '0.3'}
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              );
            })
          )}
        </svg>

        {/* Grid nodes */}
        {nodes.map(node => {
          const size = getNodeSize(node);
          const color = getNodeColor(node);
          const isHovered = hoveredNode === node.id;
          
          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer transition-all duration-300 ${
                isHovered ? 'scale-125 z-20' : 'z-10'
              }`}
              style={{
                left: node.x - size / 2,
                top: node.y - size / 2,
                width: size,
                height: size,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
            >
              {/* Outer glow ring */}
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                  transform: 'scale(2)',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              />
              
              {/* Main node */}
              <div 
                className="relative w-full h-full rounded-full border-2 flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: `${color}20`,
                  borderColor: color,
                  color: color,
                  boxShadow: `0 0 ${isHovered ? '20px' : '10px'} ${color}40`
                }}
              >
                {node.type === 'publisher' && '🏛️'}
                {node.type === 'series' && '📚'}
                {node.type === 'book' && '●'}
              </div>
              
              {/* Breathing effect for filtered nodes */}
              {node.isFiltered && (
                <div 
                  className="absolute inset-0 rounded-full border animate-ping opacity-20"
                  style={{ borderColor: color }}
                />
              )}
              
              {/* Node label on hover */}
              {isHovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-800/90 border border-slate-600/50 rounded px-2 py-1 text-xs text-slate-200 whitespace-nowrap z-30">
                  {node.type === 'book' 
                    ? (node.data as EnrichedPublisherBook).title
                    : (node.data as PublisherSeries).name
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Book detail modal */}
      {selectedBook && (
        <BookNodeModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAddBook={onAddBook}
        />
      )}
    </div>
  );
};

export default PublisherConsciousnessGrid;
