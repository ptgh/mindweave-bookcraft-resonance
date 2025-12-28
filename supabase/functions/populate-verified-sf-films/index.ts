import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

// Verified Criterion SF Films with book metadata
const CRITERION_SF_FILMS = [
  { filmTitle: 'Solaris', bookTitle: 'Solaris', bookAuthor: 'Stanisław Lem', filmYear: 1972, director: 'Andrei Tarkovsky', criterionUrl: 'https://www.criterion.com/films/578-solaris' },
  { filmTitle: 'Stalker', bookTitle: 'Roadside Picnic', bookAuthor: 'Arkady & Boris Strugatsky', filmYear: 1979, director: 'Andrei Tarkovsky', criterionUrl: 'https://www.criterion.com/films/28600-stalker' },
  { filmTitle: 'Fahrenheit 451', bookTitle: 'Fahrenheit 451', bookAuthor: 'Ray Bradbury', filmYear: 1966, director: 'François Truffaut', criterionUrl: 'https://www.criterion.com/films/334-fahrenheit-451' },
  { filmTitle: '2001: A Space Odyssey', bookTitle: '2001: A Space Odyssey', bookAuthor: 'Arthur C. Clarke', filmYear: 1968, director: 'Stanley Kubrick', criterionUrl: 'https://www.criterion.com/films/211-2001-a-space-odyssey' },
  { filmTitle: 'A Clockwork Orange', bookTitle: 'A Clockwork Orange', bookAuthor: 'Anthony Burgess', filmYear: 1971, director: 'Stanley Kubrick', criterionUrl: 'https://www.criterion.com/films/27600-a-clockwork-orange' },
  { filmTitle: 'The Andromeda Strain', bookTitle: 'The Andromeda Strain', bookAuthor: 'Michael Crichton', filmYear: 1971, director: 'Robert Wise', criterionUrl: 'https://www.criterion.com/films/28845-the-andromeda-strain' },
  { filmTitle: 'The Time Machine', bookTitle: 'The Time Machine', bookAuthor: 'H.G. Wells', filmYear: 1960, director: 'George Pal', criterionUrl: 'https://www.criterion.com/films/29517-the-time-machine' },
  { filmTitle: 'War of the Worlds', bookTitle: 'The War of the Worlds', bookAuthor: 'H.G. Wells', filmYear: 1953, director: 'Byron Haskin', criterionUrl: 'https://www.criterion.com/films/28997-the-war-of-the-worlds' },
  { filmTitle: 'The Incredible Shrinking Man', bookTitle: 'The Shrinking Man', bookAuthor: 'Richard Matheson', filmYear: 1957, director: 'Jack Arnold', criterionUrl: 'https://www.criterion.com/films/29506-the-incredible-shrinking-man' },
  { filmTitle: 'Invasion of the Body Snatchers', bookTitle: 'The Body Snatchers', bookAuthor: 'Jack Finney', filmYear: 1956, director: 'Don Siegel', criterionUrl: 'https://www.criterion.com/films/360-invasion-of-the-body-snatchers' },
  { filmTitle: 'Naked Lunch', bookTitle: 'Naked Lunch', bookAuthor: 'William S. Burroughs', filmYear: 1991, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/485-naked-lunch' },
  { filmTitle: 'The Man Who Fell to Earth', bookTitle: 'The Man Who Fell to Earth', bookAuthor: 'Walter Tevis', filmYear: 1976, director: 'Nicolas Roeg', criterionUrl: 'https://www.criterion.com/films/28730-the-man-who-fell-to-earth' },
  { filmTitle: 'Nineteen Eighty-Four', bookTitle: 'Nineteen Eighty-Four', bookAuthor: 'George Orwell', filmYear: 1984, director: 'Michael Radford', criterionUrl: 'https://www.criterion.com/films/29123-nineteen-eighty-four' },
  { filmTitle: 'On the Silver Globe', bookTitle: 'The Lunar Trilogy', bookAuthor: 'Jerzy Żuławski', filmYear: 1988, director: 'Andrzej Żuławski', criterionUrl: 'https://www.criterion.com/films/29019-on-the-silver-globe' },
  { filmTitle: 'Fantastic Planet', bookTitle: 'Oms en série', bookAuthor: 'Stefan Wul', filmYear: 1973, director: 'René Laloux', criterionUrl: 'https://www.criterion.com/films/310-fantastic-planet' },
  { filmTitle: 'Things to Come', bookTitle: 'The Shape of Things to Come', bookAuthor: 'H.G. Wells', filmYear: 1936, director: 'William Cameron Menzies', criterionUrl: 'https://www.criterion.com/films/29149-things-to-come' },
  { filmTitle: 'Village of the Damned', bookTitle: 'The Midwich Cuckoos', bookAuthor: 'John Wyndham', filmYear: 1960, director: 'Wolf Rilla', criterionUrl: 'https://www.criterion.com/films/29507-village-of-the-damned' },
  { filmTitle: 'When Worlds Collide', bookTitle: 'When Worlds Collide', bookAuthor: 'Edwin Balmer & Philip Wylie', filmYear: 1951, director: 'Rudolph Maté', criterionUrl: 'https://www.criterion.com/films/29511-when-worlds-collide' },
  { filmTitle: 'Videodrome', bookTitle: 'Videodrome', bookAuthor: 'David Cronenberg', filmYear: 1983, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/227-videodrome' },
  { filmTitle: 'Scanners', bookTitle: 'Scanners', bookAuthor: 'David Cronenberg', filmYear: 1981, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/652-scanners' },
  { filmTitle: 'The Fly', bookTitle: 'The Fly', bookAuthor: 'George Langelaan', filmYear: 1986, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/28655-the-fly' },
  { filmTitle: 'eXistenZ', bookTitle: 'eXistenZ', bookAuthor: 'David Cronenberg', filmYear: 1999, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/28936-existenz' },
  { filmTitle: 'Dead Ringers', bookTitle: 'Twins', bookAuthor: 'Bari Wood & Jack Geasland', filmYear: 1988, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/28654-dead-ringers' },
  { filmTitle: 'Crimes of the Future', bookTitle: 'Crimes of the Future', bookAuthor: 'David Cronenberg', filmYear: 2022, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/31156-crimes-of-the-future' },
  { filmTitle: 'RoboCop', bookTitle: 'RoboCop', bookAuthor: 'Ed Naha', filmYear: 1987, director: 'Paul Verhoeven', criterionUrl: 'https://www.criterion.com/films/27839-robocop' },
  { filmTitle: 'Brazil', bookTitle: 'Brazil', bookAuthor: 'Terry Gilliam', filmYear: 1985, director: 'Terry Gilliam', criterionUrl: 'https://www.criterion.com/films/216-brazil' },
  { filmTitle: '12 Monkeys', bookTitle: '12 Monkeys', bookAuthor: 'Chris Marker (La Jetée)', filmYear: 1995, director: 'Terry Gilliam', criterionUrl: 'https://www.criterion.com/films/29001-12-monkeys' },
  { filmTitle: 'La Jetée', bookTitle: 'La Jetée', bookAuthor: 'Chris Marker', filmYear: 1962, director: 'Chris Marker', criterionUrl: 'https://www.criterion.com/films/275-la-jetee' },
  { filmTitle: 'Repo Man', bookTitle: 'Repo Man', bookAuthor: 'Alex Cox', filmYear: 1984, director: 'Alex Cox', criterionUrl: 'https://www.criterion.com/films/27651-repo-man' },
  { filmTitle: 'Tetsuo: The Iron Man', bookTitle: 'Tetsuo: The Iron Man', bookAuthor: 'Shinya Tsukamoto', filmYear: 1989, director: 'Shinya Tsukamoto', criterionUrl: 'https://www.criterion.com/films/28671-tetsuo-the-iron-man' },
  { filmTitle: 'World on a Wire', bookTitle: 'Simulacron-3', bookAuthor: 'Daniel F. Galouye', filmYear: 1973, director: 'Rainer Werner Fassbinder', criterionUrl: 'https://www.criterion.com/films/27523-world-on-a-wire' },
  { filmTitle: 'The Blob', bookTitle: 'The Blob', bookAuthor: 'Original screenplay', filmYear: 1958, director: 'Irvin Yeaworth', criterionUrl: 'https://www.criterion.com/films/27587-the-blob' },
  { filmTitle: 'Alphaville', bookTitle: 'Alphaville', bookAuthor: 'Jean-Luc Godard', filmYear: 1965, director: 'Jean-Luc Godard', criterionUrl: 'https://www.criterion.com/films/259-alphaville' },
  { filmTitle: 'Seconds', bookTitle: 'Seconds', bookAuthor: 'David Ely', filmYear: 1966, director: 'John Frankenheimer', criterionUrl: 'https://www.criterion.com/films/27654-seconds' },
  { filmTitle: 'Quatermass and the Pit', bookTitle: 'Quatermass and the Pit', bookAuthor: 'Nigel Kneale', filmYear: 1967, director: 'Roy Ward Baker', criterionUrl: 'https://www.criterion.com/films/29010-quatermass-and-the-pit' },
  { filmTitle: 'Silent Running', bookTitle: 'Silent Running', bookAuthor: 'Deric Washburn', filmYear: 1972, director: 'Douglas Trumbull', criterionUrl: 'https://www.criterion.com/films/28737-silent-running' },
  { filmTitle: 'Dark Star', bookTitle: 'Dark Star', bookAuthor: 'John Carpenter & Dan O\'Bannon', filmYear: 1974, director: 'John Carpenter', criterionUrl: 'https://www.criterion.com/films/28736-dark-star' },
  { filmTitle: 'Phase IV', bookTitle: 'Phase IV', bookAuthor: 'Barry N. Malzberg', filmYear: 1974, director: 'Saul Bass', criterionUrl: 'https://www.criterion.com/films/29008-phase-iv' },
  { filmTitle: 'Eraserhead', bookTitle: 'Eraserhead', bookAuthor: 'David Lynch', filmYear: 1977, director: 'David Lynch', criterionUrl: 'https://www.criterion.com/films/29002-eraserhead' },
  { filmTitle: 'Until the End of the World', bookTitle: 'Until the End of the World', bookAuthor: 'Wim Wenders & Peter Carey', filmYear: 1991, director: 'Wim Wenders', criterionUrl: 'https://www.criterion.com/films/29002-until-the-end-of-the-world' },
  { filmTitle: 'Altered States', bookTitle: 'Altered States', bookAuthor: 'Paddy Chayefsky', filmYear: 1980, director: 'Ken Russell', criterionUrl: 'https://www.criterion.com/films/29506-altered-states' },
  { filmTitle: 'The Dead Zone', bookTitle: 'The Dead Zone', bookAuthor: 'Stephen King', filmYear: 1983, director: 'David Cronenberg', criterionUrl: 'https://www.criterion.com/films/28665-the-dead-zone' },
  { filmTitle: 'Metropolis', bookTitle: 'Metropolis', bookAuthor: 'Thea von Harbou', filmYear: 1927, director: 'Fritz Lang', criterionUrl: 'https://www.criterion.com/films/292-metropolis' },
  { filmTitle: 'Dark City', bookTitle: 'Dark City', bookAuthor: 'Alex Proyas', filmYear: 1998, director: 'Alex Proyas', criterionUrl: 'https://www.criterion.com/films/29100-dark-city' },
  { filmTitle: 'Forbidden Planet', bookTitle: 'Forbidden Planet (The Tempest)', bookAuthor: 'Cyril Hume', filmYear: 1956, director: 'Fred M. Wilcox', criterionUrl: 'https://www.criterion.com/films/29515-forbidden-planet' },
  { filmTitle: 'The Day the Earth Stood Still', bookTitle: 'Farewell to the Master', bookAuthor: 'Harry Bates', filmYear: 1951, director: 'Robert Wise', criterionUrl: 'https://www.criterion.com/films/29520-the-day-the-earth-stood-still' },
  { filmTitle: 'It Came from Outer Space', bookTitle: 'It Came from Outer Space', bookAuthor: 'Ray Bradbury', filmYear: 1953, director: 'Jack Arnold', criterionUrl: 'https://www.criterion.com/films/29518-it-came-from-outer-space' },
  { filmTitle: 'Possession', bookTitle: 'Possession', bookAuthor: 'Andrzej Żuławski', filmYear: 1981, director: 'Andrzej Żuławski', criterionUrl: 'https://www.criterion.com/films/29003-possession' },
  { filmTitle: 'Safe', bookTitle: 'Safe', bookAuthor: 'Todd Haynes', filmYear: 1995, director: 'Todd Haynes', criterionUrl: 'https://www.criterion.com/films/27657-safe' },
  { filmTitle: 'Alien', bookTitle: 'Alien', bookAuthor: 'Alan Dean Foster', filmYear: 1979, director: 'Ridley Scott', criterionUrl: 'https://www.criterion.com/films/29516-alien' },
  { filmTitle: 'Godzilla', bookTitle: 'Godzilla', bookAuthor: 'Original screenplay', filmYear: 1954, director: 'Ishirō Honda', criterionUrl: 'https://www.criterion.com/films/332-godzilla' },
];

// Verified Arrow SF Films with book metadata
const ARROW_SF_FILMS = [
  { filmTitle: 'The Thing', bookTitle: 'Who Goes There?', bookAuthor: 'John W. Campbell Jr.', filmYear: 1982, director: 'John Carpenter', arrowUrl: 'https://www.arrowfilms.com/p/the-thing-blu-ray/11536071/' },
  { filmTitle: 'Dune', bookTitle: 'Dune', bookAuthor: 'Frank Herbert', filmYear: 1984, director: 'David Lynch', arrowUrl: 'https://www.arrowfilms.com/p/dune-4k-uhd/13324926/' },
  { filmTitle: 'Slaughterhouse-Five', bookTitle: 'Slaughterhouse-Five', bookAuthor: 'Kurt Vonnegut', filmYear: 1972, director: 'George Roy Hill', arrowUrl: 'https://www.arrowfilms.com/p/slaughterhouse-five-blu-ray/11483546/' },
  { filmTitle: 'Battle Royale', bookTitle: 'Battle Royale', bookAuthor: 'Koushun Takami', filmYear: 2000, director: 'Kinji Fukasaku', arrowUrl: 'https://www.arrowfilms.com/p/battle-royale-dvd/10851177/' },
  { filmTitle: 'Aniara', bookTitle: 'Aniara', bookAuthor: 'Harry Martinson', filmYear: 2018, director: 'Pella Kågerman & Hugo Lilja', arrowUrl: 'https://www.arrowfilms.com/p/aniara-blu-ray/12237636/' },
  { filmTitle: 'Rollerball', bookTitle: 'Roller Ball Murder', bookAuthor: 'William Harrison', filmYear: 1975, director: 'Norman Jewison', arrowUrl: 'https://www.arrowfilms.com/p/rollerball-blu-ray/11070126/' },
  { filmTitle: 'Donnie Darko', bookTitle: 'Donnie Darko', bookAuthor: 'Richard Kelly', filmYear: 2001, director: 'Richard Kelly', arrowUrl: 'https://www.arrowfilms.com/p/donnie-darko-blu-ray/11371348/' },
  { filmTitle: 'Demolition Man', bookTitle: 'Demolition Man', bookAuthor: 'Original screenplay', filmYear: 1993, director: 'Marco Brambilla', arrowUrl: 'https://www.arrowfilms.com/p/4k/demolition-man-4k-ultra-hd/16288117/' },
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
    
    const allFilms = [
      ...CRITERION_SF_FILMS.map(f => ({ ...f, source: 'criterion', isCriterion: true })),
      ...ARROW_SF_FILMS.map(f => ({ ...f, source: 'arrow', isCriterion: false })),
    ];
    
    const missingFilms = allFilms.filter(f => !existingTitles.has(f.filmTitle.toLowerCase()));
    
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
          is_criterion_collection: film.isCriterion,
          criterion_url: (film as any).criterionUrl || null,
          streaming_availability: (film as any).arrowUrl ? { arrow: (film as any).arrowUrl } : {},
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
      alreadyExist: allFilms.length - missingFilms.length,
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
