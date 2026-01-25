import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isFuture, isAfter } from 'date-fns';

interface SciFiEvent {
  id: string;
  name: string;
  event_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  time: string | null;
  venue: string | null;
  city: string;
  country: string;
  website_url: string | null;
  ticket_url: string | null;
  featured_authors: string[] | null;
  is_recurring: boolean;
}

const eventTypeColors: Record<string, string> = {
  convention: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  festival: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  reading: 'bg-green-500/20 text-green-300 border-green-500/30',
  workshop: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  booklaunch: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const eventTypeLabels: Record<string, string> = {
  convention: 'Convention',
  festival: 'Festival',
  reading: 'Reading Group',
  workshop: 'Workshop',
  booklaunch: 'Book Launch',
};

const SciFiEventsSection = () => {
  const [events, setEvents] = useState<SciFiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from database - get future events ordered by date
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error: dbError } = await supabase
          .from('scifi_events')
          .select('*')
          .gte('start_date', today)
          .eq('is_active', true)
          .order('start_date', { ascending: true })
          .limit(20);
        
        if (dbError) throw dbError;
        
        if (data && data.length > 0) {
          setEvents(data as SciFiEvent[]);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Unable to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const displayedEvents = expanded ? events : events.slice(0, 3);

  const formatEventDate = (startDate: string, endDate: string | null) => {
    try {
      const start = parseISO(startDate);
      if (endDate) {
        const end = parseISO(endDate);
        // Same month
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
          return `${format(start, 'd')}-${format(end, 'd MMM yyyy')}`;
        }
        return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
      }
      return format(start, 'd MMM yyyy');
    } catch {
      return startDate;
    }
  };

  if (loading) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-light text-slate-200">Upcoming Sci-Fi Events</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800/50 rounded-lg h-48 border border-slate-700/50" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0 && !error) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-light text-slate-200">Upcoming Sci-Fi Events</h2>
          {events.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {events.length} events
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <p className="text-slate-400 text-sm mb-4">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedEvents.map((event) => (
          <Card 
            key={event.id} 
            className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-all duration-300 group"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Badge 
                    variant="outline" 
                    className={`mb-2 text-xs ${eventTypeColors[event.event_type] || 'border-primary/30 text-primary'}`}
                  >
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </Badge>
                  {event.is_recurring && (
                    <Badge variant="outline" className="ml-2 text-xs border-slate-600 text-slate-400">
                      Annual
                    </Badge>
                  )}
                  <h3 className="font-medium text-slate-200 line-clamp-2 mt-1">
                    {event.name}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>{formatEventDate(event.start_date, event.end_date)}</span>
                  </div>

                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate">
                      {event.venue ? `${event.venue}, ` : ''}{event.city}, {event.country}
                    </span>
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {event.featured_authors && event.featured_authors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.featured_authors.slice(0, 2).map((author, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-slate-700 text-slate-400">
                        {author}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {event.website_url && (
                    <a
                      href={event.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs border-slate-700 hover:border-primary/50"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    </a>
                  )}
                  {event.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full text-xs"
                      >
                        <Ticket className="w-3 h-3 mr-1" />
                        Tickets
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length > 3 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-200"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All {events.length} Events
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
};

export default SciFiEventsSection;
