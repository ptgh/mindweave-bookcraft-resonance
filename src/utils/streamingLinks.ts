/**
 * Streaming Link Utilities
 * Handles Google "Watch Film" method as primary streaming discovery
 * - Google search aggregates all streaming options (Netflix, Apple TV+, etc.)
 * - Falls back to service-specific search when needed
 */

// ============= Title Matching Helpers =============

/**
 * Normalize a title for comparison:
 * - lowercase
 * - remove leading articles (the, a, an)
 * - remove punctuation
 * - collapse whitespace
 */
export function normalizeTitle(title: string): string {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if a search title matches a canonical entry (including aliases)
 */
function matchesTitle(search: string, canonical: { title: string; aliases?: string[] }): boolean {
  const s = normalizeTitle(search);
  if (normalizeTitle(canonical.title) === s) return true;
  if (canonical.aliases?.some(a => normalizeTitle(a) === s)) return true;
  return false;
}

// ============= Film Types =============

interface CatalogFilm {
  title: string;
  url?: string;
  year?: number;
  aliases?: string[];
}

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

/**
 * VERIFIED Arrow Films Science Fiction Titles
 * Source: https://www.arrowfilms.com/c/genre/sci-fi/ (64 results)
 * Last updated: December 2024
 * Only includes SF films that are book adaptations or original SF works
 */
export const ARROW_SF_FILMS: CatalogFilm[] = [
  // Major Book Adaptations
  { title: 'The Thing', url: 'https://www.arrowfilms.com/p/the-thing-blu-ray/11536071/', year: 1982 },
  { title: 'Dune', url: 'https://www.arrowfilms.com/p/dune-4k-uhd/13324926/', year: 1984 },
  { title: 'The Andromeda Strain', url: 'https://www.arrowfilms.com/p/the-andromeda-strain-blu-ray/12087616/', year: 1971 },
  { title: 'The Incredible Shrinking Man', url: 'https://www.arrowfilms.com/p/the-incredible-shrinking-man-blu-ray/11536064/', year: 1957 },
  { title: 'Slaughterhouse-Five', url: 'https://www.arrowfilms.com/p/slaughterhouse-five-blu-ray/11483546/', year: 1972, aliases: ['Slaughterhouse Five'] },
  { title: 'Battle Royale', url: 'https://www.arrowfilms.com/p/battle-royale-dvd/10851177/', year: 2000, aliases: ['Batoru rowaiaru'] },
  { title: 'Aniara', url: 'https://www.arrowfilms.com/p/aniara-blu-ray/12237636/', year: 2018 },
  
  // Other Arrow SF
  { title: 'Videodrome', url: 'https://www.arrowfilms.com/p/videodrome-blu-ray/11174916/', year: 1983 },
  { title: 'Demolition Man', url: 'https://www.arrowfilms.com/p/4k/demolition-man-4k-ultra-hd/16288117/', year: 1993 },
  { title: 'Donnie Darko', url: 'https://www.arrowfilms.com/p/donnie-darko-blu-ray/11371348/', year: 2001 },
  { title: '12 Monkeys', url: 'https://www.arrowfilms.com/p/12-monkeys-blu-ray/11836816/', year: 1995, aliases: ['Twelve Monkeys'] },
  { title: 'Rollerball', url: 'https://www.arrowfilms.com/p/rollerball-blu-ray/11070126/', year: 1975 },
  { title: 'The Stuff', url: 'https://www.arrowfilms.com/p/the-stuff-blu-ray/11488922/', year: 1985 },
  { title: 'Mega Time Squad', url: 'https://www.arrowfilms.com/p/mega-time-squad-blu-ray/12053059/', year: 2018 },
  { title: 'Burst City', url: 'https://www.arrowfilms.com/p/burst-city-blu-ray/12688896/', year: 1982 },
  { title: 'Terra Formars', url: 'https://www.arrowfilms.com/p/terra-formars-blu-ray/12032961/', year: 2016 },
  { title: 'Bullet Ballet', url: 'https://www.arrowfilms.com/p/bullet-ballet-blu-ray/10853083/', year: 1998 },
  { title: 'In the Aftermath', url: 'https://www.arrowfilms.com/p/in-the-aftermath-blu-ray/12053057/', year: 1988 },
  { title: 'The Invisible Man Appears', url: 'https://www.arrowfilms.com/p/the-invisible-man-appears-the-invisible-man-vs-the-human-fly-blu-ray/12767969/', year: 1949 },
  { title: 'Tomorrow I\'ll Wake Up and Scald Myself with Tea', url: 'https://www.arrowfilms.com/p/tomorrow-ill-wake-up-and-scald-myself-with-tea-dvd/12771563/', year: 1977 },
];

// ============= Safe Film Matching =============

/**
 * Find an Arrow film by title, with optional year disambiguation.
 * Returns null if ambiguous (multiple matches without year to disambiguate).
 */
export function getArrowFilm(filmTitle: string, year?: number | null): CatalogFilm | null {
  const candidates = ARROW_SF_FILMS.filter(film => matchesTitle(filmTitle, film));
  
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  
  // Multiple matches - try to disambiguate by year
  if (year) {
    const exactYear = candidates.find(c => c.year === year);
    if (exactYear) return exactYear;
  }
  
  // Ambiguous - return null to avoid false positive
  return null;
}

export function isArrowFilm(filmTitle: string, year?: number | null): boolean {
  return getArrowFilm(filmTitle, year) !== null;
}

export function getArrowPurchaseUrl(filmTitle: string, year?: number | null): string {
  const film = getArrowFilm(filmTitle, year);
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
export function getArrowBrowseUrl(): string {
  return 'https://www.arrowfilms.com/c/genre/sci-fi/';
}
