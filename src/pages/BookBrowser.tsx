
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
        }, index * 50); // Faster animation
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
    console.log('Loading random books...');
    setLoading(true);
    setVisibleBooks(new Set());
    
    try {
      // Enhanced sci-fi search terms for better results
      const sciFiSearchTerms = [
        'science fiction space opera',
        'cyberpunk dystopian future',
        'time travel paradox',
        'alien contact first',
        'artificial intelligence robot',
        'galactic empire war',
        'terraforming colonization',
        'quantum physics multiverse',
        'genetic engineering biotech',
        'virtual reality simulation',
        'post apocalyptic survival',
        'interstellar exploration',
        'android consciousness',
        'space station colony',
        'technological singularity'
      ];
      
      let allBooks: EnhancedBookSuggestion[] = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      // Try multiple search terms to get enough books
      while (allBooks.length < 24 && attempts < maxAttempts) {
        const randomTerm = sciFiSearchTerms[Math.floor(Math.random() * sciFiSearchTerms.length)];
        const startIndex = Math.floor(Math.random() * 30);
        
        console.log(`Attempt ${attempts + 1}: Searching for: "${randomTerm}" at index: ${startIndex}`);
        
        try {
          const results = await searchBooksEnhanced(randomTerm, 40, startIndex);
          console.log(`Got ${results.length} results for "${randomTerm}"`);
          
          // Add new books, avoiding duplicates
          const newBooks = results.filter(book => 
            !allBooks.some(existing => existing.id === book.id)
          );
          
          allBooks.push(...newBooks);
          console.log(`Total unique books so far: ${allBooks.length}`);
          
          // If we got good results, break early
          if (results.length > 10) {
            break;
          }
        } catch (error) {
          console.error(`Search failed for "${randomTerm}":`, error);
        }
        
        attempts++;
      }
      
      console.log(`Final book count before shuffle: ${allBooks.length}`);
      
      // Shuffle and take exactly 24 books
      const shuffled = allBooks
        .sort(() => Math.random() - 0.5)
        .slice(0, 24);
        
      console.log('Final books to display:', shuffled.length);
      setBooks(shuffled);
      
      if (shuffled.length === 0) {
        console.warn('No books found after all attempts');
        toast({
          title: "No Books Found",
          description: "Unable to load sci-fi books. Please try again.",
          variant: "destructive",
        });
      } else if (shuffled.length < 24) {
        console.warn(`Only found ${shuffled.length} books instead of 24`);
        toast({
          title: "Partial Results",
          description: `Loaded ${shuffled.length} sci-fi books. Try scanning again for more.`,
        });
      }
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load sci-fi books. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToTransmissions = async (book: EnhancedBookSuggestion) => {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
            
            <Button
              onClick={loadRandomBooks}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Scanning the Archive...' : 'Discover Sci-Fi Books'}
            </Button>
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
                onClick={loadRandomBooks}
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
