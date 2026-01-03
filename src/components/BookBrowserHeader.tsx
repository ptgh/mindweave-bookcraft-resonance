
import { useState, useEffect, useCallback } from "react";
import { StandardButton } from "./ui/standard-button";
import { Input } from "./ui/input";
import { Search, X, User } from "lucide-react";
import { getScifiAuthors, getAuthorBooks, ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { searchDebouncer } from "@/services/debounced-search";
import { supabase } from "@/integrations/supabase/client";

interface BookBrowserHeaderProps {
  loading: boolean;
  onDiscover: () => void;
  userBooksCount?: number;
  onSearchResults?: (books: EnhancedBookSuggestion[], author?: ScifiAuthor) => void;
  onClearSearch?: () => void;
}

const BookBrowserHeader = ({ 
  loading, 
  onDiscover, 
  userBooksCount = 0,
  onSearchResults,
  onClearSearch
}: BookBrowserHeaderProps) => {
  const isAiEnabled = userBooksCount >= 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{type: 'author' | 'book', data: any}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [authors, setAuthors] = useState<ScifiAuthor[]>([]);
  const [activeSearch, setActiveSearch] = useState<{type: 'author' | 'title', name: string} | null>(null);

  // Load authors on mount
  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const authorsData = await getScifiAuthors();
        setAuthors(authorsData);
      } catch (error) {
        console.error('Error loading authors for search:', error);
      }
    };
    loadAuthors();
  }, []);

  // Search as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const searchKey = `signal-search-${searchQuery}`;
    
    searchDebouncer.search(
      searchKey,
      async () => {
        const query = searchQuery.toLowerCase().trim();
        const results: {type: 'author' | 'book', data: any}[] = [];
        
        // Search authors first
        const matchingAuthors = authors.filter(a => 
          a.name.toLowerCase().includes(query)
        ).slice(0, 5);
        
        matchingAuthors.forEach(author => {
          results.push({ type: 'author', data: author });
        });
        
        // Also search film adaptations for source books
        try {
          const { data: filmBooks } = await supabase
            .from('sf_film_adaptations')
            .select('id, book_title, book_author, book_cover_url')
            .neq('adaptation_type', 'original')
            .or(`book_title.ilike.%${query}%,book_author.ilike.%${query}%`)
            .limit(5);
          
          if (filmBooks) {
            const seenTitles = new Set<string>();
            filmBooks.forEach(book => {
              const key = `${book.book_title}-${book.book_author}`.toLowerCase();
              if (!seenTitles.has(key)) {
                seenTitles.add(key);
                results.push({
                  type: 'book',
                  data: {
                    id: `film-${book.id}`,
                    title: book.book_title,
                    author: book.book_author,
                    coverUrl: book.book_cover_url
                  }
                });
              }
            });
          }
        } catch (e) {
          console.error('Film books search error:', e);
        }
        
        // Search publisher books
        try {
          const { data: pubBooks } = await supabase
            .from('publisher_books')
            .select('id, title, author, cover_url')
            .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
            .limit(5);
          
          if (pubBooks) {
            pubBooks.forEach(book => {
              results.push({
                type: 'book',
                data: {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  coverUrl: book.cover_url
                }
              });
            });
          }
        } catch (e) {
          console.error('Publisher books search error:', e);
        }
        
        return results;
      },
      (results) => {
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsSearching(false);
      }
    );
  }, [searchQuery, authors]);

  const handleAuthorSelect = useCallback(async (author: ScifiAuthor) => {
    setShowSuggestions(false);
    setSearchQuery(author.name);
    setActiveSearch({ type: 'author', name: author.name });
    
    if (!onSearchResults) return;
    
    try {
      // Get books from database
      const dbBooks = await getAuthorBooks(author.id);
      
      // Transform to EnhancedBookSuggestion
      const books: EnhancedBookSuggestion[] = dbBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: author.name,
        coverUrl: book.cover_url || '',
        thumbnailUrl: book.cover_url || '',
        smallThumbnailUrl: book.cover_url || '',
        description: book.description || '',
        categories: book.categories || [],
        previewLink: book.preview_link || '',
        infoLink: book.info_link || ''
      }));
      
      // Also search Google Books for additional titles
      searchDebouncer.search(
        `author-books-${author.id}`,
        () => searchBooksEnhanced(author.name, 20, 0, author.name),
        (googleBooks: EnhancedBookSuggestion[]) => {
          if (googleBooks && googleBooks.length > 0) {
            const byTitle = new Map<string, EnhancedBookSuggestion>();
            books.forEach(b => byTitle.set(b.title.toLowerCase(), b));
            googleBooks.forEach(b => {
              const key = b.title.toLowerCase();
              if (!byTitle.has(key)) byTitle.set(key, b);
            });
            onSearchResults(Array.from(byTitle.values()), author);
          }
        }
      );
      
      onSearchResults(books, author);
    } catch (error) {
      console.error('Error loading author books:', error);
    }
  }, [onSearchResults]);

  const handleBookSelect = useCallback((book: any) => {
    setShowSuggestions(false);
    setSearchQuery(book.title);
    setActiveSearch({ type: 'title', name: book.title });
    
    if (onSearchResults) {
      onSearchResults([{
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl || '',
        thumbnailUrl: book.coverUrl || '',
        smallThumbnailUrl: book.coverUrl || '',
        description: '',
        categories: ['Science Fiction']
      }]);
    }
  }, [onSearchResults]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearch(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onClearSearch?.();
  }, [onClearSearch]);

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };
  
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Signal Collection
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Discover your next science fiction transmission through the quantum field of possibilities
      </p>
      
      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search titles and authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={handleInputBlur}
            className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
          {(searchQuery || activeSearch) && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={`${item.type}-${item.data.id || idx}`}
                onClick={() => item.type === 'author' ? handleAuthorSelect(item.data) : handleBookSelect(item.data)}
                className="w-full px-4 py-3 text-left hover:bg-slate-700/50 flex items-center gap-3 border-b border-slate-700/50 last:border-0"
              >
                {item.type === 'author' ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium">{item.data.name}</div>
                      <div className="text-slate-400 text-xs">{item.data.nationality || 'Author'} • Click to view books</div>
                    </div>
                  </>
                ) : (
                  <>
                    {item.data.coverUrl ? (
                      <img 
                        src={item.data.coverUrl} 
                        alt={item.data.title}
                        className="w-8 h-12 object-cover rounded flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-8 h-12 bg-slate-700 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 font-medium truncate">{item.data.title}</div>
                      <div className="text-slate-400 text-xs truncate">{item.data.author}</div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Active Search Indicator */}
      {activeSearch && (
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-slate-400 text-sm">
            Showing {activeSearch.type === 'author' ? 'books by' : 'results for'}:
          </span>
          <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm">
            {activeSearch.name}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2">
        <StandardButton
          onClick={onDiscover}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <span>{loading ? 'Scanning Signals...' : 'Scan Signal Collection'}</span>
          {isAiEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded text-[10px] text-[#89b4fa] ml-2">
              ✨ AI
            </span>
          )}
        </StandardButton>
      </div>
    </div>
  );
};

export default BookBrowserHeader;
