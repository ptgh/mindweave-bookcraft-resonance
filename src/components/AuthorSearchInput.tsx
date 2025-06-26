
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
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    console.log('Author search effect triggered, value:', value, 'length:', value.length, 'justSelected:', justSelected);
    
    // If we just selected an author, don't trigger search
    if (justSelected) {
      console.log('Skipping search due to recent selection');
      return;
    }
    
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
        // Don't show results if we just made a selection
        if (!justSelected) {
          console.log('Setting author suggestions:', results);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
        setIsLoading(false);
      }
    );

    setIsLoading(true);
  }, [value, allAuthors, justSelected]);

  const handleSuggestionClick = (author: ScifiAuthor) => {
    console.log('Author selected:', author);
    
    // Set the flag to prevent search from triggering
    setJustSelected(true);
    
    // Cancel any pending searches
    const currentSearchKey = `author-search-${value}`;
    searchDebouncer.cancel(currentSearchKey);
    
    // Immediately hide all suggestions and loading state
    setIsLoading(false);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Remove focus from input to prevent blur event issues
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Notify parent component of selection
    onAuthorSelect(author);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setJustSelected(false);
    }, 100);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length >= 1 && !justSelected) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Only hide suggestions if we haven't just selected an author
    if (!justSelected) {
      // Delay hiding suggestions to allow click events
      setTimeout(() => setShowSuggestions(false), 200);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Reset the selection flag when user starts typing again
    if (justSelected && newValue !== value) {
      setJustSelected(false);
    }
    onValueChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="bg-slate-700 border-slate-600 text-slate-200"
        disabled={disabled}
      />
      
      {isLoading && !justSelected && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && !justSelected && (
        <div className="absolute z-[99999] w-full mt-2 bg-slate-800 border border-slate-600 rounded-md shadow-2xl max-h-60 overflow-y-auto backdrop-blur-sm">
          {suggestions.map((author) => (
            <button
              key={author.id}
              onClick={() => handleSuggestionClick(author)}
              className="w-full px-3 py-2 text-left hover:bg-slate-600 text-sm transition-colors"
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
