import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Criterion Collection Science Fiction films - curated list with verified data
const CRITERION_SF_FILMS = [
  {
    title: "Solaris",
    director: "Andrei Tarkovsky",
    year: 1972,
    spine_number: 164,
    criterion_url: "https://www.criterion.com/films/28600-solaris",
    trailer_url: "https://www.youtube.com/watch?v=6-4KydP92ss",
    description: "A psychologist is sent to a space station orbiting a mysterious planet in this visionary adaptation of Stanisław Lem's novel."
  },
  {
    title: "Stalker",
    director: "Andrei Tarkovsky",
    year: 1979,
    spine_number: 888,
    criterion_url: "https://www.criterion.com/films/29139-stalker",
    trailer_url: "https://www.youtube.com/watch?v=TGRDYpCmMcM",
    description: "A hired guide leads two men through the Zone, a mysterious realm where the rules of reality do not apply."
  },
  {
    title: "Brazil",
    director: "Terry Gilliam",
    year: 1985,
    spine_number: 51,
    criterion_url: "https://www.criterion.com/films/27523-brazil",
    trailer_url: "https://www.youtube.com/watch?v=ESRY2bQKT04",
    description: "Terry Gilliam's dystopian masterpiece imagines a retro-futuristic world where bureaucracy has run amok."
  },
  {
    title: "RoboCop",
    director: "Paul Verhoeven",
    year: 1987,
    spine_number: 23,
    criterion_url: "https://www.criterion.com/films/27668-robocop",
    trailer_url: "https://www.youtube.com/watch?v=zfbK_dbsCu0",
    description: "Part man, part machine, all cop. Paul Verhoeven's action satire remains a biting critique of corporate America."
  },
  {
    title: "Videodrome",
    director: "David Cronenberg",
    year: 1983,
    spine_number: 248,
    criterion_url: "https://www.criterion.com/films/277-videodrome",
    trailer_url: "https://www.youtube.com/watch?v=UFHey3utk0I",
    description: "A sleazy cable TV programmer discovers a broadcast signal featuring extreme violence that causes viewers to hallucinate."
  },
  {
    title: "The Man Who Fell to Earth",
    director: "Nicolas Roeg",
    year: 1976,
    spine_number: 304,
    criterion_url: "https://www.criterion.com/films/783-the-man-who-fell-to-earth",
    trailer_url: "https://www.youtube.com/watch?v=xkdGo-FXjnY",
    description: "David Bowie stars as an alien who comes to Earth seeking water for his dying planet."
  },
  {
    title: "Alphaville",
    director: "Jean-Luc Godard",
    year: 1965,
    spine_number: 25,
    criterion_url: "https://www.criterion.com/films/256-alphaville",
    trailer_url: "https://www.youtube.com/watch?v=gPycjWbgbNU",
    description: "Godard's genre-bending noir sci-fi about a secret agent sent to a distant galaxy governed by a sentient computer."
  },
  {
    title: "World on a Wire",
    director: "Rainer Werner Fassbinder",
    year: 1973,
    spine_number: 597,
    criterion_url: "https://www.criterion.com/films/27551-world-on-a-wire",
    trailer_url: "https://www.youtube.com/watch?v=5Wv08V-hyoY",
    description: "A two-part TV movie that predates The Matrix with its exploration of simulated realities."
  },
  {
    title: "Fantastic Planet",
    director: "René Laloux",
    year: 1973,
    spine_number: 820,
    criterion_url: "https://www.criterion.com/films/28544-fantastic-planet",
    trailer_url: "https://www.youtube.com/watch?v=SgCxCZNkQ9E",
    description: "On a faraway planet where blue giants enslave humans, a young man fights for his people's freedom."
  },
  {
    title: "La Jetée",
    director: "Chris Marker",
    year: 1962,
    spine_number: 387,
    criterion_url: "https://www.criterion.com/films/290-la-jete",
    trailer_url: "https://www.youtube.com/watch?v=aLfXCgeyMzM",
    description: "This influential short film, told almost entirely through still images, inspired Terry Gilliam's Twelve Monkeys."
  },
  {
    title: "Godzilla",
    director: "Ishirō Honda",
    year: 1954,
    spine_number: 594,
    criterion_url: "https://www.criterion.com/films/316-godzilla",
    trailer_url: "https://www.youtube.com/watch?v=hTKedyQQkZQ",
    description: "The original Japanese version of the monster movie that launched a franchise and captured postwar nuclear anxieties."
  },
  {
    title: "Invasion of the Body Snatchers",
    director: "Don Siegel",
    year: 1956,
    spine_number: 700,
    criterion_url: "https://www.criterion.com/films/28498-invasion-of-the-body-snatchers",
    trailer_url: "https://www.youtube.com/watch?v=dOl5GE06SYg",
    description: "The definitive Cold War paranoia classic about alien pods that replace humans with emotionless duplicates."
  },
  {
    title: "The Blob",
    director: "Irvin Yeaworth",
    year: 1958,
    spine_number: 91,
    criterion_url: "https://www.criterion.com/films/628-the-blob",
    trailer_url: "https://www.youtube.com/watch?v=TdUsyXQ8Wrs",
    description: "Steve McQueen's film debut sees him fighting a gelatinous alien creature terrorizing a small town."
  },
  {
    title: "Seconds",
    director: "John Frankenheimer",
    year: 1966,
    spine_number: 1000,
    criterion_url: "https://www.criterion.com/films/28765-seconds",
    trailer_url: "https://www.youtube.com/watch?v=6uyJxMppPdc",
    description: "A middle-aged banker is given the opportunity to start a new life with a new identity in this paranoid thriller."
  },
  {
    title: "A.I. Artificial Intelligence",
    director: "Steven Spielberg",
    year: 2001,
    spine_number: 1194,
    criterion_url: "https://www.criterion.com/films/33219-a-i-artificial-intelligence",
    trailer_url: "https://www.youtube.com/watch?v=_19pRsZRiz4",
    description: "Stanley Kubrick's long-gestating project brought to life by Spielberg about a robot boy who yearns to become real."
  },
  {
    title: "Repo Man",
    director: "Alex Cox",
    year: 1984,
    spine_number: 640,
    criterion_url: "https://www.criterion.com/films/27903-repo-man",
    trailer_url: "https://www.youtube.com/watch?v=aKEfbMrHsxc",
    description: "A young punk joins a repo crew and gets mixed up with a mysterious Chevy Malibu containing aliens."
  },
  {
    title: "12 Monkeys",
    director: "Terry Gilliam",
    year: 1995,
    spine_number: 696,
    criterion_url: "https://www.criterion.com/films/28370-12-monkeys",
    trailer_url: "https://www.youtube.com/watch?v=15s4Y9ffW_o",
    description: "Bruce Willis plays a convict sent back in time to prevent the release of a deadly virus."
  },
  {
    title: "The Host",
    director: "Bong Joon-ho",
    year: 2006,
    spine_number: 736,
    criterion_url: "https://www.criterion.com/films/28566-the-host",
    trailer_url: "https://www.youtube.com/watch?v=yxaGmfYTAew",
    description: "A dysfunctional family bands together to save their daughter from a mutant monster in Seoul."
  },
  {
    title: "1984",
    director: "Michael Radford",
    year: 1984,
    spine_number: 1198,
    criterion_url: "https://www.criterion.com/films/33259-1984",
    trailer_url: "https://www.youtube.com/watch?v=Z4rBDUJTnNU",
    description: "John Hurt stars in this faithful adaptation of George Orwell's dystopian masterpiece."
  },
  {
    title: "2046",
    director: "Wong Kar-wai",
    year: 2004,
    spine_number: 449,
    criterion_url: "https://www.criterion.com/films/959-2046",
    trailer_url: "https://www.youtube.com/watch?v=kE8dDwEkuJg",
    description: "Wong Kar-wai's sci-fi romance where a writer imagines a future where passengers search for lost memories."
  },
  {
    title: "Altered States",
    director: "Ken Russell",
    year: 1980,
    spine_number: 1114,
    criterion_url: "https://www.criterion.com/films/31765-altered-states",
    trailer_url: "https://www.youtube.com/watch?v=fkAFJnMDCG8",
    description: "A Harvard scientist experiments with sensory deprivation and hallucinogenic drugs with mind-bending results."
  },
  {
    title: "Strange Days",
    director: "Kathryn Bigelow",
    year: 1995,
    spine_number: 1032,
    criterion_url: "https://www.criterion.com/films/29716-strange-days",
    trailer_url: "https://www.youtube.com/watch?v=5yaXPJ6FeME",
    description: "In millennium-era LA, a dealer in illicit recordings of people's experiences uncovers a shocking murder."
  },
  {
    title: "Until the End of the World",
    director: "Wim Wenders",
    year: 1991,
    spine_number: 1088,
    criterion_url: "https://www.criterion.com/films/30939-until-the-end-of-the-world",
    trailer_url: "https://www.youtube.com/watch?v=YO_WpMbJe2g",
    description: "Wenders' epic globe-trotting sci-fi romance about a technology that allows the blind to see."
  },
  {
    title: "eXistenZ",
    director: "David Cronenberg",
    year: 1999,
    spine_number: 988,
    criterion_url: "https://www.criterion.com/films/29266-existenz",
    trailer_url: "https://www.youtube.com/watch?v=HAdbdUt_h9M",
    description: "Cronenberg's mind-bending thriller about organic video game consoles that plug directly into the spine."
  },
  {
    title: "Fiend Without a Face",
    director: "Arthur Crabtree",
    year: 1958,
    spine_number: 84,
    criterion_url: "https://www.criterion.com/films/627-fiend-without-a-face",
    trailer_url: "https://www.youtube.com/watch?v=3J-J3VuV_GY",
    description: "Invisible creatures attack a military base near an atomic power plant in this cult classic."
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

    console.log('Populating Criterion SF films database...');

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('criterion_films')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.log('Delete warning:', deleteError.message);
    }

    // Insert all films
    const { data, error } = await supabase
      .from('criterion_films')
      .insert(CRITERION_SF_FILMS)
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log(`Successfully populated ${data?.length || 0} Criterion films`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Populated ${data?.length || 0} Criterion SF films`,
        count: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error populating Criterion films:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
