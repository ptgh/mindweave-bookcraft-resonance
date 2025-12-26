/**
 * Streaming Link Utilities
 * Handles Apple TV, Criterion, and YouTube link generation with hybrid approach:
 * - Use verified deep links when available
 * - Fall back to search URLs for reliability
 */

// Known valid Criterion film IDs (numeric IDs from criterion.com/films/{id}-{slug})
export const CRITERION_FILM_IDS: Record<string, number> = {
  'solaris': 27867,
  'stalker': 1306,
  '2001: a space odyssey': 41, // Not actually in Criterion, kept for reference
  'a clockwork orange': 45, // Not in Criterion
  'fahrenheit 451': 8283,
  'planet of the apes': 32316,
  'videodrome': 248,
  'scanners': 712,
  'the fly': 730,
  'robocop': 875,
  'brazil': 51,
  'twelve monkeys': 1029,
  'la jetée': 362,
  'godzilla': 594,
  'the man who fell to earth': 304,
  'repo man': 617,
  'tetsuo': 1041,
  'world on a wire': 27493,
  'fantastic planet': 820,
  'eolomea': 30050,
  'invasion of the body snatchers': 783, // 1978 version
  'things to come': 326,
};

// Generate reliable external links with hybrid approach
export function getAppleTVLink(filmTitle: string, storedUrl?: string | null): string {
  // Check if stored URL looks valid (has proper movie ID format)
  if (storedUrl && isValidAppleTVUrl(storedUrl)) {
    return storedUrl;
  }
  // Fallback to search URL - always works
  return `https://tv.apple.com/search?term=${encodeURIComponent(filmTitle)}`;
}

export function getCriterionLink(filmTitle: string, storedUrl?: string | null): string {
  // Check if stored URL is a direct film page (not browse page)
  if (storedUrl && storedUrl.includes('/films/')) {
    return storedUrl;
  }
  
  // Check our known IDs
  const filmLower = filmTitle.toLowerCase();
  const knownId = CRITERION_FILM_IDS[filmLower];
  if (knownId) {
    const slug = filmLower.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `https://www.criterion.com/films/${knownId}-${slug}`;
  }
  
  // Fallback to search URL
  return `https://www.criterion.com/search#stq=${encodeURIComponent(filmTitle)}`;
}

export function getYouTubeTrailerLink(filmTitle: string, storedUrl?: string | null): string | null {
  // Check if stored URL is valid YouTube video
  if (storedUrl) {
    const videoId = extractYouTubeId(storedUrl);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
  }
  // Return null - component will show search fallback
  return null;
}

export function getYouTubeSearchUrl(filmTitle: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(filmTitle + ' official trailer')}&sp=EgIQAQ%253D%253D`;
}

export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

function isValidAppleTVUrl(url: string): boolean {
  // Valid Apple TV URLs have format: https://tv.apple.com/movie/{title}/umc.cmc.{long_alphanumeric_id}
  // Fake ones have short IDs like umc.cmc.clockwork or umc.cmc.prestige
  const match = url.match(/umc\.cmc\.([a-z0-9]+)$/i);
  if (!match) return false;
  // Valid IDs are at least 20 characters
  return match[1].length >= 20;
}

// Check if a streaming service should show for a film
export function hasValidStreamingLink(streaming: Record<string, string> | null, service: 'apple' | 'criterion'): boolean {
  if (!streaming) return false;
  const url = streaming[service];
  if (!url) return false;
  
  if (service === 'apple') {
    return isValidAppleTVUrl(url);
  }
  if (service === 'criterion') {
    return url.includes('/films/');
  }
  return false;
}

// Films known to be in Criterion Collection SF genre
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
  "The Andromeda Strain",
  'Westworld',
  'Dark Star',
  'Logan\'s Run',
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
