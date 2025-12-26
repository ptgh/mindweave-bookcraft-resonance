import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Classic SF film adaptations database
const SF_FILM_ADAPTATIONS = [
  {
    book_title: "Do Androids Dream of Electric Sheep?",
    book_author: "Philip K. Dick",
    book_publication_year: 1968,
    film_title: "Blade Runner",
    film_year: 1982,
    director: "Ridley Scott",
    imdb_id: "tt0083658",
    imdb_rating: 8.1,
    rotten_tomatoes_score: 89,
    adaptation_type: "loose",
    notable_differences: "Film focuses more on noir aesthetics and existential questions; book explores empathy and the Mercerism religion more deeply",
    awards: ["BAFTA Award for Best Cinematography", "Hugo Award for Best Dramatic Presentation"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "2001: A Space Odyssey",
    book_author: "Arthur C. Clarke",
    book_publication_year: 1968,
    film_title: "2001: A Space Odyssey",
    film_year: 1968,
    director: "Stanley Kubrick",
    imdb_id: "tt0062622",
    imdb_rating: 8.3,
    rotten_tomatoes_score: 92,
    adaptation_type: "direct",
    notable_differences: "Novel and film were developed simultaneously; novel provides more exposition for HAL's malfunction and the Star Gate sequence",
    awards: ["Academy Award for Best Visual Effects", "BAFTA Award for Best Art Direction"],
    streaming_availability: { netflix: false, prime: true, hbo: true }
  },
  {
    book_title: "Dune",
    book_author: "Frank Herbert",
    book_publication_year: 1965,
    film_title: "Dune",
    film_year: 2021,
    director: "Denis Villeneuve",
    imdb_id: "tt1160419",
    imdb_rating: 8.0,
    rotten_tomatoes_score: 83,
    adaptation_type: "direct",
    notable_differences: "Film covers first half of novel; streamlines political complexity while maintaining visual grandeur",
    awards: ["Academy Award for Best Cinematography", "Academy Award for Best Original Score"],
    streaming_availability: { netflix: false, prime: false, hbo: true }
  },
  {
    book_title: "Story of Your Life",
    book_author: "Ted Chiang",
    book_publication_year: 1998,
    film_title: "Arrival",
    film_year: 2016,
    director: "Denis Villeneuve",
    imdb_id: "tt2543164",
    imdb_rating: 7.9,
    rotten_tomatoes_score: 94,
    adaptation_type: "direct",
    notable_differences: "Film adds geopolitical tensions and military subplot; novella focuses more on linguistics and physics",
    awards: ["Academy Award for Best Sound Editing", "Hugo Award for Best Dramatic Presentation"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "The Martian",
    book_author: "Andy Weir",
    book_publication_year: 2011,
    film_title: "The Martian",
    film_year: 2015,
    director: "Ridley Scott",
    imdb_id: "tt3659388",
    imdb_rating: 8.0,
    rotten_tomatoes_score: 91,
    adaptation_type: "direct",
    notable_differences: "Film condenses timeline and simplifies some science; maintains humor and problem-solving focus",
    awards: ["Academy Award nominations for Best Picture and Best Actor"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Solaris",
    book_author: "Stanisław Lem",
    book_publication_year: 1961,
    film_title: "Solaris",
    film_year: 1972,
    director: "Andrei Tarkovsky",
    imdb_id: "tt0069293",
    imdb_rating: 8.1,
    rotten_tomatoes_score: 92,
    adaptation_type: "loose",
    notable_differences: "Tarkovsky emphasizes human relationships over scientific mystery; Lem was critical of this approach",
    awards: ["Grand Prix at Cannes Film Festival"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Annihilation",
    book_author: "Jeff VanderMeer",
    book_publication_year: 2014,
    film_title: "Annihilation",
    film_year: 2018,
    director: "Alex Garland",
    imdb_id: "tt2798920",
    imdb_rating: 6.8,
    rotten_tomatoes_score: 88,
    adaptation_type: "loose",
    notable_differences: "Film takes significant liberties with plot and characters while maintaining cosmic horror atmosphere",
    awards: ["Nebula Award for Best Script"],
    streaming_availability: { netflix: true, prime: false, hbo: false }
  },
  {
    book_title: "The Minority Report",
    book_author: "Philip K. Dick",
    book_publication_year: 1956,
    film_title: "Minority Report",
    film_year: 2002,
    director: "Steven Spielberg",
    imdb_id: "tt0181689",
    imdb_rating: 7.6,
    rotten_tomatoes_score: 90,
    adaptation_type: "loose",
    notable_differences: "Film greatly expands short story into action thriller; adds personal stakes and different ending",
    awards: ["Saturn Award for Best Science Fiction Film"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "I, Robot",
    book_author: "Isaac Asimov",
    book_publication_year: 1950,
    film_title: "I, Robot",
    film_year: 2004,
    director: "Alex Proyas",
    imdb_id: "tt0343818",
    imdb_rating: 7.1,
    rotten_tomatoes_score: 56,
    adaptation_type: "inspired_by",
    notable_differences: "Film creates original story using Asimov's Three Laws; very different from short story collection",
    awards: ["Saturn Award nomination"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "The Time Machine",
    book_author: "H.G. Wells",
    book_publication_year: 1895,
    film_title: "The Time Machine",
    film_year: 1960,
    director: "George Pal",
    imdb_id: "tt0054387",
    imdb_rating: 7.6,
    rotten_tomatoes_score: 80,
    adaptation_type: "direct",
    notable_differences: "Film adds romance subplot and Cold War commentary; faithful to core time travel concept",
    awards: ["Academy Award for Best Special Effects"],
    streaming_availability: { netflix: false, prime: true, hbo: true }
  },
  {
    book_title: "The War of the Worlds",
    book_author: "H.G. Wells",
    book_publication_year: 1898,
    film_title: "The War of the Worlds",
    film_year: 1953,
    director: "Byron Haskin",
    imdb_id: "tt0046534",
    imdb_rating: 7.1,
    rotten_tomatoes_score: 85,
    adaptation_type: "loose",
    notable_differences: "Updated to 1950s Cold War America; changes Martian war machines to sleek flying craft",
    awards: ["Academy Award for Best Special Effects"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Fahrenheit 451",
    book_author: "Ray Bradbury",
    book_publication_year: 1953,
    film_title: "Fahrenheit 451",
    film_year: 1966,
    director: "François Truffaut",
    imdb_id: "tt0060390",
    imdb_rating: 7.2,
    rotten_tomatoes_score: 88,
    adaptation_type: "direct",
    notable_differences: "French New Wave style adds visual poetry; dual role for Julie Christie emphasizes duality themes",
    awards: ["Venice Film Festival nomination"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "The Invisible Man",
    book_author: "H.G. Wells",
    book_publication_year: 1897,
    film_title: "The Invisible Man",
    film_year: 1933,
    director: "James Whale",
    imdb_id: "tt0024184",
    imdb_rating: 7.7,
    rotten_tomatoes_score: 94,
    adaptation_type: "direct",
    notable_differences: "Film adds dark humor and iconic Claude Rains performance; faithful to novel's horror elements",
    awards: ["National Film Registry"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "A Clockwork Orange",
    book_author: "Anthony Burgess",
    book_publication_year: 1962,
    film_title: "A Clockwork Orange",
    film_year: 1971,
    director: "Stanley Kubrick",
    imdb_id: "tt0066921",
    imdb_rating: 8.3,
    rotten_tomatoes_score: 87,
    adaptation_type: "direct",
    notable_differences: "Film omits novel's final redemptive chapter (US edition); Kubrick's visual style defines the work",
    awards: ["New York Film Critics Circle Award for Best Film"],
    streaming_availability: { netflix: false, prime: true, hbo: true }
  },
  {
    book_title: "Total Recall (We Can Remember It for You Wholesale)",
    book_author: "Philip K. Dick",
    book_publication_year: 1966,
    film_title: "Total Recall",
    film_year: 1990,
    director: "Paul Verhoeven",
    imdb_id: "tt0100802",
    imdb_rating: 7.5,
    rotten_tomatoes_score: 82,
    adaptation_type: "loose",
    notable_differences: "Short story greatly expanded with Mars setting and action sequences; maintains reality-questioning theme",
    awards: ["Academy Award for Best Visual Effects"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Children of Men",
    book_author: "P.D. James",
    book_publication_year: 1992,
    film_title: "Children of Men",
    film_year: 2006,
    director: "Alfonso Cuarón",
    imdb_id: "tt0206634",
    imdb_rating: 7.9,
    rotten_tomatoes_score: 92,
    adaptation_type: "loose",
    notable_differences: "Film shifts focus from religious themes to immigration and political chaos; famous long takes",
    awards: ["Academy Award nominations for Best Cinematography and Editing"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Jurassic Park",
    book_author: "Michael Crichton",
    book_publication_year: 1990,
    film_title: "Jurassic Park",
    film_year: 1993,
    director: "Steven Spielberg",
    imdb_id: "tt0107290",
    imdb_rating: 8.2,
    rotten_tomatoes_score: 91,
    adaptation_type: "direct",
    notable_differences: "Film softens darker elements; Hammond becomes sympathetic; some characters survive who die in book",
    awards: ["Academy Award for Best Visual Effects"],
    streaming_availability: { netflix: true, prime: true, hbo: false }
  },
  {
    book_title: "Contact",
    book_author: "Carl Sagan",
    book_publication_year: 1985,
    film_title: "Contact",
    film_year: 1997,
    director: "Robert Zemeckis",
    imdb_id: "tt0118884",
    imdb_rating: 7.5,
    rotten_tomatoes_score: 66,
    adaptation_type: "direct",
    notable_differences: "Film simplifies multiple machines to one; romance subplot expanded; ending modified slightly",
    awards: ["Hugo Award for Best Dramatic Presentation"],
    streaming_availability: { netflix: false, prime: true, hbo: true }
  },
  {
    book_title: "The Andromeda Strain",
    book_author: "Michael Crichton",
    book_publication_year: 1969,
    film_title: "The Andromeda Strain",
    film_year: 1971,
    director: "Robert Wise",
    imdb_id: "tt0066769",
    imdb_rating: 7.2,
    rotten_tomatoes_score: 68,
    adaptation_type: "direct",
    notable_differences: "Faithful adaptation with documentary style; technical accuracy maintained",
    awards: ["Academy Award nominations for Art Direction and Editing"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "The Road",
    book_author: "Cormac McCarthy",
    book_publication_year: 2006,
    film_title: "The Road",
    film_year: 2009,
    director: "John Hillcoat",
    imdb_id: "tt0898367",
    imdb_rating: 7.2,
    rotten_tomatoes_score: 75,
    adaptation_type: "direct",
    notable_differences: "Film captures novel's bleak atmosphere; some flashbacks added for visual storytelling",
    awards: ["BAFTA nomination"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Stalker (Roadside Picnic)",
    book_author: "Arkady and Boris Strugatsky",
    book_publication_year: 1972,
    film_title: "Stalker",
    film_year: 1979,
    director: "Andrei Tarkovsky",
    imdb_id: "tt0079944",
    imdb_rating: 8.2,
    rotten_tomatoes_score: 97,
    adaptation_type: "loose",
    notable_differences: "Tarkovsky transforms adventure story into philosophical meditation; Zone becomes spiritual metaphor",
    awards: ["Prize of the Ecumenical Jury at Cannes"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Never Let Me Go",
    book_author: "Kazuo Ishiguro",
    book_publication_year: 2005,
    film_title: "Never Let Me Go",
    film_year: 2010,
    director: "Mark Romanek",
    imdb_id: "tt1334260",
    imdb_rating: 7.1,
    rotten_tomatoes_score: 71,
    adaptation_type: "direct",
    notable_differences: "Film captures novel's melancholy; some internal monologue lost in translation",
    awards: ["BAFTA nominations"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Ex Machina (original screenplay)",
    book_author: "Alex Garland",
    book_publication_year: 2015,
    film_title: "Ex Machina",
    film_year: 2015,
    director: "Alex Garland",
    imdb_id: "tt0470752",
    imdb_rating: 7.7,
    rotten_tomatoes_score: 92,
    adaptation_type: "direct",
    notable_differences: "Original screenplay inspired by classic AI/consciousness SF literature",
    awards: ["Academy Award for Best Visual Effects"],
    streaming_availability: { netflix: true, prime: true, hbo: false }
  },
  {
    book_title: "The Prestige",
    book_author: "Christopher Priest",
    book_publication_year: 1995,
    film_title: "The Prestige",
    film_year: 2006,
    director: "Christopher Nolan",
    imdb_id: "tt0482571",
    imdb_rating: 8.5,
    rotten_tomatoes_score: 76,
    adaptation_type: "loose",
    notable_differences: "Film restructures narrative and changes key plot elements; Tesla's machine works differently",
    awards: ["Academy Award nominations"],
    streaming_availability: { netflix: false, prime: true, hbo: false }
  },
  {
    book_title: "Edge of Tomorrow (All You Need Is Kill)",
    book_author: "Hiroshi Sakurazaka",
    book_publication_year: 2004,
    film_title: "Edge of Tomorrow",
    film_year: 2014,
    director: "Doug Liman",
    imdb_id: "tt1631867",
    imdb_rating: 7.9,
    rotten_tomatoes_score: 91,
    adaptation_type: "loose",
    notable_differences: "Setting changed from Japan to Europe; ending significantly altered for Hollywood",
    awards: ["Saturn Award nominations"],
    streaming_availability: { netflix: false, prime: true, hbo: true }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Populating SF film adaptations database...');

    // Check existing count
    const { count: existingCount } = await supabase
      .from('sf_film_adaptations')
      .select('*', { count: 'exact', head: true });

    if (existingCount && existingCount >= SF_FILM_ADAPTATIONS.length) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Database already populated',
        count: existingCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert adaptations
    const { data, error } = await supabase
      .from('sf_film_adaptations')
      .upsert(SF_FILM_ADAPTATIONS, { 
        onConflict: 'book_title,film_title',
        ignoreDuplicates: true 
      })
      .select();

    if (error) {
      console.error('Error inserting adaptations:', error);
      
      // Try individual inserts as fallback
      let insertedCount = 0;
      for (const adaptation of SF_FILM_ADAPTATIONS) {
        const { error: insertError } = await supabase
          .from('sf_film_adaptations')
          .insert(adaptation);
        
        if (!insertError) {
          insertedCount++;
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true,
        message: `Inserted ${insertedCount} new adaptations (fallback method)`,
        count: insertedCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully populated ${data?.length || 0} film adaptations`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Populated ${data?.length || 0} film adaptations`,
      count: data?.length || 0,
      adaptations: data?.map(a => `${a.book_title} → ${a.film_title} (${a.film_year})`)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating film adaptations:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Population failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
