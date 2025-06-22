
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { searchBooks, BookSuggestion } from "@/services/googleBooksApi";

interface BookSearchInputProps {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onBookSelect: (book: BookSuggestion) => void;
  disabled?: boolean;
}

const BookSearchInput = ({ 
  placeholder, 
  value, 
  onValueChange, 
  onBookSelect,
  disabled 
}: BookSearchInputProps) => {
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchBooks(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSuggestionClick = (book: BookSuggestion) => {
    onBookSelect(book);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
