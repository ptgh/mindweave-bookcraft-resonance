import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Verified SF Films from reputable distributors with book metadata
// Note: Criterion-specific columns have been deprecated from the database
const VERIFIED_SF_FILMS = [
  { filmTitle: 'Solaris', bookTitle: 'Solaris', bookAuthor: 'Stanisław Lem', filmYear: 1972, director: 'Andrei Tarkovsky', source: 'verified' },
  { filmTitle: 'Stalker', bookTitle: 'Roadside Picnic', bookAuthor: 'Arkady & Boris Strugatsky', filmYear: 1979, director: 'Andrei Tarkovsky', source: 'verified' },
  { filmTitle: 'Fahrenheit 451', bookTitle: 'Fahrenheit 451', bookAuthor: 'Ray Bradbury', filmYear: 1966, director: 'François Truffaut', source: 'verified' },
  { filmTitle: '2001: A Space Odyssey', bookTitle: '2001: A Space Odyssey', bookAuthor: 'Arthur C. Clarke', filmYear: 1968, director: 'Stanley Kubrick', source: 'verified' },
  { filmTitle: 'A Clockwork Orange', bookTitle: 'A Clockwork Orange', bookAuthor: 'Anthony Burgess', filmYear: 1971, director: 'Stanley Kubrick', source: 'verified' },
  { filmTitle: 'The Andromeda Strain', bookTitle: 'The Andromeda Strain', bookAuthor: 'Michael Crichton', filmYear: 1971, director: 'Robert Wise', source: 'verified' },
  { filmTitle: 'The Time Machine', bookTitle: 'The Time Machine', bookAuthor: 'H.G. Wells', filmYear: 1960, director: 'George Pal', source: 'verified' },
  { filmTitle: 'War of the Worlds', bookTitle: 'The War of the Worlds', bookAuthor: 'H.G. Wells', filmYear: 1953, director: 'Byron Haskin', source: 'verified' },
  { filmTitle: 'The Incredible Shrinking Man', bookTitle: 'The Shrinking Man', bookAuthor: 'Richard Matheson', filmYear: 1957, director: 'Jack Arnold', source: 'verified' },
  { filmTitle: 'Invasion of the Body Snatchers', bookTitle: 'The Body Snatchers', bookAuthor: 'Jack Finney', filmYear: 1956, director: 'Don Siegel', source: 'verified' },
  { filmTitle: 'Naked Lunch', bookTitle: 'Naked Lunch', bookAuthor: 'William S. Burroughs', filmYear: 1991, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'The Man Who Fell to Earth', bookTitle: 'The Man Who Fell to Earth', bookAuthor: 'Walter Tevis', filmYear: 1976, director: 'Nicolas Roeg', source: 'verified' },
  { filmTitle: 'Nineteen Eighty-Four', bookTitle: 'Nineteen Eighty-Four', bookAuthor: 'George Orwell', filmYear: 1984, director: 'Michael Radford', source: 'verified' },
  { filmTitle: 'On the Silver Globe', bookTitle: 'The Lunar Trilogy', bookAuthor: 'Jerzy Żuławski', filmYear: 1988, director: 'Andrzej Żuławski', source: 'verified' },
  { filmTitle: 'Fantastic Planet', bookTitle: 'Oms en série', bookAuthor: 'Stefan Wul', filmYear: 1973, director: 'René Laloux', source: 'verified' },
  { filmTitle: 'Things to Come', bookTitle: 'The Shape of Things to Come', bookAuthor: 'H.G. Wells', filmYear: 1936, director: 'William Cameron Menzies', source: 'verified' },
  { filmTitle: 'Village of the Damned', bookTitle: 'The Midwich Cuckoos', bookAuthor: 'John Wyndham', filmYear: 1960, director: 'Wolf Rilla', source: 'verified' },
  { filmTitle: 'When Worlds Collide', bookTitle: 'When Worlds Collide', bookAuthor: 'Edwin Balmer & Philip Wylie', filmYear: 1951, director: 'Rudolph Maté', source: 'verified' },
  { filmTitle: 'Videodrome', bookTitle: 'Videodrome', bookAuthor: 'David Cronenberg', filmYear: 1983, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'Scanners', bookTitle: 'Scanners', bookAuthor: 'David Cronenberg', filmYear: 1981, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'The Fly', bookTitle: 'The Fly', bookAuthor: 'George Langelaan', filmYear: 1986, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'eXistenZ', bookTitle: 'eXistenZ', bookAuthor: 'David Cronenberg', filmYear: 1999, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'Dead Ringers', bookTitle: 'Twins', bookAuthor: 'Bari Wood & Jack Geasland', filmYear: 1988, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'Crimes of the Future', bookTitle: 'Crimes of the Future', bookAuthor: 'David Cronenberg', filmYear: 2022, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'RoboCop', bookTitle: 'RoboCop', bookAuthor: 'Ed Naha', filmYear: 1987, director: 'Paul Verhoeven', source: 'verified' },
  { filmTitle: 'Brazil', bookTitle: 'Brazil', bookAuthor: 'Terry Gilliam', filmYear: 1985, director: 'Terry Gilliam', source: 'verified' },
  { filmTitle: '12 Monkeys', bookTitle: '12 Monkeys', bookAuthor: 'Chris Marker (La Jetée)', filmYear: 1995, director: 'Terry Gilliam', source: 'verified' },
  { filmTitle: 'La Jetée', bookTitle: 'La Jetée', bookAuthor: 'Chris Marker', filmYear: 1962, director: 'Chris Marker', source: 'verified' },
  { filmTitle: 'Repo Man', bookTitle: 'Repo Man', bookAuthor: 'Alex Cox', filmYear: 1984, director: 'Alex Cox', source: 'verified' },
  { filmTitle: 'Tetsuo: The Iron Man', bookTitle: 'Tetsuo: The Iron Man', bookAuthor: 'Shinya Tsukamoto', filmYear: 1989, director: 'Shinya Tsukamoto', source: 'verified' },
  { filmTitle: 'World on a Wire', bookTitle: 'Simulacron-3', bookAuthor: 'Daniel F. Galouye', filmYear: 1973, director: 'Rainer Werner Fassbinder', source: 'verified' },
  { filmTitle: 'The Blob', bookTitle: 'The Blob', bookAuthor: 'Original screenplay', filmYear: 1958, director: 'Irvin Yeaworth', source: 'verified' },
  { filmTitle: 'Alphaville', bookTitle: 'Alphaville', bookAuthor: 'Jean-Luc Godard', filmYear: 1965, director: 'Jean-Luc Godard', source: 'verified' },
  { filmTitle: 'Seconds', bookTitle: 'Seconds', bookAuthor: 'David Ely', filmYear: 1966, director: 'John Frankenheimer', source: 'verified' },
  { filmTitle: 'Quatermass and the Pit', bookTitle: 'Quatermass and the Pit', bookAuthor: 'Nigel Kneale', filmYear: 1967, director: 'Roy Ward Baker', source: 'verified' },
  { filmTitle: 'Silent Running', bookTitle: 'Silent Running', bookAuthor: 'Deric Washburn', filmYear: 1972, director: 'Douglas Trumbull', source: 'verified' },
  { filmTitle: 'Dark Star', bookTitle: 'Dark Star', bookAuthor: 'John Carpenter & Dan O\'Bannon', filmYear: 1974, director: 'John Carpenter', source: 'verified' },
  { filmTitle: 'Phase IV', bookTitle: 'Phase IV', bookAuthor: 'Barry N. Malzberg', filmYear: 1974, director: 'Saul Bass', source: 'verified' },
  { filmTitle: 'Eraserhead', bookTitle: 'Eraserhead', bookAuthor: 'David Lynch', filmYear: 1977, director: 'David Lynch', source: 'verified' },
  { filmTitle: 'Until the End of the World', bookTitle: 'Until the End of the World', bookAuthor: 'Wim Wenders & Peter Carey', filmYear: 1991, director: 'Wim Wenders', source: 'verified' },
  { filmTitle: 'Altered States', bookTitle: 'Altered States', bookAuthor: 'Paddy Chayefsky', filmYear: 1980, director: 'Ken Russell', source: 'verified' },
  { filmTitle: 'The Dead Zone', bookTitle: 'The Dead Zone', bookAuthor: 'Stephen King', filmYear: 1983, director: 'David Cronenberg', source: 'verified' },
  { filmTitle: 'Metropolis', bookTitle: 'Metropolis', bookAuthor: 'Thea von Harbou', filmYear: 1927, director: 'Fritz Lang', source: 'verified' },
  { filmTitle: 'Dark City', bookTitle: 'Dark City', bookAuthor: 'Alex Proyas', filmYear: 1998, director: 'Alex Proyas', source: 'verified' },
  { filmTitle: 'Forbidden Planet', bookTitle: 'Forbidden Planet (The Tempest)', bookAuthor: 'Cyril Hume', filmYear: 1956, director: 'Fred M. Wilcox', source: 'verified' },
  { filmTitle: 'The Day the Earth Stood Still', bookTitle: 'Farewell to the Master', bookAuthor: 'Harry Bates', filmYear: 1951, director: 'Robert Wise', source: 'verified' },
  { filmTitle: 'It Came from Outer Space', bookTitle: 'It Came from Outer Space', bookAuthor: 'Ray Bradbury', filmYear: 1953, director: 'Jack Arnold', source: 'verified' },
  { filmTitle: 'Possession', bookTitle: 'Possession', bookAuthor: 'Andrzej Żuławski', filmYear: 1981, director: 'Andrzej Żuławski', source: 'verified' },
  { filmTitle: 'Safe', bookTitle: 'Safe', bookAuthor: 'Todd Haynes', filmYear: 1995, director: 'Todd Haynes', source: 'verified' },
  { filmTitle: 'Alien', bookTitle: 'Alien', bookAuthor: 'Alan Dean Foster', filmYear: 1979, director: 'Ridley Scott', source: 'verified' },
  { filmTitle: 'Godzilla', bookTitle: 'Godzilla', bookAuthor: 'Original screenplay', filmYear: 1954, director: 'Ishirō Honda', source: 'verified' },
  // Arrow Video releases
  { filmTitle: 'The Thing', bookTitle: 'Who Goes There?', bookAuthor: 'John W. Campbell Jr.', filmYear: 1982, director: 'John Carpenter', source: 'verified' },
  { filmTitle: 'Dune', bookTitle: 'Dune', bookAuthor: 'Frank Herbert', filmYear: 1984, director: 'David Lynch', source: 'verified' },
  { filmTitle: 'Slaughterhouse-Five', bookTitle: 'Slaughterhouse-Five', bookAuthor: 'Kurt Vonnegut', filmYear: 1972, director: 'George Roy Hill', source: 'verified' },
  { filmTitle: 'Battle Royale', bookTitle: 'Battle Royale', bookAuthor: 'Koushun Takami', filmYear: 2000, director: 'Kinji Fukasaku', source: 'verified' },
  { filmTitle: 'Aniara', bookTitle: 'Aniara', bookAuthor: 'Harry Martinson', filmYear: 2018, director: 'Pella Kågerman & Hugo Lilja', source: 'verified' },
  { filmTitle: 'Rollerball', bookTitle: 'Roller Ball Murder', bookAuthor: 'William Harrison', filmYear: 1975, director: 'Norman Jewison', source: 'verified' },
  { filmTitle: 'Donnie Darko', bookTitle: 'Donnie Darko', bookAuthor: 'Richard Kelly', filmYear: 2001, director: 'Richard Kelly', source: 'verified' },
  { filmTitle: 'Demolition Man', bookTitle: 'Demolition Man', bookAuthor: 'Original screenplay', filmYear: 1993, director: 'Marco Brambilla', source: 'verified' },
];

