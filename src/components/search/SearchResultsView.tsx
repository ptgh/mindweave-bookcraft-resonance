import React from 'react';
import { BookOpen, Sparkles, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SemanticSearchResult, submitSearchFeedback } from '@/services/semanticSearchService';

function normalizeTags(value: unknown): string[] | undefined {
  if (value == null) return undefined;

  if (Array.isArray(value)) {
    const tags = value.filter((v): v is string => typeof v === 'string');
    return tags.length ? tags : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const tags = parsed.filter((v): v is string => typeof v === 'string');
          return tags.length ? tags : undefined;
        }
      } catch {
        // ignore
      }
    }

    const tags = trimmed
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    return tags.length ? tags : undefined;
  }

  return undefined;
}

interface SearchResultsViewProps {
  results: SemanticSearchResult[];
  query: string;
  isLoading?: boolean;
  responseTimeMs?: number;
  onResultClick?: (result: SemanticSearchResult) => void;
  queryId?: string;
  className?: string;
}

const MatchTypeBadge: React.FC<{ matchType: string }> = ({ matchType }) => {
  const config = {
    semantic: { label: 'AI Match', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    keyword: { label: 'Keyword', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    hybrid: { label: 'Best Match', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };
  
  const { label, className } = config[matchType as keyof typeof config] || config.keyword;
  
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {matchType === 'semantic' && <Sparkles className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
};

const ResultCard: React.FC<{
  result: SemanticSearchResult;
  rank: number;
  onClick?: () => void;
}> = ({ result, rank, onClick }) => {
  const coverUrl = result.metadata?.cover_url as string | undefined;
  const description = result.metadata?.description as string | undefined;
  const tags = normalizeTags(result.metadata?.tags);
  const publicationYear = result.metadata?.publication_year as number | undefined;
  const score = Number.isFinite(result.combinedScore) ? result.combinedScore : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex gap-4 p-4 rounded-lg cursor-pointer',
        'bg-slate-800/30 border border-slate-700/50',
        'hover:bg-slate-800/50 hover:border-blue-500/30',
        'transition-all duration-200'
      )}
    >
      {/* Rank indicator */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-medium text-slate-400">
        {rank}
      </div>

      {/* Cover image */}
      <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-slate-700/30">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={result.title}
            className="w-full h-full object-cover"
            onError={(e) => { 
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${coverUrl ? 'hidden' : ''}`}>
          <BookOpen className="h-6 w-6 text-slate-500" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors truncate flex-1 min-w-0">
            {result.title}
          </h3>
          <div className="flex-shrink-0">
            <MatchTypeBadge matchType={result.matchType} />
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-2">
          {result.author}
          {publicationYear && <span className="text-slate-500"> • {publicationYear}</span>}
        </p>

        {description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-2">
            {description}
          </p>
        )}

        {/* Relevance score */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {Math.round(score * 100)}% relevant
          </span>
          
          {tags && tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
};

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  results,
  query,
  isLoading,
  responseTimeMs,
  onResultClick,
  queryId,
  className,
}) => {
  const [feedbackGiven, setFeedbackGiven] = React.useState(false);

  const handleFeedback = async (wasHelpful: boolean) => {
    if (queryId) {
      await submitSearchFeedback(queryId, wasHelpful);
      setFeedbackGiven(true);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 animate-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700/50" />
            <div className="w-16 h-24 rounded bg-slate-700/50" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-700/50 rounded w-3/4" />
              <div className="h-4 bg-slate-700/50 rounded w-1/2" />
              <div className="h-3 bg-slate-700/50 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No results found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Try different keywords or a more specific description of what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Found <span className="text-slate-200 font-medium">{results.length}</span> results
          {query && (
            <span>
              {' '}for "<span className="text-blue-400">{query}</span>"
            </span>
          )}
          {responseTimeMs !== undefined && (
            <span className="text-slate-500"> in {responseTimeMs}ms</span>
          )}
        </p>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <ResultCard
            key={result.id}
            result={result}
            rank={index + 1}
            onClick={() => onResultClick?.(result)}
          />
        ))}
      </div>

      {/* Feedback section */}
      {queryId && !feedbackGiven && results.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-700/50">
          <span className="text-sm text-slate-400">Were these results helpful?</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(true)}
              className="text-slate-400 hover:text-emerald-400"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(false)}
              className="text-slate-400 hover:text-red-400"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <p className="text-center text-sm text-slate-500 pt-4 border-t border-slate-700/50">
          Thanks for your feedback! It helps us improve search results.
        </p>
      )}
    </div>
  );
};

export default SearchResultsView;
