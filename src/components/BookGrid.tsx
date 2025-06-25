
import { memo, useState } from "react";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import EnhancedBookCover from "./EnhancedBookCover";
import GoogleBooksPopup from "./GoogleBooksPopup";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useDeepLinking } from "@/hooks/useDeepLinking";

interface BookGridProps {
  books: EnhancedBookSuggestion[];
  visibleBooks: Set<number>;
  onAddToTransmissions: (book: EnhancedBookSuggestion) => void;
}

const BookGrid = memo(({ books, visibleBooks, onAddToTransmissions }: BookGridProps) => {
  const { getDeepLink } = useDeepLinking();
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    bookTitle: string;
    bookAuthor: string;
    previewUrl: string;
  }>({
    isOpen: false,
    bookTitle: "",
    bookAuthor: "",
    previewUrl: ""
  });

  const handleGoogleBooksClick = (book: EnhancedBookSuggestion) => {
    const deepLink = getDeepLink(book);
    if (deepLink && deepLink.url) {
      console.log('Opening Google Books popup with URL:', deepLink.url);
      setPopupData({
        isOpen: true,
        bookTitle: book.title,
        bookAuthor: book.author || 'Unknown Author',
        previewUrl: deepLink.url
      });
    } else {
      console.log('No deep link available for book:', book.title);
    }
  };

  const closePopup = () => {
    setPopupData({
      isOpen: false,
      bookTitle: "",
      bookAuthor: "",
      previewUrl: ""
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {books.map((book, index) => {
          const isVisible = visibleBooks.has(index);
          const deepLink = getDeepLink(book);
          
          return (
            <div
              key={book.id}
              className={`transition-all duration-500 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:bg-slate-800/70 transition-colors h-full flex flex-col">
                <div className="flex items-start space-x-4 flex-1">
                  <EnhancedBookCover
                    title={book.title}
                    coverUrl={book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl}
                    className="w-16 h-24 rounded flex-shrink-0"
                    lazy={true}
                  />
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-slate-200 font-medium text-base leading-tight line-clamp-3 mb-2">
                        {book.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-1 mb-3">
                        {book.author || 'Unknown Author'}
                      </p>
                      
                      {book.categories && book.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {book.categories.slice(0, 2).map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                          {book.categories.length > 2 && (
                            <span className="text-slate-400 text-xs px-2 py-1">
                              +{book.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-3 mt-auto">
                      <Button
                        onClick={() => onAddToTransmissions(book)}
                        className="bg-slate-700/50 hover:bg-blue-600/80 text-slate-200 border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 text-sm h-9 w-full"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Signals
                      </Button>
                      
                      {/* Google Books link under the button */}
                      {deepLink && (
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleGoogleBooksClick(book);
                            }}
                            className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/40 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-blue-400/20"
                            title="Preview in Google Books"
                          >
                            <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <GoogleBooksPopup
        isOpen={popupData.isOpen}
        onClose={closePopup}
        bookTitle={popupData.bookTitle}
        bookAuthor={popupData.bookAuthor}
        previewUrl={popupData.previewUrl}
      />
    </>
  );
});

BookGrid.displayName = 'BookGrid';

export default BookGrid;
