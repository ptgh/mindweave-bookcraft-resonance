import { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles, Clock, Zap, BookOpen, User, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { TEMPORAL_CONTEXT_TAGS } from '@/constants/temporalTags';
import gsap from 'gsap';

interface Book {
  id: number;
  title: string;
  author: string;
  publication_year?: number;
  temporal_context_tags?: string[];
}

interface EraData {
  era: string;
  count: number;
  books: Book[];
}

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
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [eraData, setEraData] = useState<EraData[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const { toast } = useToast();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch user's books on mount
  useEffect(() => {
    if (!userId) return;

    const getEra = (year: number): string => {
      if (year < 1900) return 'Victorian Era';
      if (year < 1920) return 'Edwardian Era';
      if (year < 1950) return 'Early Modern';
      if (year < 1980) return 'Mid-Century';
      if (year < 2000) return 'Late 20th Century';
      return '21st Century';
    };

    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, publication_year, temporal_context_tags')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching books:', error);
        return;
      }

      setBooks(data || []);

      // Build era distribution from tags when present, otherwise from publication year
      const eraMap = new Map<string, Book[]>();
      
      (data || []).forEach((book) => {
        const tags = book.temporal_context_tags || [];
        const tagEras = tags.filter((t) => TEMPORAL_CONTEXT_TAGS.literaryEra.includes(t as any));
        const derivedEra = !tagEras.length && book.publication_year ? [getEra(book.publication_year)] : tagEras;

        derivedEra.forEach((era) => {
          if (!eraMap.has(era)) eraMap.set(era, []);
          eraMap.get(era)!.push(book as Book);
        });
      });

      const eraArray = Array.from(eraMap.entries())
        .map(([era, books]) => ({ era, count: books.length, books }))
        .sort((a, b) => b.count - a.count);

      setEraData(eraArray);
    };

    fetchBooks();
  }, [userId]);

  // GSAP hover animation for Analysis button
  useEffect(() => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    };
    
    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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

  const getSelectedEraBooks = () => {
    if (!selectedEra) return [];
    return eraData.find(e => e.era === selectedEra)?.books || [];
  };

  const selectedBooks = getSelectedEraBooks();

  // Get historical forces and tech context for selected era
  const getContextTags = (books: Book[]) => {
    const forces = new Set<string>();
    const tech = new Set<string>();

    books.forEach(book => {
      const tags = book.temporal_context_tags || [];
      tags.forEach(tag => {
        if (TEMPORAL_CONTEXT_TAGS.historicalForces.includes(tag as any)) {
          forces.add(tag);
        }
        if (TEMPORAL_CONTEXT_TAGS.technologicalContext.includes(tag as any)) {
          tech.add(tag);
        }
      });
    });

    return { forces: Array.from(forces), tech: Array.from(tech) };
  };

  const contextTags = selectedEra ? getContextTags(selectedBooks) : { forces: [], tech: [] };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-slate-200">Historical Context</h2>
        </div>
        {!analysis && (
          <button
            ref={buttonRef}
            onClick={() => generateAnalysis(true)}
            disabled={isLoading || eraData.length === 0}
            className="text-xs text-slate-300 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Analysis
          </button>
        )}
      </div>

      {!analysis ? (
        <div className="space-y-2">
          {eraData.length === 0 ? (
            <p className="text-xs text-slate-400">
              No eras detected yet. Add publication years or temporal context tags to your books to explore historical patterns.
            </p>
          ) : (
            <>
              {/* Era List */}
              <div className="space-y-1.5">
                {eraData.map((era) => (
                  <button
                    key={era.era}
                    onClick={() => setSelectedEra(selectedEra === era.era ? null : era.era)}
                    className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-200 truncate">{era.era}</span>
                      <span className="text-xs text-slate-400">({era.count})</span>
                    </div>
                    {selectedEra === era.era ? (
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Era Details */}
              {selectedEra && (
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-600/30">
                  {/* Books in Era */}
                  <Collapsible
                    open={expandedSections.has('books')}
                    onOpenChange={() => toggleSection('books')}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-slate-200">Books</span>
                          <span className="text-xs text-slate-400">({selectedBooks.length})</span>
                        </div>
                        {expandedSections.has('books') ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-1.5">
                      {selectedBooks.map((book) => (
                        <div key={book.id} className="p-2.5 bg-slate-700/20 rounded border border-slate-600/20">
                          <div className="text-xs font-medium text-slate-200">{book.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{book.author}</div>
                          {book.publication_year && (
                            <div className="text-xs text-slate-500 mt-0.5">{book.publication_year}</div>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Historical Forces */}
                  {contextTags.forces.length > 0 && (
                    <Collapsible
                      open={expandedSections.has('forces')}
                      onOpenChange={() => toggleSection('forces')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-slate-200">Historical Forces</span>
                            <span className="text-xs text-slate-400">({contextTags.forces.length})</span>
                          </div>
                          {expandedSections.has('forces') ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-1.5">
                        {contextTags.forces.map((force, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-700/20 rounded border border-slate-600/20">
                            <span className="text-xs text-amber-400">{force}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Technology Context */}
                  {contextTags.tech.length > 0 && (
                    <Collapsible
                      open={expandedSections.has('tech')}
                      onOpenChange={() => toggleSection('tech')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-slate-200">Technology Context</span>
                            <span className="text-xs text-slate-400">({contextTags.tech.length})</span>
                          </div>
                          {expandedSections.has('tech') ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-1.5">
                        {contextTags.tech.map((tech, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-700/20 rounded border border-slate-600/20">
                            <span className="text-xs text-cyan-400">{tech}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )}
            </>
          )}
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
