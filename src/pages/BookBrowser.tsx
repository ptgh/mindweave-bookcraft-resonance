
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { searchBooks } from "@/services/googleBooksApi";

interface BookCover {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
}

const BookBrowser = () => {
  const [books, setBooks] = useState<BookCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleBooks, setVisibleBooks] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadRandomBooks();
  }, []);

  useEffect(() => {
    // Stagger the fade-in effect
    books.forEach((_, index) => {
      setTimeout(() => {
        setVisibleBooks(prev => new Set([...prev, index]));
      }, index * 100);
    });
  }, [books]);

  const loadRandomBooks = async () => {
    try {
      setLoading(true);
      
      // Get random authors from database
      const { data: authors, error } = await supabase
        .from('scifi_authors')
        .select('name, notable_works')
        .limit(20);

      if (error) throw error;

      const allBooks: BookCover[] = [];
      const randomAuthors = authors?.sort(() => Math.random() - 0.5).slice(0, 10) || [];

      // Fetch books for each author
      for (const author of randomAuthors) {
        if (author.notable_works && author.notable_works.length > 0) {
          const randomWork = author.notable_works[Math.floor(Math.random() * author.notable_works.length)];
          
          try {
            const googleBooks = await searchBooks(`${randomWork} ${author.name}`);
            if (googleBooks.length > 0) {
              const book = googleBooks[0];
              if (book.coverUrl) {
                allBooks.push({
                  id: book.id,
                  title: book.title,
                  author: book.authors?.join(', ') || author.name,
                  coverUrl: book.coverUrl,
                  description: book.description
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch book for ${author.name}:`, error);
          }
        }
      }

      // Shuffle and add more variety
      const shuffledBooks = allBooks.sort(() => Math.random() - 0.5);
      setBooks(shuffledBooks);
      
    } catch (error) {
      console.error('Failed to load books:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load book covers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: BookCover) => {
    toast({
      title: "Book Selected",
      description: `"${book.title}" by ${book.author}`,
    });
  };

  const refreshBooks = () => {
    setVisibleBooks(new Set());
    loadRandomBooks();
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
              Discover random sci-fi classics through their covers
            </p>
            
            <Button
              onClick={refreshBooks}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Collection'}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin" />
              </div>
              <p className="text-slate-400">Loading consciousness fragments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {books.map((book, index) => (
                <div
                  key={`${book.id}-${index}`}
                  className={`group cursor-pointer transition-all duration-1000 transform ${
                    visibleBooks.has(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  onClick={() => handleBookClick(book)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-slate-800">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-1">{book.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && books.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-slate-500" />
              </div>
              <h3 className="text-slate-300 text-lg font-medium mb-2">No books found</h3>
              <p className="text-slate-400 text-sm mb-4">
                Unable to load book covers at this time
              </p>
              <Button
                onClick={refreshBooks}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Consciousness fragments: {books.length} discovered</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Reality index: Fluctuating</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default BookBrowser;
