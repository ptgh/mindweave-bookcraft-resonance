import React, { useState, useCallback } from 'react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { BookToScreenSection } from '@/components/BookToScreenSection';
import { BookToScreenSelector, FilterMode } from '@/components/BookToScreenSelector';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

interface AIRecommendation {
  film_title: string;
  book_title: string;
  author: string;
  year: number;
  director: string;
  reason: string;
}

const BookToScreen: React.FC = () => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const { toast } = useEnhancedToast();

  const handleAIScan = useCallback(async () => {
    setIsAILoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-film-recommendations');
      
      if (error) {
        throw error;
      }

      if (data?.recommendations?.length > 0) {
        setAIRecommendations(data.recommendations);
        toast({
          title: 'Signal Collection Scanned ✨',
          description: `Found ${data.recommendations.length} new adaptation suggestions`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Scan Complete',
          description: 'No new recommendations found',
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
            <div className="mb-8 p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
              <h3 className="text-sm font-medium text-violet-300 mb-3 flex items-center gap-2">
                <span>✨</span>
                AI Suggestions - Add these to your collection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-violet-500/20">
                    <p className="text-sm font-medium text-foreground">{rec.film_title} ({rec.year})</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on "{rec.book_title}" by {rec.author}
                    </p>
                    <p className="text-xs text-violet-300 mt-1">Dir: {rec.director}</p>
                    <p className="text-xs text-muted-foreground/80 mt-2 italic">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <BookToScreenSection showTitle={false} filterMode={filterMode} />
        </main>
      </div>
    </>
  );
};

export default BookToScreen;
