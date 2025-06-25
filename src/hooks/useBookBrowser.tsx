
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";
import { imageService } from "@/services/image-service";
import { debounce } from "@/utils/performance";

export const useBookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Optimized search terms for better performance
  const searchTerms = useMemo(() => [
    'science fiction', 'cyberpunk', 'space opera', 'dystopian fiction',
    'time travel', 'artificial intelligence', 'space exploration',
    'hard science fiction', 'biopunk', 'steampunk', 'alternate history'
  ], []);

  // Enhanced loading function with better error handling
  const debouncedLoadBooks = useMemo(
    () => debounce(async () => {
      console.log('Loading books...');
      setLoading(true);
      setError(null);
      setVisibleBooks(new Set());
      
      try {
        let allBooks: EnhancedBookSuggestion[] = [];
        let attempts = 0;
        const maxAttempts = 6;
        let consecutiveFailures = 0;
        
        while (allBooks.length < 18 && attempts < maxAttempts && consecutiveFailures < 3) {
          const termIndex = attempts % searchTerms.length;
          const term = searchTerms[termIndex];
          const startIndex = Math.floor(attempts / searchTerms.length) * 10;
          
          try {
            const results = await searchBooksEnhanced(term, 10, startIndex);
            
            if (results.length > 0) {
              const newBooks = results.filter(book => 
                book.title && book.author &&
                !allBooks.some(existing => existing.id === book.id) &&
                !previouslyShownBooks.has(book.id)
              );
              
              allBooks.push(...newBooks);
              consecutiveFailures = 0; // Reset failure counter on success
            } else {
              consecutiveFailures++;
            }
          } catch (searchError) {
            console.error(`Search failed for "${term}":`, searchError);
            consecutiveFailures++;
            
            // If we have some books already, continue with what we have
            if (allBooks.length > 6 && consecutiveFailures >= 2) {
              break;
            }
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        if (allBooks.length > 0) {
          const shuffled = allBooks
            .sort(() => Math.random() - 0.5)
            .slice(0, 18);
            
          setBooks(shuffled);
          
          const newBookIds = new Set(shuffled.map(book => book.id));
          setPreviouslyShownBooks(prev => new Set([...prev, ...newBookIds]));
          
          console.log(`Loaded ${shuffled.length} new sci-fi books`);
          setRetryCount(0); // Reset retry count on success
        } else {
          if (previouslyShownBooks.size > 0) {
            setPreviouslyShownBooks(new Set());
            toast({
              title: "Refreshing Archive",
              description: "Cleared viewing history to show fresh recommendations.",
            });
            setBooks([]);
          } else {
            setError("No sci-fi transmissions found in the quantum field. The archive may be temporarily inaccessible.");
            setBooks([]);
          }
        }
      } catch (error) {
        console.error('Error loading books:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Archive scan failed: ${errorMessage}`);
        setBooks([]);
        
        toast({
          title: "Archive Scan Error",
          description: "Failed to load sci-fi transmissions. Check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [previouslyShownBooks, toast, searchTerms, retryCount]
  );

  const loadRandomBooks = useCallback(() => {
    setRetryCount(prev => prev + 1);
    debouncedLoadBooks();
  }, [debouncedLoadBooks]);

  const addToTransmissions = useCallback(async (book: EnhancedBookSuggestion) => {
    try {
      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read',
        isbn: undefined,
        apple_link: undefined,
        open_count: 0
      });
      
      toast({
        title: "Signal Logged",
        description: `"${book.title}" has been added to your transmissions.`,
      });
    } catch (error: any) {
      console.error('Error adding to transmissions:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadRandomBooks();
  }, []);

  // Enhanced visibility animation with error handling
  useEffect(() => {
    if (books.length > 0) {
      const showBooks = () => {
        books.forEach((_, index) => {
          setTimeout(() => {
            setVisibleBooks(prev => new Set([...prev, index]));
          }, index * 50);
        });
      };

      requestAnimationFrame(showBooks);

      // Optimized image preloading - fixed to handle void return type
      const imageUrls = books
        .flatMap(book => [book.coverUrl, book.thumbnailUrl, book.smallThumbnailUrl])
        .filter(Boolean)
        .slice(0, 9) as string[];
      
      if (imageUrls.length > 0) {
        setTimeout(() => {
          // preloadImages returns void, so we just call it directly
          imageService.preloadImages(imageUrls);
        }, 200);
      }
    }
  }, [books]);

  return {
    books,
    loading,
    error,
    visibleBooks,
    previouslyShownBooks,
    loadRandomBooks,
    addToTransmissions
  };
};
