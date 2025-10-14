/**
 * Official Conceptual Tags used throughout the system
 * These are the ONLY tags used for pattern recognition, neural map connections, and display
 */
export const CONCEPTUAL_TAGS = [
  // Sci-Fi Genres & Movements
  "Cyberpunk",
  "Post-Cyberpunk",
  "Space Opera",
  "Hard Science Fiction",
  "Biopunk",
  "Golden Age",
  
  // Temporal Themes
  "Block Universe Compatible",
  "Time Dilation",
  "Chrono Loops",
  "Technological Shamanism",
  
  // World Structures
  "Utopian Collapse",
  "Mega-Corporate Systems",
  "Off-Earth Civilisations",
  "Dystopian Systems",
  
  // Narrative Form
  "Nonlinear Structure",
  "Dream Logic",
  "Archive-Based",
  "Memory Distortion",
  
  // Sci-Fi Elements
  "Cybernetic Enhancement",
  "Quantum Consciousness",
  "Neural Interface",
  "Posthuman Evolution"
] as const;

/**
 * Strip emojis from a tag string
 */
const stripEmojis = (str: string): string => {
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE00}-\u{FE0F}]/gu, '').trim();
};

/**
 * Filter tags to only include official conceptual tags
 * Strips emojis before comparing to handle legacy data
 */
export const filterConceptualTags = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(tag => stripEmojis(tag))
    .filter(tag => tag && CONCEPTUAL_TAGS.includes(tag as any));
};
