import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles, Clock, Zap, BookOpen, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useToast } from '@/hooks/use-toast';

interface TemporalAnalysis {
  eraNarratives: Record<string, { description: string; books: Array<{ title: string; author: string; year: number }> }>;
  temporalBridges: Array<{ eras: string[]; connection: string; bookTitles: string[] }>;
  historicalForces: Array<{ force: string; books: Array<{ title: string; author: string }>; impact: string }>;
  authorInsights: Array<{ author: string; contribution: string; bookCount: number }>;
  readingPattern: string;
}

interface TemporalAnalysisPanelProps {
  userId: string | null;
}

export const TemporalAnalysisPanel = ({ userId }: TemporalAnalysisPanelProps) => {
  const [analysis, setAnalysis] = useState<TemporalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const generateAnalysis = async (forceRefresh = false) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate analysis",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-temporal-context', {
        body: { userId, forceRefresh }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast({
        title: "Analysis complete",
        description: "Your temporal reading patterns have been analyzed"
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to generate analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-slate-200">Historical Context</h2>
        </div>
        {analysis && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateAnalysis(true)}
            disabled={isLoading}
            className="text-xs"
          >
            Regenerate
          </Button>
        )}
      </div>

      {!analysis ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Generate an AI-powered analysis of your temporal reading patterns, exploring how your books connect across eras, historical forces, and technological contexts.
          </p>
          <Button
            onClick={() => generateAnalysis()}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Generate Analysis</span>
              </span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Era Narratives */}
          {Object.keys(analysis.eraNarratives).length > 0 && (
            <Collapsible
              open={expandedSections.has('eras')}
              onOpenChange={() => toggleSection('eras')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-200">Era Narratives</span>
                    <span className="text-xs text-slate-400">
                      ({Object.keys(analysis.eraNarratives).length})
                    </span>
                  </div>
                  {expandedSections.has('eras') ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {Object.entries(analysis.eraNarratives).map(([era, data]) => (
                  <div key={era} className="p-3 bg-slate-700/20 rounded border border-slate-600/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-400">{era}</span>
                      <span className="text-xs text-slate-500">{data.books.length} books</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{data.description}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Temporal Bridges */}
          {analysis.temporalBridges.length > 0 && (
            <Collapsible
              open={expandedSections.has('bridges')}
              onOpenChange={() => toggleSection('bridges')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-200">Temporal Bridges</span>
                    <span className="text-xs text-slate-400">
                      ({analysis.temporalBridges.length})
                    </span>
                  </div>
                  {expandedSections.has('bridges') ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {analysis.temporalBridges.map((bridge, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/20 rounded border border-slate-600/20">
                    <p className="text-xs text-slate-300 leading-relaxed">{bridge.connection}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Historical Forces */}
          {analysis.historicalForces.length > 0 && (
            <Collapsible
              open={expandedSections.has('forces')}
              onOpenChange={() => toggleSection('forces')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-200">Historical Forces</span>
                    <span className="text-xs text-slate-400">
                      ({analysis.historicalForces.length})
                    </span>
                  </div>
                  {expandedSections.has('forces') ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {analysis.historicalForces.map((force, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/20 rounded border border-slate-600/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-amber-400">{force.force}</span>
                      <span className="text-xs text-slate-500">{force.books.length} books</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{force.impact}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Author Insights */}
          {analysis.authorInsights.length > 0 && (
            <Collapsible
              open={expandedSections.has('authors')}
              onOpenChange={() => toggleSection('authors')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-slate-200">Author Insights</span>
                    <span className="text-xs text-slate-400">
                      ({analysis.authorInsights.length})
                    </span>
                  </div>
                  {expandedSections.has('authors') ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {analysis.authorInsights.map((author, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/20 rounded border border-slate-600/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-green-400">{author.author}</span>
                      <span className="text-xs text-slate-500">{author.bookCount} books</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{author.contribution}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Reading Pattern */}
          {analysis.readingPattern && (
            <Collapsible
              open={expandedSections.has('pattern')}
              onOpenChange={() => toggleSection('pattern')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-slate-200">Your Reading Pattern</span>
                  </div>
                  {expandedSections.has('pattern') ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-3 bg-slate-700/20 rounded border border-slate-600/20">
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.readingPattern}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
};
