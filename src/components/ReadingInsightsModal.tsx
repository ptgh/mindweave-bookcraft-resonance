import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReadingNarrative } from '@/components/ReadingNarrative';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ReadingInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReadingInsightsModal = ({ open, onOpenChange }: ReadingInsightsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [narrative, setNarrative] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadInsights();
    }
  }, [open, user]);

  const loadInsights = async (forceRegenerate = false) => {
    if (!user) return;

    setIsLoading(true);

    try {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-900/95 border-slate-700">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-cyan-400" />
              <DialogTitle className="text-2xl font-bold text-slate-200">Reading Insights</DialogTitle>
            </div>
            {narrative && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
          </div>
          
          {generatedAt && (
            <div className="text-sm text-slate-400">
              Generated {new Date(generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {cached && ' (cached)'}
            </div>
          )}
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="text-slate-400 mt-4">
                Analyzing your reading journey...
              </p>
            </div>
          ) : narrative ? (
            <ReadingNarrative narrative={narrative} />
          ) : (
            <div className="text-center py-20">
              <Brain className="h-16 w-16 mx-auto mb-4 text-cyan-400/40" />
              <h3 className="text-xl font-bold text-slate-200 mb-2">No insights yet</h3>
              <p className="text-slate-400 mb-6">
                Add at least 3 books to your collection to generate insights
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
