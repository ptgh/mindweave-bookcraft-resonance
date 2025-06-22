
import { useState, useEffect } from "react";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-lg w-full max-w-4xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center border border-slate-600/40">
              {series.name.toLowerCase().includes('penguin') ? (
                <span className="text-xs">🐧</span>
              ) : (
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
              )}
            </div>
            <div>
              <PublisherResonanceBadge series={series} size="sm" />
              <p className="text-slate-400 text-xs mt-0.5">{series.publisher}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Description */}
        <div className="p-4 border-b border-slate-700/30">
          <p className="text-slate-300 text-sm leading-relaxed">{series.description}</p>
        </div>
        
        {/* Books Container */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading curated signals...</p>
            </div>
          ) : (
            <>
              {/* Scroll Controls */}
              {books.length > 0 && (
                <>
                  <button
                    onClick={scrollLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-700/80 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-700/80 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Horizontal Scrolling Books */}
              <div 
                id="books-container"
                className="flex overflow-x-auto gap-4 p-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {books.map((book) => (
                  <div key={book.id} className="flex-shrink-0 w-48 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-700/50 transition-colors">
                    {/* Book Cover */}
                    <div className="w-full h-32 bg-slate-700/50 rounded mb-3 overflow-hidden flex items-center justify-center">
                      {book.cover_url ? (
                        <img 
                          src={book.cover_url} 
                          alt={book.title} 
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`flex items-center justify-center text-slate-400 text-2xl ${book.cover_url ? 'hidden' : ''}`}>
                        📚
                      </div>
                    </div>
                    
                    {/* Book Info */}
                    <div className="mb-3">
                      <h3 className="text-slate-200 font-medium text-xs leading-tight mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-slate-400 text-xs mb-2">{book.author}</p>
                      {book.editorial_note && (
                        <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-2">{book.editorial_note}</p>
                      )}
                    </div>
                    
                    {/* Add Button */}
                    <Button
                      size="sm"
                      onClick={() => onAddBook(book)}
                      className="w-full bg-purple-600/80 hover:bg-purple-600 text-white text-xs h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Signal
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {books.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <h3 className="text-slate-300 text-sm font-medium mb-1">No books in this collection yet</h3>
              <p className="text-slate-400 text-xs">
                This publisher thread is being curated. Check back soon for new signals.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom scrollbar hiding */}
      <style jsx>{`
        #books-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PublisherResonanceModal;
