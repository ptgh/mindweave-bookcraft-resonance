import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TagSuggestion {
  name: string;
  confidence: number;
  reason: string;
}

interface AITagSuggestionsProps {
  title: string;
  author: string;
  description?: string;
  currentTags: string[];
  onTagSelect: (tag: string) => void;
  userTaggingPatterns?: string[];
  autoApply?: boolean; // Auto-apply high confidence suggestions
}

export const AITagSuggestions = ({
  title,
  author,
  description,
  currentTags,
  onTagSelect,
  userTaggingPatterns,
  autoApply = false,
}: AITagSuggestionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const { toast } = useToast();

  // Auto-load suggestions when autoApply is enabled and title/author are present
  useEffect(() => {
    if (autoApply && title && author && !hasLoaded && !isLoading && currentTags.length === 0) {
      loadSuggestions(true);
    }
  }, [autoApply, title, author, hasLoaded, isLoading, currentTags.length]);

  const loadSuggestions = async (silent = false) => {
    if (hasLoaded && !silent) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    if (!silent) setIsExpanded(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tag-suggestions', {
        body: {
          title,
          author,
          description,
          currentTags,
          userTaggingPatterns,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setHasLoaded(true);
        
        // Auto-apply high confidence tags if enabled and no tags selected yet
        if (autoApply && currentTags.length === 0 && !autoApplied) {
          const highConfidenceTags = data.suggestions
            .filter((s: TagSuggestion) => s.confidence >= 75)
            .slice(0, 3);
          
          if (highConfidenceTags.length > 0) {
            highConfidenceTags.forEach((s: TagSuggestion) => {
              if (!currentTags.includes(s.name)) {
                onTagSelect(s.name);
              }
            });
            setAutoApplied(true);
            
            if (!silent) {
              toast({
                title: 'AI Tags Applied',
                description: `Added ${highConfidenceTags.length} suggested conceptual nodes`,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load tag suggestions:', error);
      if (!silent) {
        toast({
          title: 'Failed to load suggestions',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTag = (tag: string) => {
    if (!currentTags.includes(tag)) {
      onTagSelect(tag);
    }
  };

  const handleAcceptAll = () => {
    suggestions.forEach((s) => {
      if (!currentTags.includes(s.name)) {
        onTagSelect(s.name);
      }
    });
    setIsExpanded(false);
  };

  // Filter out tags already selected
  const availableSuggestions = suggestions.filter(
    (s) => !currentTags.includes(s.name)
  );

  if (availableSuggestions.length === 0 && hasLoaded) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => loadSuggestions(false)}
        disabled={isLoading}
        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        AI Suggestions
        {hasLoaded && availableSuggestions.length > 0 && (
          <span className="ml-1">({availableSuggestions.length})</span>
        )}
        {hasLoaded && (isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
      </Button>

      {isExpanded && availableSuggestions.length > 0 && (
        <div className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2 animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => handleAcceptTag(suggestion.name)}
                className="group relative"
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all"
                  style={{ opacity: Math.max(0.6, suggestion.confidence / 100) }}
                >
                  {suggestion.name}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {suggestion.confidence}%
                  </span>
                </Badge>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 text-xs bg-popover text-popover-foreground rounded-md shadow-lg border border-border">
                  {suggestion.reason}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-7 text-xs"
            >
              Dismiss
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAcceptAll}
              className="h-7 text-xs gap-1"
            >
              <Wand2 className="h-3 w-3" />
              Accept All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
