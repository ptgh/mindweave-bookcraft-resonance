import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, BookOpen, Film, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface TimelineEntry {
  id: string;
  title: string;
  author: string;
  type: 'book_written' | 'book_setting' | 'film_adaptation';
  year: number;
  coverUrl?: string;
  filmTitle?: string;
  filmYear?: number;
  narrativeTimePeriod?: string;
}

interface SFTimelineVisualizationProps {
  className?: string;
}

const decadeColors: Record<number, string> = {
  1900: 'from-amber-900/50 to-amber-800/30',
  1920: 'from-orange-900/50 to-orange-800/30',
  1940: 'from-yellow-900/50 to-yellow-800/30',
  1950: 'from-emerald-900/50 to-emerald-800/30',
  1960: 'from-teal-900/50 to-teal-800/30',
  1970: 'from-cyan-900/50 to-cyan-800/30',
  1980: 'from-blue-900/50 to-blue-800/30',
  1990: 'from-indigo-900/50 to-indigo-800/30',
  2000: 'from-violet-900/50 to-violet-800/30',
  2010: 'from-purple-900/50 to-purple-800/30',
  2020: 'from-pink-900/50 to-pink-800/30',
};

export const SFTimelineVisualization: React.FC<SFTimelineVisualizationProps> = ({ className }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'written' | 'setting' | 'all'>('all');
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const timelineEntries: TimelineEntry[] = [];

        // Fetch user's transmissions with publication years
        if (user?.id) {
          const { data: transmissions } = await supabase
            .from('transmissions')
            .select('id, title, author, publication_year, narrative_time_period, cover_url')
            .eq('user_id', user.id)
            .not('publication_year', 'is', null);

          if (transmissions) {
            transmissions.forEach(t => {
              if (t.publication_year) {
                timelineEntries.push({
                  id: `book-${t.id}`,
                  title: t.title || 'Unknown',
                  author: t.author || 'Unknown',
                  type: 'book_written',
                  year: t.publication_year,
                  coverUrl: t.cover_url || undefined,
                  narrativeTimePeriod: t.narrative_time_period || undefined,
                });
              }
            });
          }
        }

        // Fetch film adaptations
        const { data: films } = await supabase
          .from('sf_film_adaptations')
          .select('id, book_title, book_author, book_publication_year, film_title, film_year, poster_url');

        if (films) {
          films.forEach(f => {
            // Add book publication entry
            if (f.book_publication_year) {
              timelineEntries.push({
                id: `film-book-${f.id}`,
                title: f.book_title,
                author: f.book_author,
                type: 'book_written',
                year: f.book_publication_year,
                filmTitle: f.film_title,
                filmYear: f.film_year || undefined,
              });
            }
            // Add film adaptation entry
            if (f.film_year) {
              timelineEntries.push({
                id: `film-${f.id}`,
                title: f.book_title,
                author: f.book_author,
                type: 'film_adaptation',
                year: f.film_year,
                coverUrl: f.poster_url || undefined,
                filmTitle: f.film_title,
              });
            }
          });
        }

        // Sort by year
        timelineEntries.sort((a, b) => a.year - b.year);
        setEntries(timelineEntries);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimelineData();
  }, [user?.id]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (viewMode === 'written') {
      filtered = entries.filter(e => e.type === 'book_written');
    } else if (viewMode === 'setting') {
      filtered = entries.filter(e => e.type === 'book_setting');
    }
    
    if (selectedDecade !== null) {
      filtered = filtered.filter(e => Math.floor(e.year / 10) * 10 === selectedDecade);
    }
    
    return filtered;
  }, [entries, viewMode, selectedDecade]);

  const decades = useMemo(() => {
    const uniqueDecades = new Set(entries.map(e => Math.floor(e.year / 10) * 10));
    return Array.from(uniqueDecades).sort((a, b) => a - b);
  }, [entries]);

  const getDecadeColor = (year: number): string => {
    const decade = Math.floor(year / 10) * 10;
    return decadeColors[decade] || 'from-slate-900/50 to-slate-800/30';
  };

  const getEntryIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'book_written':
        return <BookOpen className="w-4 h-4" />;
      case 'film_adaptation':
        return <Film className="w-4 h-4" />;
      case 'book_setting':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEntryColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'book_written':
        return 'text-cyan-400 border-cyan-400/30';
      case 'film_adaptation':
        return 'text-amber-400 border-amber-400/30';
      case 'book_setting':
        return 'text-purple-400 border-purple-400/30';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-slate-200">SF Timeline</h2>
        </div>
        <div className="h-48 bg-slate-800/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-slate-200">SF Timeline</h2>
        </div>
        <Card className="p-8 text-center bg-slate-800/30 border-slate-700/30">
          <p className="text-slate-400">Add books with publication years to see your SF timeline</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-medium text-slate-200">SF Timeline</h2>
          <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-400">
            {filteredEntries.length} entries
          </Badge>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            onClick={() => setViewMode('all')}
            className="text-xs h-7"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'written' ? 'default' : 'ghost'}
            onClick={() => setViewMode('written')}
            className="text-xs h-7"
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Written
          </Button>
        </div>
      </div>

      {/* Decade Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <Button
          size="sm"
          variant={selectedDecade === null ? 'default' : 'ghost'}
          onClick={() => setSelectedDecade(null)}
          className="text-xs h-7 whitespace-nowrap"
        >
          All Eras
        </Button>
        {decades.map(decade => (
          <Button
            key={decade}
            size="sm"
            variant={selectedDecade === decade ? 'default' : 'ghost'}
            onClick={() => setSelectedDecade(decade)}
            className="text-xs h-7 whitespace-nowrap"
          >
            {decade}s
          </Button>
        ))}
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400/50 via-slate-600/30 to-amber-400/50" />

        {/* Timeline Entries */}
        <div className="space-y-4 pl-12">
          {filteredEntries.slice(0, 20).map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "relative group",
                "transform transition-all duration-300 hover:translate-x-2"
              )}
            >
              {/* Timeline Node */}
              <div className={cn(
                "absolute -left-[34px] w-4 h-4 rounded-full border-2 bg-slate-900",
                getEntryColor(entry.type),
                "flex items-center justify-center"
              )}>
                {getEntryIcon(entry.type)}
              </div>

              {/* Entry Card */}
              <Card className={cn(
                "p-4 bg-gradient-to-r border-slate-700/30",
                getDecadeColor(entry.year),
                "hover:border-slate-600/50 transition-colors"
              )}>
                <div className="flex items-start gap-3">
                  {/* Cover/Poster Thumbnail */}
                  {entry.coverUrl && (
                    <img
                      src={entry.coverUrl}
                      alt={entry.title}
                      className="w-12 h-18 object-cover rounded shadow-lg hidden sm:block"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-sm font-bold",
                        entry.type === 'film_adaptation' ? 'text-amber-400' : 'text-cyan-400'
                      )}>
                        {entry.year}
                      </span>
                      <Badge variant="outline" className={cn("text-xs", getEntryColor(entry.type))}>
                        {entry.type === 'book_written' && 'Published'}
                        {entry.type === 'film_adaptation' && 'Filmed'}
                        {entry.type === 'book_setting' && 'Set In'}
                      </Badge>
                    </div>

                    <h3 className="font-medium text-slate-200 truncate">
                      {entry.type === 'film_adaptation' ? entry.filmTitle : entry.title}
                    </h3>
                    
                    <p className="text-xs text-slate-400 truncate">
                      {entry.type === 'film_adaptation' ? (
                        <>Based on "{entry.title}" by {entry.author}</>
                      ) : (
                        <>by {entry.author}</>
                      )}
                    </p>

                    {entry.filmTitle && entry.type === 'book_written' && entry.filmYear && (
                      <p className="text-xs text-amber-400/70 mt-1">
                        <Film className="w-3 h-3 inline mr-1" />
                        Adapted as "{entry.filmTitle}" ({entry.filmYear})
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {filteredEntries.length > 20 && (
          <div className="text-center mt-4">
            <p className="text-sm text-slate-500">
              Showing 20 of {filteredEntries.length} entries
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SFTimelineVisualization;
