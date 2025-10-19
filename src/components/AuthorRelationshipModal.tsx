import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StandardButton } from "@/components/ui/standard-button";
import { Network, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { ScifiAuthor } from "@/services/scifiAuthorsService";
import { ReadingNarrative } from "./ReadingNarrative";

interface AuthorRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: ScifiAuthor;
  compareWith?: string[];
}

export const AuthorRelationshipModal = ({ 
  isOpen, 
  onClose, 
  author,
  compareWith 
}: AuthorRelationshipModalProps) => {
  const [narrative, setNarrative] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const { toast } = useEnhancedToast();

  const formatAnalysisAsNarrative = (analysis: any, authorName: string): string => {
    let narrative = `# ${authorName}\n\n`;
    
    if (analysis.influences && analysis.influences.length > 0) {
      narrative += `## Literary DNA\n\n`;
      narrative += `*Consciousness traces flowing through the network...*\n\n`;
      analysis.influences.forEach((influence: string) => {
        narrative += `- ${influence}\n`;
      });
      narrative += `\n`;
    }
    
    if (analysis.thematic_signature && analysis.thematic_signature.length > 0) {
      narrative += `## Thematic Signature\n\n`;
      narrative += `*Recurring patterns in the author's consciousness stream...*\n\n`;
      analysis.thematic_signature.forEach((theme: string) => {
        narrative += `- ${theme}\n`;
      });
      narrative += `\n`;
    }
    
    if (analysis.stylistic_notes) {
      narrative += `## Narrative Approach\n\n`;
      narrative += `${analysis.stylistic_notes}\n\n`;
    }
    
    if (analysis.connections) {
      narrative += `## Consciousness Bridges\n\n`;
      narrative += `*Connections across the literary network...*\n\n`;
      narrative += `${analysis.connections}\n`;
    }
    
    return narrative;
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-author-analysis', {
        body: { 
          authorName: author.name,
          compareWith: compareWith || []
        }
      });

      if (invokeError) throw invokeError;

      const formattedNarrative = formatAnalysisAsNarrative(data, author.name);
      setNarrative(formattedNarrative);
      setGeneratedAt(new Date());

      toast({
        title: "Analysis complete",
        description: "Literary connections mapped successfully"
      });
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
      toast({
        title: "Analysis failed",
        description: "Could not map author relationships",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate on first open
  useEffect(() => {
    if (isOpen && !narrative && !loading && !generatedAt) {
      generateAnalysis();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] min-h-0 bg-slate-800/95 border border-slate-700 text-slate-200 p-0">
        <div className="flex h-[85vh] max-h-[85vh] min-h-0 flex-col">
          <DialogHeader className="px-6 py-4 flex-shrink-0 border-b border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Network className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-slate-100 text-xl font-medium">
                    Author Relationships
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm mt-1">
                    Mapping literary influences and thematic connections across the SF consciousness network
                  </DialogDescription>
                </div>
              </div>
              
              <StandardButton
                onClick={generateAnalysis}
                disabled={loading}
                variant="standard"
                size="sm"
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Regenerate
              </StandardButton>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide pt-4 px-6 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading && !narrative ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Network className="w-12 h-12 text-blue-400 animate-pulse mb-4" />
                <p className="text-slate-300 text-sm">Analyzing literary connections...</p>
                <p className="text-slate-500 text-xs mt-2">Mapping influence networks and thematic bridges</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <StandardButton
                  onClick={generateAnalysis}
                  variant="standard"
                  size="sm"
                >
                  Try Again
                </StandardButton>
              </div>
            ) : narrative ? (
              <>
                <ReadingNarrative 
                  narrative={narrative}
                  transmissions={[]}
                />
                {generatedAt && (
                  <div className="mt-6 pt-4 border-t border-slate-700 text-center text-slate-500 text-xs">
                    Generated {generatedAt.toLocaleTimeString()}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
