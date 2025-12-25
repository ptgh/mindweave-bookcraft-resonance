import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface SciFiEvent {
  id: string;
  title: string;
  author: string;
  authorId: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  type: string;
  description: string;
}

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
        
        const { data, error: fnError } = await supabase.functions.invoke('fetch-publisher-events');
        
        if (fnError) throw fnError;
        
        if (data?.success && data?.events) {
          setEvents(data.events);
        } else {
          // Use fallback/mock data if API returns nothing
          setEvents(getFallbackEvents());
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Unable to load events');
        // Show fallback events on error
        setEvents(getFallbackEvents());
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getFallbackEvents = (): SciFiEvent[] => [
    {
      id: 'fallback-1',
      title: 'Science Fiction Book Club',
      author: 'Various Authors',
      authorId: '0',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      time: '7:00 PM',
      venue: 'Local Bookstore',
      location: 'Check your local listings',
      type: 'Book Club',
      description: 'Join fellow sci-fi enthusiasts for monthly discussions'
    },
    {
      id: 'fallback-2',
      title: 'SF Masterworks Reading Group',
      author: 'Classic Authors',
      authorId: '0',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      time: '6:30 PM',
      venue: 'Online',
      location: 'Virtual Event',
      type: 'Reading Group',
      description: 'Exploring the canon of science fiction classics'
    }
  ];

  const displayedEvents = expanded ? events : events.slice(0, 3);

  const formatEventDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
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
    return null; // Don't show section if no events
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
            className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-all duration-300"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Badge 
                    variant="outline" 
                    className="mb-2 text-xs border-primary/30 text-primary"
                  >
                    {event.type}
                  </Badge>
                  <h3 className="font-medium text-slate-200 line-clamp-2">
                    {event.title}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{event.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{formatEventDate(event.date)}</span>
                  </div>

                  {event.time && event.time !== 'TBA' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{event.time}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  {event.location && event.location !== 'Location TBA' && (
                    <p className="text-xs text-slate-500 pl-6 truncate">
                      {event.location}
                    </p>
                  )}
                </div>

                {event.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                    {event.description}
                  </p>
                )}
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

      <div className="mt-4 text-center">
        <a
          href="https://www.penguinrandomhouse.com/authors/events/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View all Penguin Random House events
        </a>
      </div>
    </section>
  );
};

export default SciFiEventsSection;
