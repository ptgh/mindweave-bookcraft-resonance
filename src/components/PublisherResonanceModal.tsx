
import { useState, useEffect } from "react";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPublisherBooks, PublisherSeries, PublisherBook } from "@/services/publisherService";
import PublisherResonanceBadge from "./PublisherResonanceBadge";

interface PublisherResonanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: PublisherSeries;
  onAddBook: (book: PublisherBook) => void;
}

const PublisherResonanceModal = ({ isOpen, onClose, series, onAddBook }: PublisherResonanceModalProps) => {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && series) {
      loadSeriesBooks();
    }
  }, [isOpen, series]);

  const loadSeriesBooks = async () => {
    try {
      setLoading(true);
      const seriesBooks = await getPublisherBooks(series.id);
      setBooks(seriesBooks);
    } catch (error) {
      console.error('Failed to load series books:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    const container = document.getElementById('books-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('books-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 border border-slate-600/30 rounded-lg w-full max-w-3xl max-h-[60vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-slate-700/50 rounded-full flex items-center justify-center border border-slate-600/30">
              {series.name.toLowerCase().includes('penguin') ? (
                <span className="text-xs">🐧</span>
              ) : (
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
              )}
            </div>
            <div>
              <PublisherResonanceBadge series={series} size="sm" />
              <p className="text-slate-400 text-xs mt-0.5 font-light">{series.publisher}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Description */}
        <div className="px-4 py-3 border-b border-slate-700/20">
          <p className="text-slate-300 text-sm leading-relaxed font-light">{series.description}</p>
        </div>
        
        {/* Books Container */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm font-light">Loading curated signals...</p>
            </div>
          ) : (
            <>
              {/* Scroll Controls */}
              {books.length > 0 && (
                <>
                  <button
                    onClick={scrollLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-slate-700/60 hover:bg-slate-600/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-slate-600/30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={scrollRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-slate-700/60 hover:bg-slate-600/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-slate-600/30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              
              {/* Horizontal Scrolling Books */}
              <ScrollArea className="w-full h-full">
                <div 
                  id="books-container"
                  className="flex overflow-x-auto gap-3 p-4 pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {books.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-44 bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50">
                      {/* Book Cover */}
                      <div className="w-full h-28 bg-slate-700/30 rounded mb-3 overflow-hidden flex items-center justify-center border border-slate-600/20">
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
                        <div className={`flex items-center justify-center text-slate-400 text-xl ${book.cover_url ? 'hidden' : ''}`}>
                          📚
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="mb-3">
                        <h3 className="text-slate-200 font-medium text-xs leading-tight mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-slate-400 text-xs mb-2 font-light">{book.author}</p>
                        {book.editorial_note && (
                          <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-2 font-light">{book.editorial_note}</p>
                        )}
                      </div>
                      
                      {/* Add Button */}
                      <Button
                        size="sm"
                        onClick={() => onAddBook(book)}
                        className="w-full bg-purple-600/70 hover:bg-purple-600/90 text-white text-xs h-6 font-light border-0"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Signal
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
          
          {books.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-dashed border-slate-600/50 flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <h3 className="text-slate-300 text-sm font-medium mb-1">No books in this collection yet</h3>
              <p className="text-slate-400 text-xs font-light">
                This publisher thread is being curated. Check back soon for new signals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublisherResonanceModal;
