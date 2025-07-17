import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, BookOpen, Tag, ChevronDown, ChevronUp, Sparkles, Globe, Zap, RefreshCw, Database, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Transmission } from '@/services/transmissionsService';

gsap.registerPlugin(ScrollTrigger);

interface ChronoTimelineProps {
  transmissions: Transmission[];
}

interface TimelineNode {
  transmission: Transmission;
  position: number;
  year: number;
  decade: string;
  era: string;
  expanded: boolean;
}

interface EraGroup {
  era: string;
  nodes: TimelineNode[];
  startYear: number;
  endYear: number;
  count: number;
  description: string;
  significance: string;
}

export function ChronoTimeline({ transmissions }: ChronoTimelineProps) {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'publication' | 'narrative' | 'reading'>('publication');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [isEnriching, setIsEnriching] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  // Get year based on view mode with better narrative parsing
  function getYearForMode(transmission: Transmission, mode: string): number | null {
    switch (mode) {
      case 'publication':
        return transmission.publication_year || 
               (transmission.created_at ? new Date(transmission.created_at).getFullYear() : null);
      case 'narrative':
        // Better parsing for narrative time periods
        if (transmission.narrative_time_period) {
          const timeStr = transmission.narrative_time_period.toLowerCase();
          // Look for specific year patterns
          const yearMatch = timeStr.match(/(\d{4})/);
          if (yearMatch) return parseInt(yearMatch[1]);
          
          // Handle special cases like "22nd century", "far future", etc.
          if (timeStr.includes('22nd century') || timeStr.includes('2100')) return 2150;
          if (timeStr.includes('21st century') || timeStr.includes('2021') || timeStr.includes('contemporary')) return 2021;
          if (timeStr.includes('far future')) return 2500;
          if (timeStr.includes('10,191 ag')) return 10191; // Dune reference
        }
        return null;
      case 'reading':
        return transmission.created_at ? new Date(transmission.created_at).getFullYear() : null;
      default:
        return transmission.publication_year;
    }
  }

  // Enhanced data processing
  const timelineData = useMemo(() => {
    const filteredTransmissions = transmissions.filter(t => {
      const year = getYearForMode(t, viewMode);
      return year && year > 1800 && year < 12000; // Extended range for sci-fi
    });

    const nodes: TimelineNode[] = filteredTransmissions.map(transmission => {
      const year = getYearForMode(transmission, viewMode) || new Date().getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      const era = getEra(year);
      
      return {
        transmission,
        position: Math.min(95, Math.max(5, (year - 1800) / (2100 - 1800) * 100)),
        year,
        decade,
        era,
        expanded: false
      };
    });

    return nodes.sort((a, b) => a.year - b.year);
  }, [transmissions, viewMode]);

  // Enhanced era grouping
  const eras = useMemo(() => {
    const eraGroups: { [key: string]: TimelineNode[] } = {};
    
    timelineData.forEach(node => {
      if (!eraGroups[node.era]) eraGroups[node.era] = [];
      eraGroups[node.era].push(node);
    });

    return Object.entries(eraGroups)
      .map(([era, nodes]) => ({
        era,
        nodes,
        startYear: Math.min(...nodes.map(n => n.year)),
        endYear: Math.max(...nodes.map(n => n.year)),
        count: nodes.length,
        description: getEraDescription(era),
        significance: getEraSignificance(era)
      }))
      .sort((a, b) => a.startYear - b.startYear);
  }, [timelineData]);

  // Get decades for filtering
  const decades = useMemo(() => {
    const decadeSet = new Set(timelineData.map(node => node.decade));
    return Array.from(decadeSet).sort();
  }, [timelineData]);

  // Filter by selected decade
  const displayedNodes = useMemo(() => {
    if (!selectedDecade) return timelineData;
    return timelineData.filter(node => node.decade === selectedDecade);
  }, [timelineData, selectedDecade]);

  // GSAP Animations
  useEffect(() => {
    if (displayedNodes.length > 0) {
      // Animate timeline line
      gsap.fromTo(".timeline-line", 
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, ease: "power2.out" }
      );

      // Animate era sections
      gsap.from(".era-section", {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
      });

      // Animate "Temporal Significance" text with subtle emphasis
      gsap.from(".temporal-significance", {
        opacity: 0,
        y: 10,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5
      });

      // Subtle pulse effect for "Temporal Significance"
      gsap.to(".temporal-significance", {
        opacity: 0.7,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });

      // Animate book cards with scroll trigger
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(card, 
            {
              opacity: 0,
              y: 30,
              scale: 0.95
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      });
    }
  }, [displayedNodes]);

  // OpenAI Data Enrichment
  const enrichTimelineData = async () => {
    setIsEnriching(true);
    try {
      toast({
        title: "Enhancing Timeline Data",
        description: "Using AI to extract publication years, narrative periods, and historical context from book metadata...",
      });

      const { data, error } = await supabase.functions.invoke('enrich-timeline-data');
      
      if (error) throw error;
      
      toast({
        title: "Enhancement Complete",
        description: `Successfully enriched ${data.processed || 0} books with temporal metadata and context.`,
      });
      
      // Trigger a refresh of the data
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "AI enhancement failed. Check your OpenAI API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleNotes = (id: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  function getEra(year: number): string {
    if (year >= 2100) return "Far Future";
    if (year >= 2050) return "Near Future";
    if (year >= 2000) return "Contemporary";
    if (year >= 1950) return "Space Age";
    if (year >= 1900) return "Industrial";
    if (year >= 1800) return "Classical";
    return "Ancient";
  }

  function getEraDescription(era: string): string {
    const descriptions = {
      "Far Future": "Advanced civilizations and cosmic-scale narratives",
      "Near Future": "Emerging technologies and social transformation", 
      "Contemporary": "Modern day sci-fi exploring current possibilities",
      "Space Age": "The golden age of space exploration fiction",
      "Industrial": "Early technological speculation and scientific romance",
      "Classical": "Foundation works of speculative fiction"
    };
    return descriptions[era as keyof typeof descriptions] || "";
  }

  function getEraSignificance(era: string): string {
    const significance = {
      "Far Future": "Explores ultimate human potential and cosmic destiny",
      "Near Future": "Anticipates immediate technological and social changes",
      "Contemporary": "Reflects current anxieties and possibilities", 
      "Space Age": "Defined the scope and ambition of science fiction",
      "Industrial": "Established core themes of technological impact",
      "Classical": "Created the fundamental frameworks of the genre"
    };
    return significance[era as keyof typeof significance] || "";
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const years = timelineData.map(n => n.year).filter(Boolean);
    const eraDistribution = eras.reduce((acc, era) => {
      acc[era.era] = era.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBooks: timelineData.length,
      yearSpan: years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : "No data",
      timeJumps: years.length > 1 ? years.slice(1).reduce((jumps, year, i) => jumps + Math.abs(year - years[i]), 0) : 0,
      eraDistribution,
      averageYear: years.length > 0 ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length) : 0
    };
  }, [timelineData, eras]);

  if (displayedNodes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Timeline Data</h3>
          <p className="text-slate-400 mb-6">No books found for the selected timeframe or view mode.</p>
          <Button 
            onClick={enrichTimelineData}
            disabled={isEnriching}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEnriching ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enhancing Data...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance Data
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-800/30 p-4 rounded-lg border border-slate-600/30">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setViewMode('publication')}
            variant={viewMode === 'publication' ? 'default' : 'ghost'}
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            Publication
          </Button>
          <Button
            onClick={() => setViewMode('narrative')}
            variant={viewMode === 'narrative' ? 'default' : 'ghost'}
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            Narrative
          </Button>
          <Button
            onClick={() => setViewMode('reading')}
            variant={viewMode === 'reading' ? 'default' : 'ghost'}
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            Reading
          </Button>
          <Button 
            onClick={enrichTimelineData}
            disabled={isEnriching}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
          >
            {isEnriching ? 'Enhancing...' : 'Enhance Data'}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Temporal Scope:</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white px-2 py-1 h-auto"
          >
            Year
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            className="text-slate-300 hover:text-white px-2 py-1 h-auto"
          >
            All Time
          </Button>
        </div>
      </div>
      
      <div className="text-center text-slate-400 italic text-sm font-light">
        "AI extracts publication years and narrative periods from book metadata"
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30 text-center">
          <div className="text-2xl font-bold text-slate-100">{stats.totalBooks}</div>
          <div className="text-sm text-slate-400">Total Books</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30 text-center">
          <div className="text-2xl font-bold text-slate-100">{stats.yearSpan.split(' - ').length > 1 ? Math.abs(parseInt(stats.yearSpan.split(' - ')[1]) - parseInt(stats.yearSpan.split(' - ')[0])) + 'y' : 'N/A'}</div>
          <div className="text-sm text-slate-400">Year Span</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30 text-center">
          <div className="text-2xl font-bold text-slate-100">{stats.yearSpan !== "No data" ? stats.yearSpan : 'N/A'}</div>
          <div className="text-sm text-slate-400">Era Range</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30 text-center">
          <div className="text-2xl font-bold text-slate-100">{displayedNodes.length > 1 ? displayedNodes.length - 1 : 0}</div>
          <div className="text-sm text-slate-400">Time Jumps</div>
        </div>
      </div>

      {/* Era Distribution */}
      {Object.keys(stats.eraDistribution).length > 0 && (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Era Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(stats.eraDistribution).map(([era, count]) => (
              <div key={era} className="text-center">
                <div className="text-lg font-bold text-blue-400">{count}</div>
                <div className="text-xs text-slate-400">{era}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biggest Time Jumps */}
      {displayedNodes.length > 1 && (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Biggest Time Jumps</h4>
          {(() => {
            const jumps = [];
            for (let i = 1; i < displayedNodes.length; i++) {
              const jump = Math.abs(displayedNodes[i].year - displayedNodes[i-1].year);
              jumps.push({
                years: jump,
                from: displayedNodes[i-1].transmission.title,
                to: displayedNodes[i].transmission.title
              });
            }
            return jumps
              .sort((a, b) => b.years - a.years)
              .slice(0, 2)
              .map((jump, idx) => (
                <div key={idx} className="text-sm text-slate-300 mb-1">
                  <span className="font-semibold text-blue-400">{jump.years} years</span>
                  <br />
                  <span className="text-slate-400">{jump.from} → {jump.to}</span>
                </div>
              ));
          })()}
        </div>
      )}

      {/* Timeline Visualization */}
      <div ref={timelineRef} className="relative">
        {/* Timeline line */}
        <div className="timeline-line absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left"></div>
        
        {/* Timeline markers and cards */}
        <div className="relative pt-16 space-y-12">
          {displayedNodes.map((node, index) => (
            <div key={node.transmission.id} className="relative flex justify-center">
              {/* Timeline marker */}
              <div 
                className="absolute top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-800 shadow-lg transform -translate-x-1/2 -translate-y-8"
                style={{ left: `${node.position}%` }}
              />
              
              {/* Card - styled like Signal Preview modal, wider and more spread out */}
              <Card
                ref={el => cardsRef.current[index] = el}
                key={node.transmission.id}
                className="relative overflow-hidden bg-slate-800/90 border-slate-600/50 shadow-xl backdrop-blur-sm hover:bg-slate-800 transition-all duration-300 w-full max-w-2xl mx-auto"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 font-medium px-2 py-1">
                        {node.year}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-medium px-2 py-1">
                        {node.era}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(node.transmission.id)}
                      className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 p-2"
                    >
                      {expandedCards.has(node.transmission.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-100 mb-2 leading-tight">
                    {node.transmission.title}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <User className="w-4 h-4" />
                    <span>{node.transmission.author}</span>
                  </div>
                </CardHeader>

                {expandedCards.has(node.transmission.id) && (
                  <CardContent className="pt-0 space-y-4 animate-fade-in">
                    {/* Story Timeline - matching Signal Preview style */}
                    {node.transmission.narrative_time_period && (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-300">Story Timeline</span>
                        </div>
                        <p className="text-sm text-slate-200">
                          {node.transmission.narrative_time_period}
                        </p>
                      </div>
                    )}

                    {/* Synopsis - Short like wiki example (max 120 chars) */}
                    {node.transmission.notes && (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">Synopsis</span>
                        </div>
                        <div className="text-sm text-slate-200 leading-relaxed">
                          {expandedNotes.has(node.transmission.id) 
                            ? node.transmission.notes
                            : node.transmission.notes.length > 120 
                              ? node.transmission.notes.substring(0, 120) + '...'
                              : node.transmission.notes
                          }
                          {node.transmission.notes.length > 120 && (
                            <button
                              onClick={() => toggleNotes(node.transmission.id)}
                              className="ml-2 text-blue-400 hover:text-blue-300 text-xs underline font-medium"
                            >
                              {expandedNotes.has(node.transmission.id) ? 'Show Less' : 'Show More'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Historical Context */}
                    {node.transmission.historical_context_tags && node.transmission.historical_context_tags.length > 0 && (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-300">Context</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {node.transmission.historical_context_tags.map((tag, idx) => (
                            <Badge key={idx} className="text-xs bg-purple-500/20 text-purple-300 border-purple-400/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Temporal Significance */}
                    {node.transmission.historical_context_tags && node.transmission.historical_context_tags.length > 0 && (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <h5 className="temporal-significance text-slate-300 font-medium mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          Temporal Significance:
                        </h5>
                        <div className="mt-2">
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {node.transmission.historical_context_tags.join('. ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Apple Books Link */}
                    {node.transmission.apple_link && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30"
                          onClick={() => window.open(node.transmission.apple_link, '_blank')}
                        >
                          Buy on Apple Books
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}