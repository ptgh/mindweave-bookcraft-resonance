
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {books.map((book, index) => {
        const isVisible = visibleBooks.has(index);
        const deepLink = getDeepLink(book);
        const bookId = parseInt(book.id) || index; // Fallback to index if no proper ID
        
        console.log('Deep link for book:', book.title, deepLink); // Debug log
        
        return (
          <div
            key={book.id}
            className={`group transition-all duration-500 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="relative">
                <EnhancedBookCover
                  title={book.title}
                  coverUrl={book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl}
                  className="w-full h-32 mb-3 rounded"
                  lazy={true}
                />
                
                {/* Deep Link Icon - Always show if we have a link */}
                {deepLink && (
                  <button
                    onClick={() => {
                      // Extract any available ISBN data
                      const isbn = undefined; // Will be handled by the deep linking service
                      handleDeepLinkClick(bookId, deepLink.url, isbn);
                    }}
                    disabled={isLoading(bookId)}
                    className="absolute top-1 right-1 w-6 h-6 bg-slate-900/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs hover:bg-slate-800/90 hover:shadow-md hover:shadow-blue-400/30 transition-all duration-200 border border-slate-600/30 hover:border-blue-400/50"
                    title={`Open in ${deepLink.type === 'apple' ? 'Apple Books' : deepLink.type === 'google' ? 'Google Books' : 'Open Library'}`}
                  >
                    {isLoading(bookId) ? (
                      <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-slate-200 drop-shadow-sm">{deepLink.icon}</span>
                    )}
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-slate-200 text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">
                  {book.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-1">
                  {book.author || 'Unknown Author'}
                </p>
                
                {book.categories && book.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {book.categories.slice(0, 2).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-700/30 text-slate-400 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => onAddToTransmissions(book)}
                className="w-full mt-3 bg-slate-700/50 hover:bg-blue-600/80 text-slate-200 border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 text-xs h-8"
                variant="outline"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add to Signals
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

BookGrid.displayName = 'BookGrid';

export default BookGrid;
