import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  label: string;
  subtitle?: string;
}

interface ProfileSearchInputProps {
  type: 'author' | 'book';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
}

export const ProfileSearchInput = ({ type, value, onChange, placeholder, maxLength, id }: ProfileSearchInputProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchAuthors = async (term: string): Promise<SearchResult[]> => {
    const { data } = await supabase
      .from('scifi_authors')
      .select('name, nationality')
      .ilike('name', `%${term}%`)
      .order('name')
      .limit(8);

    return (data || []).map(a => ({
      label: a.name,
      subtitle: a.nationality || undefined,
    }));
  };

  const searchBooks = async (term: string): Promise<SearchResult[]> => {
    // Search both author_books and publisher_books in parallel
    const [authorBooks, publisherBooks] = await Promise.all([
      supabase
        .from('author_books')
        .select('title, author_id')
        .ilike('title', `%${term}%`)
        .limit(6),
      supabase
        .from('publisher_books')
        .select('title, author')
        .ilike('title', `%${term}%`)
        .limit(6),
    ]);

    const seen = new Set<string>();
    const combined: SearchResult[] = [];

    for (const b of authorBooks.data || []) {
      const key = b.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({ label: b.title });
      }
    }
    for (const b of publisherBooks.data || []) {
      const key = b.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({ label: b.title, subtitle: b.author || undefined });
      }
    }

    return combined.slice(0, 8);
  };

  const doSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = type === 'author' ? await searchAuthors(term) : await searchBooks(term);
      setResults(res);
      setIsOpen(res.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const handleChange = (val: string) => {
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 250);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.label);
    onChange(result.label);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="bg-slate-800/50 border-slate-600 text-sm pl-8 pr-8"
          maxLength={maxLength}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[99999] bottom-full mb-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-xs text-slate-400">Searching...</div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.label}-${i}`}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700/80 transition-colors border-b border-slate-700/50 last:border-0"
              >
                <span className="block text-sm font-medium text-slate-100 truncate">{r.label}</span>
                {r.subtitle && (
                  <span className="block text-xs text-slate-400 truncate">{r.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
