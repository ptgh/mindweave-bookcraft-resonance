
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getScifiAuthors, ScifiAuthor } from "@/services/scifiAuthorsService";
import { searchDebouncer } from "@/services/debounced-search";

interface AuthorSearchInputProps {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onAuthorSelect: (author: ScifiAuthor) => void;
  disabled?: boolean;
}

const AuthorSearchInput = ({ 
  placeholder, 
  value, 
  onValueChange, 
  onAuthorSelect,
  disabled 
}: AuthorSearchInputProps) => {
  const [suggestions, setSuggestions] = useState<ScifiAuthor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allAuthors, setAllAuthors] = useState<ScifiAuthor[]>([]);

  // Load all authors on component mount
  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const authors = await getScifiAuthors();
        setAllAuthors(authors);
      } catch (error) {
        console.error('Error loading authors:', error);
      }
    };
    loadAuthors();
  }, []);

  // Filter authors based on search input
  useEffect(() => {
    console.log('Author search effect triggered, value:', value, 'length:', value.length);
    
    if (value.length < 1) {
      console.log('Clearing suggestions due to empty value');
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    const searchKey = `author-search-${value}`;
    
    searchDebouncer.search(
      searchKey,
      async () => {
        console.log('Filtering authors for:', value);
        const filtered = allAuthors.filter(author =>
          author.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 10); // Limit to 10 suggestions
        return filtered;
      },
      (results) => {
        console.log('Setting author suggestions:', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsLoading(false);
      }
    );

    setIsLoading(true);
  }, [value, allAuthors]);

  const handleSuggestionClick = (author: ScifiAuthor) => {
    console.log('Author selected:', author);
    
    // Cancel any pending searches first
    const currentSearchKey = `author-search-${value}`;
    searchDebouncer.cancel(currentSearchKey);
    
    // Clear all search state immediately
    setIsLoading(false);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Clear the input value - this should trigger the parent to update
    onValueChange('');
    
    // Notify parent component of selection
    onAuthorSelect(author);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length >= 1) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="bg-slate-700 border-slate-600 text-slate-200"
        disabled={disabled}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((author) => (
            <button
              key={author.id}
              onClick={() => handleSuggestionClick(author)}
              className="w-full px-3 py-2 text-left hover:bg-slate-600 text-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 font-medium truncate">{author.name}</div>
                {author.nationality && (
                  <div className="text-slate-400 text-xs truncate">{author.nationality}</div>
                )}
                {author.notable_works && author.notable_works.length > 0 && (
                  <div className="text-slate-500 text-xs truncate">
                    Notable: {author.notable_works.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthorSearchInput;
