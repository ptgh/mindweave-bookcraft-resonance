import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PRHEvent {
  eventid: string;
  eventname: string;
  eventtype: string;
  eventdate: string;
  eventtime: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  description: string;
  authorname: string;
  authorid: string;
}

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

// Known sci-fi authors to search for events
const SCIFI_AUTHORS = [
  'Isaac Asimov',
  'Philip K. Dick',
  'Arthur C. Clarke',
  'Ursula K. Le Guin',
  'Frank Herbert',
  'Ray Bradbury',
  'William Gibson',
  'Neal Stephenson',
  'Kim Stanley Robinson',
  'Octavia E. Butler',
  'Cixin Liu',
  'Ted Chiang',
  'N.K. Jemisin',
  'Ann Leckie',
  'Becky Chambers',
  'Martha Wells',
  'Arkady Martine',
  'Adrian Tchaikovsky',
  'Nnedi Okofor',
  'Brandon Sanderson'
];

async function fetchAuthorEvents(authorName: string): Promise<PRHEvent[]> {
  try {
    const [firstName, ...lastParts] = authorName.split(' ');
    const lastName = lastParts.join(' ');
    
    // First, get author ID
    const authorUrl = `https://reststop.randomhouse.com/resources/authors?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;
    console.log(`Fetching author: ${authorUrl}`);
    
    const authorResponse = await fetch(authorUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!authorResponse.ok) {
      console.log(`Author not found: ${authorName}`);
      return [];
    }
    
    const authorData = await authorResponse.text();
    
    // Parse XML response to get author ID
    const authorIdMatch = authorData.match(/<authorid>(\d+)<\/authorid>/);
    if (!authorIdMatch) {
      console.log(`No author ID found for: ${authorName}`);
      return [];
    }
    
    const authorId = authorIdMatch[1];
    console.log(`Found author ID ${authorId} for ${authorName}`);
    
    // Fetch events for this author
    const eventsUrl = `https://reststop.randomhouse.com/resources/events?authorid=${authorId}`;
    console.log(`Fetching events: ${eventsUrl}`);
    
    const eventsResponse = await fetch(eventsUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!eventsResponse.ok) {
      console.log(`No events found for author ID: ${authorId}`);
      return [];
    }
    
    const eventsData = await eventsResponse.text();
    
    // Parse XML events
    const events: PRHEvent[] = [];
    const eventMatches = eventsData.matchAll(/<event[^>]*>([\s\S]*?)<\/event>/g);
    
    for (const match of eventMatches) {
      const eventXml = match[1];
      
      const getField = (field: string): string => {
        const fieldMatch = eventXml.match(new RegExp(`<${field}>([^<]*)</${field}>`));
        return fieldMatch ? fieldMatch[1].trim() : '';
      };
      
      events.push({
        eventid: getField('eventid'),
        eventname: getField('eventname') || `${authorName} Event`,
        eventtype: getField('eventtype') || 'Author Event',
        eventdate: getField('eventdate'),
        eventtime: getField('eventtime'),
        venue: getField('venue'),
        city: getField('city'),
        state: getField('state'),
        country: getField('country') || 'USA',
        description: getField('description'),
        authorname: authorName,
        authorid: authorId
      });
    }
    
    console.log(`Found ${events.length} events for ${authorName}`);
    return events;
    
  } catch (error) {
    console.error(`Error fetching events for ${authorName}:`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching sci-fi publisher events...');
    
    const allEvents: SciFiEvent[] = [];
    
    // Fetch events for sci-fi authors (limit concurrent requests)
    const batchSize = 5;
    for (let i = 0; i < SCIFI_AUTHORS.length; i += batchSize) {
      const batch = SCIFI_AUTHORS.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(author => fetchAuthorEvents(author))
      );
      
      for (const events of batchResults) {
        for (const event of events) {
          // Only include future events
          if (event.eventdate) {
            const eventDate = new Date(event.eventdate);
            if (eventDate >= new Date()) {
              allEvents.push({
                id: event.eventid || `${event.authorid}-${Date.now()}`,
                title: event.eventname,
                author: event.authorname,
                authorId: event.authorid,
                date: event.eventdate,
                time: event.eventtime || 'TBA',
                venue: event.venue || 'Venue TBA',
                location: [event.city, event.state, event.country]
                  .filter(Boolean)
                  .join(', ') || 'Location TBA',
                type: event.eventtype,
                description: event.description || ''
              });
            }
          }
        }
      }
    }
    
    // Sort by date
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Limit to next 20 events
    const upcomingEvents = allEvents.slice(0, 20);
    
    console.log(`Returning ${upcomingEvents.length} upcoming sci-fi events`);
    
    return new Response(
      JSON.stringify({
        success: true,
        events: upcomingEvents,
        totalFound: allEvents.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error fetching publisher events:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        events: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
