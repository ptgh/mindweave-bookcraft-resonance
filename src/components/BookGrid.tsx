
import { memo } from "react";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import EnhancedBookCover from "./EnhancedBookCover";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useDeepLinking } from "@/hooks/useDeepLinking";

interface BookGridProps {
  books: EnhancedBookSuggestion[];
  visibleBooks: Set<number>;
  onAddToTransmissions: (book: EnhancedBookSuggestion) => void;
}

const BookGrid = memo(({ books, visibleBooks, onAddToTransmissions }: BookGridProps) => {
  const { getDeepLink, handleDeepLinkClick, isLoading } = useDeepLinking();

  const generateAppleLink = (title: string, author: string) => {
    // Improved Apple Books search URL that searches more specifically
    const searchQuery = `${title} ${author}`.trim();
    const encodedQuery = encodeURIComponent(searchQuery);
    return `https://books.apple.com/search?term=${encodedQuery}`;
  };

  return (
    <div className="space-y-4">
      {books.map((book, index) => {
        const isVisible = visibleBooks.has(index);
        const deepLink = getDeepLink(book);
        const appleLink = generateAppleLink(book.title, book.author || '');
        const bookId = parseInt(book.id) || index;
        
        return (
          <div
            key={book.id}
            className={`transition-all duration-500 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
              <div className="flex items-start space-x-4">
                <EnhancedBookCover
                  title={book.title}
                  coverUrl={book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl}
                  className="w-12 h-16 rounded"
                  lazy={true}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-slate-200 font-medium text-sm leading-tight line-clamp-3">
                        {book.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">
                        {book.author || 'Unknown Author'}
                      </p>
                      
                      {book.categories && book.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.categories.slice(0, 3).map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                          {book.categories.length > 3 && (
                            <span className="text-slate-400 text-xs px-2 py-1">
                              +{book.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Button
                        onClick={() => onAddToTransmissions(book)}
                        className="bg-slate-700/50 hover:bg-blue-600/80 text-slate-200 border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 text-xs h-8 px-3"
                        variant="outline"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Signals
                      </Button>
                      
                      {/* External links under the button */}
                      <div className="flex items-center space-x-2">
                        {/* Google Books Link */}
                        {deepLink && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeepLinkClick(bookId, deepLink.url);
                            }}
                            disabled={isLoading(bookId)}
                            className="w-6 h-6 bg-blue-500/20 hover:bg-blue-500/40 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-blue-400/20"
                            title="Open in Google Books"
                          >
                            {isLoading(bookId) ? (
                              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                            )}
                          </button>
                        )}

                        {/* Apple Books Link */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(appleLink, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-red-400/20"
                          title="Search in Apple Books"
                        >
                          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

BookGrid.displayName = 'BookGrid';

export default BookGrid;
