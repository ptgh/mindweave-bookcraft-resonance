import React from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuerySuggestionsProps {
  currentQuery?: string;
  results?: Array<{ title: string; author: string }>;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

// Generate contextual suggestions based on current query and results
function generateSuggestions(
  currentQuery?: string,
  results?: Array<{ title: string; author: string }>
): string[] {
  const suggestions: string[] = [];

  // If we have results, suggest related searches
  if (results && results.length > 0) {
    const authors = [...new Set(results.slice(0, 3).map(r => r.author))];
    if (authors.length > 0) {
      suggestions.push(`More by ${authors[0]}`);
    }
    
    // Suggest finding similar books
    if (results[0]?.title) {
      suggestions.push(`Books similar to ${results[0].title}`);
    }
  }

  // Parse query for contextual suggestions
  if (currentQuery) {
    const lowerQuery = currentQuery.toLowerCase();
    
    // Suggest narrowing down
    if (!lowerQuery.includes('hard sf') && !lowerQuery.includes('hard sci')) {
      suggestions.push(`${currentQuery} + hard SF`);
    }
    
    if (!lowerQuery.includes('award') && !lowerQuery.includes('hugo') && !lowerQuery.includes('nebula')) {
      suggestions.push(`Award-winning ${currentQuery.toLowerCase()}`);
    }

    if (!lowerQuery.includes('recent') && !lowerQuery.includes('new') && !lowerQuery.includes('2020')) {
      suggestions.push(`Recent ${currentQuery.toLowerCase()} (2020+)`);
    }
  }

  // Add some default suggestions if we don't have enough
  const defaultSuggestions = [
    'First contact with realistic aliens',
    'Near-future climate fiction',
    'AI that explores consciousness',
    'Generation ship stories',
    'Hopeful post-apocalyptic',
    'Linguistics and language in SF',
    'Military SF with moral complexity',
    'Solarpunk optimistic futures',
  ];

  while (suggestions.length < 4) {
    const random = defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];
    if (!suggestions.includes(random)) {
      suggestions.push(random);
    }
  }

  return suggestions.slice(0, 4);
}

export const QuerySuggestions: React.FC<QuerySuggestionsProps> = ({
  currentQuery,
  results,
  onSuggestionClick,
  className,
}) => {
  const suggestions = React.useMemo(
    () => generateSuggestions(currentQuery, results),
    [currentQuery, results]
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Lightbulb className="h-4 w-4" />
        <span>Related searches</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-slate-800/30 border border-slate-700/50',
              'hover:bg-slate-800/50 hover:border-blue-500/30',
              'text-sm text-slate-300 hover:text-blue-300',
              'transition-all duration-200'
            )}
          >
            <Sparkles className="h-3 w-3 text-slate-500 group-hover:text-blue-400" />
            <span>{suggestion}</span>
            <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuerySuggestions;
