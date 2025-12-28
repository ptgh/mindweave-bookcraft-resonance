import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Classic SF film adaptations database with streaming URLs, awards, and images
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
    adaptation_type: "loose",
    notable_differences: "Film focuses more on noir aesthetics and existential questions; book explores empathy and the Mercerism religion more deeply",
    trailer_url: "https://www.youtube.com/watch?v=eogpIG53Cis",
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
    adaptation_type: "direct",
    notable_differences: "Novel and film were developed simultaneously; novel provides more exposition for HAL's malfunction and the Star Gate sequence",
    trailer_url: "https://www.youtube.com/watch?v=oR_e9y-bka0",
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
    adaptation_type: "direct",
    notable_differences: "Film covers first half of novel; streamlines political complexity while maintaining visual grandeur",
    trailer_url: "https://www.youtube.com/watch?v=8g18jFHCLXk",
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
    adaptation_type: "direct",
    notable_differences: "Film adds geopolitical tensions and military subplot; novella focuses more on linguistics and physics",
    trailer_url: "https://www.youtube.com/watch?v=tFMo3UJ4B4g",
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
    adaptation_type: "direct",
    notable_differences: "Film condenses timeline and simplifies some science; maintains humor and problem-solving focus",
    trailer_url: "https://www.youtube.com/watch?v=ej3ioOneTy8",
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
    adaptation_type: "loose",
    notable_differences: "Tarkovsky emphasizes human relationships over scientific mystery; Lem was critical of this approach",
    trailer_url: "https://www.youtube.com/watch?v=6-4KydP92ss",
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
    adaptation_type: "direct",
    notable_differences: "Film omits novel's final redemptive chapter (US edition); Kubrick's visual style defines the work",
    trailer_url: "https://www.youtube.com/watch?v=SPRzm8ibDQ8",
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
    adaptation_type: "direct",
    notable_differences: "Film softens darker elements; Hammond becomes sympathetic; some characters survive who die in book",
    trailer_url: "https://www.youtube.com/watch?v=lc0UehYemQA",
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
    adaptation_type: "loose",
    notable_differences: "Film shifts focus from religious themes to immigration and political chaos; famous long takes",
    trailer_url: "https://www.youtube.com/watch?v=2VT2apoX90o",
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
    adaptation_type: "direct",
    notable_differences: "Film simplifies multiple machines to one; romance subplot expanded; ending modified slightly",
    trailer_url: "https://www.youtube.com/watch?v=SRoj3jK37Vc",
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
    adaptation_type: "direct",
    notable_differences: "Film captures novel's bleak atmosphere; some flashbacks added for visual storytelling",
    trailer_url: "https://www.youtube.com/watch?v=bO2BLSEJf6Y",
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
    adaptation_type: "loose",
    notable_differences: "Tarkovsky transforms adventure story into philosophical meditation; Zone becomes spiritual metaphor",
    trailer_url: "https://www.youtube.com/watch?v=xB7jVTut3-g",
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
    adaptation_type: "direct",
    notable_differences: "French New Wave style; English language with British setting",
    trailer_url: "https://www.youtube.com/watch?v=yyrD_1sTdU0",
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
    adaptation_type: "loose",
    notable_differences: "Film takes significant liberties with plot and characters while maintaining cosmic horror atmosphere",
    trailer_url: "https://www.youtube.com/watch?v=89OP78l9oF0",
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
    adaptation_type: "loose",
    notable_differences: "Film restructures narrative and changes key plot elements; Tesla's machine works differently",
    trailer_url: "https://www.youtube.com/watch?v=o4gHCmTQDVI",
  },
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

    console.log(`Processing ${SF_FILM_ADAPTATIONS.length} film adaptations...`);

    let inserted = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const film of SF_FILM_ADAPTATIONS) {
      // Check if film already exists by title
      const { data: existingFilms } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title')
        .ilike('film_title', film.film_title)
        .limit(1);

      if (existingFilms && existingFilms.length > 0) {
        // Update existing film
        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update(film)
          .eq('id', existingFilms[0].id);

        if (updateError) {
          errors.push(`Failed to update ${film.film_title}: ${updateError.message}`);
        } else {
          updated++;
          console.log(`Updated: ${film.film_title}`);
        }
      } else {
        // Insert new film
        const { error: insertError } = await supabase
          .from('sf_film_adaptations')
          .insert(film);

        if (insertError) {
          errors.push(`Failed to insert ${film.film_title}: ${insertError.message}`);
        } else {
          inserted++;
          console.log(`Inserted: ${film.film_title}`);
        }
      }
    }

    console.log(`Completed: ${inserted} inserted, ${updated} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      count: inserted + updated,
      inserted,
      updated,
      total: SF_FILM_ADAPTATIONS.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating film adaptations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
