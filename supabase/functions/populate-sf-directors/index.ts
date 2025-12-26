import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Key SF directors with their filmographies
const SF_DIRECTORS = [
  {
    name: "Ridley Scott",
    nationality: "British",
    bio: "Visionary filmmaker known for groundbreaking science fiction that combines stunning visuals with philosophical depth. His work has defined the look of dystopian futures in cinema.",
    birth_year: 1937,
    wikipedia_url: "https://en.wikipedia.org/wiki/Ridley_Scott",
    notable_sf_films: ["Blade Runner", "Alien", "The Martian", "Prometheus", "Blade Runner 2049"]
  },
  {
    name: "Denis Villeneuve",
    nationality: "Canadian",
    bio: "Master of atmospheric science fiction, Villeneuve brings literary sensibilities to epic spectacles. His films explore consciousness, time, and humanity's place in the universe.",
    birth_year: 1967,
    wikipedia_url: "https://en.wikipedia.org/wiki/Denis_Villeneuve",
    notable_sf_films: ["Arrival", "Blade Runner 2049", "Dune", "Dune: Part Two"]
  },
  {
    name: "Stanley Kubrick",
    nationality: "American",
    bio: "Legendary perfectionist whose meticulous approach created some of the most influential films in cinema history. His science fiction work pushed the boundaries of the medium.",
    birth_year: 1928,
    death_year: 1999,
    wikipedia_url: "https://en.wikipedia.org/wiki/Stanley_Kubrick",
    notable_sf_films: ["2001: A Space Odyssey", "A Clockwork Orange", "Dr. Strangelove"]
  },
  {
    name: "Andrei Tarkovsky",
    nationality: "Russian",
    bio: "Poetic filmmaker whose contemplative style influenced generations of directors. His science fiction transcends genre to explore spiritual and existential themes.",
    birth_year: 1932,
    death_year: 1986,
    wikipedia_url: "https://en.wikipedia.org/wiki/Andrei_Tarkovsky",
    notable_sf_films: ["Solaris", "Stalker", "The Sacrifice"]
  },
  {
    name: "Christopher Nolan",
    nationality: "British-American",
    bio: "Known for complex narratives and practical effects, Nolan creates mind-bending experiences that challenge audiences while delivering blockbuster entertainment.",
    birth_year: 1970,
    wikipedia_url: "https://en.wikipedia.org/wiki/Christopher_Nolan",
    notable_sf_films: ["Interstellar", "Inception", "The Prestige", "Tenet", "Oppenheimer"]
  },
  {
    name: "Steven Spielberg",
    nationality: "American",
    bio: "One of cinema's most successful directors, Spielberg has shaped the science fiction genre with films ranging from wonder-filled adventures to thoughtful dramas.",
    birth_year: 1946,
    wikipedia_url: "https://en.wikipedia.org/wiki/Steven_Spielberg",
    notable_sf_films: ["E.T. the Extra-Terrestrial", "Jurassic Park", "Close Encounters of the Third Kind", "A.I. Artificial Intelligence", "Minority Report", "War of the Worlds", "Ready Player One"]
  },
  {
    name: "Alex Garland",
    nationality: "British",
    bio: "Writer-director who brings literary intelligence to visceral science fiction. His films explore artificial intelligence, self-destruction, and the boundaries of consciousness.",
    birth_year: 1970,
    wikipedia_url: "https://en.wikipedia.org/wiki/Alex_Garland",
    notable_sf_films: ["Ex Machina", "Annihilation", "Men", "Civil War"]
  },
  {
    name: "Terry Gilliam",
    nationality: "American-British",
    bio: "Former Monty Python animator whose fantastical visual imagination creates surreal, satirical worlds that critique bureaucracy and conformity.",
    birth_year: 1940,
    wikipedia_url: "https://en.wikipedia.org/wiki/Terry_Gilliam",
    notable_sf_films: ["Brazil", "12 Monkeys", "The Zero Theorem", "Time Bandits"]
  },
  {
    name: "David Cronenberg",
    nationality: "Canadian",
    bio: "Pioneer of body horror who explores the intersection of technology and flesh. His 'New Flesh' films examine transformation, identity, and evolution.",
    birth_year: 1943,
    wikipedia_url: "https://en.wikipedia.org/wiki/David_Cronenberg",
    notable_sf_films: ["Videodrome", "The Fly", "Scanners", "eXistenZ", "Crimes of the Future"]
  },
  {
    name: "Paul Verhoeven",
    nationality: "Dutch",
    bio: "Provocative satirist whose action films contain sharp critiques of capitalism, militarism, and media. His Hollywood SF work is both entertaining and subversive.",
    birth_year: 1938,
    wikipedia_url: "https://en.wikipedia.org/wiki/Paul_Verhoeven",
    notable_sf_films: ["RoboCop", "Total Recall", "Starship Troopers", "Hollow Man"]
  },
  {
    name: "James Cameron",
    nationality: "Canadian",
    bio: "Technical innovator and master of blockbuster filmmaking. Cameron's science fiction combines cutting-edge effects with environmental and humanist themes.",
    birth_year: 1954,
    wikipedia_url: "https://en.wikipedia.org/wiki/James_Cameron",
    notable_sf_films: ["The Terminator", "Terminator 2: Judgment Day", "Aliens", "The Abyss", "Avatar", "Avatar: The Way of Water"]
  },
  {
    name: "Alfonso Cuarón",
    nationality: "Mexican",
    bio: "Master of the long take whose technical virtuosity serves deeply human stories. His science fiction grounds futuristic concepts in immediate emotional reality.",
    birth_year: 1961,
    wikipedia_url: "https://en.wikipedia.org/wiki/Alfonso_Cuar%C3%B3n",
    notable_sf_films: ["Children of Men", "Gravity"]
  },
  {
    name: "Bong Joon-ho",
    nationality: "South Korean",
    bio: "Genre-bending auteur whose films mix tones and critique social inequality. His science fiction often uses creature features to examine class and environmentalism.",
    birth_year: 1969,
    wikipedia_url: "https://en.wikipedia.org/wiki/Bong_Joon-ho",
    notable_sf_films: ["The Host", "Snowpiercer", "Okja"]
  },
  {
    name: "Jean-Luc Godard",
    nationality: "French",
    bio: "Revolutionary New Wave director who deconstructed cinematic conventions. His approach to science fiction emphasized ideas over spectacle.",
    birth_year: 1930,
    death_year: 2022,
    wikipedia_url: "https://en.wikipedia.org/wiki/Jean-Luc_Godard",
    notable_sf_films: ["Alphaville", "Weekend"]
  },
  {
    name: "Nicolas Roeg",
    nationality: "British",
    bio: "Cinematographer-turned-director known for fractured narratives and striking imagery. His alien visitor film remains a touchstone of art-house science fiction.",
    birth_year: 1928,
    death_year: 2018,
    wikipedia_url: "https://en.wikipedia.org/wiki/Nicolas_Roeg",
    notable_sf_films: ["The Man Who Fell to Earth"]
  },
  {
    name: "George Miller",
    nationality: "Australian",
    bio: "Creator of the Mad Max franchise whose kinetic action and practical stunt work revolutionized post-apocalyptic filmmaking.",
    birth_year: 1945,
    wikipedia_url: "https://en.wikipedia.org/wiki/George_Miller_(filmmaker)",
    notable_sf_films: ["Mad Max", "The Road Warrior", "Mad Max: Fury Road", "Furiosa"]
  },
  {
    name: "John Carpenter",
    nationality: "American",
    bio: "Genre master whose low-budget films have achieved cult status. Carpenter's synthesis of horror and science fiction creates uniquely paranoid experiences.",
    birth_year: 1948,
    wikipedia_url: "https://en.wikipedia.org/wiki/John_Carpenter",
    notable_sf_films: ["The Thing", "Escape from New York", "They Live", "Dark Star", "Starman"]
  },
  {
    name: "Luc Besson",
    nationality: "French",
    bio: "Visual stylist known for colorful, kinetic films that blend action with European sensibilities. His science fiction celebrates design and visual imagination.",
    birth_year: 1959,
    wikipedia_url: "https://en.wikipedia.org/wiki/Luc_Besson",
    notable_sf_films: ["The Fifth Element", "Lucy", "Valerian and the City of a Thousand Planets"]
  },
  {
    name: "Neill Blomkamp",
    nationality: "South African-Canadian",
    bio: "VFX artist turned director whose gritty science fiction addresses inequality and xenophobia through allegory. His documentary-style approach grounds fantastic elements.",
    birth_year: 1979,
    wikipedia_url: "https://en.wikipedia.org/wiki/Neill_Blomkamp",
    notable_sf_films: ["District 9", "Elysium", "Chappie"]
  },
  {
    name: "Duncan Jones",
    nationality: "British",
    bio: "Director who emerged with intelligent, small-scale science fiction before taking on larger productions. His early work recalls classic SF cinema.",
    birth_year: 1971,
    wikipedia_url: "https://en.wikipedia.org/wiki/Duncan_Jones",
    notable_sf_films: ["Moon", "Source Code", "Mute"]
  },
  {
    name: "Gareth Edwards",
    nationality: "British",
    bio: "VFX supervisor turned director known for grounding massive spectacles in human-scale perspectives.",
    birth_year: 1975,
    wikipedia_url: "https://en.wikipedia.org/wiki/Gareth_Edwards_(director)",
    notable_sf_films: ["Monsters", "Godzilla", "Rogue One: A Star Wars Story", "The Creator"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Populating SF directors database...');

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('sf_directors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.log('Delete warning:', deleteError.message);
    }

    // Insert all directors
    const { data, error } = await supabase
      .from('sf_directors')
      .insert(SF_DIRECTORS)
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log(`Successfully populated ${data?.length || 0} SF directors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Populated ${data?.length || 0} SF directors`,
        count: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error populating SF directors:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
