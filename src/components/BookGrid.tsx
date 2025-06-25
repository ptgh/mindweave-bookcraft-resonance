
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
    const query = encodeURIComponent(`${title} ${author}`);
    return `https://books.apple.com/search?term=${query}`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {books.map((book, index) => {
        const isVisible = visibleBooks.has(index);
        const deepLink = getDeepLink(book);
        const appleLink = generateAppleLink(book.title, book.author || '');
        const bookId = parseInt(book.id) || index;
        
        return (
          <div
            key={book.id}
            className={`group transition-all duration-500 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-blue-500/10 h-full flex flex-col">
              <div className="relative mb-3">
                <EnhancedBookCover
                  title={book.title}
                  coverUrl={book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl}
                  className="w-full h-32 rounded"
                  lazy={true}
                />
                
                {/* Google Books Link */}
                {deepLink && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeepLinkClick(bookId, deepLink.url);
                    }}
                    disabled={isLoading(bookId)}
                    className="absolute top-1 right-1 w-6 h-6 bg-slate-900/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-slate-800/90 hover:shadow-lg hover:shadow-blue-400/30 transition-all duration-200 border border-slate-600/50 hover:border-blue-400/60 cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Open in Google Books"
                  >
                    {isLoading(bookId) ? (
                      <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-slate-200 text-xs drop-shadow-sm">📖</span>
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
                  className="absolute top-1 left-1 w-6 h-6 bg-slate-900/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-slate-800/90 hover:shadow-lg hover:shadow-red-400/30 transition-all duration-200 border border-slate-600/50 hover:border-red-400/60 cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Open in Apple Books"
                >
                  <span className="text-slate-200 text-xs drop-shadow-sm">🍎</span>
                </button>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-3">
                  <h3 className="text-slate-200 text-sm font-medium leading-tight line-clamp-3 min-h-[3rem]">
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
                  className="w-full bg-slate-700/50 hover:bg-blue-600/80 text-slate-200 border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 text-xs h-8"
                  variant="outline"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Signals
                </Button>
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
