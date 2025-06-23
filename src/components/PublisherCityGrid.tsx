
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
      
      // Get unique books for this publisher to avoid duplicates
      const publisherBooks = books.filter(b => b.series_id === s.id);
      const existingTitles = new Set(acc[s.publisher].books.map(book => book.title));
      const uniqueBooks = publisherBooks.filter(book => !existingTitles.has(book.title));
      
      acc[s.publisher].books.push(...uniqueBooks);
      return acc;
    }, {} as Record<string, { series: PublisherSeries[], books: EnrichedPublisherBook[] }>);

    const newBuildings: PublisherBuilding[] = Object.entries(publisherGroups).map(([publisher, data], index) => {
      const bookCount = data.books.length;
      const baseHeight = 180;
      const height = Math.max(baseHeight, baseHeight + (bookCount * 6));
      
      return {
        id: `building-${publisher}`,
        name: publisher,
        publisher,
        books: data.books,
        x: index * 400 + 200,
        width: 280,
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
    const scrollAmount = 400;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min((buildings.length - 1) * 400, scrollPosition + scrollAmount);
    setScrollPosition(newPosition);
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Enhanced Tron Grid Background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(rgba(34, 211, 238, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px'
        }}
      />

      {/* Perspective Grid Lines - Enhanced */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Horizontal perspective lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const y = 300 + (i * 40);
          const perspective = Math.max(0.3, 1 - (i * 0.08));
          const opacity = Math.max(0.2, perspective);
          return (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke={`rgba(34, 211, 238, ${opacity})`}
              strokeWidth={perspective * 2}
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.3}s`, animationDuration: '4s' }}
            />
          );
        })}
        
        {/* Vertical perspective lines with depth */}
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i * 100) - scrollPosition;
          const endX = x + (i % 2 === 0 ? 30 : -30);
          const opacity = Math.max(0.1, 1 - Math.abs(x - window.innerWidth/2) / (window.innerWidth/2));
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1="300"
              x2={endX}
              y2="100%"
              stroke={`rgba(34, 211, 238, ${opacity * 0.4})`}
              strokeWidth="1"
            />
          );
        })}

        {/* Horizon line */}
        <line
          x1="0"
          y1="300"
          x2="100%"
          y2="300"
          stroke="rgba(34, 211, 238, 0.6)"
          strokeWidth="2"
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />
      </svg>

      {/* City Buildings */}
      <div 
        ref={cityRef}
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {buildings.map((building) => (
          <div key={building.id} className="absolute">
            {/* Enhanced Building Structure */}
            <div
              className={`cursor-pointer transition-all duration-500 ${
                building.isSelected 
                  ? 'scale-110 z-10' 
                  : 'hover:scale-105'
              }`}
              style={{
                left: building.x,
                bottom: '300px',
                width: building.width,
                height: building.height,
              }}
              onClick={() => handleBuildingClick(building.id)}
            >
              {/* Building Core Structure */}
              <div className="relative w-full h-full">
                {/* Main building outline with enhanced glow */}
                <div 
                  className={`absolute inset-0 transition-all duration-500 ${
                    building.isSelected
                      ? 'border-4 border-cyan-300 shadow-2xl shadow-cyan-400/40 bg-gradient-to-t from-cyan-400/15 via-cyan-400/10 to-cyan-400/5'
                      : 'border-2 border-cyan-400/70 hover:border-cyan-300/90 hover:shadow-lg hover:shadow-cyan-400/20'
                  }`}
                  style={{
                    background: building.isSelected 
                      ? 'linear-gradient(180deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.08) 50%, rgba(34, 211, 238, 0.12) 100%)'
                      : 'linear-gradient(180deg, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0.02) 100%)'
                  }}
                />
                
                {/* Building internal grid pattern */}
                <div 
                  className={`absolute inset-4 transition-opacity duration-500 ${
                    building.isSelected ? 'opacity-60' : 'opacity-30'
                  }`}
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px'
                  }}
                />

                {/* Windows/segments for visual depth */}
                <div className="absolute inset-6 flex flex-col justify-between">
                  {Array.from({ length: Math.floor(building.height / 60) }, (_, i) => (
                    <div 
                      key={i} 
                      className={`h-8 border border-cyan-400/30 transition-all duration-300 ${
                        building.isSelected ? 'bg-cyan-400/10 border-cyan-300/50' : 'bg-cyan-400/5'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Publisher Label */}
                <div className="absolute -bottom-12 left-0 right-0 text-center">
                  <div 
                    className={`text-sm font-light tracking-widest transition-all duration-500 ${
                      building.isSelected
                        ? 'text-cyan-200 text-shadow-lg shadow-cyan-400/70 scale-110'
                        : 'text-cyan-400/90'
                    }`}
                  >
                    {building.publisher.toUpperCase()}
                  </div>
                  <div className={`w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mt-2 transition-all duration-500 ${
                    building.isSelected ? 'via-cyan-300/80' : ''
                  }`} />
                </div>

                {/* Enhanced pulsing effect when selected */}
                {building.isSelected && (
                  <>
                    <div className="absolute -inset-4 border-2 border-cyan-400/40 animate-ping" />
                    <div className="absolute -inset-8 border border-cyan-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={() => handleScroll('left')}
          className="w-12 h-12 rounded-full border-2 border-cyan-400/60 bg-slate-900/70 text-cyan-300 hover:bg-cyan-400/15 hover:border-cyan-300 hover:text-cyan-200 transition-all duration-300 flex items-center justify-center backdrop-blur-sm text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={scrollPosition === 0}
        >
          ←
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="w-12 h-12 rounded-full border-2 border-cyan-400/60 bg-slate-900/70 text-cyan-300 hover:bg-cyan-400/15 hover:border-cyan-300 hover:text-cyan-200 transition-all duration-300 flex items-center justify-center backdrop-blur-sm text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={scrollPosition >= (buildings.length - 1) * 400}
        >
          →
        </button>
      </div>

      {/* Book Portals Panel - Full Height */}
      {selectedBuildingData && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900/95 border-l-2 border-cyan-400/30 backdrop-blur-sm overflow-hidden shadow-2xl shadow-cyan-400/10">
          <div className="p-6 border-b-2 border-cyan-400/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-cyan-200 font-medium text-lg tracking-wide">{selectedBuildingData.publisher}</h3>
                <p className="text-slate-400 text-sm mt-1">Literary Portals: {selectedBuildingData.books.length}</p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-slate-400 hover:text-cyan-300 transition-colors text-xl p-2 hover:bg-slate-700/50 rounded"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            {selectedBuildingData.books.map((book) => (
              <div
                key={`${book.id}-${book.title}`}
                className="group bg-slate-800/50 border border-slate-700/40 rounded-lg p-4 hover:bg-slate-700/50 hover:border-cyan-400/40 transition-all duration-300 cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="flex items-start space-x-4">
                  {/* Book Portal Glow */}
                  <div className="w-16 h-20 bg-slate-700/50 border border-cyan-400/30 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:shadow-lg group-hover:shadow-cyan-400/30 transition-all duration-300">
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
                    <div className={`flex items-center justify-center text-cyan-400 text-sm absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                      <div className="w-8 h-8 border border-cyan-400/50 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-200 font-medium text-sm leading-tight mb-2 line-clamp-2">{book.title}</h4>
                    <p className="text-slate-400 text-sm mb-3">{book.author}</p>
                    {book.isbn && (
                      <p className="text-slate-500 text-xs font-mono mb-3">ISBN: {book.isbn}</p>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddBook(book);
                      }}
                      className="w-full bg-cyan-600/70 hover:bg-cyan-600/90 text-white text-sm py-2 rounded border-0 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/30 group-hover:animate-pulse"
                    >
                      <div className="w-3 h-3 border border-white rounded-full mr-2" />
                      Add to Transmissions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Status Display */}
      <div className="absolute top-6 left-6">
        <div className="flex items-center space-x-3 text-slate-400 text-sm">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          <span>Grid Matrix: Active</span>
          <div className="w-2 h-2 bg-slate-600 rounded-full" />
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
