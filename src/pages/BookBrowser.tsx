import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import EnhancedBookCover from "@/components/EnhancedBookCover";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/enhanced-google-books-api";
import { saveTransmission } from "@/services/transmissionsService";
import { imageService } from "@/services/image-service";

const BookBrowser = () => {
  const [books, setBooks] = useState<EnhancedBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const [previouslyShownBooks, setPreviouslyShownBooks] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadRandomBooks();
  }, []);

  useEffect(() => {
    // Animate books in with staggered fade-in effect
    if (books.length > 0) {
      books.forEach((_, index) => {
        setTimeout(() => {
          setVisibleBooks(prev => new Set([...prev, index]));
        }, index * 50);
      });

      // Preload images for better performance
      const imageUrls = books.flatMap(book => [
        book.coverUrl,
        book.thumbnailUrl,
        book.smallThumbnailUrl
      ]).filter(Boolean) as string[];
      
      imageService.preloadImages(imageUrls);
    }
  }, [books]);

  const loadRandomBooks = async () => {
    console.log('=== Starting loadRandomBooks ===');
    console.log('Previously shown books count:', previouslyShownBooks.size);
    setLoading(true);
    setVisibleBooks(new Set());
    
    try {
      // Simple, reliable search terms
      const searchTerms = [
        'science fiction',
        'cyberpunk',
        'space opera',
        'dystopian fiction',
        'time travel',
        'artificial intelligence',
        'space exploration',
        'hard science fiction',
        'biopunk',
        'steampunk',
        'alternate history',
        'post apocalyptic'
      ];
      
      console.log('Available search terms:', searchTerms);
      
      let allBooks: EnhancedBookSuggestion[] = [];
      let attempts = 0;
      const maxAttempts = searchTerms.length * 2; // Allow multiple passes through search terms
      
      // Keep searching until we have enough unique books
      while (allBooks.length < 24 && attempts < maxAttempts) {
        const termIndex = attempts % searchTerms.length;
        const term = searchTerms[termIndex];
        const startIndex = Math.floor(attempts / searchTerms.length) * 15; // Offset for pagination
        
        console.log(`\n--- Attempt ${attempts + 1}: Searching for: "${term}" (startIndex: ${startIndex}) ---`);
        
        try {
          const results = await searchBooksEnhanced(term, 15, startIndex);
          console.log(`Results for "${term}":`, results.length, 'books');
          
          if (results.length > 0) {
            // Filter out previously shown books and duplicates
            const newBooks = results.filter(book => 
              !allBooks.some(existing => existing.id === book.id) &&
              !previouslyShownBooks.has(book.id)
            );
            
            allBooks.push(...newBooks);
            console.log(`Added ${newBooks.length} new unique books. Total: ${allBooks.length}`);
          } else {
            console.warn(`No results for "${term}" at startIndex ${startIndex}`);
          }
        } catch (searchError) {
          console.error(`Search failed for "${term}":`, searchError);
        }
        
        attempts++;
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('\n=== Final Results ===');
      console.log('Total unique books found:', allBooks.length);
      
      if (allBooks.length > 0) {
        // Shuffle and take exactly 24 books (or all if less than 24)
        const shuffled = allBooks
          .sort(() => Math.random() - 0.5)
          .slice(0, 24);
          
        console.log('Setting books:', shuffled.length);
        setBooks(shuffled);
        
        // Add these books to the previously shown set
        const newBookIds = new Set(shuffled.map(book => book.id));
        setPreviouslyShownBooks(prev => new Set([...prev, ...newBookIds]));
        console.log('Updated previously shown books count:', previouslyShownBooks.size + newBookIds.size);
        
        toast({
          title: "Books Loaded",
          description: `Found ${shuffled.length} new sci-fi books for you to explore.`,
        });
      } else {
        console.error('No new books found after all search attempts');
        
        // If we can't find any new books, clear the history and try again
        if (previouslyShownBooks.size > 0) {
          console.log('Clearing previously shown books history and retrying...');
          setPreviouslyShownBooks(new Set());
          toast({
            title: "Refreshing Library",
            description: "Cleared viewing history to show fresh recommendations.",
          });
          // Don't call loadRandomBooks again here to avoid infinite loop
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
      console.log('=== loadRandomBooks completed ===');
    }
  };

  const addToTransmissions = async (book: EnhancedBookSuggestion) => {
    console.log('Adding book to transmissions:', book.title);
    try {
      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || book.thumbnailUrl || book.smallThumbnailUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.description || '',
        status: 'want-to-read'
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
  };

  const handleDiscoverClick = () => {
    console.log('Discover button clicked');
    loadRandomBooks();
  };

  const handleScanClick = () => {
    console.log('Scan button clicked');
    loadRandomBooks();
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
              Sci-Fi Book Browser
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Discover your next science fiction transmission through the quantum field of possibilities
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleDiscoverClick}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Scanning the Archive...' : 'Discover Sci-Fi Books'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
              </div>
              <p className="text-slate-400">Scanning the consciousness archive...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-8 gap-4">
              {books.map((book, index) => (
                <Card
                  key={`${book.id}-${index}`}
                  className={`group relative overflow-hidden bg-slate-800/50 border-slate-700 hover:border-blue-400/50 transition-all duration-300 ${
                    visibleBooks.has(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                    <EnhancedBookCover
                      title={book.title}
                      coverUrl={book.coverUrl}
                      thumbnailUrl={book.thumbnailUrl}
                      smallThumbnailUrl={book.smallThumbnailUrl}
                      className="w-full h-full"
                      lazy={true}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => addToTransmissions(book)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                      >
                        Add to Library
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <h3 className="font-medium text-slate-200 text-xs line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {book.author}
                    </p>
                    {book.rating && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-yellow-400">★</span>
                        <span className="text-xs text-slate-400 ml-1">{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && books.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
              </div>
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Sci-Fi Books Found</h3>
              <p className="text-slate-400 text-sm mb-4">
                The archive scan returned empty. Try discovering new sci-fi books.
              </p>
              <Button
                onClick={handleScanClick}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Scan Archive
              </Button>
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Archive status: {books.length} sci-fi books discovered</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Previously viewed: {previouslyShownBooks.size} books</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Enhanced caching: Active</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Image optimization: Enabled</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default BookBrowser;
