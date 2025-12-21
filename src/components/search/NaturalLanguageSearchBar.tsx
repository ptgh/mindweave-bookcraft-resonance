import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Mic, Loader2, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRecentSearches, getPopularSearches } from '@/services/semanticSearchService';

interface NaturalLanguageSearchBarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const EXAMPLE_PLACEHOLDERS = [
  'Books like Dune but with female protagonists',
  'Hard SF with optimistic futures',
  'First contact stories with linguistics focus',
  'Space opera under 300 pages',
  'Cyberpunk noir mysteries',
  'Time travel paradox stories',
  'AI consciousness exploration',
];

export const NaturalLanguageSearchBar: React.FC<NaturalLanguageSearchBarProps> = ({
  onSearch,
  isSearching = false,
  placeholder,
  className,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  // Rotate placeholder examples
  useEffect(() => {
    if (!placeholder) {
      const interval = setInterval(() => {
        setCurrentPlaceholder(prev => (prev + 1) % EXAMPLE_PLACEHOLDERS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [placeholder]);

  // Fetch suggestions when focused
  useEffect(() => {
    if (isFocused && query.length === 0) {
      Promise.all([
        getRecentSearches(5),
        getPopularSearches(5),
      ]).then(([recent, popular]) => {
        setRecentSearches(recent);
        setPopularSearches(popular);
      });
    }
  }, [isFocused, query]);

  // Handle click outside (needs to include the portal dropdown)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideInput = containerRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      if (!clickedInsideInput && !clickedInsideDropdown) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim().length > 0) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleVoiceInput = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    const SpeechRecognitionConstructor = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onSearch(transcript);
    };

    recognition.start();
  }, [onSearch]);

  const displayPlaceholder = placeholder || EXAMPLE_PLACEHOLDERS[currentPlaceholder];

  const isDropdownOpen =
    showSuggestions &&
    query.length === 0 &&
    (recentSearches.length > 0 || popularSearches.length > 0);

  useLayoutEffect(() => {
    if (!isDropdownOpen) {
      setDropdownPos(null);
      return;
    }

    const updatePos = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);

    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isDropdownOpen]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (query.length === 0) setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={displayPlaceholder}
            autoFocus={autoFocus}
            className={cn(
              'pl-12 pr-24 py-6 text-lg',
              'bg-background border-border',
              'focus:border-primary/50 focus:ring-primary/20',
              'placeholder:text-muted-foreground placeholder:text-base',
              'transition-all duration-300'
            )}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {query.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={cn(
                'h-8 w-8',
                isListening ? 'text-red-400 animate-pulse' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              disabled={query.trim().length === 0 || isSearching}
              size="sm"
              className="h-8 px-3 bg-blue-600 hover:bg-blue-500"
            >
              Search
            </Button>
          </div>
        </div>
      </form>

      {isDropdownOpen && dropdownPos &&
        createPortal(
          <>
            {/* Opaque overlay to prevent seeing/clicking underlying UI */}
            <div
              className="fixed inset-0 z-[9998] bg-background/90"
              onMouseDown={() => setShowSuggestions(false)}
            />

            <div
              ref={dropdownRef}
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
              className="fixed z-[9999] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-2xl max-h-[50vh]"
            >
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-border bg-card">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div className="p-3 bg-card">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    Try Searching For
                  </h4>
                  <div className="space-y-1">
                    {popularSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default NaturalLanguageSearchBar;
