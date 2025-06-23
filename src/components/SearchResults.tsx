
import { SearchResult } from "@/services/searchService";
import { Button } from "@/components/ui/button";
import { Book, User, FileText } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

const SearchResults = ({ results, onSelectResult }: SearchResultsProps) => {
  if (results.length === 0) return null;

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'author':
        return <User className="w-4 h-4" />;
      case 'book':
        return <Book className="w-4 h-4" />;
      case 'transmission':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'author':
        return 'Author';
      case 'book':
        return 'Book';
      case 'transmission':
        return 'Transmission';
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <button
          key={`${result.type}-${result.id}-${index}`}
          onClick={() => onSelectResult(result)}
          className="w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 focus:outline-none focus:bg-slate-700"
        >
          <div className="flex items-start space-x-3">
            {result.coverUrl && (
              <img
                src={result.coverUrl}
                alt={result.title}
                className="w-12 h-16 object-cover rounded bg-slate-700 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getIcon(result.type)}
                <span className="text-xs text-blue-400 font-medium">
                  {getTypeLabel(result.type)}
                </span>
              </div>
              <h3 className="font-medium text-slate-200 truncate">{result.title}</h3>
              {result.author && (
                <p className="text-sm text-slate-400 truncate">by {result.author}</p>
              )}
              {result.subtitle && (
                <p className="text-sm text-slate-400 truncate">{result.subtitle}</p>
              )}
              {result.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {result.description}
                </p>
              )}
              {result.notableWorks && result.notableWorks.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Notable works: {result.notableWorks.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SearchResults;
