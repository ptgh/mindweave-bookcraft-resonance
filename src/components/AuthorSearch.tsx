
import { memo } from "react";
import SearchInput from "./SearchInput";
import { SearchResult } from "@/services/searchService";

interface AuthorSearchProps {
  onResults: (results: SearchResult[]) => void;
  onResultSelect: (result: SearchResult) => void;
  searchResults: SearchResult[];
  onQueryChange?: (query: string) => void;
}

const AuthorSearch = memo(({ onResults, onResultSelect, searchResults, onQueryChange }: AuthorSearchProps) => {
  return (
    <div className="max-w-2xl mx-auto relative">
      <SearchInput 
        onResults={onResults}
        onQueryChange={onQueryChange}
        placeholder="Search authors and books..."
      />
      {/* Dropdown hidden for Author Matrix - highlighting happens in author list instead */}
    </div>
  );
});

AuthorSearch.displayName = 'AuthorSearch';

export default AuthorSearch;
