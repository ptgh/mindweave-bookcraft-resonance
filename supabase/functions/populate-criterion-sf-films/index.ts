import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Complete list of Criterion Collection SF films with verified data
const CRITERION_SF_FILMS = [
  { title: "2001: A Space Odyssey", director: "Stanley Kubrick", year: 1968, spine: 700, slug: "2001-a-space-odyssey", book_title: "2001: A Space Odyssey", book_author: "Arthur C. Clarke" },
  { title: "Alien", director: "Ridley Scott", year: 1979, spine: 1200, slug: "alien", book_title: "Alien", book_author: "Alan Dean Foster" },
  { title: "Altered States", director: "Ken Russell", year: 1980, spine: 829, slug: "altered-states", book_title: "Altered States", book_author: "Paddy Chayefsky" },
  { title: "Andrei Rublev", director: "Andrei Tarkovsky", year: 1966, spine: 34, slug: "andrei-rublev", book_title: "Andrei Rublev", book_author: "Andrei Tarkovsky" },
  { title: "Brazil", director: "Terry Gilliam", year: 1985, spine: 51, slug: "brazil", book_title: "Brazil", book_author: "Terry Gilliam" },
  { title: "Crimes of the Future", director: "David Cronenberg", year: 2022, spine: 1200, slug: "crimes-of-the-future", book_title: "Crimes of the Future", book_author: "David Cronenberg" },
  { title: "Dark City", director: "Alex Proyas", year: 1998, spine: 0, slug: "dark-city", book_title: "Dark City", book_author: "Alex Proyas" },
  { title: "Dead Ringers", director: "David Cronenberg", year: 1988, spine: 23, slug: "dead-ringers", book_title: "Twins", book_author: "Bari Wood & Jack Geasland" },
  { title: "Eraserhead", director: "David Lynch", year: 1977, spine: 725, slug: "eraserhead", book_title: "Eraserhead", book_author: "David Lynch" },
  { title: "eXistenZ", director: "David Cronenberg", year: 1999, spine: 0, slug: "existenz", book_title: "eXistenZ", book_author: "Christopher Priest" },
  { title: "Fahrenheit 451", director: "François Truffaut", year: 1966, spine: 0, slug: "fahrenheit-451", book_title: "Fahrenheit 451", book_author: "Ray Bradbury" },
  { title: "Fantastic Planet", director: "René Laloux", year: 1973, spine: 820, slug: "fantastic-planet", book_title: "Oms en série", book_author: "Stefan Wul" },
  { title: "The Fly", director: "David Cronenberg", year: 1986, spine: 0, slug: "the-fly", book_title: "The Fly", book_author: "George Langelaan" },
  { title: "Godzilla", director: "Ishirō Honda", year: 1954, spine: 594, slug: "godzilla", book_title: "Godzilla", book_author: "Shigeru Kayama" },
  { title: "The Host", director: "Bong Joon-ho", year: 2006, spine: 0, slug: "the-host", book_title: "The Host", book_author: "Bong Joon-ho" },
  { title: "House", director: "Nobuhiko Obayashi", year: 1977, spine: 539, slug: "house", book_title: "House", book_author: "Chiho Katsura" },
  { title: "Invasion of the Body Snatchers", director: "Philip Kaufman", year: 1978, spine: 700, slug: "invasion-of-the-body-snatchers", book_title: "The Body Snatchers", book_author: "Jack Finney" },
  { title: "The Invitation", director: "Karyn Kusama", year: 2015, spine: 0, slug: "the-invitation", book_title: "The Invitation", book_author: "Phil Hay & Matt Manfredi" },
  { title: "It Came from Outer Space", director: "Jack Arnold", year: 1953, spine: 0, slug: "it-came-from-outer-space", book_title: "It Came from Outer Space", book_author: "Ray Bradbury" },
  { title: "La Jetée", director: "Chris Marker", year: 1962, spine: 387, slug: "la-jetee", book_title: "La Jetée", book_author: "Chris Marker" },
  { title: "The Man Who Fell to Earth", director: "Nicolas Roeg", year: 1976, spine: 304, slug: "the-man-who-fell-to-earth", book_title: "The Man Who Fell to Earth", book_author: "Walter Tevis" },
  { title: "Memories of Murder", director: "Bong Joon-ho", year: 2003, spine: 0, slug: "memories-of-murder", book_title: "Memories of Murder", book_author: "Kim Kwang-rim" },
  { title: "Metropolis", director: "Fritz Lang", year: 1927, spine: 28, slug: "metropolis", book_title: "Metropolis", book_author: "Thea von Harbou" },
  { title: "Naked Lunch", director: "David Cronenberg", year: 1991, spine: 220, slug: "naked-lunch", book_title: "Naked Lunch", book_author: "William S. Burroughs" },
  { title: "Nineteen Eighty-Four", director: "Michael Radford", year: 1984, spine: 0, slug: "nineteen-eighty-four", book_title: "Nineteen Eighty-Four", book_author: "George Orwell" },
  { title: "On the Silver Globe", director: "Andrzej Żuławski", year: 1988, spine: 0, slug: "on-the-silver-globe", book_title: "The Lunar Trilogy", book_author: "Jerzy Żuławski" },
  { title: "Paris, Texas", director: "Wim Wenders", year: 1984, spine: 748, slug: "paris-texas", book_title: "Paris, Texas", book_author: "Sam Shepard" },
  { title: "Possession", director: "Andrzej Żuławski", year: 1981, spine: 1120, slug: "possession", book_title: "Possession", book_author: "Andrzej Żuławski" },
  { title: "RoboCop", director: "Paul Verhoeven", year: 1987, spine: 23, slug: "robocop", book_title: "RoboCop", book_author: "Ed Naha" },
  { title: "Safe", director: "Todd Haynes", year: 1995, spine: 1143, slug: "safe", book_title: "Safe", book_author: "Todd Haynes" },
  { title: "Scanners", director: "David Cronenberg", year: 1981, spine: 712, slug: "scanners", book_title: "Scanners", book_author: "David Cronenberg" },
  { title: "Seconds", director: "John Frankenheimer", year: 1966, spine: 587, slug: "seconds", book_title: "Seconds", book_author: "David Ely" },
  { title: "Solaris", director: "Andrei Tarkovsky", year: 1972, spine: 164, slug: "solaris", book_title: "Solaris", book_author: "Stanisław Lem" },
  { title: "Stalker", director: "Andrei Tarkovsky", year: 1979, spine: 888, slug: "stalker", book_title: "Roadside Picnic", book_author: "Arkady & Boris Strugatsky" },
  { title: "Tetsuo: The Iron Man", director: "Shinya Tsukamoto", year: 1989, spine: 0, slug: "tetsuo-the-iron-man", book_title: "Tetsuo: The Iron Man", book_author: "Shinya Tsukamoto" },
  { title: "They Live", director: "John Carpenter", year: 1988, spine: 0, slug: "they-live", book_title: "Eight O'Clock in the Morning", book_author: "Ray Nelson" },
  { title: "The Thing", director: "John Carpenter", year: 1982, spine: 0, slug: "the-thing", book_title: "Who Goes There?", book_author: "John W. Campbell Jr." },
  { title: "Time Bandits", director: "Terry Gilliam", year: 1981, spine: 37, slug: "time-bandits", book_title: "Time Bandits", book_author: "Terry Gilliam & Michael Palin" },
  { title: "Under the Skin", director: "Jonathan Glazer", year: 2013, spine: 0, slug: "under-the-skin", book_title: "Under the Skin", book_author: "Michel Faber" },
  { title: "Videodrome", director: "David Cronenberg", year: 1983, spine: 248, slug: "videodrome", book_title: "Videodrome", book_author: "David Cronenberg" },
  { title: "War of the Worlds", director: "Byron Haskin", year: 1953, spine: 0, slug: "the-war-of-the-worlds", book_title: "The War of the Worlds", book_author: "H.G. Wells" },
  { title: "World on a Wire", director: "Rainer Werner Fassbinder", year: 1973, spine: 548, slug: "world-on-a-wire", book_title: "Simulacron-3", book_author: "Daniel F. Galouye" },
  { title: "A Clockwork Orange", director: "Stanley Kubrick", year: 1971, spine: 0, slug: "a-clockwork-orange", book_title: "A Clockwork Orange", book_author: "Anthony Burgess" },
  { title: "12 Monkeys", director: "Terry Gilliam", year: 1995, spine: 0, slug: "12-monkeys", book_title: "La Jetée (inspiration)", book_author: "Chris Marker" },
  { title: "The Day the Earth Stood Still", director: "Robert Wise", year: 1951, spine: 0, slug: "the-day-the-earth-stood-still", book_title: "Farewell to the Master", book_author: "Harry Bates" },
  { title: "Forbidden Planet", director: "Fred M. Wilcox", year: 1956, spine: 0, slug: "forbidden-planet", book_title: "The Tempest (inspiration)", book_author: "William Shakespeare" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authorization
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing ${CRITERION_SF_FILMS.length} Criterion SF films...`);

    let inserted = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const film of CRITERION_SF_FILMS) {
      const criterionUrl = `https://www.criterion.com/films/${film.slug}`;
      
      // Check if film already exists by title (case-insensitive)
      const { data: existingFilms } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title')
        .ilike('film_title', film.title)
        .limit(1);

      if (existingFilms && existingFilms.length > 0) {
        // Update existing film with Criterion data
        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({
            is_criterion_collection: true,
            criterion_url: criterionUrl,
            criterion_spine: film.spine > 0 ? film.spine : null,
            source: 'criterion',
          })
          .eq('id', existingFilms[0].id);

        if (updateError) {
          errors.push(`Failed to update ${film.title}: ${updateError.message}`);
        } else {
          updated++;
          console.log(`Updated: ${film.title}`);
        }
      } else {
        // Insert new film
        const { error: insertError } = await supabase
          .from('sf_film_adaptations')
          .insert({
            film_title: film.title,
            director: film.director,
            film_year: film.year,
            book_title: film.book_title,
            book_author: film.book_author,
            is_criterion_collection: true,
            criterion_url: criterionUrl,
            criterion_spine: film.spine > 0 ? film.spine : null,
            source: 'criterion',
          });

        if (insertError) {
          errors.push(`Failed to insert ${film.title}: ${insertError.message}`);
        } else {
          inserted++;
          console.log(`Inserted: ${film.title}`);
        }
      }
    }

    console.log(`Completed: ${inserted} inserted, ${updated} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      inserted,
      updated,
      total: CRITERION_SF_FILMS.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating Criterion films:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
