
import AuthorSearch from "@/components/AuthorSearch";
import { SearchResult } from "@/services/searchService";

interface AuthorMatrixHeaderProps {
  searchResults: SearchResult[];
  onResults: (results: SearchResult[]) => void;
  onResultSelect: (result: SearchResult) => void;
}

const AuthorMatrixHeader = ({ searchResults, onResults, onResultSelect }: AuthorMatrixHeaderProps) => {
  return (
    <div className="feature-block text-center mb-6 sm:mb-8">
      <h1 className="hero-title text-2xl sm:text-3xl font-light text-slate-200 mb-2 tracking-wider">
        Author Matrix
      </h1>
      <p className="text-slate-400 text-sm mb-4 sm:mb-6">
        Navigate the consciousness territories of science fiction masters
      </p>
      
      <AuthorSearch
        onResults={onResults}
        onResultSelect={onResultSelect}
        searchResults={searchResults}
      />
    </div>
  );
};

export default AuthorMatrixHeader;
