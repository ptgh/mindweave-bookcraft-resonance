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
        // Use publication_year or fallback to created_at year
        return transmission.publication_year || 
               (transmission.created_at ? new Date(transmission.created_at).getFullYear() : null);
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
          <button
            onClick={() => setViewMode('publication')}
            className={`bg-transparent border text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 ${
              viewMode === 'publication'
                ? "border-blue-400 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                : "border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Publication</span>
          </button>
          <button
            onClick={() => setViewMode('narrative')}
            className={`bg-transparent border text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 ${
              viewMode === 'narrative'
                ? "border-purple-400 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                : "border-slate-600 text-slate-300 hover:border-purple-400 hover:text-purple-400"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Narrative</span>
          </button>
          <button
            onClick={() => setViewMode('reading')}
            className={`bg-transparent border text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 ${
              viewMode === 'reading'
                ? "border-green-400 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                : "border-slate-600 text-slate-300 hover:border-green-400 hover:text-green-400"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Reading</span>
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedDecade(null)}
            className={`bg-transparent border text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 ${
              selectedDecade === null
                ? "border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                : "border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
            }`}
          >
            All Eras
          </button>
          {decades.map(decade => (
            <button
              key={decade}
              onClick={() => setSelectedDecade(decade)}
              className={`bg-transparent border text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 ${
                selectedDecade === decade
                  ? "border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                  : "border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
              }`}
            >
              {decade}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Era Sections */}
        <div className="space-y-6">
          {eras.map(({ era, nodes, startYear, endYear, count }) => (
            <div key={era} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <div className="bg-slate-700/50 p-4 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-medium text-slate-200">{era}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">{startYear} - {endYear}</span>
                    <div className="bg-slate-600/50 text-slate-300 px-2 py-1 rounded text-xs">
                      {count} book{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Timeline for this era */}
                <div className="relative">
                  <div className="absolute inset-x-0 top-8 h-0.5 bg-gradient-to-r from-slate-700 via-blue-500 to-slate-700"></div>
                  
                  <div className="relative space-y-4">
                    {nodes.map((node, index) => (
                      <div
                        key={node.transmission.id}
                        className="relative group cursor-pointer"
                        onMouseEnter={() => setHoveredTransmission(node.transmission.id)}
                        onMouseLeave={() => setHoveredTransmission(null)}
                      >
                        {/* Timeline connector line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-blue-500/20"></div>
                        
                        {/* Timeline node */}
                        <div className="relative flex items-start gap-4 p-4 rounded-lg border border-slate-600/50 bg-slate-700/30 hover:bg-slate-600/40 transition-all duration-200">
                          {/* Timeline dot */}
                          <div className="relative flex-shrink-0 mt-1">
                            <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-slate-800 shadow-lg group-hover:scale-125 transition-transform duration-200 z-10"></div>
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400/30 animate-pulse"></div>
                          </div>
                          
                          {/* Book info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-200 mb-1">
                                  {node.transmission.title}
                                </h4>
                                <p className="text-xs text-slate-400 mb-2">
                                  by {node.transmission.author}
                                </p>
                                
                                {/* Tags */}
                                {Array.isArray(node.transmission.tags) && node.transmission.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {node.transmission.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                      <div key={tagIndex} className="text-xs px-2 py-1 bg-slate-600/50 text-slate-300 rounded">
                                        {tag}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-medium text-blue-400">
                                  {node.year}
                                </div>
                                {node.transmission.created_at && (
                                  <div className="text-xs text-slate-500">
                                    Added: {format(new Date(node.transmission.created_at), 'MMM yyyy')}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Notes preview */}
                            {node.transmission.notes && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {node.transmission.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Enhanced hover popup with higher z-index */}
                        {hoveredTransmission === node.transmission.id && (
                          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
                            <div className="bg-slate-800/95 border border-slate-600 rounded-lg shadow-2xl p-6 backdrop-blur-sm max-w-sm w-80 mx-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-base text-slate-200">{node.transmission.title}</h4>
                                  <p className="text-sm text-slate-400">by {node.transmission.author}</p>
                                </div>
                                
                                <div className="flex gap-4 text-xs">
                                  <div>
                                    <span className="text-slate-500">Year:</span>
                                    <span className="text-blue-400 ml-1">{node.year}</span>
                                  </div>
                                  {node.transmission.created_at && (
                                    <div>
                                      <span className="text-slate-500">Added:</span>
                                      <span className="text-green-400 ml-1">{format(new Date(node.transmission.created_at), 'MMM dd, yyyy')}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {node.transmission.notes && (
                                  <div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                      {node.transmission.notes}
                                    </p>
                                  </div>
                                )}
                                
                                {Array.isArray(node.transmission.tags) && node.transmission.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {node.transmission.tags.map((tag: string, tagIndex: number) => (
                                      <div key={tagIndex} className="text-xs px-2 py-1 border border-slate-600 text-slate-300 rounded">
                                        {tag}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-slate-200">Chrono Thread Legend</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-slate-300">Timeline positions represent {viewMode} chronology</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-gradient-to-r from-slate-700 via-blue-500 to-slate-700"></div>
            <span className="text-slate-300">Books connected through temporal threads</span>
          </div>
          <div className="text-xs text-slate-500">
            Hover over books to see detailed information and temporal connections
          </div>
        </div>
      </div>
    </div>
  );
}