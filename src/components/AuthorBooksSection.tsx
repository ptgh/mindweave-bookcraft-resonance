
import { Brain } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AuthorDetails from "@/components/AuthorDetails";
import EmptyState from "@/components/EmptyState";
import { ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { memo, useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import { gsap } from "gsap";
import EnhancedBookPreviewModal from "./EnhancedBookPreviewModal";
import EnhancedBookCover from "./EnhancedBookCover";
import AuthorBookTagSelector from "./AuthorBookTagSelector";

interface AuthorBooksSectionProps {
  selectedAuthor: ScifiAuthor | null;
  authorBooks: AuthorBook[];
  booksLoading: boolean;
  onAddToTransmissions: (book: AuthorBook, tags?: string[]) => void;
}

const AuthorBooksSection = memo(({ 
  selectedAuthor, 
  authorBooks, 
  booksLoading, 
  onAddToTransmissions 
}: AuthorBooksSectionProps) => {
  const { getDeepLink } = useDeepLinking();
  const previewButtonsRef = useRef<HTMLButtonElement[]>([]);
  const addButtonsRef = useRef<HTMLButtonElement[]>([]);
  const [selectedBookForPreview, setSelectedBookForPreview] = useState<any>(null);
  const [bookTags, setBookTags] = useState<Record<string, string[]>>({});

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
  }, [authorBooks]);

  useEffect(() => {
    // Initialize tags from existing book data
    const initialTags: Record<string, string[]> = {};
    authorBooks.forEach((book) => {
      initialTags[book.id] = book.conceptual_tags || [];
    });
    setBookTags(initialTags);
  }, [authorBooks]);

  const handleTagsChange = (bookId: string, tags: string[]) => {
    setBookTags((prev) => ({ ...prev, [bookId]: tags }));
  };

  const handleLogSignal = (book: AuthorBook) => {
    const tags = bookTags[book.id] || [];
    onAddToTransmissions(book, tags);
  };

  const handleBookPreview = (book: AuthorBook) => {
    // Convert AuthorBook to EnrichedPublisherBook format
    const enrichedBook = {
      id: book.id,
      title: book.title,
      author: selectedAuthor?.name || 'Unknown Author',
      cover_url: book.cover_url,
      editorial_note: book.description,
      isbn: null, // AuthorBook doesn't have ISBN
      series_id: '',
      created_at: ''
    };
    setSelectedBookForPreview(enrichedBook);
  };

  const closePreview = () => {
    setSelectedBookForPreview(null);
  };

  if (!selectedAuthor) {
    return (
      <EmptyState
        icon={Brain}
        title="Select an Author"
        description="Choose from the consciousness archive to explore their literary universe"
      />
    );
  }

  return (
    <>
      <div>
        {booksLoading ? (
          <LoadingSkeleton type="author-detail" />
        ) : (
          <AuthorDetails author={selectedAuthor} />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-200 text-lg sm:text-xl font-medium mb-1">Available Books</h3>
              <p className="text-slate-400 text-sm">Transmissions ready for signal logging</p>
            </div>
          </div>
          
          {booksLoading ? (
            <LoadingSkeleton type="book-grid" count={6} />
          ) : authorBooks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {authorBooks.map(book => {
                const bookForDeepLink = {
                  id: book.google_books_id,
                  title: book.title,
                  author: selectedAuthor?.name || 'Unknown Author',
                  coverUrl: book.cover_url,
                  thumbnailUrl: book.cover_url,
                  smallThumbnailUrl: book.cover_url,
                  categories: book.categories,
                  description: book.description,
                  subtitle: book.subtitle,
                  publishedDate: book.published_date,
                  pageCount: book.page_count,
                  rating: book.rating,
                  ratingsCount: book.ratings_count,
                  previewLink: book.preview_link,
                  infoLink: book.info_link
                };
                const deepLink = getDeepLink(bookForDeepLink);
                
                return (
                  <div key={book.id}>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-slate-800/70 transition-colors h-full flex flex-col">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1 mb-3 sm:mb-4">
                        <EnhancedBookCover
                          title={book.title}
                          author={selectedAuthor?.name}
                          coverUrl={book.cover_url}
                          className="w-12 h-16 sm:w-12 sm:h-16 flex-shrink-0"
                          lazy={true}
                        />
                        
                          <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-slate-200 font-medium text-sm leading-tight mb-1 break-words line-clamp-3">
                                {book.title}
                              </h3>
                              <p className="text-slate-400 text-xs mb-1 truncate">{selectedAuthor?.name || 'Unknown Author'}</p>
                            </div>
                            <div className="w-3 h-3 rounded-full border-2 border-slate-500 bg-slate-500/10 flex-shrink-0" />
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {bookTags[book.id] && bookTags[book.id].length > 0 ? (
                              bookTags[book.id].map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-slate-700/30 text-slate-400 rounded-full text-xs italic">
                                No tags yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row space-x-2">
                        <div ref={addToAddRefs as any}>
                          <AuthorBookTagSelector
                            bookTitle={book.title}
                            selectedTags={bookTags[book.id] || []}
                            onTagsChange={(tags) => handleTagsChange(book.id, tags)}
                            onLogSignal={() => handleLogSignal(book)}
                          />
                        </div>
                        
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
          ) : (
            <EmptyState
              icon={Brain}
              title="No Books Found"
              description="No available transmissions found for this consciousness node"
            />
          )}
        </div>
      </div>

      {selectedBookForPreview && (
        <EnhancedBookPreviewModal
          book={selectedBookForPreview}
          onClose={closePreview}
          onAddBook={(book) => {
            // Convert back to AuthorBook format
            const authorBook: AuthorBook = {
              id: book.id,
              title: book.title,
              author_id: '', // Not used in this context
              google_books_id: '',
              cover_url: book.cover_url,
              description: book.editorial_note,
              subtitle: null,
              published_date: null,
              page_count: null,
              rating: null,
              ratings_count: null,
              categories: null,
              preview_link: null,
              info_link: null,
              created_at: '',
              updated_at: ''
            };
            onAddToTransmissions(authorBook);
          }}
        />
      )}
    </>
  );
});

AuthorBooksSection.displayName = 'AuthorBooksSection';

export default AuthorBooksSection;
