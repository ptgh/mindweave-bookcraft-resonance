
import { memo } from "react";
import SearchInput from "./SearchInput";
import { SearchResult } from "@/services/searchService";

interface AuthorSearchProps {
  onResults: (results: SearchResult[]) => void;
  onResultSelect: (result: SearchResult) => void;
  searchResults: SearchResult[];
}

const AuthorSearch = memo(({ onResults, onResultSelect, searchResults }: AuthorSearchProps) => {
  return (
    <div className="max-w-2xl mx-auto relative">
      <SearchInput 
        onResults={onResults}
        placeholder="Search authors and books..."
      />
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {searchResults.filter(r => r.type === 'author').map((result, index) => (
            <button
              key={index}
              onClick={() => onResultSelect(result)}
              className="w-full p-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 touch-manipulation"
            >
              <h3 className="font-medium text-slate-200">{result.title}</h3>
              <p className="text-sm text-slate-400">{result.subtitle}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

AuthorSearch.displayName = 'AuthorSearch';

export default AuthorSearch;
