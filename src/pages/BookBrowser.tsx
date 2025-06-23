
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
      // Search for various sci-fi related terms to get diverse results
      const searchTerms = [
        'science fiction',
        'space opera',
        'cyberpunk',
        'dystopian',
        'time travel',
        'alien',
        'robot',
        'future',
        'mars',
        'artificial intelligence'
      ];
      
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const startIndex = Math.floor(Math.random() * 100);
      
      const results = await searchBooks(randomTerm, 20, startIndex);
      
      // Shuffle the results for more randomness
      const shuffled = results.sort(() => Math.random() - 0.5);
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
        tags: book.categories?.join(', ') || '',
        resonance_labels: '',
        notes: book.subtitle || '',
        status: 'want_to_read'
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
              Book Browser
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Discover your next literary transmission through the quantum field of possibilities
            </p>
            
            <Button
              onClick={loadRandomBooks}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Scanning the Archive...' : 'Discover New Books'}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <div className="text-slate-400 text-center p-4">
                          <div className="text-lg font-medium mb-1">{book.title}</div>
                          <div className="text-sm opacity-75">{book.author}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => addToTransmissions(book)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        Add to Library
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium text-slate-200 text-sm line-clamp-2 mb-1">
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
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Books Found</h3>
              <p className="text-slate-400 text-sm mb-4">
                The archive scan returned empty. Try discovering new books.
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
              <span>Archive status: {books.length} books discovered</span>
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
