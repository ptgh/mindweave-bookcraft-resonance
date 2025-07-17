import React, { useState, useMemo } from 'react';
import { Transmission } from '@/services/transmissionsService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, BookOpen, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface ChronoTimelineProps {
  transmissions: Transmission[];
}

interface TimelineNode {
  transmission: Transmission;
  position: number;
  year: number;
  decade: string;
}

export function ChronoTimeline({ transmissions }: ChronoTimelineProps) {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [hoveredTransmission, setHoveredTransmission] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'publication' | 'narrative' | 'reading'>('publication');

  // Process transmissions into timeline nodes
  const timelineData = useMemo(() => {
    const filteredTransmissions = transmissions.filter(t => {
      const year = getYearForMode(t, viewMode);
      return year && year > 1800 && year < 2030; // Reasonable range
    });

    const nodes: TimelineNode[] = filteredTransmissions.map(transmission => {
      const year = getYearForMode(transmission, viewMode) || new Date().getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      
      return {
        transmission,
        position: (year - 1800) / (2030 - 1800) * 100, // Position as percentage
        year,
        decade
      };
    });

    return nodes.sort((a, b) => a.year - b.year);
  }, [transmissions, viewMode]);

  // Get decades for filtering
  const decades = useMemo(() => {
    const decadeSet = new Set(timelineData.map(node => node.decade));
    return Array.from(decadeSet).sort();
  }, [timelineData]);

  // Filter by selected decade
  const filteredNodes = selectedDecade 
    ? timelineData.filter(node => node.decade === selectedDecade)
    : timelineData;

  // Group nodes by era for visualization
  const eras = useMemo(() => {
    const eraGroups: { [key: string]: TimelineNode[] } = {};
    
    filteredNodes.forEach(node => {
      const era = getEra(node.year);
      if (!eraGroups[era]) eraGroups[era] = [];
      eraGroups[era].push(node);
    });

    return Object.entries(eraGroups).map(([era, nodes]) => ({
      era,
      nodes,
      startYear: Math.min(...nodes.map(n => n.year)),
      endYear: Math.max(...nodes.map(n => n.year)),
      count: nodes.length
    }));
  }, [filteredNodes]);

  function getYearForMode(transmission: Transmission, mode: string): number | null {
    switch (mode) {
      case 'publication':
        return transmission.publication_year || null;
      case 'narrative':
        return transmission.narrative_time_period ? parseInt(transmission.narrative_time_period) : null;
      case 'reading':
        return transmission.created_at ? new Date(transmission.created_at).getFullYear() : null;
      default:
        return null;
    }
  }

  function getEra(year: number): string {
    if (year < 1900) return 'Victorian Era';
    if (year < 1920) return 'Edwardian Era';
    if (year < 1950) return 'Early Modern';
    if (year < 1980) return 'Mid-Century';
    if (year < 2000) return 'Late 20th Century';
    return '21st Century';
  }

  function getEraColor(era: string): string {
    const colors: { [key: string]: string } = {
      'Victorian Era': 'bg-gradient-to-r from-amber-500 to-orange-600',
      'Edwardian Era': 'bg-gradient-to-r from-emerald-500 to-teal-600',
      'Early Modern': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'Mid-Century': 'bg-gradient-to-r from-purple-500 to-pink-600',
      'Late 20th Century': 'bg-gradient-to-r from-cyan-500 to-blue-600',
      '21st Century': 'bg-gradient-to-r from-violet-500 to-purple-600'
    };
    return colors[era] || 'bg-gradient-to-r from-gray-500 to-slate-600';
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'publication' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('publication')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Publication
          </Button>
          <Button
            variant={viewMode === 'narrative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('narrative')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Narrative
          </Button>
          <Button
            variant={viewMode === 'reading' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('reading')}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Reading
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
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

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Era Sections */}
        <div className="space-y-8">
          {eras.map(({ era, nodes, startYear, endYear, count }) => (
            <Card key={era} className="overflow-hidden">
              <CardHeader className={`${getEraColor(era)} text-white`}>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {era}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{startYear} - {endYear}</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {count} book{count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Timeline for this era */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-8 h-0.5 bg-gradient-to-r from-muted via-primary to-muted"></div>
                  
                  <div className="relative flex justify-between min-h-[120px]">
                    {nodes.map((node, index) => (
                      <div
                        key={node.transmission.id}
                        className="relative group cursor-pointer"
                        style={{
                          left: `${((node.year - startYear) / (endYear - startYear)) * 80 + 10}%`
                        }}
                        onMouseEnter={() => setHoveredTransmission(node.transmission.id)}
                        onMouseLeave={() => setHoveredTransmission(null)}
                      >
                        {/* Timeline dot */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                          <div className="w-4 h-4 rounded-full bg-primary border-2 border-background shadow-lg group-hover:scale-125 transition-transform duration-200"></div>
                        </div>
                        
                        {/* Book info */}
                        <div className="mt-12 w-48 text-center">
                          <div className="text-sm font-medium mb-1 line-clamp-2">
                            {node.transmission.title}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {node.transmission.author}
                          </div>
                          <div className="text-xs font-medium text-primary">
                            {node.year}
                          </div>
                          
                          {/* Tags */}
                          {node.transmission.tags && Array.isArray(node.transmission.tags) && (
                            <div className="flex flex-wrap gap-1 mt-2 justify-center">
                              {node.transmission.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover card */}
                        {hoveredTransmission === node.transmission.id && (
                          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 w-64 p-4 bg-card border rounded-lg shadow-lg">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">{node.transmission.title}</h4>
                              <p className="text-xs text-muted-foreground">by {node.transmission.author}</p>
                              {node.transmission.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {node.transmission.notes}
                                </p>
                              )}
                              <div className="flex justify-between text-xs">
                                <span>Published: {node.year}</span>
                                {node.transmission.created_at && (
                                  <span>Read: {format(new Date(node.transmission.created_at), 'MMM yyyy')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Chrono Thread Legend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Timeline positions represent {viewMode} chronology</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-gradient-to-r from-muted via-primary to-muted"></div>
            <span>Books connected through temporal threads</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Hover over books to see detailed information and temporal connections
          </div>
        </CardContent>
      </Card>
    </div>
  );
}