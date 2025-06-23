
import { useState, useEffect, useRef } from "react";
import { PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import BookPortalModal from "./BookPortalModal";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      const baseHeight = 200;
      const height = Math.max(baseHeight, baseHeight + (bookCount * 8));
      
      return {
        id: `building-${publisher}`,
        name: publisher,
        publisher,
        books: data.books,
        x: index * 700 + 600,
        width: 320,
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

  // Handle keyboard navigation for accessibility
  const handleKeyNavigation = (e: React.KeyboardEvent, buildingId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBuildingClick(buildingId);
    }
  };

  // Handle wheel/scroll navigation for city movement
  const handleWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    const scrollAmount = 150;
    const maxScroll = Math.max(0, (buildings.length - 1) * 700 - window.innerWidth / 3);
    const newPosition = Math.max(0, Math.min(maxScroll, scrollPosition + (e.deltaX || e.deltaY) * 0.5));
    setScrollPosition(newPosition);
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);

  return (
    <div 
      className="fixed inset-0 top-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
      onWheel={handleWheelScroll}
    >
      {/* Enhanced Tron Grid Background with City Blocks */}
      <div className="absolute inset-0 z-0">
        {/* Main grid lines */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px),
              linear-gradient(rgba(34, 211, 238, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 25px 25px, 25px 25px'
          }}
        />
        
        {/* City blocks/buildings in background */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 50 }, (_, i) => {
            const x = (i % 10) * 120 + 50;
            const z = Math.floor(i / 10) * 80 + 600;
            const height = 40 + Math.random() * 60;
            const width = 60 + Math.random() * 40;
            
            return (
              <div
                key={`city-block-${i}`}
                className="absolute border border-cyan-400/20 bg-gradient-to-t from-cyan-400/5 to-transparent"
                style={{
                  left: x,
                  bottom: z,
                  width: width,
                  height: height,
                  transform: `perspective(1000px) rotateX(${Math.random() * 5}deg)`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Perspective Grid Lines - Enhanced */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-1">
        {/* Horizontal perspective lines */}
        {Array.from({ length: 15 }, (_, i) => {
          const y = 450 + (i * 35);
          const perspective = Math.max(0.2, 1 - (i * 0.06));
          const opacity = Math.max(0.15, perspective);
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
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: '4s' }}
            />
          );
        })}
        
        {/* Vertical perspective lines with depth */}
        {Array.from({ length: 25 }, (_, i) => {
          const x = (i * 80) - scrollPosition;
          const endX = x + (i % 2 === 0 ? 25 : -25);
          const opacity = Math.max(0.1, 1 - Math.abs(x - window.innerWidth/2) / (window.innerWidth/2));
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1="450"
              x2={endX}
              y2="100%"
              stroke={`rgba(34, 211, 238, ${opacity * 0.3})`}
              strokeWidth="1"
            />
          );
        })}

        {/* Horizon line */}
        <line
          x1="0"
          y1="450"
          x2="100%"
          y2="450"
          stroke="rgba(34, 211, 238, 0.5)"
          strokeWidth="3"
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />
      </svg>

      {/* Page Title and Description */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center z-50">
        <h1 className="text-4xl font-light text-slate-200 mb-2">Publisher Consciousness Grid</h1>
        <p className="text-slate-400 text-lg">Navigate the digital city of literature—explore publisher districts and activate book portals in the luminous grid.</p>
      </div>

      {/* Grid Matrix Panel - Top left, no overlap with title */}
      <div className="absolute top-24 left-8 z-50 w-80">
        <div className="bg-slate-900/98 border-2 border-cyan-400/40 rounded-lg p-4 backdrop-blur-sm shadow-2xl shadow-cyan-400/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-200 font-medium text-sm tracking-wider">GRID MATRIX</span>
            </div>
            <div className="text-cyan-400/70 text-xs">ACTIVE</div>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Grid Status:</span>
              <span className="text-cyan-300 font-mono">SYNCHRONIZED</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Navigation Mode:</span>
              <span className="text-cyan-300 font-mono">3D PERSPECTIVE</span>
            </div>
            {selectedBuilding && (
              <div className="flex items-center justify-between text-sm border-t border-cyan-400/20 pt-2">
                <span className="text-slate-300">Focus:</span>
                <span className="text-cyan-200 font-mono text-xs">
                  {buildings.find(b => b.id === selectedBuilding)?.publisher}
                </span>
              </div>
            )}
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mb-3" />
          
          <div className="text-slate-400 text-xs mb-2 tracking-wider">GRID INSTRUCTIONS:</div>
          <div className="space-y-1 text-xs text-slate-500">
            <div>• Scroll to navigate city grid</div>
            <div>• Click buildings to activate portals</div>
            <div>• Select publisher from central panel</div>
          </div>
        </div>
      </div>

      {/* Publisher Selector - CENTERED, with proper spacing */}
      <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-50 w-[500px]">
        <div className="bg-slate-900/98 border-2 border-cyan-400/40 rounded-lg p-6 backdrop-blur-sm shadow-2xl shadow-cyan-400/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-200 font-medium text-sm tracking-wider">PUBLISHER GRID</span>
            </div>
            <div className="text-cyan-400/70 text-xs">ONLINE</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Active Publishers:</span>
              <span className="text-cyan-300 font-mono">{buildings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Portals:</span>
              <span className="text-cyan-300 font-mono">
                {buildings.reduce((total, building) => total + building.books.length, 0)}
              </span>
            </div>
          </div>
          
          {selectedBuilding && (
            <div className="mb-4 p-3 border border-cyan-400/20 rounded bg-cyan-400/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Selected Publisher:</span>
                <span className="text-cyan-200 font-mono">
                  {buildings.find(b => b.id === selectedBuilding)?.publisher}
                </span>
              </div>
            </div>
          )}
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mb-4" />
          
          {/* Publisher Selection Grid - More spacing, better layout */}
          <div>
            <div className="text-slate-400 text-xs mb-4 tracking-wider">SELECT PUBLISHER:</div>
            <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2">
              {buildings.map((building) => (
                <button
                  key={building.id}
                  className={`p-4 rounded-lg border transition-all duration-300 text-left w-full focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    building.isSelected
                      ? 'bg-cyan-400/20 border-cyan-300/60 text-cyan-200 shadow-lg shadow-cyan-400/25 scale-[1.02]'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/60 hover:border-cyan-400/40 hover:text-cyan-200'
                  }`}
                  onClick={() => handleBuildingClick(building.id)}
                  onKeyDown={(e) => handleKeyNavigation(e, building.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium min-w-0 flex-1">{building.publisher}</span>
                    <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                      <span className="text-xs opacity-70 bg-slate-700/50 px-2 py-1 rounded">{building.books.length}</span>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* City Buildings - positioned lower with more spacing */}
      <div 
        ref={cityRef}
        className="absolute inset-0 transition-transform duration-700 ease-out z-10"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {buildings.map((building) => (
          <div key={building.id} className="absolute">
            {/* Enhanced Building Structure */}
            <div
              className={`cursor-pointer transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 ${
                building.isSelected 
                  ? 'scale-110 z-20' 
                  : 'hover:scale-105 z-15'
              }`}
              style={{
                left: building.x,
                bottom: '450px',
                width: building.width,
                height: building.height,
              }}
              onClick={() => handleBuildingClick(building.id)}
              onKeyDown={(e) => handleKeyNavigation(e, building.id)}
              tabIndex={0}
              role="button"
              aria-label={`Select ${building.publisher} publisher building`}
            >
              {/* Building Core Structure */}
              <div className="relative w-full h-full">
                {/* Main building outline with enhanced glow */}
                <div 
                  className={`absolute inset-0 transition-all duration-500 ${
                    building.isSelected
                      ? 'border-4 border-cyan-300 shadow-2xl shadow-cyan-400/50 bg-gradient-to-t from-cyan-400/20 via-cyan-400/15 to-cyan-400/8'
                      : 'border-2 border-cyan-400/60 hover:border-cyan-300/80 hover:shadow-lg hover:shadow-cyan-400/25'
                  }`}
                  style={{
                    background: building.isSelected 
                      ? 'linear-gradient(180deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.12) 50%, rgba(34, 211, 238, 0.15) 100%)'
                      : 'linear-gradient(180deg, rgba(34, 211, 238, 0.08) 0%, rgba(34, 211, 238, 0.04) 100%)'
                  }}
                />
                
                {/* Building internal structure - floors */}
                <div className="absolute inset-4 space-y-2">
                  {Array.from({ length: Math.floor(building.height / 40) }, (_, i) => (
                    <div 
                      key={i} 
                      className={`h-6 border-l-2 border-r-2 border-cyan-400/30 transition-all duration-300 flex items-center ${
                        building.isSelected ? 'bg-cyan-400/15 border-cyan-300/60' : 'bg-cyan-400/8'
                      }`}
                    >
                      {/* Floor windows */}
                      <div className="flex space-x-2 ml-2">
                        {Array.from({ length: 4 }, (_, j) => (
                          <div 
                            key={j}
                            className={`w-2 h-2 ${
                              building.isSelected ? 'bg-cyan-300/80' : 'bg-cyan-400/50'
                            } rounded-full animate-pulse`}
                            style={{ animationDelay: `${(i + j) * 0.1}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Publisher Label - positioned with more spacing */}
                <div className="absolute -bottom-32 left-0 right-0 text-center">
                  <div 
                    className={`text-sm font-light tracking-widest transition-all duration-500 ${
                      building.isSelected
                        ? 'text-cyan-200 text-shadow-lg shadow-cyan-400/70 scale-110'
                        : 'text-cyan-400/90'
                    }`}
                  >
                    {building.publisher.toUpperCase()}
                  </div>
                  <div className={`w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mt-3 transition-all duration-500 ${
                    building.isSelected ? 'via-cyan-300/80' : ''
                  }`} />
                  <div className="text-cyan-400/60 text-xs mt-3 font-mono">
                    {building.books.length} PORTALS
                  </div>
                </div>

                {/* Enhanced pulsing effect when selected */}
                {building.isSelected && (
                  <>
                    <div className="absolute -inset-6 border-2 border-cyan-400/30 animate-ping" />
                    <div className="absolute -inset-10 border border-cyan-400/15 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Portals Panel - Right side, properly positioned to avoid overlap */}
      {selectedBuildingData && (
        <div className="fixed right-6 top-24 bottom-6 w-96 bg-slate-900/98 border-2 border-cyan-400/30 rounded-lg backdrop-blur-sm overflow-hidden shadow-2xl shadow-cyan-400/10 z-50">
          <div className="p-4 border-b-2 border-cyan-400/20 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-cyan-200 font-medium text-lg tracking-wide">{selectedBuildingData.publisher}</h3>
                <p className="text-slate-400 text-sm mt-1">Literary Portals Available: {selectedBuildingData.books.length}</p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-slate-400 hover:text-cyan-300 transition-colors text-xl p-2 hover:bg-slate-700/50 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400/50 flex-shrink-0 ml-3"
                aria-label="Close book portals panel"
              >
                ×
              </button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-4">
              {selectedBuildingData.books.map((book) => (
                <div
                  key={`${book.id}-${book.title}`}
                  className="group bg-slate-800/50 border border-slate-700/40 rounded-lg p-4 hover:bg-slate-700/50 hover:border-cyan-400/40 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-cyan-400/30"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Book Portal Glow */}
                    <div className="w-14 h-18 bg-slate-700/50 border border-cyan-400/30 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:shadow-lg group-hover:shadow-cyan-400/30 transition-all duration-300">
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
                      <h4 className="text-slate-200 font-medium text-sm leading-tight mb-2">{book.title}</h4>
                      <p className="text-slate-400 text-xs mb-3">{book.author}</p>
                      {book.isbn && (
                        <p className="text-slate-500 text-xs font-mono mb-3">ISBN: {book.isbn}</p>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddBook(book);
                        }}
                        className="w-full bg-cyan-600/70 hover:bg-cyan-600/90 text-white text-xs py-2 rounded border-0 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/30 group-hover:animate-pulse focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      >
                        <div className="w-2 h-2 border border-white rounded-full mr-2" />
                        Add to Transmissions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

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
