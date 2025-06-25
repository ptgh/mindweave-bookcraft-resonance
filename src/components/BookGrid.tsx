
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
      {/* Grid matching Transmissions design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors h-full flex flex-col">
                <div className="flex items-start space-x-4 flex-1 mb-4">
                  <EnhancedBookCover
                    title={book.title}
                    coverUrl={book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl}
                    className="w-12 h-16 flex-shrink-0"
                    lazy={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-slate-200 font-medium text-sm leading-tight line-clamp-2 mb-1">
                          {book.title}
                        </h3>
                        <p className="text-slate-400 text-xs mb-1">{book.author || 'Unknown Author'}</p>
                      </div>
                      <div className="w-3 h-3 rounded-full border-2 border-slate-500 bg-slate-500/10 flex-shrink-0" />
                    </div>
                    
                    {book.categories && book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
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
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={() => onAddToTransmissions(book)}
                    className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-blue-400 transition-colors text-sm h-8 w-full"
                    variant="outline"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add to Signals
                  </Button>
                  
                  {deepLink && (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleGoogleBooksClick(book);
                        }}
                        className="text-xs text-slate-400 hover:text-blue-400 transition-colors underline"
                        title="Preview in Google Books"
                      >
                        Preview Book
                      </button>
                    </div>
                  )}
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
