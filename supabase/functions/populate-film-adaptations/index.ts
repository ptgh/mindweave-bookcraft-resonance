import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Classic SF film adaptations database with streaming URLs, awards, and images
const SF_FILM_ADAPTATIONS = [
  {
    book_title: "Do Androids Dream of Electric Sheep?",
    book_author: "Philip K. Dick",
    book_publication_year: 1968,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780345404473-L.jpg",
    film_title: "Blade Runner",
    film_year: 1982,
    director: "Ridley Scott",
    imdb_id: "tt0083658",
    imdb_rating: 8.1,
    rotten_tomatoes_score: 89,
    poster_url: "https://m.media-amazon.com/images/M/MV5BNzQzMzJhZTEtOWM4NS00MTdhLTg0YjgtMjM4MDRkZjUwZDBlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Film focuses more on noir aesthetics and existential questions; book explores empathy and the Mercerism religion more deeply",
    trailer_url: "https://www.youtube.com/watch?v=eogpIG53Cis",
    awards: [
      { name: "BAFTA Award for Best Cinematography", year: 1983 },
      { name: "Hugo Award for Best Dramatic Presentation", year: 1983 },
      { name: "National Film Registry", year: 1993 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/blade-runner-the-final-cut/umc.cmc.7gw26y91mgu9u63m2pz1i84sp",
      criterion: "https://www.criterion.com/shop/browse?genre=science-fiction"
    }
  },
  {
    book_title: "2001: A Space Odyssey",
    book_author: "Arthur C. Clarke",
    book_publication_year: 1968,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780451457998-L.jpg",
    film_title: "2001: A Space Odyssey",
    film_year: 1968,
    director: "Stanley Kubrick",
    imdb_id: "tt0062622",
    imdb_rating: 8.3,
    rotten_tomatoes_score: 92,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMmNlYzRiNDctZWNhMi00MzI4LThkZTctMTUzMmZkMmFmNThmXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Novel and film were developed simultaneously; novel provides more exposition for HAL's malfunction and the Star Gate sequence",
    trailer_url: "https://www.youtube.com/watch?v=oR_e9y-bka0",
    awards: [
      { name: "Academy Award for Best Visual Effects", year: 1969 },
      { name: "BAFTA Award for Best Art Direction", year: 1969 },
      { name: "National Film Registry", year: 1991 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/2001-a-space-odyssey/umc.cmc.1hk1n3sqb0gk04bcv8ychb7e4",
      criterion: "https://www.criterion.com/shop/browse?genre=science-fiction"
    }
  },
  {
    book_title: "Dune",
    book_author: "Frank Herbert",
    book_publication_year: 1965,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    film_title: "Dune",
    film_year: 2021,
    director: "Denis Villeneuve",
    imdb_id: "tt1160419",
    imdb_rating: 8.0,
    rotten_tomatoes_score: 83,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMDQ0NjgyN2YtNWViNS00YjA3LTkxNDktYzFkZTExZGMxZDkxXkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film covers first half of novel; streamlines political complexity while maintaining visual grandeur",
    trailer_url: "https://www.youtube.com/watch?v=8g18jFHCLXk",
    awards: [
      { name: "Academy Award for Best Cinematography", year: 2022 },
      { name: "Academy Award for Best Original Score", year: 2022 },
      { name: "Academy Award for Best Sound", year: 2022 },
      { name: "Academy Award for Best Production Design", year: 2022 },
      { name: "Academy Award for Best Film Editing", year: 2022 },
      { name: "Academy Award for Best Visual Effects", year: 2022 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/dune/umc.cmc.3h8cj8xb2qqp1s52e1q25ti9z"
    }
  },
  {
    book_title: "Dune Messiah",
    book_author: "Frank Herbert",
    book_publication_year: 1969,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780441172696-L.jpg",
    film_title: "Dune: Part Two",
    film_year: 2024,
    director: "Denis Villeneuve",
    imdb_id: "tt15239678",
    imdb_rating: 8.5,
    rotten_tomatoes_score: 92,
    poster_url: "https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Combines second half of first book with elements of Dune Messiah; adds romance and battle sequences",
    trailer_url: "https://www.youtube.com/watch?v=Way9Dexny3w",
    awards: [
      { name: "Academy Award nominations pending", year: 2025 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/dune-part-two/umc.cmc.5dg9hpchz5rxc4m1d6z0t6z0"
    }
  },
  {
    book_title: "Story of Your Life",
    book_author: "Ted Chiang",
    book_publication_year: 1998,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9781101972120-L.jpg",
    film_title: "Arrival",
    film_year: 2016,
    director: "Denis Villeneuve",
    imdb_id: "tt2543164",
    imdb_rating: 7.9,
    rotten_tomatoes_score: 94,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTExMzU0ODcxNDheQTJeQWpwZ15BbWU4MDE1OTI4MzAy._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film adds geopolitical tensions and military subplot; novella focuses more on linguistics and physics",
    trailer_url: "https://www.youtube.com/watch?v=tFMo3UJ4B4g",
    awards: [
      { name: "Academy Award for Best Sound Editing", year: 2017 },
      { name: "Hugo Award for Best Dramatic Presentation", year: 2017 },
      { name: "Nebula Award for Best Script", year: 2017 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/arrival/umc.cmc.6h3y4b7p99nxz8r6k3r4k3r4"
    }
  },
  {
    book_title: "The Martian",
    book_author: "Andy Weir",
    book_publication_year: 2011,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780553418026-L.jpg",
    film_title: "The Martian",
    film_year: 2015,
    director: "Ridley Scott",
    imdb_id: "tt3659388",
    imdb_rating: 8.0,
    rotten_tomatoes_score: 91,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTc2MTQ3MDA1Nl5BMl5BanBnXkFtZTgwODA3OTI4NjE@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film condenses timeline and simplifies some science; maintains humor and problem-solving focus",
    trailer_url: "https://www.youtube.com/watch?v=ej3ioOneTy8",
    awards: [
      { name: "Golden Globe for Best Picture - Musical or Comedy", year: 2016 },
      { name: "Academy Award nominations for Best Picture and Best Actor", year: 2016 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/the-martian/umc.cmc.6z2e9c8k6r3e6r3e6r3e6r3e"
    }
  },
  {
    book_title: "Solaris",
    book_author: "Stanisław Lem",
    book_publication_year: 1961,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780156027601-L.jpg",
    film_title: "Solaris",
    film_year: 1972,
    director: "Andrei Tarkovsky",
    imdb_id: "tt0069293",
    imdb_rating: 8.1,
    rotten_tomatoes_score: 92,
    poster_url: "https://m.media-amazon.com/images/M/MV5BZmY4Yjc0OWQtZDRhMy00ODc2LWI2ZGYtMmNmYjA5MjkzODVlL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Tarkovsky emphasizes human relationships over scientific mystery; Lem was critical of this approach",
    trailer_url: "https://www.youtube.com/watch?v=6-4KydP92ss",
    awards: [
      { name: "Grand Prix at Cannes Film Festival", year: 1972 },
      { name: "FIPRESCI Prize", year: 1972 }
    ],
    streaming_availability: { 
      criterion: "https://www.criterion.com/films/27867-solaris"
    }
  },
  {
    book_title: "Annihilation",
    book_author: "Jeff VanderMeer",
    book_publication_year: 2014,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780374104092-L.jpg",
    film_title: "Annihilation",
    film_year: 2018,
    director: "Alex Garland",
    imdb_id: "tt2798920",
    imdb_rating: 6.8,
    rotten_tomatoes_score: 88,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTk2Mjc2NzYxNl5BMl5BanBnXkFtZTgwMTA2OTA1NDM@._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Film takes significant liberties with plot and characters while maintaining cosmic horror atmosphere",
    trailer_url: "https://www.youtube.com/watch?v=89OP78l9oF0",
    awards: [
      { name: "Nebula Award for Best Script", year: 2019 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/annihilation/umc.cmc.4h83dk4r4r4dk4h83"
    }
  },
  {
    book_title: "A Clockwork Orange",
    book_author: "Anthony Burgess",
    book_publication_year: 1962,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780393312836-L.jpg",
    film_title: "A Clockwork Orange",
    film_year: 1971,
    director: "Stanley Kubrick",
    imdb_id: "tt0066921",
    imdb_rating: 8.3,
    rotten_tomatoes_score: 87,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTY3MjM1Mzc4N15BMl5BanBnXkFtZTgwODM0NzAxMDE@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film omits novel's final redemptive chapter (US edition); Kubrick's visual style defines the work",
    trailer_url: "https://www.youtube.com/watch?v=SPRzm8ibDQ8",
    awards: [
      { name: "New York Film Critics Circle Award for Best Film", year: 1971 },
      { name: "National Film Registry", year: 2020 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/a-clockwork-orange/umc.cmc.clockwork",
      criterion: "https://www.criterion.com/shop/browse?genre=science-fiction"
    }
  },
  {
    book_title: "The Prestige",
    book_author: "Christopher Priest",
    book_publication_year: 1995,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780312858865-L.jpg",
    film_title: "The Prestige",
    film_year: 2006,
    director: "Christopher Nolan",
    imdb_id: "tt0482571",
    imdb_rating: 8.5,
    rotten_tomatoes_score: 76,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNF5BMl5BanBnXkFtZTYwNTM0MzY2._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Film restructures narrative and changes key plot elements; Tesla's machine works differently",
    trailer_url: "https://www.youtube.com/watch?v=o4gHCmTQDVI",
    awards: [
      { name: "Academy Award nominations for Cinematography and Art Direction", year: 2007 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/the-prestige/umc.cmc.prestige"
    }
  },
  {
    book_title: "Jurassic Park",
    book_author: "Michael Crichton",
    book_publication_year: 1990,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780345538987-L.jpg",
    film_title: "Jurassic Park",
    film_year: 1993,
    director: "Steven Spielberg",
    imdb_id: "tt0107290",
    imdb_rating: 8.2,
    rotten_tomatoes_score: 91,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMjM2MDgxMDg0Nl5BMl5BanBnXkFtZTgwNTM2OTM5NDE@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film softens darker elements; Hammond becomes sympathetic; some characters survive who die in book",
    trailer_url: "https://www.youtube.com/watch?v=lc0UehYemQA",
    awards: [
      { name: "Academy Award for Best Visual Effects", year: 1994 },
      { name: "Academy Award for Best Sound", year: 1994 },
      { name: "Academy Award for Best Sound Editing", year: 1994 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/jurassic-park/umc.cmc.jurassicpark"
    }
  },
  {
    book_title: "Children of Men",
    book_author: "P.D. James",
    book_publication_year: 1992,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780307279903-L.jpg",
    film_title: "Children of Men",
    film_year: 2006,
    director: "Alfonso Cuarón",
    imdb_id: "tt0206634",
    imdb_rating: 7.9,
    rotten_tomatoes_score: 92,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTQ5NTI2NTI4NF5BMl5BanBnXkFtZTcwNjk2NDA2OQ@@._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Film shifts focus from religious themes to immigration and political chaos; famous long takes",
    trailer_url: "https://www.youtube.com/watch?v=2VT2apoX90o",
    awards: [
      { name: "Academy Award nominations for Best Cinematography and Editing", year: 2007 },
      { name: "BAFTA Award for Best Cinematography", year: 2007 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/children-of-men/umc.cmc.childrenofmen"
    }
  },
  {
    book_title: "Contact",
    book_author: "Carl Sagan",
    book_publication_year: 1985,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9781501197987-L.jpg",
    film_title: "Contact",
    film_year: 1997,
    director: "Robert Zemeckis",
    imdb_id: "tt0118884",
    imdb_rating: 7.5,
    rotten_tomatoes_score: 66,
    poster_url: "https://m.media-amazon.com/images/M/MV5BYWNkYmFiZjUtYmI3Ni00NzEyLWFjNjUtZTNjZmNkYTFhN2YzXkEyXkFqcGdeQXVyNDk3NzU2MTQ@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film simplifies multiple machines to one; romance subplot expanded; ending modified slightly",
    trailer_url: "https://www.youtube.com/watch?v=SRoj3jK37Vc",
    awards: [
      { name: "Hugo Award for Best Dramatic Presentation", year: 1998 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/contact/umc.cmc.contact1997"
    }
  },
  {
    book_title: "The Road",
    book_author: "Cormac McCarthy",
    book_publication_year: 2006,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg",
    film_title: "The Road",
    film_year: 2009,
    director: "John Hillcoat",
    imdb_id: "tt0898367",
    imdb_rating: 7.2,
    rotten_tomatoes_score: 75,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMTAwNzk4NTQ0NjNeQTJeQWpwZ15BbWU3MDY2MjQ3MTM@._V1_.jpg",
    adaptation_type: "direct",
    notable_differences: "Film captures novel's bleak atmosphere; some flashbacks added for visual storytelling",
    trailer_url: "https://www.youtube.com/watch?v=bO2BLSEJf6Y",
    awards: [
      { name: "BAFTA nomination for Best Actor", year: 2010 }
    ],
    streaming_availability: { 
      apple: "https://tv.apple.com/movie/the-road/umc.cmc.theroad"
    }
  },
  {
    book_title: "Stalker (Roadside Picnic)",
    book_author: "Arkady and Boris Strugatsky",
    book_publication_year: 1972,
    book_cover_url: "https://covers.openlibrary.org/b/isbn/9781613743416-L.jpg",
    film_title: "Stalker",
    film_year: 1979,
    director: "Andrei Tarkovsky",
    imdb_id: "tt0079944",
    imdb_rating: 8.2,
    rotten_tomatoes_score: 97,
    poster_url: "https://m.media-amazon.com/images/M/MV5BMDgwODNmMGItMDcwYi00OWZjLTgyZjAtMGYwMmI4N2Q0NmJmXkEyXkFqcGdeQXVyNzY1MTU0Njk@._V1_.jpg",
    adaptation_type: "loose",
    notable_differences: "Tarkovsky transforms adventure story into philosophical meditation; Zone becomes spiritual metaphor",
    trailer_url: "https://www.youtube.com/watch?v=TGRDYpCmMcM",
    awards: [
      { name: "Prize of the Ecumenical Jury at Cannes", year: 1980 }
    ],
    streaming_availability: { 
      criterion: "https://www.criterion.com/films/30167-stalker"
    }
  },
  {
    book_title: "Ex Machina",
    book_author: "Alex Garland",
    book_publication_year: 2015,
    film_title: "Ex Machina",
    film_year: 2015,
    director: "Alex Garland",
    imdb_id: "tt0470752",
    imdb_rating: 7.7,
    rotten_tomatoes_score: 92,
    adaptation_type: "original",
    notable_differences: "Original screenplay inspired by classic AI/consciousness SF literature",
    trailer_url: "https://www.youtube.com/watch?v=EoQuVnKhxaM",
    awards: [
      { name: "Academy Award for Best Visual Effects", year: 2016 },
      { name: "BAFTA Award for Outstanding Debut", year: 2016 }
    ],
    streaming_availability: { 
      netflix: "https://www.netflix.com/title/80023689",
      prime: "https://www.amazon.com/gp/video/detail/B00XI05N5E"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=vw61gCe2oqI",
    awards: [
      { name: "Saturn Award nominations", year: 2015 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B00KL3VZ4C",
      hbo: "https://play.max.com/movie/edge-of-tomorrow"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=NvHiNA5Udpc",
    awards: [
      { name: "Venice Film Festival nomination", year: 1966 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B00C3MXWXY"
    }
  },
  {
    book_title: "The Invisible Man",
    book_author: "H.G. Wells",
    book_publication_year: 1897,
    film_title: "The Invisible Man",
    film_year: 2020,
    director: "Leigh Whannell",
    imdb_id: "tt1051906",
    imdb_rating: 7.1,
    rotten_tomatoes_score: 91,
    adaptation_type: "reimagining",
    notable_differences: "Modern psychological thriller focused on domestic abuse; technology-based invisibility",
    trailer_url: "https://www.youtube.com/watch?v=WO_FJdiY9dA",
    awards: [
      { name: "Saturn Award for Best Horror Film", year: 2021 }
    ],
    streaming_availability: { 
      netflix: "https://www.netflix.com/title/81052919",
      prime: "https://www.amazon.com/gp/video/detail/B084DC61VL",
      peacock: "https://www.peacocktv.com/watch/asset/movies/the-invisible-man/8a45d978"
    }
  },
  {
    book_title: "The War of the Worlds",
    book_author: "H.G. Wells",
    book_publication_year: 1898,
    film_title: "War of the Worlds",
    film_year: 2005,
    director: "Steven Spielberg",
    imdb_id: "tt0407304",
    imdb_rating: 6.5,
    rotten_tomatoes_score: 75,
    adaptation_type: "loose",
    notable_differences: "Updated to modern day New Jersey; focuses on family survival; post-9/11 themes",
    trailer_url: "https://www.youtube.com/watch?v=_BLsOcYw2Fk",
    awards: [
      { name: "Academy Award nominations for Visual Effects and Sound", year: 2006 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ9W"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=WFMLGEHdIjE",
    awards: [
      { name: "Academy Award for Best Visual Effects", year: 1991 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ7G"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=lG7DGMgfOb8",
    awards: [
      { name: "Saturn Award for Best Science Fiction Film", year: 2003 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ8Q"
    }
  },
  {
    book_title: "I Am Legend",
    book_author: "Richard Matheson",
    book_publication_year: 1954,
    film_title: "I Am Legend",
    film_year: 2007,
    director: "Francis Lawrence",
    imdb_id: "tt0480249",
    imdb_rating: 7.2,
    rotten_tomatoes_score: 68,
    adaptation_type: "loose",
    notable_differences: "Changes ending and themes significantly; loses novel's philosophical exploration of monstrosity",
    trailer_url: "https://www.youtube.com/watch?v=oYnzEeIbWjs",
    awards: [
      { name: "Saturn Award for Best Actor", year: 2008 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000YABVZC",
      hbo: "https://play.max.com/movie/i-am-legend"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=sXiRZhDEo8A",
    awards: [
      { name: "BAFTA nominations", year: 2011 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B004QOB0OW"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=BiXxE1P7pL8",
    awards: [
      { name: "Academy Award for Best Special Effects", year: 1961 },
      { name: "National Film Registry", year: 2023 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ6W",
      hbo: "https://play.max.com/movie/the-time-machine"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=7VjPjD-QWzE",
    awards: [
      { name: "Academy Award nominations for Art Direction and Editing", year: 1972 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ4Y"
    }
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
    trailer_url: "https://www.youtube.com/watch?v=rL6RRIOZyCM",
    awards: [
      { name: "Saturn Award nomination", year: 2005 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ6G"
    }
  },
  {
    book_title: "Ender's Game",
    book_author: "Orson Scott Card",
    book_publication_year: 1985,
    film_title: "Ender's Game",
    film_year: 2013,
    director: "Gavin Hood",
    imdb_id: "tt1731141",
    imdb_rating: 6.6,
    rotten_tomatoes_score: 62,
    adaptation_type: "direct",
    notable_differences: "Compresses timeline significantly; ages up characters; simplifies Battle School politics",
    trailer_url: "https://www.youtube.com/watch?v=2UNWLgY-wuo",
    awards: [
      { name: "Saturn Award nominations", year: 2014 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B00G9A4ILS",
      netflix: "https://www.netflix.com/title/70267236"
    }
  },
  {
    book_title: "Ready Player One",
    book_author: "Ernest Cline",
    book_publication_year: 2011,
    film_title: "Ready Player One",
    film_year: 2018,
    director: "Steven Spielberg",
    imdb_id: "tt1677720",
    imdb_rating: 7.4,
    rotten_tomatoes_score: 72,
    adaptation_type: "loose",
    notable_differences: "Changes many pop culture references; alters challenges and some character arcs",
    trailer_url: "https://www.youtube.com/watch?v=cSp1dM2Vj48",
    awards: [
      { name: "Academy Award nomination for Best Visual Effects", year: 2019 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B07B9RPQZL",
      hbo: "https://play.max.com/movie/ready-player-one"
    }
  },
  {
    book_title: "The Hitchhiker's Guide to the Galaxy",
    book_author: "Douglas Adams",
    book_publication_year: 1979,
    film_title: "The Hitchhiker's Guide to the Galaxy",
    film_year: 2005,
    director: "Garth Jennings",
    imdb_id: "tt0371724",
    imdb_rating: 6.7,
    rotten_tomatoes_score: 60,
    adaptation_type: "direct",
    notable_differences: "Adams wrote screenplay before death; adds new subplot; streamlines radio/book complexity",
    trailer_url: "https://www.youtube.com/watch?v=MeD2F6J7lFY",
    awards: [
      { name: "Empire Award for Best Sci-Fi/Fantasy", year: 2006 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B00C0N9Q7S",
      disney: "https://www.disneyplus.com/movies/the-hitchhikers-guide-to-the-galaxy/3Z0g5wB5d8KV"
    }
  },
  {
    book_title: "Planet of the Apes",
    book_author: "Pierre Boulle",
    book_publication_year: 1963,
    film_title: "Planet of the Apes",
    film_year: 1968,
    director: "Franklin J. Schaffner",
    imdb_id: "tt0063442",
    imdb_rating: 8.0,
    rotten_tomatoes_score: 88,
    adaptation_type: "loose",
    notable_differences: "Film adds iconic twist ending not in novel; apes more primitive than novel's technologically advanced society",
    trailer_url: "https://www.youtube.com/watch?v=VbxgYlcNxE8",
    awards: [
      { name: "Academy Honorary Award for Makeup", year: 1969 },
      { name: "National Film Registry", year: 2001 }
    ],
    streaming_availability: { 
      prime: "https://www.amazon.com/gp/video/detail/B000I9WZ58",
      disney: "https://www.disneyplus.com/movies/planet-of-the-apes/1p3m8CZ5mZz6"
    }
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

    console.log('Populating SF film adaptations database with streaming links and awards...');

    // Delete all existing records to refresh with new data
    await supabase.from('sf_film_adaptations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert adaptations
    const { data, error } = await supabase
      .from('sf_film_adaptations')
      .insert(SF_FILM_ADAPTATIONS)
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
        } else {
          console.error(`Failed to insert ${adaptation.film_title}:`, insertError.message);
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
      message: `Populated ${data?.length || 0} film adaptations with streaming links`,
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
