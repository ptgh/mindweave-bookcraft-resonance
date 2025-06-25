
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";
import { imageService } from "@/services/image-service";

export const useBookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadRandomBooks = useCallback(async () => {
    console.log('=== Starting loadRandomBooks ===');
    setLoading(true);
    setVisibleBooks(new Set());
    
    try {
      const searchTerms = [
        'science fiction', 'cyberpunk', 'space opera', 'dystopian fiction',
        'time travel', 'artificial intelligence', 'space exploration',
        'hard science fiction', 'biopunk', 'steampunk', 'alternate history',
        'post apocalyptic'
      ];
      
      let allBooks: EnhancedBookSuggestion[] = [];
      let attempts = 0;
      const maxAttempts = searchTerms.length * 2;
      
      while (allBooks.length < 24 && attempts < maxAttempts) {
        const termIndex = attempts % searchTerms.length;
        const term = searchTerms[termIndex];
        const startIndex = Math.floor(attempts / searchTerms.length) * 15;
        
        try {
          const results = await searchBooksEnhanced(term, 15, startIndex);
          
          if (results.length > 0) {
            const newBooks = results.filter(book => 
              !allBooks.some(existing => existing.id === book.id) &&
              !previouslyShownBooks.has(book.id)
            );
            
            allBooks.push(...newBooks);
          }
        } catch (searchError) {
          console.error(`Search failed for "${term}":`, searchError);
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
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
  }, [previouslyShownBooks, toast]);

  const addToTransmissions = useCallback(async (book: EnhancedBookSuggestion) => {
    try {
      // Extract ISBN from book data
      const isbn = book.volumeInfo?.industryIdentifiers?.find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      // Generate Apple link if ISBN is available
      const apple_link = isbn ? `https://books.apple.com/book/isbn${isbn}` : undefined;

      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read',
        isbn: isbn,
        apple_link: apple_link,
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

  useEffect(() => {
    if (books.length > 0) {
      books.forEach((_, index) => {
        setTimeout(() => {
          setVisibleBooks(prev => new Set([...prev, index]));
        }, index * 50);
      });

      const imageUrls = books.flatMap(book => [
        book.coverUrl,
        book.thumbnailUrl,
        book.smallThumbnailUrl
      ]).filter(Boolean) as string[];
      
      if (imageUrls.length > 0) {
        imageService.preloadImages(imageUrls);
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
