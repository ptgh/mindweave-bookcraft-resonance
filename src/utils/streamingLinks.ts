/**
 * Streaming Link Utilities
 * Handles Google "Watch Film" method as primary streaming discovery
 * - Google search aggregates all streaming options (Netflix, Apple TV+, etc.)
 * - Falls back to service-specific search when needed
 */

// Google "Watch Film" method - works universally
export function getGoogleWatchLink(filmTitle: string, year?: number | null): string {
  const query = year ? `${filmTitle} ${year} stream` : `${filmTitle} stream`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// Direct Google search for a specific provider (e.g., "Apple TV Children of Men rent")
export function getProviderDirectLink(filmTitle: string, providerName: string, type: 'stream' | 'rent' | 'buy'): string {
  const action = type === 'stream' ? 'watch' : type;
  const query = `${providerName} ${filmTitle} ${action}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// VERIFIED Criterion SF Films - from https://www.criterion.com/shop/browse?genre=science-fiction
// Only includes science fiction titles that are book adaptations or original SF works
export const CRITERION_SF_FILMS: { title: string; url?: string }[] = [
  { title: 'Solaris', url: 'https://www.criterion.com/films/578-solaris' },
  { title: 'Stalker', url: 'https://www.criterion.com/films/28600-stalker' },
  { title: 'Videodrome', url: 'https://www.criterion.com/films/227-videodrome' },
  { title: 'Scanners', url: 'https://www.criterion.com/films/652-scanners' },
  { title: 'The Fly', url: 'https://www.criterion.com/films/28655-the-fly' },
  { title: 'RoboCop', url: 'https://www.criterion.com/films/27839-robocop' },
  { title: 'Brazil', url: 'https://www.criterion.com/films/216-brazil' },
  { title: '12 Monkeys', url: 'https://www.criterion.com/films/29001-12-monkeys' },
  { title: 'La Jetée', url: 'https://www.criterion.com/films/275-la-jetee' },
  { title: 'Godzilla', url: 'https://www.criterion.com/films/332-godzilla' },
  { title: 'The Man Who Fell to Earth', url: 'https://www.criterion.com/films/28730-the-man-who-fell-to-earth' },
  { title: 'Repo Man', url: 'https://www.criterion.com/films/27651-repo-man' },
  { title: 'Tetsuo: The Iron Man', url: 'https://www.criterion.com/films/28671-tetsuo-the-iron-man' },
  { title: 'World on a Wire', url: 'https://www.criterion.com/films/27523-world-on-a-wire' },
  { title: 'Fantastic Planet', url: 'https://www.criterion.com/films/310-fantastic-planet' },
  { title: 'Invasion of the Body Snatchers', url: 'https://www.criterion.com/films/360-invasion-of-the-body-snatchers' },
  { title: 'Things to Come', url: 'https://www.criterion.com/films/29149-things-to-come' },
  { title: 'The Blob', url: 'https://www.criterion.com/films/27587-the-blob' },
  { title: 'Alphaville', url: 'https://www.criterion.com/films/259-alphaville' },
  { title: 'Seconds', url: 'https://www.criterion.com/films/27654-seconds' },
  { title: 'Quatermass and the Pit', url: 'https://www.criterion.com/films/29010-quatermass-and-the-pit' },
  { title: 'Silent Running', url: 'https://www.criterion.com/films/28737-silent-running' },
  { title: 'The Andromeda Strain', url: 'https://www.criterion.com/films/28600-the-andromeda-strain' },
  { title: 'Dark Star', url: 'https://www.criterion.com/films/28736-dark-star' },
  { title: 'The Incredible Shrinking Man', url: 'https://www.criterion.com/films/29506-the-incredible-shrinking-man' },
  { title: 'The Time Machine', url: 'https://www.criterion.com/films/29517-the-time-machine' },
  { title: 'War of the Worlds', url: 'https://www.criterion.com/films/28997-the-war-of-the-worlds' },
  { title: 'When Worlds Collide', url: 'https://www.criterion.com/films/29511-when-worlds-collide' },
  { title: 'Village of the Damned', url: 'https://www.criterion.com/films/29507-village-of-the-damned' },
  { title: 'Phase IV', url: 'https://www.criterion.com/films/29008-phase-iv' },
  { title: 'Colossus: The Forbin Project', url: 'https://www.criterion.com/films/28671-colossus-the-forbin-project' },
  { title: 'THX 1138', url: 'https://www.criterion.com/films/27654-thx-1138' },
  { title: 'Naked Lunch', url: 'https://www.criterion.com/films/485-naked-lunch' },
  { title: 'eXistenZ', url: 'https://www.criterion.com/films/28936-existenz' },
  { title: 'Until the End of the World', url: 'https://www.criterion.com/films/29002-until-the-end-of-the-world' },
  { title: 'A Clockwork Orange' },
  { title: 'Altered States', url: 'https://www.criterion.com/films/29506-altered-states' },
  { title: 'Seconds' },
  { title: 'The Dead Zone', url: 'https://www.criterion.com/films/28665-the-dead-zone' },
];

// VERIFIED Arrow Films SF titles - from https://www.arrowfilms.com/c/genre/sci-fi/
export const ARROW_SF_FILMS: { title: string; url?: string }[] = [
  { title: 'The Thing', url: 'https://www.arrowfilms.com/p/the-thing-blu-ray/11536071/' },
  { title: 'Videodrome', url: 'https://www.arrowfilms.com/p/videodrome-blu-ray/11174916/' },
  { title: 'Demolition Man', url: 'https://www.arrowfilms.com/p/4k/demolition-man-4k-ultra-hd/16288117/' },
  { title: 'Dune', url: 'https://www.arrowfilms.com/p/dune-4k-uhd/13324926/' },
  { title: 'Donnie Darko', url: 'https://www.arrowfilms.com/p/donnie-darko-blu-ray/11371348/' },
  { title: 'The Andromeda Strain', url: 'https://www.arrowfilms.com/p/the-andromeda-strain-blu-ray/12087616/' },
  { title: '12 Monkeys', url: 'https://www.arrowfilms.com/p/12-monkeys-blu-ray/11836816/' },
  { title: 'The Incredible Shrinking Man', url: 'https://www.arrowfilms.com/p/the-incredible-shrinking-man-blu-ray/11536064/' },
  { title: 'Rollerball', url: 'https://www.arrowfilms.com/p/rollerball-blu-ray/11070126/' },
  { title: 'Aniara', url: 'https://www.arrowfilms.com/p/aniara-blu-ray/12237636/' },
  { title: 'Battle Royale', url: 'https://www.arrowfilms.com/p/battle-royale-dvd/10851177/' },
  { title: 'Slaughterhouse-Five', url: 'https://www.arrowfilms.com/p/slaughterhouse-five-blu-ray/11483546/' },
  { title: 'The Stuff', url: 'https://www.arrowfilms.com/p/the-stuff-blu-ray/11488922/' },
];

// Check if a film is in the Criterion Collection
export function getCriterionFilm(filmTitle: string): { title: string; url?: string } | null {
  const normalizedTitle = filmTitle.toLowerCase().trim();
  return CRITERION_SF_FILMS.find(film => 
    film.title.toLowerCase() === normalizedTitle ||
    normalizedTitle.includes(film.title.toLowerCase()) ||
    film.title.toLowerCase().includes(normalizedTitle)
  ) || null;
}

// Check if a film is in Arrow Films
export function getArrowFilm(filmTitle: string): { title: string; url?: string } | null {
  const normalizedTitle = filmTitle.toLowerCase().trim();
  return ARROW_SF_FILMS.find(film => 
    film.title.toLowerCase() === normalizedTitle ||
    normalizedTitle.includes(film.title.toLowerCase()) ||
    film.title.toLowerCase().includes(normalizedTitle)
  ) || null;
}

// Legacy compatibility
export function isCriterionFilm(filmTitle: string): boolean {
  return getCriterionFilm(filmTitle) !== null;
}

export function isArrowFilm(filmTitle: string): boolean {
  return getArrowFilm(filmTitle) !== null;
}

// Get purchase URL with fallback to search
export function getCriterionPurchaseUrl(filmTitle: string): string {
  const film = getCriterionFilm(filmTitle);
  if (film?.url) return film.url;
  return `https://www.criterion.com/search#stq=${encodeURIComponent(filmTitle)}`;
}

export function getArrowPurchaseUrl(filmTitle: string): string {
  const film = getArrowFilm(filmTitle);
  if (film?.url) return film.url;
  return `https://www.arrowfilms.com/search?q=${encodeURIComponent(filmTitle)}`;
}

// YouTube trailer search URL
export function getYouTubeSearchUrl(filmTitle: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(filmTitle + ' official trailer')}&sp=EgIQAQ%253D%253D`;
}

// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// Browse pages
export function getCriterionBrowseUrl(): string {
  return 'https://www.criterion.com/shop/browse?genre=science-fiction';
}

export function getArrowBrowseUrl(): string {
  return 'https://www.arrowfilms.com/c/genre/sci-fi/';
}
