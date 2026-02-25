
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchResult, searchAll } from "@/services/searchService";

interface SearchInputProps {
  onResults: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
  onQueryChange?: (value: string) => void;
}

const SearchInput = ({ onResults, placeholder = "Search authors, books, or your transmissions...", className = "", onQueryChange }: SearchInputProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const results = await searchAll(query);
          onResults(results);
        } catch (error) {
          console.error('Search failed:', error);
          onResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        onResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, onResults]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  const clearSearch = () => {
    setQuery("");
    onResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-3.5 h-3.5 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-blue-400"
        />
        {query && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default SearchInput;
