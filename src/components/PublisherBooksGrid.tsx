
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <div 
            key={book.id} 
            className="group relative bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
            onClick={() => handleBookClick(book.id)}
          >
            {/* Book Cover */}
            <div className="w-full aspect-[3/4] bg-slate-800/50 rounded-lg mb-3 overflow-hidden relative">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex items-center justify-center text-slate-400 text-2xl absolute inset-0 ${book.cover_url ? 'hidden' : ''}`}>
                {getSeriesPlaceholder(series.name)}
              </div>
              
              {/* Add button overlay - minimal like transmissions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBook(book);
                  }}
                  className="bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Add to Library
                </button>
              </div>
            </div>
            
            {/* Book Info */}
            <div className="space-y-1">
              <h3 className="text-slate-200 font-medium text-sm leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                {book.title}
              </h3>
              <p className="text-slate-400 text-xs">{book.author}</p>
              
              {book.editorial_note && (
                <p className="text-slate-500 text-xs italic leading-relaxed line-clamp-2 mt-2">
                  {book.editorial_note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Book Preview Modal - ensure correct book data */}
      {selectedBook && (
        <EnhancedBookPreviewModal
          key={selectedBook.id} // Force re-render with new book
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
          onAddBook={(book) => {
            onAddBook(selectedBook);
            setSelectedBookId(null);
          }}
        />
      )}
    </div>
  );
};

export default PublisherBooksGrid;
