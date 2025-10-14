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
 * Filter tags to only include official conceptual tags
 */
export const filterConceptualTags = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags.filter(tag => CONCEPTUAL_TAGS.includes(tag as any));
};
