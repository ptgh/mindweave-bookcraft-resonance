import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StandardButton } from '@/components/ui/standard-button';
import { RefreshCw, Sparkles, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Transmission } from '@/services/transmissionsService';
import { ReadingNarrative } from '@/components/ReadingNarrative';

interface TemporalContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  transmissions: Transmission[];
}

export const TemporalContextModal = ({ isOpen, onClose, transmissions }: TemporalContextModalProps) => {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const { toast } = useEnhancedToast();

  const generateAnalysis = async (forceRegenerate = false) => {
    setLoading(true);
    setError(null);

    try {
      const userTransmissions = transmissions.map(t => ({
        title: t.title || 'Untitled',
        author: t.author || 'Unknown Author',
        publication_year: t.publication_year,
        created_at: t.created_at,
        tags: typeof t.tags === 'string' ? [t.tags] : t.tags,
        historical_context_tags: t.historical_context_tags || [],
        narrative_time_period: t.narrative_time_period,
        notes: t.notes
      }));

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-temporal-analysis', {
        body: { userTransmissions, forceRegenerate }
      });

      if (functionError) throw functionError;

      if (functionData?.error) {
        throw new Error(functionData.error);
      }

      setNarrative(functionData.narrative);
      setGeneratedAt(functionData.generatedAt);

      if (!forceRegenerate && functionData.cached) {
        toast({
          title: "Analysis Retrieved",
          description: "Showing your cached temporal analysis",
          variant: "default"
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: "Your temporal reading landscape has been mapped",
          variant: "success"
        });
      }
    } catch (err) {
      console.error('Temporal analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate temporal analysis';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !narrative && !loading && !error) {
      generateAnalysis();
    }
  }, [isOpen]);

  const handleRegenerate = () => {
    generateAnalysis(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] min-h-0 bg-slate-800/95 border border-slate-700 text-slate-200 p-0">
        <div className="flex h-[85vh] max-h-[85vh] min-h-0 flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-light text-slate-200">
                    Temporal Context Analysis
                  </h2>
                </div>
                <p className="text-sm text-slate-400 ml-8">
                  Navigate the corridors of time to map your reading across eras and historical landscapes
                </p>
              </div>
              <StandardButton
                onClick={handleRegenerate}
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
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide pt-4 px-6 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading && !narrative && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">Analyzing your temporal reading landscape...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500" />
                </div>
                <h3 className="text-red-400 text-lg mb-2">Analysis Failed</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <StandardButton onClick={() => generateAnalysis(true)} variant="standard">
                  Try Again
                </StandardButton>
              </div>
            )}

            {narrative && !loading && !error && (
              <>
                <ReadingNarrative narrative={narrative} transmissions={transmissions} />
                {generatedAt && (
                  <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                    <p className="text-slate-500 text-xs">
                      Generated {new Date(generatedAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
