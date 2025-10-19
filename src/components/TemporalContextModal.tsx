import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Transmission } from '@/services/transmissionsService';

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
        <DialogHeader className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <DialogTitle className="text-xl font-light text-slate-200">
                  Temporal Context Analysis
                </DialogTitle>
              </div>
              <p className="text-sm text-slate-400 ml-8">
                Navigate the corridors of time to map your reading across eras and historical landscapes
              </p>
            </div>
            <Button
              onClick={handleRegenerate}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-blue-400 hover:bg-slate-700/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide pt-4 px-6 pb-6">
          {loading && !narrative && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Sparkles className="w-12 h-12 text-blue-400 animate-pulse" />
              <p className="text-slate-300">Analyzing your temporal reading landscape...</p>
              <p className="text-slate-500 text-sm">Mapping literary eras and historical context</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="text-red-400 text-center">
                <p className="font-medium mb-2">Analysis Failed</p>
                <p className="text-sm text-slate-400">{error}</p>
              </div>
              <Button onClick={() => generateAnalysis(true)} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {narrative && (
            <div className="prose prose-invert prose-slate max-w-none">
              <div className="space-y-6">
                {narrative.split('\n').map((paragraph, index) => {
                  if (!paragraph.trim()) return null;
                  
                  // Handle markdown headings
                  if (paragraph.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-2xl font-light text-blue-300 mt-8 mb-4 first:mt-0">
                        {paragraph.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-xl font-light text-slate-200 mt-6 mb-3">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  
                  // Handle markdown lists
                  if (paragraph.match(/^[-*]\s/)) {
                    return (
                      <li key={index} className="text-slate-300 ml-6 mb-2">
                        {paragraph.replace(/^[-*]\s/, '')}
                      </li>
                    );
                  }
                  
                  // Regular paragraphs with bold/italic support
                  let formattedText = paragraph
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>')
                    .replace(/"([^"]+)"/g, '<span class="text-blue-300">"$1"</span>');
                  
                  return (
                    <p 
                      key={index} 
                      className="text-slate-300 leading-relaxed mb-4"
                      dangerouslySetInnerHTML={{ __html: formattedText }}
                    />
                  );
                })}
              </div>

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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
