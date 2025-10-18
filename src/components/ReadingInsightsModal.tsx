import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReadingNarrative } from '@/components/ReadingNarrative';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReadingInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingInsightsModal = ({ isOpen, onClose }: ReadingInsightsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [narrative, setNarrative] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadInsights();
    }
  }, [isOpen, user]);

  const loadInsights = async (forceRegenerate = false) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // First, fetch user's transmissions
      const { data: transmissions, error: transmissionsError } = await supabase
        .from('transmissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (transmissionsError) throw transmissionsError;

      if (!transmissions || transmissions.length < 3) {
        toast({
          title: 'Not enough data yet',
          description: 'Add at least 3 books to generate your reading insights.',
        });
        setIsLoading(false);
        return;
      }

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-reading-narrative', {
        body: {
          userTransmissions: transmissions.map(t => ({
            title: t.title,
            author: t.author,
            tags: t.tags,
            historical_context_tags: t.historical_context_tags,
            publication_year: t.publication_year,
            created_at: t.created_at,
            notes: t.notes,
          })),
          timeframe: 'all',
          forceRegenerate,
        },
      });

      if (error) throw error;

      if (data) {
        setNarrative(data.narrative);
        setGeneratedAt(data.generated_at);
        setCached(data.cached || false);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast({
        title: 'Failed to generate insights',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await loadInsights(true);
    toast({
      title: 'Insights regenerated',
      description: 'Your reading narrative has been updated with the latest analysis.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-slate-200">
              <Brain className="h-6 w-6 text-blue-400" />
              Reading Insights
            </DialogTitle>
            {narrative && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2 border-slate-600 hover:border-blue-400 hover:text-blue-400"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
          </div>
          {generatedAt && (
            <div className="text-sm text-slate-400 mt-2">
              Generated {new Date(generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {cached && ' (cached)'}
            </div>
          )}
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="text-slate-400 mt-4">
                Analyzing your reading journey...
              </p>
            </div>
          ) : narrative ? (
            <div className="prose prose-invert prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-200 prose-li:text-slate-300 prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed max-w-none">
              <ReadingNarrative narrative={narrative} />
            </div>
          ) : (
            <div className="text-center py-20">
              <Brain className="h-16 w-16 mx-auto mb-4 text-blue-400/40" />
              <h2 className="text-xl font-bold mb-2 text-slate-200">No insights yet</h2>
              <p className="text-slate-400 mb-6">
                Add more books to your collection to generate insights
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};