
import { memo, useState, useEffect, useRef } from "react";
import { EnhancedBookSuggestion } from "@/services/googleBooksApi";
import EnhancedBookCover from "./EnhancedBookCover";
import EnhancedBookPreviewModal from "./EnhancedBookPreviewModal";
import PenguinPublisherBadge from "./PenguinPublisherBadge";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import { gsap } from "gsap";

interface BookGridProps {
  books: EnhancedBookSuggestion[];
  visibleBooks: Set<number>;
  onAddToTransmissions: (book: EnhancedBookSuggestion) => void;
}

const BookGrid = memo(({ books, visibleBooks, onAddToTransmissions }: BookGridProps) => {
  const { getDeepLink } = useDeepLinking();
  const previewButtonsRef = useRef<HTMLButtonElement[]>([]);
  const addButtonsRef = useRef<HTMLButtonElement[]>([]);
  const [selectedBookForPreview, setSelectedBookForPreview] = useState<any>(null);

  // Add buttons to refs array
  const addToRefs = (el: HTMLButtonElement | null) => {
    if (el && !previewButtonsRef.current.includes(el)) {
      previewButtonsRef.current.push(el);
    }
  };

  const addToAddRefs = (el: HTMLButtonElement | null) => {
    if (el && !addButtonsRef.current.includes(el)) {
      addButtonsRef.current.push(el);
    }
  };

  // GSAP animations on mount
  useEffect(() => {
    const allButtons = [...previewButtonsRef.current, ...addButtonsRef.current];
    
    if (allButtons.length > 0) {
      // Initial state - hidden
      gsap.set(allButtons, { 
        opacity: 0, 
        y: 10 
      });

      // Animate in with stagger
      gsap.to(allButtons, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.2
      });

      // Setup hover animations for all buttons
      allButtons.forEach((button) => {
        if (button) {
          const handleMouseEnter = () => {
            gsap.to(button, {
              borderColor: "#89b4fa",
              boxShadow: "0 0 8px #89b4fa66",
              duration: 0.3,
              ease: "power2.inOut"
            });
          };

          const handleMouseLeave = () => {
            gsap.to(button, {
              borderColor: "rgba(255, 255, 255, 0.15)",
              boxShadow: "0 0 0px transparent",
              duration: 0.3,
              ease: "power2.inOut"
            });
          };

          button.addEventListener('mouseenter', handleMouseEnter);
          button.addEventListener('mouseleave', handleMouseLeave);

          // Cleanup function stored on the element
          (button as any)._cleanupHover = () => {
            button.removeEventListener('mouseenter', handleMouseEnter);
            button.removeEventListener('mouseleave', handleMouseLeave);
          };
        }
      });
    }

    // Cleanup function
    return () => {
      const allButtons = [...previewButtonsRef.current, ...addButtonsRef.current];
      allButtons.forEach((button) => {
        if (button && (button as any)._cleanupHover) {
          (button as any)._cleanupHover();
        }
      });
      previewButtonsRef.current = [];
      addButtonsRef.current = [];
    };
  }, [books]);

  const handleBookPreview = (book: EnhancedBookSuggestion) => {
    // Convert EnhancedBookSuggestion to EnrichedPublisherBook format
    const enrichedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover_url: book.coverUrl,
      editorial_note: book.description,
      isbn: null, // EnhancedBookSuggestion doesn't have ISBN
      series_id: '',
      created_at: ''
    };
    setSelectedBookForPreview(enrichedBook);
  };

  const closePreview = () => {
    setSelectedBookForPreview(null);
  };

  // Check if a book is likely a Penguin publication
  const isPenguinBook = (book: EnhancedBookSuggestion) => {
    return book.title.toLowerCase().includes('penguin') ||
           book.author.toLowerCase().includes('penguin') ||
           (book.categories && book.categories.some(cat => cat.toLowerCase().includes('penguin')));
  };

  return (
    <>
      {/* Grid matching Transmissions design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book, index) => {
          const isVisible = visibleBooks.has(index);
          const deepLink = getDeepLink(book);
          const showPenguinBadge = isPenguinBook(book);
          
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
                    author={book.author}
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
                    
                    {/* Show Penguin badge if applicable */}
                    {showPenguinBadge && (
                      <div className="mt-2">
                        <PenguinPublisherBadge size="sm" />
                      </div>
                    )}
                    
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
                
                <div className="flex flex-row space-x-2">
                  <button
                    ref={addToAddRefs}
                    onClick={() => onAddToTransmissions(book)}
                    className="flex-1 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa]"
                    style={{
                      boxShadow: "0 0 0px transparent"
                    }}
                  >
                    <Plus className="w-3 h-3 mr-2 inline" />
                    Log Signal
                  </button>
                  
                  {deepLink && (
                    <button
                      ref={addToRefs}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBookPreview(book);
                      }}
                      className="flex-1 px-3 py-1.5 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-[#89b4fa]"
                      title="Preview book"
                      style={{
                        boxShadow: "0 0 0px transparent"
                      }}
                    >
                      Preview
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBookForPreview && (
        <EnhancedBookPreviewModal
          book={selectedBookForPreview}
          onClose={closePreview}
          onAddBook={(book) => {
            // Convert back to EnhancedBookSuggestion format
            const enhancedBook: EnhancedBookSuggestion = {
              id: book.id,
              title: book.title,
              author: book.author,
              coverUrl: book.cover_url,
              thumbnailUrl: book.cover_url,
              smallThumbnailUrl: book.cover_url,
              categories: [],
              description: book.editorial_note,
              subtitle: '',
              publishedDate: '',
              pageCount: 0,
              rating: 0,
              ratingsCount: 0,
              previewLink: '',
              infoLink: ''
            };
            onAddToTransmissions(enhancedBook);
          }}
        />
      )}
    </>
  );
});

BookGrid.displayName = 'BookGrid';

export default BookGrid;