Deno.serve(async (req) => {
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
    const googleBooksApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

    // Get existing films
    const { data: existingFilms } = await supabase
      .from('sf_film_adaptations')
      .select('film_title');
    
    const existingTitles = new Set((existingFilms || []).map(f => f.film_title.toLowerCase()));
    
    const missingFilms = VERIFIED_SF_FILMS.filter(f => !existingTitles.has(f.filmTitle.toLowerCase()));
    
    console.log(`Found ${missingFilms.length} missing films to add`);
    
    let added = 0;
    let enriched = 0;
    const errors: string[] = [];

    for (const film of missingFilms) {
      try {
        let posterUrl: string | null = null;
        let bookCoverUrl: string | null = null;
        let bookPublicationYear: number | null = null;

        // Fetch poster from TMDB
        if (tmdbApiKey) {
          try {
            const tmdbSearch = await fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(film.filmTitle)}&year=${film.filmYear}`
            );
            const tmdbData = await tmdbSearch.json();
            if (tmdbData.results?.[0]?.poster_path) {
              posterUrl = `https://image.tmdb.org/t/p/w500${tmdbData.results[0].poster_path}`;
            }
          } catch (e) {
            console.error(`TMDB error for ${film.filmTitle}:`, e);
          }
        }

        // Fetch book data from Google Books
        if (googleBooksApiKey && film.bookTitle) {
          try {
            const query = `${film.bookTitle} ${film.bookAuthor}`;
            const gbSearch = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${googleBooksApiKey}&maxResults=1`
            );
            const gbData = await gbSearch.json();
            const book = gbData.items?.[0]?.volumeInfo;
            if (book) {
              if (book.imageLinks?.thumbnail) {
                bookCoverUrl = book.imageLinks.thumbnail.replace('http://', 'https://');
              }
              if (book.publishedDate) {
                const year = parseInt(book.publishedDate.substring(0, 4));
                if (!isNaN(year)) bookPublicationYear = year;
              }
              enriched++;
            }
          } catch (e) {
            console.error(`Google Books error for ${film.bookTitle}:`, e);
          }
        }

        const insertData = {
          film_title: film.filmTitle,
          book_title: film.bookTitle,
          book_author: film.bookAuthor,
          film_year: film.filmYear,
          director: film.director,
          poster_url: posterUrl,
          book_cover_url: bookCoverUrl,
          book_publication_year: bookPublicationYear,
          source: film.source,
        };

        const { error } = await supabase
          .from('sf_film_adaptations')
          .insert(insertData);

        if (error) {
          errors.push(`${film.filmTitle}: ${error.message}`);
        } else {
          added++;
          console.log(`Added: ${film.filmTitle}`);
        }
      } catch (e) {
        errors.push(`${film.filmTitle}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      added,
      enriched,
      total: missingFilms.length,
      alreadyExist: VERIFIED_SF_FILMS.length - missingFilms.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
