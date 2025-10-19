import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ReadingNarrative } from '@/components/ReadingNarrative';
import { StandardButton } from '@/components/ui/standard-button';
import { supabase } from '@/integrations/supabase/client';
import { Transmission } from '@/services/transmissionsService';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

interface ReadingInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transmissions: Transmission[];
}

export const ReadingInsightsModal = ({ isOpen, onClose, transmissions }: ReadingInsightsModalProps) => {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const { toast } = useEnhancedToast();

  const generateNarrative = async (forceRegenerate = false) => {
    if (transmissions.length === 0) {
      setError('No transmissions found. Add some books to generate insights.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userTransmissions = transmissions.map(t => ({
        title: t.title,
        author: t.author,
        tags: t.tags || '',
        notes: t.notes || '',
        publication_year: t.publication_year,
        created_at: t.created_at
      }));

      // Get the current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error: functionError } = await supabase.functions.invoke('ai-reading-narrative', {
        body: {
          userTransmissions,
          timeframe: 'all',
          forceRegenerate
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (functionError) throw functionError;

      if (data?.narrative) {
        setNarrative(data.narrative);
        setGeneratedAt(new Date());
        
        if (forceRegenerate) {
          toast({
            title: 'Narrative Regenerated',
            description: 'Your reading insights have been refreshed.',
            variant: 'success'
          });
        }
      } else {
        throw new Error('No narrative received');
      }
    } catch (err: any) {
      console.error('Error generating narrative:', err);
      setError(err.message || 'Failed to generate narrative. Please try again.');
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate reading insights.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !narrative && !loading) {
      generateNarrative(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] min-h-0 bg-slate-800/95 border border-slate-700 text-slate-200 p-0">
        <div className="flex h-[85vh] max-h-[85vh] min-h-0 flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-light text-slate-200">Reading Narrative</h2>
                </div>
                <p className="text-sm text-slate-400 ml-8">
                  Traverse the cosmos of your curated constellation to reveal patterns in your speculative fiction journey
                </p>
              </div>
              <StandardButton
                onClick={() => generateNarrative(true)}
                variant="standard"
                size="xs"
                disabled={loading}
                className="inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Regenerate
              </StandardButton>
            </div>
          </div>

          {/* Content - scrollable with hidden scrollbar */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide pt-4 px-6 pb-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">Analyzing your reading patterns...</p>
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500" />
                </div>
                <h3 className="text-red-400 text-lg mb-2">Generation Error</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <StandardButton onClick={() => generateNarrative(false)} variant="standard">
                  Try Again
                </StandardButton>
              </div>
            )}

            {narrative && !loading && !error && (
              <ReadingNarrative narrative={narrative} transmissions={transmissions} />
            )}
          </div>
        </div>
        {/* Hide scrollbars but allow scrolling */}
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
