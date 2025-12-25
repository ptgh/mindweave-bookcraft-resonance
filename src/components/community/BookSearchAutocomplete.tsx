import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, BookOpen, Library, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { searchBooksEnhanced } from '@/services/googleBooksApi';
import gsap from 'gsap';

interface BookResult {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  source: 'library' | 'google';
  isbn?: string;
  transmission_id?: number;
}

interface BookSearchAutocompleteProps {
  onSelect: (book: BookResult) => void;
  placeholder?: string;
  className?: string;
}

export const BookSearchAutocomplete: React.FC<BookSearchAutocompleteProps> = ({
  onSelect,
  placeholder = "Search for a book...",
  className
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const allResults: BookResult[] = [];

        // Search user's library first
        if (user) {
          const { data: transmissions } = await supabase
            .from('transmissions')
            .select('id, title, author, cover_url, isbn')
            .eq('user_id', user.id)
            .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
            .limit(5);

          if (transmissions) {
            allResults.push(...transmissions.map(t => ({
              id: `lib-${t.id}`,
              title: t.title || '',
              author: t.author || '',
              cover_url: t.cover_url || undefined,
              source: 'library' as const,
              isbn: t.isbn || undefined,
              transmission_id: t.id
            })));
          }
        }

        // Then search Google Books (sci-fi only)
        const googleBooks = await searchBooksEnhanced(query, 5);
        allResults.push(...googleBooks.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          cover_url: b.coverUrl,
          source: 'google' as const,
          isbn: b.isbn
        })));

        setResults(allResults);
        setShowDropdown(allResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, user]);

  // Animate results
  useEffect(() => {
    if (showDropdown && results.length > 0 && dropdownRef.current) {
      gsap.fromTo(
        resultsRef.current.filter(Boolean),
        { opacity: 0, y: -10 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.2, 
          stagger: 0.05, 
          ease: 'power2.out' 
        }
      );
    }
  }, [showDropdown, results]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((book: BookResult) => {
    onSelect(book);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }, [onSelect]);

  const libraryResults = results.filter(r => r.source === 'library');
  const googleResults = results.filter(r => r.source === 'google');

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {/* Library Results */}
          {libraryResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-emerald-400 flex items-center gap-2 border-b border-slate-700/50">
                <Library className="w-3 h-3" />
                From Your Library
              </div>
              {libraryResults.map((book, index) => (
                <button
                  key={book.id}
                  ref={el => { resultsRef.current[index] = el; }}
                  onClick={() => handleSelect(book)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left"
                >
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-slate-700 rounded flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{book.title}</p>
                    <p className="text-xs text-slate-400 truncate">{book.author}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Google Books Results */}
          {googleResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-blue-400 flex items-center gap-2 border-b border-slate-700/50">
                <Search className="w-3 h-3" />
                Search Results (Sci-Fi)
              </div>
              {googleResults.map((book, index) => (
                <button
                  key={book.id}
                  ref={el => { resultsRef.current[libraryResults.length + index] = el; }}
                  onClick={() => handleSelect(book)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left"
                >
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-slate-700 rounded flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{book.title}</p>
                    <p className="text-xs text-slate-400 truncate">{book.author}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && query.length >= 2 && (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              No sci-fi books found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
