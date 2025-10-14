
import { useState, useEffect, useCallback, useMemo } from "react";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";
import { searchAppleBooks } from "@/services/appleBooks";
import { imageService } from "@/services/image-service";
import { debounce } from "@/utils/performance";
import { getRandomCuratedBooks, CuratedBook } from "@/services/curatedSciFiLists";
import { getAllAuthorBooks, AuthorBook } from "@/services/scifiAuthorsService";

export const useBookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const [rotationCount, setRotationCount] = useState(0);
  const { toast } = useEnhancedToast();

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

  // Enhanced loading with curated books mixed in
  const debouncedLoadBooks = useMemo(
    () => debounce(async () => {
      console.log('Loading sci-fi books...', 'Rotation:', rotationCount);
      setLoading(true);
      setVisibleBooks(new Set());
      
      try {
        let allBooks: EnhancedBookSuggestion[] = [];
        
        // 1. Load books from author_books database table
        try {
          const dbBooks = await getAllAuthorBooks(50);
          console.log(`Found ${dbBooks.length} books in author_books table`);
          
          const transformedDbBooks: EnhancedBookSuggestion[] = dbBooks
            .filter(book => !previouslyShownBooks.has(book.google_books_id || book.id))
            .map((book: AuthorBook) => ({
              id: book.google_books_id || book.id,
              title: book.title,
              author: '', // We'll need to fetch author name if needed
              coverUrl: book.cover_url || '',
              thumbnailUrl: book.cover_url || '',
              smallThumbnailUrl: book.cover_url || '',
              subtitle: book.subtitle,
              description: book.description,
              publishedDate: book.published_date,
              pageCount: book.page_count,
              categories: book.categories,
              rating: book.rating,
              ratingsCount: book.ratings_count,
              previewLink: book.preview_link,
              infoLink: book.info_link
            }));
          
          allBooks.push(...transformedDbBooks);
          console.log(`Added ${transformedDbBooks.length} database books to pool`);
        } catch (dbError) {
          console.error('Error loading database books:', dbError);
        }
        
        // 2. Mix in curated books every rotation
        const curatedBooks = getRandomCuratedBooks(6);
        console.log(`Including ${curatedBooks.length} curated books`);
        
        // 3. Search for curated books
        for (const curated of curatedBooks) {
          try {
            const searchQuery = `intitle:"${curated.title}" inauthor:"${curated.author}"`;
            const results = await searchBooksEnhanced(searchQuery, 1, 0);
            if (results.length > 0 && !previouslyShownBooks.has(results[0].id)) {
              allBooks.push(results[0]);
            }
          } catch (e) {
            console.warn(`Failed to find curated book: ${curated.title}`, e);
          }
        }
        
        // 4. Fill remaining with Google Books search results if needed
        let attempts = 0;
        const maxAttempts = 8;
        
        while (allBooks.length < 18 && attempts < maxAttempts) {
          const termIndex = attempts % searchTerms.length;
          const term = searchTerms[termIndex];
          const startIndex = Math.floor(attempts / searchTerms.length) * 10;
          
          try {
            console.log(`Searching for: "${term}" (attempt ${attempts + 1})`);
            const results = await searchBooksEnhanced(term, 15, startIndex);
            
            if (results.length > 0) {
              const newBooks = results.filter(book => 
                book.title && book.author &&
                !allBooks.some(existing => existing.id === book.id) &&
                !previouslyShownBooks.has(book.id)
              );
              
              console.log(`Found ${newBooks.length} new sci-fi books for "${term}"`);
              allBooks.push(...newBooks);
            }
          } catch (searchError: any) {
            console.error(`Search failed for "${term}":`, searchError);
            // If it's a rate limit error, stop trying
            if (searchError?.message?.includes('429') || searchError?.message?.includes('rate limit')) {
              console.warn('Rate limit reached for Google Books API');
              break;
            }
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (allBooks.length > 0) {
          const shuffled = allBooks
            .sort(() => Math.random() - 0.5)
            .slice(0, 18);
            
          setBooks(shuffled);
          
          const newBookIds = new Set(shuffled.map(book => book.id));
          setPreviouslyShownBooks(prev => new Set([...prev, ...newBookIds]));
          setRotationCount(prev => prev + 1);
          
          console.log(`Loaded ${shuffled.length} sci-fi books (rotation ${rotationCount + 1})`);
        } else {
          // Auto-clear and reload when out of books
          if (previouslyShownBooks.size > 0) {
            console.log('Clearing history and reloading...');
            setPreviouslyShownBooks(new Set());
            setRotationCount(0);
            toast({
              title: "Refreshing Collection",
              description: "Cleared viewing history to show fresh recommendations.",
              variant: "success"
            });
            setTimeout(() => {
              debouncedLoadBooks();
            }, 500);
          } else {
            setBooks([]);
            toast({
              title: "Limited Books Available",
              description: "Showing available books from database. External book service may be temporarily unavailable.",
              variant: "default",
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
    [previouslyShownBooks, toast, searchTerms, rotationCount]
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
        variant: "success"
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
