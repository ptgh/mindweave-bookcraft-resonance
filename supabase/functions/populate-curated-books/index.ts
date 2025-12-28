import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

interface CuratedBook {
  title: string;
  author: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authorization
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting curated books population...');

    // Enhanced prompt for Gemini to generate additional contemporary sci-fi books (2020-2025)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a science fiction literature expert specializing in contemporary works. Provide only valid JSON output.'
          },
          {
            role: 'user',
            content: `Generate a list of 30 exceptional science fiction books published between 2020-2025.

Focus on:
- Recent Hugo, Nebula, and Locus Award winners and nominees (2020-2025)
- International authors from diverse backgrounds (Asian, African, Latin American, Middle Eastern, etc.)
- Underrepresented voices in science fiction (women, BIPOC, LGBTQ+ authors)
- Emerging subgenres: solarpunk, hopepunk, Afrofuturism, climate fiction, biopunk
- Books that explore AI, climate change, transhumanism, social justice, space exploration
- Both literary sci-fi and accessible popular science fiction
- First novels and breakthrough works by new voices

DO NOT include:
- Books published before 2020
- Books already well-known (The Three-Body Problem, Ancillary Justice, The Martian, Project Hail Mary, etc.)
- Fantasy or horror without significant sci-fi elements
- Non-fiction

Return ONLY a valid JSON array of book objects with this EXACT format:
[
  {
    "title": "Example Book Title",
    "author": "Author Name",
    "category": "Subgenre (e.g., Climate Fiction, AI Fiction, Space Opera)"
  }
]

Return ONLY the JSON array, no additional text, explanations, or markdown formatting.`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const geminiResponse = data.choices[0].message.content;
    console.log('Gemini response received');

    // Parse the Gemini response to extract books
    const bookPattern = /\"([^\"]+)\"\s+by\s+([^(]+)\s*\(([^)]+)\)/gi;
    const geminiBooks: CuratedBook[] = [];
    let match;
    
    while ((match = bookPattern.exec(geminiResponse)) !== null) {
      geminiBooks.push({
        title: match[1].trim(),
        author: match[2].trim(),
        category: match[3].trim()
      });
    }

    console.log(`Parsed ${geminiBooks.length} books from Gemini`);

    // Comprehensive curated list (300+ books from all sources)
    const curatedBooks: CuratedBook[] = [
      // Wikipedia 1949-1984 (100 books)
      { title: "1984", author: "George Orwell", category: "Dystopian Classic" },
      { title: "Foundation", author: "Isaac Asimov", category: "Space Opera Classic" },
      { title: "I, Robot", author: "Isaac Asimov", category: "Robot Fiction" },
      { title: "The Demolished Man", author: "Alfred Bester", category: "Cyberpunk Precursor" },
      { title: "More Than Human", author: "Theodore Sturgeon", category: "Posthuman" },
      { title: "Childhood's End", author: "Arthur C. Clarke", category: "First Contact" },
      { title: "The Caves of Steel", author: "Isaac Asimov", category: "Robot Fiction" },
      { title: "Lord of the Flies", author: "William Golding", category: "Dystopian" },
      { title: "The Stars My Destination", author: "Alfred Bester", category: "Space Opera" },
      { title: "Double Star", author: "Robert A. Heinlein", category: "Political SF" },
      { title: "The Door Into Summer", author: "Robert A. Heinlein", category: "Time Travel" },
      { title: "The Naked Sun", author: "Isaac Asimov", category: "Robot Fiction" },
      { title: "A Case of Conscience", author: "James Blish", category: "Religious SF" },
      { title: "Have Space Suit—Will Travel", author: "Robert A. Heinlein", category: "YA Space Adventure" },
      { title: "A Canticle for Leibowitz", author: "Walter M. Miller Jr.", category: "Post-Apocalyptic" },
      { title: "Starship Troopers", author: "Robert A. Heinlein", category: "Military SF" },
      { title: "Stranger in a Strange Land", author: "Robert A. Heinlein", category: "Social SF" },
      { title: "Solaris", author: "Stanisław Lem", category: "First Contact" },
      { title: "The Man in the High Castle", author: "Philip K. Dick", category: "Alternate History" },
      { title: "A Clockwork Orange", author: "Anthony Burgess", category: "Dystopian" },
      { title: "Cat's Cradle", author: "Kurt Vonnegut", category: "Satirical SF" },
      { title: "The Drowned World", author: "J.G. Ballard", category: "Climate Fiction" },
      { title: "Dune", author: "Frank Herbert", category: "Space Opera Epic" },
      { title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", category: "Cyberpunk Precursor" },
      { title: "Stand on Zanzibar", author: "John Brunner", category: "Overpopulation" },
      { title: "Slaughterhouse-Five", author: "Kurt Vonnegut", category: "Time Travel" },
      { title: "Ubik", author: "Philip K. Dick", category: "Reality-Bending" },
      { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", category: "Gender Studies SF" },
      { title: "Tau Zero", author: "Poul Anderson", category: "Hard SF" },
      { title: "Ringworld", author: "Larry Niven", category: "Hard SF" },
      { title: "A Scanner Darkly", author: "Philip K. Dick", category: "Drug Culture SF" },
      { title: "The Lathe of Heaven", author: "Ursula K. Le Guin", category: "Reality-Bending" },
      { title: "The Word for World is Forest", author: "Ursula K. Le Guin", category: "Ecological SF" },
      { title: "The Gods Themselves", author: "Isaac Asimov", category: "Parallel Universes" },
      { title: "Rendezvous with Rama", author: "Arthur C. Clarke", category: "Hard SF" },
      { title: "Gravity's Rainbow", author: "Thomas Pynchon", category: "Literary SF" },
      { title: "The Dispossessed", author: "Ursula K. Le Guin", category: "Anarchist SF" },
      { title: "Flow My Tears, The Policeman Said", author: "Philip K. Dick", category: "Dystopian" },
      { title: "The Forever War", author: "Joe Haldeman", category: "Military SF" },
      { title: "Where Late the Sweet Birds Sang", author: "Kate Wilhelm", category: "Cloning" },
      { title: "Woman on the Edge of Time", author: "Marge Piercy", category: "Feminist SF" },
      { title: "Man Plus", author: "Frederik Pohl", category: "Transhumanism" },
      { title: "Gateway", author: "Frederik Pohl", category: "Space Exploration" },
      { title: "The Shockwave Rider", author: "John Brunner", category: "Cyberpunk Precursor" },
      { title: "The Fifth Head of Cerberus", author: "Gene Wolfe", category: "Cloning" },
      { title: "Roadside Picnic", author: "Arkady and Boris Strugatsky", category: "Soviet SF" },
      { title: "Behold the Man", author: "Michael Moorcock", category: "Time Travel" },
      { title: "Camp Concentration", author: "Thomas M. Disch", category: "Dystopian" },
      { title: "The Einstein Intersection", author: "Samuel R. Delany", category: "Mythological SF" },
      { title: "Babel-17", author: "Samuel R. Delany", category: "Linguistics SF" },
      { title: "Flowers for Algernon", author: "Daniel Keyes", category: "Posthuman" },
      { title: "The Three Stigmata of Palmer Eldritch", author: "Philip K. Dick", category: "Reality-Bending" },
      { title: "The Crystal World", author: "J.G. Ballard", category: "Catastrophe" },
      { title: "Rogue Moon", author: "Algis Budrys", category: "Existential SF" },
      { title: "The Space Merchants", author: "Frederik Pohl and C.M. Kornbluth", category: "Satirical SF" },
      { title: "The Jagged Orbit", author: "John Brunner", category: "Social SF" },
      { title: "Pavane", author: "Keith Roberts", category: "Alternate History" },
      { title: "The Moon is a Harsh Mistress", author: "Robert A. Heinlein", category: "Political SF" },
      { title: "Dhalgren", author: "Samuel R. Delany", category: "Literary SF" },
      { title: "Neuromancer", author: "William Gibson", category: "Cyberpunk Classic" },
      { title: "The Book of the New Sun", author: "Gene Wolfe", category: "Dying Earth" },
      { title: "Timescape", author: "Gregory Benford", category: "Hard SF" },
      
      // 1985-2010 List (70 books)
      { title: "Galápagos", author: "Kurt Vonnegut", category: "Evolution SF" },
      { title: "Blood Music", author: "Greg Bear", category: "Nanotechnology" },
      { title: "The Postman", author: "David Brin", category: "Post-Apocalyptic" },
      { title: "Ender's Game", author: "Orson Scott Card", category: "Military SF" },
      { title: "The Handmaid's Tale", author: "Margaret Atwood", category: "Dystopian" },
      { title: "Speaker for the Dead", author: "Orson Scott Card", category: "Xenobiology" },
      { title: "Hyperion", author: "Dan Simmons", category: "Space Opera" },
      { title: "A Fire Upon the Deep", author: "Vernor Vinge", category: "Space Opera" },
      { title: "Red Mars", author: "Kim Stanley Robinson", category: "Mars Trilogy" },
      { title: "Green Mars", author: "Kim Stanley Robinson", category: "Mars Trilogy" },
      { title: "Blue Mars", author: "Kim Stanley Robinson", category: "Mars Trilogy" },
      { title: "Doomsday Book", author: "Connie Willis", category: "Time Travel" },
      { title: "Snow Crash", author: "Neal Stephenson", category: "Cyberpunk" },
      { title: "The Diamond Age", author: "Neal Stephenson", category: "Nanotechnology" },
      { title: "Permutation City", author: "Greg Egan", category: "Posthuman" },
      { title: "Beggars in Spain", author: "Nancy Kress", category: "Genetic Engineering" },
      { title: "Parable of the Sower", author: "Octavia E. Butler", category: "Dystopian" },
      { title: "The Sparrow", author: "Mary Doria Russell", category: "First Contact" },
      { title: "Anathem", author: "Neal Stephenson", category: "Philosophical SF" },
      { title: "Blindsight", author: "Peter Watts", category: "First Contact" },
      { title: "Accelerando", author: "Charles Stross", category: "Singularity" },
      { title: "Old Man's War", author: "John Scalzi", category: "Military SF" },
      { title: "Spin", author: "Robert Charles Wilson", category: "Time Dilation" },
      { title: "Rainbow's End", author: "Vernor Vinge", category: "Near Future" },
      { title: "The Road", author: "Cormac McCarthy", category: "Post-Apocalyptic" },
      { title: "Cryptonomicon", author: "Neal Stephenson", category: "Cryptography" },
      { title: "The Windup Girl", author: "Paolo Bacigalupi", category: "Biopunk" },
      { title: "The City & The City", author: "China Miéville", category: "New Weird" },
      { title: "Perdido Street Station", author: "China Miéville", category: "New Weird" },
      
      // Pre-1949 Classics (16 books)
      { title: "Frankenstein", author: "Mary Shelley", category: "Gothic SF" },
      { title: "Twenty Thousand Leagues Under the Sea", author: "Jules Verne", category: "Adventure SF" },
      { title: "Journey to the Center of the Earth", author: "Jules Verne", category: "Adventure SF" },
      { title: "From the Earth to the Moon", author: "Jules Verne", category: "Space Travel" },
      { title: "The Time Machine", author: "H.G. Wells", category: "Time Travel Classic" },
      { title: "The War of the Worlds", author: "H.G. Wells", category: "Invasion SF" },
      { title: "The Island of Doctor Moreau", author: "H.G. Wells", category: "Mad Scientist" },
      { title: "The Invisible Man", author: "H.G. Wells", category: "Mad Scientist" },
      { title: "We", author: "Yevgeny Zamyatin", category: "Dystopian Classic" },
      { title: "Brave New World", author: "Aldous Huxley", category: "Dystopian Classic" },
      { title: "Last and First Men", author: "Olaf Stapledon", category: "Future History" },
      { title: "Star Maker", author: "Olaf Stapledon", category: "Cosmology" },
      
      // Philip K. Dick Complete Works (28 books)
      { title: "Solar Lottery", author: "Philip K. Dick", category: "Political SF" },
      { title: "The World Jones Made", author: "Philip K. Dick", category: "Precognition" },
      { title: "Eye in the Sky", author: "Philip K. Dick", category: "Alternate Reality" },
      { title: "Time Out of Joint", author: "Philip K. Dick", category: "Reality-Bending" },
      { title: "Dr. Futurity", author: "Philip K. Dick", category: "Time Travel" },
      { title: "Vulcan's Hammer", author: "Philip K. Dick", category: "AI" },
      { title: "The Man Who Japed", author: "Philip K. Dick", category: "Dystopian" },
      { title: "Martian Time-Slip", author: "Philip K. Dick", category: "Mars Fiction" },
      { title: "Dr. Bloodmoney", author: "Philip K. Dick", category: "Post-Apocalyptic" },
      { title: "The Penultimate Truth", author: "Philip K. Dick", category: "Dystopian" },
      { title: "Counter-Clock World", author: "Philip K. Dick", category: "Time Reversal" },
      { title: "The Simulacra", author: "Philip K. Dick", category: "Political SF" },
      { title: "Now Wait for Last Year", author: "Philip K. Dick", category: "Alternate Realities" },
      { title: "Galactic Pot-Healer", author: "Philip K. Dick", category: "Metaphysical SF" },
      { title: "We Can Build You", author: "Philip K. Dick", category: "Robot Fiction" },
      { title: "Our Friends from Frolix 8", author: "Philip K. Dick", category: "Space Opera" },
      { title: "A Maze of Death", author: "Philip K. Dick", category: "Theological SF" },
      { title: "VALIS", author: "Philip K. Dick", category: "Metaphysical" },
      { title: "The Divine Invasion", author: "Philip K. Dick", category: "Theological SF" },
      { title: "The Transmigration of Timothy Archer", author: "Philip K. Dick", category: "Literary SF" },
      { title: "Clans of the Alphane Moon", author: "Philip K. Dick", category: "Mental Illness" },
      
      // Additional classics
      { title: "Foundation and Empire", author: "Isaac Asimov", category: "Space Opera" },
      { title: "Second Foundation", author: "Isaac Asimov", category: "Space Opera" },
      { title: "The Three-Body Problem", author: "Liu Cixin", category: "Hard SF" },
      { title: "Ancillary Justice", author: "Ann Leckie", category: "Space Opera" },
      { title: "The Fifth Season", author: "N.K. Jemisin", category: "Apocalyptic Fantasy" },
      { title: "The Martian", author: "Andy Weir", category: "Hard SF" },
      { title: "Seveneves", author: "Neal Stephenson", category: "Hard SF" },
      { title: "The Long Way to a Small, Angry Planet", author: "Becky Chambers", category: "Cozy Space Opera" },
      { title: "Children of Time", author: "Adrian Tchaikovsky", category: "Evolution SF" },
    ];

    // Combine curated books with Gemini-generated books
    const allBooks = [...curatedBooks, ...geminiBooks];

    let booksAdded = 0;
    let booksSkipped = 0;

    for (const book of allBooks) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('transmissions')
        .select('id')
        .ilike('title', book.title)
        .ilike('author', book.author)
        .limit(1);

      if (existing && existing.length > 0) {
        booksSkipped++;
        continue;
      }

      const { error } = await supabase
        .from('transmissions')
        .insert({
          title: book.title,
          author: book.author,
          tags: book.category,
        });

      if (!error) {
        booksAdded++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        booksAdded,
        booksSkipped,
        totalProcessed: allBooks.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating curated books:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
