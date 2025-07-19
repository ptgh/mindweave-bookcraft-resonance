
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import { EnrichedPublisherBook, PublisherSeries } from "@/services/publisherService";
import EnhancedBookPreviewModal from "./EnhancedBookPreviewModal";

interface PublisherBooksGridProps {
  books: EnrichedPublisherBook[];
  series?: PublisherSeries;
  onAddBook: (book: EnrichedPublisherBook) => void;
  loading?: boolean;
}

const PublisherBooksGrid = ({ books, series, onAddBook, loading }: PublisherBooksGridProps) => {
  if (!series) return null;
  
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  
  // Reset selected book when books change
  useEffect(() => {
    setSelectedBookId(null);
  }, [books]);

  // Get the selected book by ID to ensure correct book data
  const selectedBook = selectedBookId ? books.find(book => book.id === selectedBookId) : null;

  const handleBookClick = (bookId: string) => {
    console.log('Clicking book with ID:', bookId);
    const book = books.find(b => b.id === bookId);
    console.log('Found book:', book?.title, book?.author);
    setSelectedBookId(bookId);
  };

  const getSeriesPlaceholder = (seriesName: string) => {
    if (seriesName.toLowerCase().includes('penguin')) return '🐧';
    if (seriesName.toLowerCase().includes('gollancz')) return '🏛️';
    if (seriesName.toLowerCase().includes('tor')) return '🗲';
    if (seriesName.toLowerCase().includes('oxford')) return '📜';
    if (seriesName.toLowerCase().includes('angry robot')) return '🤖';
    return '📚';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
        <p className="text-foreground/70">Loading curated collection...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <span className="text-2xl">{series.badge_emoji}</span>
        </div>
        <h3 className="text-slate-300 text-lg font-medium mb-2">No books found</h3>
        <p className="text-slate-400 text-sm">
          This series collection is being curated. Check back soon for new additions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <PublisherResonanceBadge series={series} size="md" />
        <p className="text-foreground/80 text-sm mt-3 leading-relaxed">{series.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          console.log(`Displaying book: ${book.title} - Cover URL:`, book.cover_url);
          
          return (
            <div 
              key={book.id} 
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer group"
              onClick={() => handleBookClick(book.id)}
            >
              <div className="flex items-start space-x-4">
                {/* Book Cover - using direct cover_url from database */}
                <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title} 
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.error(`Failed to load cover for ${book.title}:`, book.cover_url);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                      onLoad={() => {
                        console.log(`Cover loaded successfully for ${book.title}:`, book.cover_url);
                      }}
                    />
                  ) : null}
                  <div className={`flex items-center justify-center text-slate-300 text-lg absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                    {getSeriesPlaceholder(series.name)}
                  </div>
                </div>
                
                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-slate-200 font-medium text-sm leading-tight group-hover:text-blue-400 transition-colors">{book.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{book.author}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400/10 flex-shrink-0"></div>
                  </div>
                  
                  {book.editorial_note && (
                    <p className="text-slate-400 text-xs italic leading-relaxed line-clamp-2 mb-2">{book.editorial_note}</p>
                  )}
                  
                  {book.isbn && (
                    <p className="text-slate-500 text-xs font-mono mb-3">ISBN: {book.isbn}</p>
                  )}
                  
                   {/* Add Button - styled like transmissions page */}
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onAddBook(book);
                     }}
                     className="w-full bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-500 text-white text-xs h-8 font-light border-0 flex items-center justify-center rounded transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                   >
                     <div className="w-3 h-3 rounded-full border border-white mr-2 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                     </div>
                     Add to Transmissions
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Book Preview Modal - ensure correct book data */}
      {selectedBook && (
        <EnhancedBookPreviewModal
          key={selectedBook.id} // Force re-render with new book
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
          onAddBook={(book) => {
            onAddBook(book);
            setSelectedBookId(null);
          }}
        />
      )}
    </div>
  );
};

export default PublisherBooksGrid;
