
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";
import { imageService } from "@/services/image-service";
import { debounce } from "@/utils/performance";

export const useBookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Memoize search terms for better performance
  const searchTerms = useMemo(() => [
    'science fiction', 'cyberpunk', 'space opera', 'dystopian fiction',
    'time travel', 'artificial intelligence', 'space exploration',
    'hard science fiction', 'biopunk', 'steampunk', 'alternate history',
    'post apocalyptic'
  ], []);

  // Debounced loading function for better performance
  const debouncedLoadBooks = useMemo(
    () => debounce(async () => {
      console.log('Starting loadRandomBooks');
      setLoading(true);
      setVisibleBooks(new Set());
      
      try {
        let allBooks: EnhancedBookSuggestion[] = [];
        let attempts = 0;
        const maxAttempts = Math.min(searchTerms.length * 2, 10); // Limit attempts for better performance
        
        while (allBooks.length < 24 && attempts < maxAttempts) {
          const termIndex = attempts % searchTerms.length;
          const term = searchTerms[termIndex];
          const startIndex = Math.floor(attempts / searchTerms.length) * 12; // Reduced batch size
          
          try {
            const results = await searchBooksEnhanced(term, 12, startIndex);
            
            if (results.length > 0) {
              const newBooks = results.filter(book => 
                book.title && book.author && // Ensure required fields
                !allBooks.some(existing => existing.id === book.id) &&
                !previouslyShownBooks.has(book.id)
              );
              
              allBooks.push(...newBooks);
            }
          } catch (searchError) {
            console.error(`Search failed for "${term}":`, searchError);
          }
          
          attempts++;
          // Small delay to prevent API rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (allBooks.length > 0) {
          const shuffled = allBooks
            .sort(() => Math.random() - 0.5)
            .slice(0, 24);
            
          setBooks(shuffled);
          
          const newBookIds = new Set(shuffled.map(book => book.id));
          setPreviouslyShownBooks(prev => new Set([...prev, ...newBookIds]));
          
          toast({
            title: "Books Loaded",
            description: `Found ${shuffled.length} new sci-fi books for you to explore.`,
          });
        } else {
          if (previouslyShownBooks.size > 0) {
            setPreviouslyShownBooks(new Set());
            toast({
              title: "Refreshing Library",
              description: "Cleared viewing history to show fresh recommendations.",
            });
            setBooks([]);
          } else {
            setBooks([]);
            toast({
              title: "No Books Found",
              description: "Unable to load sci-fi books. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error in loadRandomBooks:', error);
        setBooks([]);
        toast({
          title: "Loading Error",
          description: "Failed to load sci-fi books. Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [previouslyShownBooks, toast, searchTerms]
  );

  const loadRandomBooks = useCallback(() => {
    debouncedLoadBooks();
  }, [debouncedLoadBooks]);

  const addToTransmissions = useCallback(async (book: EnhancedBookSuggestion) => {
    try {
      const isbn = undefined; // Will be extracted from enhanced book data if available

      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read',
        isbn: isbn,
        apple_link: isbn ? `https://books.apple.com/book/isbn${isbn}` : undefined,
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

  // Optimized visibility animation
  useEffect(() => {
    if (books.length > 0) {
      const showBooks = () => {
        books.forEach((_, index) => {
          setTimeout(() => {
            setVisibleBooks(prev => new Set([...prev, index]));
          }, index * 30); // Reduced delay for faster loading
        });
      };

      // Use requestAnimationFrame for smoother animations
      requestAnimationFrame(showBooks);

      // Optimized image preloading
      const imageUrls = books
        .flatMap(book => [book.coverUrl, book.thumbnailUrl, book.smallThumbnailUrl])
        .filter(Boolean)
        .slice(0, 12) as string[]; // Limit preloading for better performance
      
      if (imageUrls.length > 0) {
        setTimeout(() => {
          imageService.preloadImages(imageUrls);
        }, 100);
      }
    }
  }, [books]);

  return {
    books,
    loading,
    visibleBooks,
    previouslyShownBooks,
    loadRandomBooks,
    addToTransmissions
  };
};
