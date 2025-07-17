import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, BookOpen, Tag, ChevronDown, ChevronUp, Sparkles, Globe, Zap, RefreshCw, Database } from 'lucide-react';
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
  const [isEnriching, setIsEnriching] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  // Enhanced data processing with OpenAI enrichment
  const timelineData = useMemo(() => {
    const filteredTransmissions = transmissions.filter(t => {
      const year = getYearForMode(t, viewMode);
      return year && year > 1800 && year < 2100; // Extended range for sci-fi
    });

    const nodes: TimelineNode[] = filteredTransmissions.map(transmission => {
      const year = getYearForMode(transmission, viewMode) || new Date().getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      const era = getEra(year);
      
      return {
        transmission,
        position: (year - 1800) / (2100 - 1800) * 100,
        year,
        decade,
        era,
        expanded: false
      };
    });

    return nodes.sort((a, b) => a.year - b.year);
  }, [transmissions, viewMode]);

  // Enhanced era grouping with better categorization
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
  const filteredEras = selectedDecade 
    ? eras.map(era => ({
        ...era,
        nodes: era.nodes.filter(node => node.decade === selectedDecade)
      })).filter(era => era.nodes.length > 0)
    : eras;

  // GSAP Animations
  useEffect(() => {
    if (!timelineRef.current) return;

    const ctx = gsap.context(() => {
      // Animate timeline container
      gsap.from(timelineRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power2.out"
      });

      // Animate era sections
      gsap.from(".era-section", {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
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

    }, timelineRef);

    return () => ctx.revert();
  }, [filteredEras]);

  // OpenAI Data Enrichment
  const enrichTimelineData = async () => {
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-timeline-data');
      
      if (error) throw error;
      
      toast({
        title: "Timeline Enhanced",
        description: `Successfully enriched ${data.enriched?.length || 0} books with temporal data`,
      });
      
      // Reload the page to see updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error enriching timeline data:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enrich timeline data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnriching(false);
    }
  };

  function getYearForMode(transmission: Transmission, mode: string): number | null {
    switch (mode) {
      case 'publication':
        return transmission.publication_year || 
               (transmission.created_at ? new Date(transmission.created_at).getFullYear() : null);
      case 'narrative':
        // Parse narrative time period - handle various formats
        if (transmission.narrative_time_period) {
          const match = transmission.narrative_time_period.match(/(\d{4})/);
          return match ? parseInt(match[1]) : null;
        }
        return null;
      case 'reading':
        return transmission.created_at ? new Date(transmission.created_at).getFullYear() : null;
      default:
        return null;
    }
  }

  function getEra(year: number): string {
    if (year < 1880) return 'Proto Science Fiction';
    if (year < 1930) return 'Scientific Romance';
    if (year < 1950) return 'Golden Age';
    if (year < 1970) return 'Silver Age';
    if (year < 1990) return 'New Wave & Cyberpunk';
    if (year < 2010) return 'Modern SF';
    return 'Contemporary & New Weird';
  }

  function getEraDescription(era: string): string {
    const descriptions: { [key: string]: string } = {
      'Proto Science Fiction': 'Early scientific speculation and fantastical voyages',
      'Scientific Romance': 'Wells, Verne, and the foundation of scientific fiction',
      'Golden Age': 'Campbell era - hard science fiction and space opera',
      'Silver Age': 'Post-war expansion and social science fiction',
      'New Wave & Cyberpunk': 'Literary experimentation and digital dystopias',
      'Modern SF': 'Diverse voices and subgenre explosion',
      'Contemporary & New Weird': 'Genre blending and new mythologies'
    };
    return descriptions[era] || 'Temporal classification pending';
  }

  function getEraSignificance(era: string): string {
    const significance: { [key: string]: string } = {
      'Proto Science Fiction': 'Laid groundwork for scientific speculation in literature',
      'Scientific Romance': 'Established core SF themes and narrative structures',
      'Golden Age': 'Defined hard SF and created lasting space opera conventions',
      'Silver Age': 'Introduced social consciousness and psychological depth',
      'New Wave & Cyberpunk': 'Revolutionized style and explored digital futures',
      'Modern SF': 'Diversified voices and explored complex social issues',
      'Contemporary & New Weird': 'Pushes boundaries and creates new mythologies'
    };
    return significance[era] || 'Shaping the future of speculative fiction';
  }

  function getEraColor(era: string): string {
    const colors: { [key: string]: string } = {
      'Proto Science Fiction': 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
      'Scientific Romance': 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
      'Golden Age': 'from-yellow-500/20 to-gold-600/20 border-yellow-500/30',
      'Silver Age': 'from-slate-500/20 to-gray-600/20 border-slate-500/30',
      'New Wave & Cyberpunk': 'from-purple-500/20 to-pink-600/20 border-purple-500/30',
      'Modern SF': 'from-blue-500/20 to-indigo-600/20 border-blue-500/30',
      'Contemporary & New Weird': 'from-violet-500/20 to-purple-600/20 border-violet-500/30'
    };
    return colors[era] || 'from-muted/20 to-muted-foreground/20 border-muted-foreground/30';
  }

  const toggleCardExpansion = (transmissionId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transmissionId)) {
        newSet.delete(transmissionId);
      } else {
        newSet.add(transmissionId);
      }
      return newSet;
    });
  };

  return (
    <div ref={timelineRef} className="space-y-6">
      {/* Enhanced Timeline Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'publication' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('publication')}
            className="transition-all duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Publication
          </Button>
          <Button
            variant={viewMode === 'narrative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('narrative')}
            className="transition-all duration-200"
          >
            <Globe className="w-4 h-4 mr-2" />
            Narrative
          </Button>
          <Button
            variant={viewMode === 'reading' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('reading')}
            className="transition-all duration-200"
          >
            <Clock className="w-4 h-4 mr-2" />
            Reading
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={enrichTimelineData}
            disabled={isEnriching}
            className="transition-all duration-200"
          >
            {isEnriching ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isEnriching ? 'Enhancing...' : 'Enhance Data'}
          </Button>
          
          <Button
            variant={selectedDecade === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDecade(null)}
          >
            All Eras
          </Button>
          {decades.map(decade => (
            <Button
              key={decade}
              variant={selectedDecade === decade ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDecade(decade)}
            >
              {decade}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Timeline Visualization */}
      <div className="space-y-8">
        {filteredEras.map((eraGroup, eraIndex) => (
          <Card 
            key={eraGroup.era} 
            className={`era-section bg-gradient-to-r ${getEraColor(eraGroup.era)} border overflow-hidden`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{eraGroup.era}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{eraGroup.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium text-foreground">
                    {eraGroup.startYear} - {eraGroup.endYear}
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {eraGroup.count} book{eraGroup.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mt-2">
                {eraGroup.significance}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Timeline connector */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/20"></div>
                
                <div className="space-y-6">
                  {eraGroup.nodes.map((node, index) => {
                    const isExpanded = expandedCards.has(node.transmission.id);
                    
                    return (
                      <Card
                        key={node.transmission.id}
                        ref={el => cardsRef.current[eraIndex * 100 + index] = el}
                        className="relative ml-12 transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/50 bg-card/50 backdrop-blur-sm"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-14 top-6 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-lg"></div>
                        
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Book Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-foreground mb-1">
                                  {node.transmission.title}
                                </h4>
                                <p className="text-muted-foreground flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {node.transmission.author}
                                </p>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold text-primary mb-1">
                                  {node.year}
                                </div>
                                {node.transmission.created_at && (
                                  <div className="text-xs text-muted-foreground">
                                    Added: {format(new Date(node.transmission.created_at), 'MMM yyyy')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {Array.isArray(node.transmission.historical_context_tags) && 
                             node.transmission.historical_context_tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {node.transmission.historical_context_tags.slice(0, isExpanded ? undefined : 3).map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {!isExpanded && node.transmission.historical_context_tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{node.transmission.historical_context_tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Expandable Content */}
                            {isExpanded && (
                              <div className="space-y-3 pt-3 border-t border-border">
                                {/* Temporal Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  {node.transmission.publication_year && (
                                    <div>
                                      <span className="text-muted-foreground">Published:</span>
                                      <span className="text-foreground ml-2 font-medium">
                                        {node.transmission.publication_year}
                                      </span>
                                    </div>
                                  )}
                                  {node.transmission.narrative_time_period && (
                                    <div>
                                      <span className="text-muted-foreground">Setting:</span>
                                      <span className="text-foreground ml-2 font-medium">
                                        {node.transmission.narrative_time_period}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Era:</span>
                                    <span className="text-foreground ml-2 font-medium">{node.era}</span>
                                  </div>
                                </div>

                                {/* Notes */}
                                {node.transmission.notes && (
                                  <div>
                                    <h5 className="text-sm font-medium text-foreground mb-2">Notes:</h5>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {node.transmission.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Additional tags */}
                                {node.transmission.tags && (
                                  <div>
                                    <h5 className="text-sm font-medium text-foreground mb-2">Tags:</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(node.transmission.tags) 
                                        ? node.transmission.tags.map((tag: string, tagIndex: number) => (
                                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))
                                        : typeof node.transmission.tags === 'string' && (
                                            <Badge variant="secondary" className="text-xs">
                                              {node.transmission.tags}
                                            </Badge>
                                          )
                                      }
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expand/Collapse Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCardExpansion(node.transmission.id)}
                              className="w-full mt-4"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-2" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  Show More
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Legend */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Chrono Thread Guide</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span className="text-foreground">Timeline shows {viewMode} chronology</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-gradient-to-r from-primary/50 to-primary/20"></div>
                <span className="text-foreground">Temporal connections between works</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Expand cards for detailed information</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-foreground">AI-enhanced temporal data available</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This chronological visualization maps science fiction across temporal dimensions, 
            inspired by comprehensive SF timelines and enhanced with contextual analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}