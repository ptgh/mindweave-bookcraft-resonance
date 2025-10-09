
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";
import { searchAppleBooks } from "@/services/appleBooks";
import { imageService } from "@/services/image-service";
import { debounce } from "@/utils/performance";

export const useBookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Highly specific sci-fi searches for accurate titles and covers
  const searchTerms = useMemo(() => [
    'subject:science fiction space opera',
    'subject:cyberpunk fiction',
    'subject:dystopian science fiction',
    'subject:time travel science fiction',
    'subject:artificial intelligence fiction',
    'subject:hard science fiction',
    'subject:post-apocalyptic science fiction',
    'subject:space exploration fiction',
    'subject:first contact science fiction',
    'subject:virtual reality science fiction',
    'subject:alien invasion science fiction',
    'subject:interstellar science fiction'
  ], []);

  // Optimized loading function with better sci-fi filtering
  const debouncedLoadBooks = useMemo(
    () => debounce(async () => {
      console.log('Loading sci-fi books...');
      setLoading(true);
      setVisibleBooks(new Set());
      
      try {
        let allBooks: EnhancedBookSuggestion[] = [];
        let attempts = 0;
        const maxAttempts = 8; // Increased to get more results after filtering
        
        while (allBooks.length < 18 && attempts < maxAttempts) {
          const termIndex = attempts % searchTerms.length;
          const term = searchTerms[termIndex];
          const startIndex = Math.floor(attempts / searchTerms.length) * 10;
          
          try {
            console.log(`Searching for: "${term}" (attempt ${attempts + 1})`);
            const results = await searchBooksEnhanced(term, 15, startIndex); // Increased count
            
            if (results.length > 0) {
              const newBooks = results.filter(book => 
                book.title && book.author &&
                !allBooks.some(existing => existing.id === book.id) &&
                !previouslyShownBooks.has(book.id)
              );
              
              console.log(`Found ${newBooks.length} new sci-fi books for "${term}"`);
              allBooks.push(...newBooks);
            }
          } catch (searchError) {
            console.error(`Search failed for "${term}":`, searchError);
          }
          
          attempts++;
          // Reduced delay for better performance
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (allBooks.length > 0) {
          const shuffled = allBooks
            .sort(() => Math.random() - 0.5)
            .slice(0, 18);
            
          setBooks(shuffled);
          
          const newBookIds = new Set(shuffled.map(book => book.id));
          setPreviouslyShownBooks(prev => new Set([...prev, ...newBookIds]));
          
          console.log(`Loaded ${shuffled.length} sci-fi books`);
        } else {
          if (previouslyShownBooks.size > 0) {
            setPreviouslyShownBooks(new Set());
        toast({
          title: "Refreshing Collection",
              description: "Cleared viewing history to show fresh sci-fi recommendations.",
            });
            setBooks([]);
          } else {
            setBooks([]);
            toast({
              title: "No Sci-Fi Books Found",
              description: "Unable to load sci-fi books. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error loading sci-fi books:', error);
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
      // Try to enrich with Apple Books link (cached via proxy)
      let appleLink: string | undefined;
      try {
        const found = await searchAppleBooks(book.title, book.author || '', undefined);
        if (found?.storeUrl) {
          appleLink = found.storeUrl;
        }
      } catch (e) {
        console.warn('Apple Books lookup failed, proceeding without link:', e);
      }

      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read',
        apple_link: appleLink,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optimized visibility animation
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

      // Optimized image preloading
      const imageUrls = books
        .flatMap(book => [book.coverUrl, book.thumbnailUrl, book.smallThumbnailUrl])
        .filter(Boolean)
        .slice(0, 9) as string[];
      
      if (imageUrls.length > 0) {
        setTimeout(() => {
          imageService.preloadImages(imageUrls);
        }, 200);
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
