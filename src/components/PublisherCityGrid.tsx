
import { useState, useEffect, useRef } from "react";
import { PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import BookPortalModal from "./BookPortalModal";

interface PublisherBuilding {
  id: string;
  name: string;
  publisher: string;
  books: EnrichedPublisherBook[];
  x: number;
  width: number;
  height: number;
  isSelected: boolean;
}

interface PublisherCityGridProps {
  series: PublisherSeries[];
  books: EnrichedPublisherBook[];
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const PublisherCityGrid = ({ 
  series, 
  books, 
  onAddBook 
}: PublisherCityGridProps) => {
  const [buildings, setBuildings] = useState<PublisherBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const cityRef = useRef<HTMLDivElement>(null);

  // Filter to only show specific publishers
  const allowedPublishers = ['Gollancz', 'Penguin Classics', 'Tor'];

  useEffect(() => {
    // Create buildings for each publisher
    const publisherGroups = series.reduce((acc, s) => {
      if (!allowedPublishers.some(pub => s.publisher.includes(pub))) return acc;
      
      if (!acc[s.publisher]) {
        acc[s.publisher] = {
          series: [],
          books: []
        };
      }
      acc[s.publisher].series.push(s);
      acc[s.publisher].books.push(...books.filter(b => b.series_id === s.id));
      return acc;
    }, {} as Record<string, { series: PublisherSeries[], books: EnrichedPublisherBook[] }>);

    const newBuildings: PublisherBuilding[] = Object.entries(publisherGroups).map(([publisher, data], index) => {
      const bookCount = data.books.length;
      const baseHeight = 120;
      const height = Math.max(baseHeight, baseHeight + (bookCount * 4));
      
      return {
        id: `building-${publisher}`,
        name: data.series[0]?.name || publisher,
        publisher,
        books: data.books,
        x: index * 300 + 150,
        width: 200,
        height,
        isSelected: selectedBuilding === `building-${publisher}`
      };
    });

    setBuildings(newBuildings);
  }, [series, books, selectedBuilding]);

  const handleBuildingClick = (buildingId: string) => {
    setSelectedBuilding(selectedBuilding === buildingId ? null : buildingId);
  };

  const handleBookClick = (book: EnrichedPublisherBook) => {
    setSelectedBook(book);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min((buildings.length - 1) * 300, scrollPosition + scrollAmount);
    setScrollPosition(newPosition);
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
      {/* Tron Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px),
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px'
        }}
      />

      {/* Perspective Grid Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Horizontal grid lines with perspective */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 400 + (i * 30);
          const perspective = 1 - (i * 0.1);
          return (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke="rgba(34, 211, 238, 0.4)"
              strokeWidth={perspective}
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: '3s' }}
            />
          );
        })}
        
        {/* Vertical perspective lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = (i * 100) - scrollPosition;
          const opacity = Math.max(0.1, 1 - Math.abs(x - 400) / 800);
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1="400"
              x2={x + 50}
              y2="600"
              stroke={`rgba(34, 211, 238, ${opacity * 0.3})`}
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* City Buildings */}
      <div 
        ref={cityRef}
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {buildings.map((building) => (
          <div key={building.id} className="absolute">
            {/* Building Structure */}
            <div
              className={`cursor-pointer transition-all duration-300 ${
                building.isSelected 
                  ? 'scale-105' 
                  : 'hover:scale-102'
              }`}
              style={{
                left: building.x,
                bottom: '200px',
                width: building.width,
                height: building.height,
              }}
              onClick={() => handleBuildingClick(building.id)}
            >
              {/* Building Wireframe */}
              <div className="relative w-full h-full">
                {/* Building outline */}
                <div 
                  className={`absolute inset-0 border-2 transition-all duration-300 ${
                    building.isSelected
                      ? 'border-cyan-400 shadow-lg shadow-cyan-400/20 bg-cyan-400/5'
                      : 'border-cyan-400/60 hover:border-cyan-400/80'
                  }`}
                  style={{
                    background: building.isSelected 
                      ? 'linear-gradient(180deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)'
                      : 'transparent'
                  }}
                />
                
                {/* Building grid pattern */}
                <div 
                  className="absolute inset-2 opacity-40"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />
                
                {/* Publisher Label */}
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <div 
                    className={`text-xs font-light tracking-wider transition-all duration-300 ${
                      building.isSelected
                        ? 'text-cyan-300 text-shadow-lg shadow-cyan-400/50'
                        : 'text-cyan-400/80'
                    }`}
                  >
                    {building.publisher.toUpperCase()}
                  </div>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mt-1" />
                </div>

                {/* Pulsing effect when selected */}
                {building.isSelected && (
                  <div className="absolute -inset-2 border border-cyan-400/30 animate-ping" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={() => handleScroll('left')}
          className="w-10 h-10 rounded-full border border-cyan-400/50 bg-slate-900/50 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
          disabled={scrollPosition === 0}
        >
          ←
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="w-10 h-10 rounded-full border border-cyan-400/50 bg-slate-900/50 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
          disabled={scrollPosition >= (buildings.length - 1) * 300}
        >
          →
        </button>
      </div>

      {/* Book Portals Panel */}
      {selectedBuildingData && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/90 border border-cyan-400/30 rounded-lg backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-cyan-400/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-cyan-300 font-medium text-sm">{selectedBuildingData.publisher}</h3>
                <p className="text-slate-400 text-xs mt-1">Literary Portals: {selectedBuildingData.books.length}</p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-slate-400 hover:text-cyan-300 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 h-full overflow-y-auto">
            {selectedBuildingData.books.map((book) => (
              <div
                key={book.id}
                className="group bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 hover:bg-slate-700/50 hover:border-cyan-400/30 transition-all duration-200 cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="flex items-start space-x-3">
                  {/* Book Portal Glow */}
                  <div className="w-12 h-16 bg-slate-700/50 border border-cyan-400/30 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:shadow-lg group-hover:shadow-cyan-400/20 transition-all duration-200">
                    {book.cover_url ? (
                      <img 
                        src={book.cover_url} 
                        alt={book.title} 
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`flex items-center justify-center text-cyan-400 text-xs absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                      <div className="w-6 h-6 border border-cyan-400/50 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-200 font-medium text-xs leading-tight mb-1 line-clamp-2">{book.title}</h4>
                    <p className="text-slate-400 text-xs mb-2">{book.author}</p>
                    {book.isbn && (
                      <p className="text-slate-500 text-xs font-mono mb-2">ISBN: {book.isbn}</p>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddBook(book);
                      }}
                      className="w-full bg-cyan-600/70 hover:bg-cyan-600/90 text-white text-xs h-6 rounded border-0 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/20 group-hover:animate-pulse"
                    >
                      <div className="w-2 h-2 border border-white rounded-full mr-2" />
                      Add to Transmissions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center space-x-2 text-slate-400 text-xs">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span>Grid Matrix: Active</span>
          <div className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>Publishers Online: {buildings.length}</span>
        </div>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookPortalModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAddBook={onAddBook}
        />
      )}
    </div>
  );
};

export default PublisherCityGrid;
