import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { BookToScreenSection } from '@/components/BookToScreenSection';
import { BookToScreenSelector, FilterMode } from '@/components/BookToScreenSelector';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Database, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { cleanPersonName, truncateWithBreak } from '@/utils/textCleaners';

interface AIRecommendation {
  film_title: string;
  book_title: string;
  author: string;
  year: number;
  director: string;
  reason: string;
}

// Use centralized text cleaners
const truncateText = (text: string, maxLength: number = 35): string => {
  const { display } = truncateWithBreak(text, maxLength);
  return display;
};

const BookToScreen: React.FC = () => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [addedFilms, setAddedFilms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);
  const [triggerExternalSearch, setTriggerExternalSearch] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const { toast } = useEnhancedToast();
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Animate AI panel when recommendations appear
  useEffect(() => {
    if (aiRecommendations.length > 0 && aiPanelRef.current) {
      gsap.fromTo(aiPanelRef.current, 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [aiRecommendations]);

  const handleAIScan = useCallback(async () => {
    setIsAILoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-film-recommendations');
      
      if (error) {
        throw error;
      }

      if (data?.recommendations?.length > 0) {
        setAIRecommendations(data.recommendations);
        setAddedFilms(data.added || []);
        
        if (data.addedCount > 0) {
          toast({
            title: 'Collection Expanded ✨',
            description: data.message,
            variant: 'success',
          });
          // Refresh the film list to show newly added films
          setRefreshKey(prev => prev + 1);
        } else {
          toast({
            title: 'Scan Complete',
            description: data.message,
          });
        }
      } else {
        toast({
          title: 'Scan Complete',
          description: 'No new recommendations at this time',
        });
      }
    } catch (error: any) {
      console.error('AI scan error:', error);
      if (error.message?.includes('429')) {
        toast({
          title: 'Rate Limited',
          description: 'Please wait a moment and try again',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Scan Failed',
          description: error.message || 'Failed to scan for recommendations',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAILoading(false);
    }
  }, [toast]);

  const handleSearchTMDB = () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast({
        title: 'Enter Search Term',
        description: 'Please enter at least 2 characters to search',
        variant: 'destructive',
      });
      return;
    }
    setTriggerExternalSearch(prev => prev + 1);
  };

  return (
    <>
      <SEOHead 
        title="Book to Screen - SF Film Adaptations | Leafnode"
        description="Explore classic science fiction book-to-film adaptations. Watch trailers, discover streaming options, and compare ratings for iconic SF movies."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-light text-slate-200 mb-3">
              Book to <span className="text-amber-400">Screen</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Classic science fiction literature brought to life on screen
            </p>
          </div>

          {/* Search Bar with TMDB Button */}
          <div className="max-w-lg mx-auto mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search films, books, authors, directors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchQuery.length >= 2 && handleSearchTMDB()}
                  className="pl-10 bg-muted/20 border-border/30 focus:border-amber-400/50"
                />
              </div>
              {searchQuery.trim().length >= 2 && (
                <Button
                  onClick={handleSearchTMDB}
                  disabled={isSearchingTMDB}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 whitespace-nowrap"
                >
                  {isSearchingTMDB ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  TMDB
                </Button>
              )}
            </div>
          </div>

          {/* Selector Buttons */}
          <div className="flex justify-center mb-8">
            <BookToScreenSelector
              selected={filterMode}
              onSelect={setFilterMode}
              onAIScan={handleAIScan}
              isAILoading={isAILoading}
            />
          </div>

          {/* AI Recommendations Display */}
          {aiRecommendations.length > 0 && (
            <div 
              ref={aiPanelRef}
              className="mb-8 p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg"
            >
              <h3 className="text-sm font-medium text-violet-300 mb-3 flex items-center gap-2">
                <span>✨</span>
                AI Suggestions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiRecommendations.map((rec, idx) => {
                  const wasAdded = addedFilms.includes(rec.film_title);
                  // Check if this film was already in the collection (not newly added but present)
                  const isInCollection = !wasAdded && !addedFilms.includes(rec.film_title);
                  // For now, all films shown here that weren't added are already in collection
                  const alreadyInCollection = !wasAdded;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border transition-all ${
                        wasAdded 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : alreadyInCollection
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-muted/20 border-violet-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{rec.film_title} ({rec.year})</p>
                        {wasAdded ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-medium">
                            Added ✓
                          </span>
                        ) : alreadyInCollection ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-medium">
                            In Collection
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" title={rec.author}>
                        Based on "{rec.book_title}" by {truncateText(rec.author)}
                      </p>
                      <p className="text-xs text-violet-300 mt-1">Dir: {rec.director}</p>
                      <p className="text-xs text-muted-foreground/80 mt-2 italic">{rec.reason}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-3">
                {addedFilms.length > 0 
                  ? `${addedFilms.length} film${addedFilms.length > 1 ? 's' : ''} added to your collection. Scroll down to see all films.`
                  : 'These films are already in your collection.'}
              </p>
            </div>
          )}

          <BookToScreenSection 
            key={refreshKey}
            showTitle={false} 
            filterMode={filterMode} 
            searchQuery={searchQuery}
            triggerExternalSearch={triggerExternalSearch}
            onSearchingChange={setIsSearchingTMDB}
          />
        </main>
      </div>
    </>
  );
};

export default BookToScreen;
