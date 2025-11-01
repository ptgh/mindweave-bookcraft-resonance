import React, { useState, useMemo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GSAPButtonGroup from '@/components/GSAPButtonGroup';
import { ChevronDown, ChevronUp, User, BookOpen, Globe, Tag, Calendar, Clock, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { Transmission } from '@/services/transmissionsService';
import { getTransmissions } from '@/services/transmissionsService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { AuthorPopup } from '@/components/AuthorPopup';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { EnrichedPublisherBook } from '@/services/publisherService';
import { getAuthorByName, ScifiAuthor, findOrCreateAuthor } from '@/services/scifiAuthorsService';
import { GenreInferenceService } from '@/services/genreInferenceService';
import { SciFiGenre, getEraForYear } from '@/constants/scifiGenres';
import { filterConceptualTags } from '@/constants/conceptualTags';
import { TEMPORAL_CONTEXT_TAGS, getTagCategory } from '@/constants/temporalTags';

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
  genre: SciFiGenre | null;
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
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [authorPopupVisible, setAuthorPopupVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bookTitleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { toast } = useEnhancedToast();
  const queryClient = useQueryClient();

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

    // Deduplicate by title + author (keep first occurrence)
    const deduplicatedTransmissions = filteredTransmissions.filter((transmission, index, self) => {
      const key = `${transmission.title?.toLowerCase()}-${transmission.author?.toLowerCase()}`;
      return index === self.findIndex(t => 
        `${t.title?.toLowerCase()}-${t.author?.toLowerCase()}` === key
      );
    });

    const nodes: TimelineNode[] = deduplicatedTransmissions.map(transmission => {
      const year = getYearForMode(transmission, viewMode) || new Date().getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      const era = getEraForYear(year);
      
      // Infer genre from book metadata
      const genre = GenreInferenceService.inferGenre({
        title: transmission.title,
        author: transmission.author,
        tags: Array.isArray(transmission.tags) ? transmission.tags : (transmission.tags ? [transmission.tags] : []),
        conceptualNodes: [], // Will add thematic constellation when field is added to schema
        publicationYear: transmission.publication_year || year,
        notes: transmission.notes
      });
      
      return {
        transmission,
        position: Math.min(95, Math.max(5, (year - 1800) / (2100 - 1800) * 100)),
        year,
        decade,
        era,
        genre,
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

  // GSAP Animations - Optimized for fast loading
  useEffect(() => {
    if (displayedNodes.length === 0) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

    // Animate timeline line
    gsap.fromTo(
      '.timeline-line',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6, ease: 'power2.out' }
    );

    // Animate all cards quickly with minimal delay
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(
        card,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay: index * 0.02 }
      );
    });

    // Era and tags entrance (non-blocking)
    gsap.from('.era-section', { opacity: 0, x: -20, duration: 0.4, ease: 'power2.out', delay: 0.1 });

    return () => {
      // Cleanup animations
      gsap.killTweensOf('.timeline-line');
      cardsRef.current.forEach((card) => card && gsap.killTweensOf(card));
      try {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      } catch {}
    };
  }, [displayedNodes]);

  // OpenAI Data Enrichment
  const enrichTimelineData = async () => {
    setIsEnriching(true);
    try {
      toast({
        title: "Enhancing Timeline Data",
        description: "Using AI to extract publication years, narrative periods, and historical context from book metadata...",
        variant: "default"
      });

      const { data, error } = await supabase.functions.invoke('enrich-timeline-data');
      
      if (error) throw error;
      
      toast({
        title: "Enhancement Complete",
        description: `Successfully enriched ${data.processed || 0} books with temporal metadata and context.`,
        variant: "success"
      });
      
      // Refresh the data without page reload
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
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

  const handleAuthorClick = async (authorName: string) => {
    console.log('Author clicked:', authorName);
    try {
      // First try to get existing author
      let authorData = await getAuthorByName(authorName);
      
      // If not found, create new author record
      if (!authorData) {
        console.log('Author not found in database, creating new record:', authorName);
        const newAuthorId = await findOrCreateAuthor(authorName);
        if (newAuthorId) {
          // Try to fetch the newly created author
          authorData = await getAuthorByName(authorName);
        }
      }
      
      if (authorData) {
        console.log('Setting author:', authorData);
        setSelectedAuthor(authorData);
        setAuthorPopupVisible(true);
      } else {
        // Fallback: create minimal author object for display with proper UUID
        const fallbackAuthor: ScifiAuthor = {
          id: crypto.randomUUID(),
          name: authorName,
          bio: undefined,
          notable_works: [],
          needs_enrichment: true,
          data_quality_score: 0,
          birth_year: undefined,
          death_year: undefined,
          last_enriched: undefined,
          enrichment_attempts: 0,
          nationality: undefined,
          data_source: 'manual',
          verification_status: 'pending'
        };
        console.log('Using fallback author:', fallbackAuthor);
        setSelectedAuthor(fallbackAuthor);
        setAuthorPopupVisible(true);
      }
    } catch (error) {
      console.error('Error fetching author data:', error);
      
      // Fallback: show author popup with minimal data
      const fallbackAuthor: ScifiAuthor = {
        id: crypto.randomUUID(),
        name: authorName,
        bio: 'Author information is being loaded...',
        notable_works: [],
        needs_enrichment: true,
        data_quality_score: 0,
        birth_year: undefined,
        death_year: undefined,
        last_enriched: undefined,
        enrichment_attempts: 0,
        nationality: undefined,
        data_source: 'manual',
        verification_status: 'pending'
      };
      console.log('Using error fallback author:', fallbackAuthor);
      setSelectedAuthor(fallbackAuthor);
      setAuthorPopupVisible(true);
    }
  };

  const closeAuthorPopup = () => {
    setAuthorPopupVisible(false);
    setSelectedAuthor(null);
  };

  const handleBookClick = (transmission: Transmission) => {
    // Transform Transmission to EnrichedPublisherBook format
    const bookData: EnrichedPublisherBook = {
      id: transmission.id.toString(),
      series_id: transmission.publisher_series_id || '',
      title: transmission.title || '',
      author: transmission.author || '',
      isbn: transmission.isbn || null,
      cover_url: transmission.cover_url || null,
      editorial_note: transmission.notes || null,
      penguin_url: null,
      publisher_link: null,
      google_cover_url: null,
      created_at: transmission.created_at || new Date().toISOString()
    };
    setSelectedBook(bookData);
    setShowBookPreview(true);
  };

  const closeBookPreview = () => {
    setShowBookPreview(false);
    setSelectedBook(null);
  };

  const handleAddBook = (book: EnrichedPublisherBook) => {
    toast({
      title: "Signal Added",
      description: `"${book.title}" has been added to your transmissions.`,
      variant: "success"
    });
    setShowBookPreview(false);
  };

  // Mock author data - in a real app, this would come from an API
  const getAuthorInfo = (authorName: string) => {
    const mockAuthors: Record<string, any> = {
      "Edwin A. Abbott": {
        name: "Edwin A. Abbott",
        bio: "English schoolmaster, theologian, and mathematician who wrote the satirical novella Flatland.",
        birthYear: 1838,
        deathYear: 1926,
        nationality: "British",
        notableWorks: ["Flatland", "The Kernel and the Husk", "Philomythus"],
        totalWorks: 15
      },
      "Jack London": {
        name: "Jack London", 
        bio: "American novelist, journalist, and social activist known for his rugged tales of adventure.",
        birthYear: 1876,
        deathYear: 1916,
        nationality: "American",
        notableWorks: ["The Call of the Wild", "White Fang", "The Sea-Wolf", "To Build a Fire"],
        totalWorks: 23
      },
      "Aldous Huxley": {
        name: "Aldous Huxley",
        bio: "English writer and philosopher best known for his dystopian novel Brave New World.",
        birthYear: 1894,
        deathYear: 1963,
        nationality: "British",
        notableWorks: ["Brave New World", "Point Counter Point", "The Doors of Perception", "Island"],
        totalWorks: 47
      }
    };

    return mockAuthors[authorName] || {
      name: authorName,
      bio: `${authorName} is a renowned author whose works have contributed significantly to literature.`,
      notableWorks: ["Various acclaimed works"],
      totalWorks: 1
    };
  };


  // Era function removed - now using getEraForYear from scifiGenres.ts

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
        <GSAPButtonGroup
          buttons={[
            { id: 'publication', label: 'Publication' },
            { id: 'narrative', label: 'Narrative' },
            { id: 'reading', label: 'Reading' },
            { 
              id: 'enhance', 
              label: isEnriching ? 'Enhancing...' : 'Enhance Data',
              icon: isEnriching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />
            }
          ]}
          selected={viewMode === 'publication' ? 'publication' : viewMode === 'narrative' ? 'narrative' : viewMode === 'reading' ? 'reading' : 'publication'}
          onSelect={(id) => {
            if (id === 'enhance') {
              enrichTimelineData();
            } else {
              setViewMode(id as 'publication' | 'narrative' | 'reading');
            }
          }}
          disabled={isEnriching}
        />

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
                className="absolute top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-800 shadow-lg"
                style={{ 
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-32px)'
                }}
              />
              
              {/* Card - styled like Signal Preview modal, wider and more spread out */}
              <Card
                ref={el => cardsRef.current[index] = el}
                key={node.transmission.id}
                className="relative overflow-hidden bg-slate-800/90 border-slate-600/50 shadow-xl backdrop-blur-sm hover:bg-slate-800 transition-all duration-300 w-full max-w-xl mx-auto"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 font-medium px-2 py-1">
                          {node.year}
                        </Badge>
                        {node.genre && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-medium px-2 py-1">
                            {node.genre.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        ref={(el) => (bookTitleRefs.current[index] = el)}
                        onClick={() => handleBookClick(node.transmission)}
                        className="text-lg font-semibold text-slate-100 leading-tight text-left relative group hover:text-blue-400 transition-colors duration-300"
                        onMouseEnter={(e) => {
                          gsap.to(e.currentTarget, {
                            color: '#60a5fa',
                            duration: 0.3,
                            ease: 'power2.out'
                          });
                        }}
                        onMouseLeave={(e) => {
                          gsap.to(e.currentTarget, {
                            color: 'rgb(241, 245, 249)',
                            duration: 0.3,
                            ease: 'power2.out'
                          });
                        }}
                      >
                        <span className="relative">
                          {node.transmission.title}
                          <span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 ease-out"
                            style={{ transformOrigin: 'left' }}
                          />
                        </span>
                      </button>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <User className="w-4 h-4" />
                        <button
                          onClick={() => handleAuthorClick(node.transmission.author || '')}
                          className="text-left relative group"
                          style={{ transition: 'color 0.3s ease' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#60a5fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgb(203, 213, 225)';
                          }}
                        >
                          <span className="relative">
                            {node.transmission.author}
                            <span 
                              className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 ease-out"
                              style={{ transformOrigin: 'left' }}
                            />
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {node.transmission.cover_url && (
                        <img 
                          src={node.transmission.cover_url}
                          alt={`${node.transmission.title} cover`}
                          className="w-12 h-16 object-cover rounded border border-slate-600/50 shadow-sm"
                        />
                      )}
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

                    {/* Synopsis - Short and concise (max 200 chars) */}
                    {node.transmission.notes && (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">Synopsis</span>
                        </div>
                        <div className="text-sm text-slate-200 leading-relaxed">
                          {expandedNotes.has(node.transmission.id) 
                            ? node.transmission.notes
                            : node.transmission.notes.length > 200 
                              ? node.transmission.notes.substring(0, 200) + '...'
                              : node.transmission.notes
                          }
                          {node.transmission.notes.length > 200 && (
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

                    {/* Conceptual Nodes */}
                    {(() => {
                      const conceptualTags = filterConceptualTags(node.transmission.tags || []);
                      return conceptualTags.length > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-cyan-300">Conceptual Nodes</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {conceptualTags.map((tag, idx) => (
                              <Badge key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Temporal Context - NEW STRUCTURED VERSION */}
                    {(() => {
                      const temporalTags = node.transmission.temporal_context_tags || [];
                      if (temporalTags.length === 0) return null;
                      
                      // Categorize tags by type
                      const literaryEra = temporalTags.filter(tag => 
                        TEMPORAL_CONTEXT_TAGS.literaryEra.includes(tag as any)
                      );
                      const historicalForces = temporalTags.filter(tag => 
                        TEMPORAL_CONTEXT_TAGS.historicalForces.includes(tag as any)
                      );
                      const techContext = temporalTags.filter(tag => 
                        TEMPORAL_CONTEXT_TAGS.technologicalContext.includes(tag as any)
                      );
                      
                      return (
                        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">Temporal Context</span>
                          </div>
                          
                          {literaryEra.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-slate-400">Era:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {literaryEra.map((tag, idx) => (
                                  <Badge key={idx} className="text-xs bg-purple-500/30 text-purple-200 border-purple-400/40">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {historicalForces.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-slate-400">Forces:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {historicalForces.map((tag, idx) => (
                                  <Badge key={idx} className="text-xs bg-amber-500/30 text-amber-200 border-amber-400/40">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {techContext.length > 0 && (
                            <div>
                              <span className="text-xs text-slate-400">Tech:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {techContext.map((tag, idx) => (
                                  <Badge key={idx} className="text-xs bg-blue-500/30 text-blue-200 border-blue-400/40">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

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

      {/* Author Popup */}
      <AuthorPopup
        author={selectedAuthor}
        isVisible={authorPopupVisible}
        onClose={closeAuthorPopup}
        onAuthorUpdate={(updatedAuthor) => {
          setSelectedAuthor(updatedAuthor);
        }}
      />

      {/* Book Preview Modal */}
      {selectedBook && showBookPreview && (
        <EnhancedBookPreviewModal
          book={selectedBook}
          onClose={closeBookPreview}
          onAddBook={handleAddBook}
        />
      )}
    </div>
  );
}