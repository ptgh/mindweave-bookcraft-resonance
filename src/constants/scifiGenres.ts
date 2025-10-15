// Science Fiction Genre Taxonomy
// Comprehensive categorization of SF subgenres with metadata

export interface SciFiGenre {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  timeAssociations: {
    startYear: number;
    endYear?: number;
    peakYear?: number;
  };
  color: string; // HSL color for badges
  emoji: string;
  keywords: string[]; // For inference from nodes/tags
}

export const SF_GENRES: SciFiGenre[] = [
  {
    id: 'hard_sf',
    name: 'Hard SF',
    description: 'Rigorous scientific accuracy and technical detail',
    characteristics: ['Scientific plausibility', 'Technical detail', 'Physics-based speculation'],
    timeAssociations: { startYear: 1940, peakYear: 1980 },
    color: 'hsl(210, 70%, 60%)', // Blue
    emoji: '⚛️',
    keywords: ['physics', 'engineering', 'science', 'technical', 'hard science']
  },
  {
    id: 'space_opera',
    name: 'Space Opera',
    description: 'Epic scale galactic adventures and space civilizations',
    characteristics: ['Galactic empires', 'Space battles', 'Interstellar politics'],
    timeAssociations: { startYear: 1920, peakYear: 1950 },
    color: 'hsl(280, 70%, 65%)', // Purple
    emoji: '🚀',
    keywords: ['space empire', 'galactic', 'interstellar', 'star wars', 'space fleet']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High tech, low life - near-future urban dystopias',
    characteristics: ['Megacorporations', 'Hackers', 'Neural implants', 'Urban decay'],
    timeAssociations: { startYear: 1980, peakYear: 1995 },
    color: 'hsl(300, 80%, 50%)', // Neon magenta
    emoji: '🌃',
    keywords: ['cyberpunk', 'hacker', 'neural', 'cyber', 'megacorp', 'dystopia']
  },
  {
    id: 'post_cyberpunk',
    name: 'Post-Cyberpunk',
    description: 'Optimistic tech futures, social transformation',
    characteristics: ['Technology as solution', 'Social systems', 'Positive futures'],
    timeAssociations: { startYear: 1998, peakYear: 2010 },
    color: 'hsl(190, 70%, 55%)', // Cyan
    emoji: '🔮',
    keywords: ['transhumanism', 'singularity', 'augmentation', 'post-human']
  },
  {
    id: 'new_wave',
    name: 'New Wave',
    description: 'Literary experimental SF with soft sciences',
    characteristics: ['Experimental prose', 'Psychology', 'Soft sciences', 'Social commentary'],
    timeAssociations: { startYear: 1960, endYear: 1980, peakYear: 1968 },
    color: 'hsl(45, 80%, 60%)', // Gold
    emoji: '🌊',
    keywords: ['experimental', 'psychological', 'literary', 'consciousness']
  },
  {
    id: 'military_sf',
    name: 'Military SF',
    description: 'Warfare, tactics, and military culture in space',
    characteristics: ['Combat', 'Military hierarchy', 'Tactics', 'War technology'],
    timeAssociations: { startYear: 1959, peakYear: 1990 },
    color: 'hsl(0, 60%, 50%)', // Military red
    emoji: '⚔️',
    keywords: ['military', 'war', 'combat', 'soldier', 'fleet', 'tactical']
  },
  {
    id: 'biopunk',
    name: 'Biopunk',
    description: 'Genetic engineering and biological modification',
    characteristics: ['Genetic modification', 'Biotech', 'Body horror', 'Evolution'],
    timeAssociations: { startYear: 1990, peakYear: 2010 },
    color: 'hsl(120, 60%, 45%)', // Bio green
    emoji: '🧬',
    keywords: ['genetic', 'biotech', 'clone', 'mutation', 'dna', 'evolution']
  },
  {
    id: 'climate_fiction',
    name: 'Climate Fiction',
    description: 'Environmental collapse and climate change futures',
    characteristics: ['Climate change', 'Ecological disaster', 'Environmental themes'],
    timeAssociations: { startYear: 2000, peakYear: 2020 },
    color: 'hsl(85, 50%, 45%)', // Earth green
    emoji: '🌍',
    keywords: ['climate', 'environment', 'ecology', 'apocalypse', 'greenhouse']
  },
  {
    id: 'time_travel',
    name: 'Time Travel',
    description: 'Temporal mechanics and paradoxes',
    characteristics: ['Causality', 'Paradoxes', 'Temporal mechanics', 'History alteration'],
    timeAssociations: { startYear: 1895, peakYear: 1960 },
    color: 'hsl(270, 60%, 55%)', // Temporal purple
    emoji: '⏰',
    keywords: ['time travel', 'temporal', 'paradox', 'time machine', 'causality']
  },
  {
    id: 'post_apocalyptic',
    name: 'Post-Apocalyptic',
    description: 'Survival after civilization collapse',
    characteristics: ['Ruins', 'Survival', 'Societal collapse', 'Rebuilding'],
    timeAssociations: { startYear: 1950, peakYear: 2015 },
    color: 'hsl(30, 50%, 40%)', // Wasteland brown
    emoji: '☢️',
    keywords: ['apocalypse', 'wasteland', 'survival', 'collapse', 'ruins', 'nuclear']
  },
  {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Humanity encounters alien intelligence',
    characteristics: ['Xenobiology', 'Communication', 'Cultural exchange', 'Aliens'],
    timeAssociations: { startYear: 1950, peakYear: 1980 },
    color: 'hsl(160, 60%, 50%)', // Alien green
    emoji: '👽',
    keywords: ['alien', 'contact', 'xenobiology', 'extraterrestrial', 'communication']
  },
  {
    id: 'solarpunk',
    name: 'Solarpunk',
    description: 'Optimistic sustainable futures',
    characteristics: ['Renewable energy', 'Sustainability', 'Green technology', 'Hope'],
    timeAssociations: { startYear: 2010, peakYear: 2020 },
    color: 'hsl(65, 70%, 55%)', // Solar yellow-green
    emoji: '🌱',
    keywords: ['solar', 'sustainable', 'green tech', 'renewable', 'hopeful']
  },
  {
    id: 'virtual_reality',
    name: 'Virtual Reality',
    description: 'Simulated realities and digital consciousness',
    characteristics: ['Simulation', 'Digital worlds', 'VR', 'Matrix-like'],
    timeAssociations: { startYear: 1992, peakYear: 2015 },
    color: 'hsl(180, 80%, 60%)', // Digital cyan
    emoji: '🕶️',
    keywords: ['virtual reality', 'simulation', 'digital', 'vr', 'matrix', 'cyber']
  },
  {
    id: 'social_sf',
    name: 'Social SF',
    description: 'Explores social structures and cultural evolution',
    characteristics: ['Society', 'Politics', 'Culture', 'Social systems'],
    timeAssociations: { startYear: 1890, peakYear: 1960 },
    color: 'hsl(35, 65%, 55%)', // Amber
    emoji: '🏛️',
    keywords: ['society', 'utopia', 'dystopia', 'political', 'social', 'culture']
  },
  {
    id: 'philosophical_sf',
    name: 'Philosophical SF',
    description: 'Explores consciousness, reality, and existence',
    characteristics: ['Metaphysics', 'Consciousness', 'Reality', 'Existential'],
    timeAssociations: { startYear: 1950, peakYear: 1985 },
    color: 'hsl(255, 55%, 60%)', // Deep purple
    emoji: '🧠',
    keywords: ['consciousness', 'philosophy', 'metaphysics', 'reality', 'existential']
  }
];

// Helper to get genre by ID
export function getGenreById(id: string): SciFiGenre | undefined {
  return SF_GENRES.find(g => g.id === id);
}

// Get genres that were prominent in a given year
export function getGenresForYear(year: number): SciFiGenre[] {
  return SF_GENRES.filter(genre => {
    const { startYear, endYear } = genre.timeAssociations;
    if (endYear) {
      return year >= startYear && year <= endYear;
    }
    return year >= startYear;
  }).sort((a, b) => {
    // Sort by how close to peak year
    const aDiff = Math.abs((a.timeAssociations.peakYear || a.timeAssociations.startYear) - year);
    const bDiff = Math.abs((b.timeAssociations.peakYear || b.timeAssociations.startYear) - year);
    return aDiff - bDiff;
  });
}

// Get era label for timeline grouping (keep for background organization)
export function getEraForYear(year: number): string {
  if (year >= 2100) return "Far Future";
  if (year >= 2050) return "Near Future";
  if (year >= 2000) return "Millennial Era";
  if (year >= 1980) return "Cyber Age";
  if (year >= 1960) return "New Wave Era";
  if (year >= 1940) return "Golden Age";
  if (year >= 1900) return "Proto SF";
  return "Early Speculation";
}
