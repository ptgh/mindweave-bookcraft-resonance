
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { searchBooks, BookSuggestion } from "@/services/googleBooksApi";
import { saveTransmission } from "@/services/transmissionsService";

const BookBrowser = () => {
  const [books, setBooks] = useState<BookSuggestion[]>([]);
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
        }, index * 100);
      });
    }
  }, [books]);

  const loadRandomBooks = async () => {
    setLoading(true);
    setVisibleBooks(new Set());
    
    try {
      // Search for sci-fi specific terms to get sci-fi results only
      const sciFiSearchTerms = [
        'science fiction space',
        'cyberpunk dystopian',
        'time travel sci-fi',
        'alien invasion',
        'robot artificial intelligence',
        'future technology',
        'space exploration',
        'galactic empire',
        'terraforming mars',
        'quantum physics fiction',
        'genetic engineering sci-fi',
        'virtual reality cyberpunk',
        'post apocalyptic future',
        'interstellar travel',
        'clone wars science fiction'
      ];
      
      const randomTerm = sciFiSearchTerms[Math.floor(Math.random() * sciFiSearchTerms.length)];
      const startIndex = Math.floor(Math.random() * 100);
      
      const results = await searchBooks(randomTerm, 20, startIndex);
      
      // Filter results to ensure they are sci-fi related
      const sciFiBooks = results.filter(book => {
        const title = book.title.toLowerCase();
        const categories = book.categories || [];
        const categoryText = categories.join(' ').toLowerCase();
        
        return categoryText.includes('science fiction') || 
               categoryText.includes('sci-fi') ||
               categoryText.includes('cyberpunk') ||
               categoryText.includes('dystopian') ||
               title.includes('space') ||
               title.includes('future') ||
               title.includes('robot') ||
               title.includes('alien') ||
               title.includes('cyber') ||
               title.includes('time travel');
      });
      
      // Shuffle the results for more randomness
      const shuffled = sciFiBooks.sort(() => Math.random() - 0.5);
      setBooks(shuffled);
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToTransmissions = async (book: BookSuggestion) => {
    try {
      await saveTransmission({
        title: book.title,
        author: book.author || 'Unknown',
        cover_url: book.coverUrl || '',
        tags: book.categories || [],
        rating: {},
        notes: book.subtitle || '',
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {books.map((book, index) => (
                <Card
                  key={`${book.id}-${index}`}
                  className={`group relative overflow-hidden bg-slate-800/50 border-slate-700 hover:border-blue-400/50 transition-all duration-500 ${
                    visibleBooks.has(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    
                    {/* Stylized placeholder for missing covers */}
                    <div className={`w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex flex-col items-center justify-center p-3 ${book.coverUrl ? 'hidden' : ''}`}>
                      <div className="w-8 h-8 mb-2 rounded-full bg-blue-400/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-400 rounded-sm opacity-60"></div>
                      </div>
                      <div className="text-slate-300 text-center">
                        <div className="text-xs font-medium mb-1 line-clamp-2">{book.title}</div>
                        <div className="text-xs opacity-75 line-clamp-1">{book.author}</div>
                      </div>
                      <div className="mt-2 flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full opacity-40"></div>
                        <div className="w-1 h-1 bg-cyan-400 rounded-full opacity-60"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full opacity-40"></div>
                      </div>
                    </div>
                    
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
              <span>Quantum field: Stable</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default BookBrowser;
