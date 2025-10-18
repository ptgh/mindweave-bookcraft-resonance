
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { searchBooksEnhanced, EnhancedBookSuggestion } from "@/services/googleBooksApi";
import { searchDebouncer } from "@/services/debounced-search";

interface BookSearchInputProps {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onBookSelect: (book: EnhancedBookSuggestion) => void;
  disabled?: boolean;
  authorFilter?: string; // Filter results by author
  isEditMode?: boolean; // Disable suggestions when editing existing book
}

const BookSearchInput = ({ 
  placeholder, 
  value, 
  onValueChange, 
  onBookSelect,
  disabled,
  authorFilter,
  isEditMode = false
}: BookSearchInputProps) => {
  const [suggestions, setSuggestions] = useState<EnhancedBookSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Don't search in edit mode or if just selected
    if (isEditMode || justSelected) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    console.log('Book search triggered for:', value);
    setIsLoading(true);
    
    const searchKey = `book-search-${value}`;
    
    searchDebouncer.search(
      searchKey,
      async () => {
        console.log('Executing book search for:', value, 'with author filter:', authorFilter);
        const results = await searchBooksEnhanced(value, 10, 0, authorFilter);
        console.log('Book search results:', results);
        return results;
      },
      (results) => {
        console.log('Setting book suggestions:', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0 && !justSelected);
        setIsLoading(false);
      }
    );
  }, [value, authorFilter, isEditMode, justSelected]);

  const handleSuggestionClick = (book: EnhancedBookSuggestion) => {
    console.log('Book suggestion clicked:', book);
    
    // Cancel any pending searches
    searchDebouncer.cancel(`book-search-${value}`);
    
    // Set flag to prevent dropdown from reopening
    setJustSelected(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(false);
    
    // Blur the input to prevent refocus from showing dropdown
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    onBookSelect(book);
    
    // Reset flag after a delay
    setTimeout(() => {
      setJustSelected(false);
    }, 300);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length >= 2 && !justSelected) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputChange = (newValue: string) => {
    // Reset justSelected flag when user starts typing again
    if (justSelected) {
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
        onChange={(e) => handleInputChange(e.target.value)}
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
        <div className="absolute z-[99999] w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((book) => (
            <button
              key={book.id}
              onClick={() => handleSuggestionClick(book)}
              className="w-full px-3 py-2 text-left hover:bg-slate-600 flex items-center space-x-3 text-sm"
            >
              {book.coverUrl && (
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-8 h-10 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-slate-200 font-medium truncate">{book.title}</div>
                <div className="text-slate-400 text-xs truncate">{book.author}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookSearchInput;
