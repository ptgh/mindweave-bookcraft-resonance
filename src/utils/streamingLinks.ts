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

// Known Criterion SF films for filtering
export const CRITERION_SF_FILMS = [
  'Solaris',
  'Stalker',
  'Fahrenheit 451',
  'Planet of the Apes',
  'Videodrome',
  'Scanners',
  'The Fly',
  'RoboCop',
  'Brazil',
  'Twelve Monkeys',
  'La Jetée',
  'Godzilla',
  'The Man Who Fell to Earth',
  'Repo Man',
  'Tetsuo: The Iron Man',
  'World on a Wire',
  'Fantastic Planet',
  'Eolomea',
  'Invasion of the Body Snatchers',
  'Things to Come',
  'The Blob',
  'The Day the Earth Stood Still',
  'Alphaville',
  'Seconds',
  'Quatermass and the Pit',
  'Silent Running',
  'The Andromeda Strain',
  'Westworld',
  'Dark Star',
  "Logan's Run",
  'The Incredible Shrinking Man',
  'The Time Machine',
  'War of the Worlds',
  'When Worlds Collide',
  'The Day of the Triffids',
  'Village of the Damned',
  'Phase IV',
  'Colossus: The Forbin Project',
  'THX 1138',
  'A Boy and His Dog',
  'Eraserhead',
  'Close Encounters of the Third Kind',
  'Alien',
  'Mad Max',
  'Escape from New York',
  'Blade Runner',
];

// Check if a film is in the Criterion Collection
export function isCriterionFilm(filmTitle: string): boolean {
  const normalizedTitle = filmTitle.toLowerCase().trim();
  return CRITERION_SF_FILMS.some(title => 
    title.toLowerCase() === normalizedTitle ||
    normalizedTitle.includes(title.toLowerCase()) ||
    title.toLowerCase().includes(normalizedTitle)
  );
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

// Criterion browse page
export function getCriterionBrowseUrl(): string {
  return 'https://www.criterion.com/shop/browse?genre=science-fiction';
}
