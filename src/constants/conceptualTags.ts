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

/**
 * One-line descriptions for each conceptual tag, used in EntityCard tooltips
 */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  "Cyberpunk": "High tech, low life — advanced technology amid societal decay and corporate control",
  "Post-Cyberpunk": "Beyond cyberpunk's nihilism — technology as tool for social change and hope",
  "Space Opera": "Epic interstellar narratives spanning galaxies, empires and civilisations",
  "Hard Science Fiction": "Rigorous scientific accuracy driving plot, world-building and speculation",
  "Biopunk": "Biotechnology, genetic engineering and organic systems reshaping humanity",
  "Golden Age": "The optimistic era of Asimov, Clarke and Heinlein — big ideas, boundless futures",
  "Block Universe Compatible": "Time as a fixed four-dimensional structure where past, present and future coexist",
  "Time Dilation": "Relativistic time distortion — seconds for travellers, centuries for civilisation",
  "Chrono Loops": "Recursive temporal structures, time loops and paradoxes of causality",
  "Technological Shamanism": "Mystical or spiritual dimensions emerging from advanced technology",
  "Utopian Collapse": "Perfect societies fracturing under the weight of their own ideals",
  "Mega-Corporate Systems": "Corporations as sovereign powers — commerce replacing governance",
  "Off-Earth Civilisations": "Human or alien societies beyond Earth — colonies, stations, generation ships",
  "Dystopian Systems": "Oppressive regimes, surveillance states and controlled societies",
  "Nonlinear Structure": "Fragmented, recursive or multi-threaded narrative architectures",
  "Dream Logic": "Surreal, oneiric storytelling where reality bends to subconscious rules",
  "Archive-Based": "Stories told through documents, records, logs and found materials",
  "Memory Distortion": "Unreliable recall, implanted memories and the fragility of identity",
  "Cybernetic Enhancement": "Human-machine fusion — augmentation, prosthetics and transhumanism",
  "Quantum Consciousness": "Mind and quantum mechanics intertwined — observer effects on reality",
  "Neural Interface": "Direct brain-computer connections — jacking in, mind uploading, digital consciousness",
  "Posthuman Evolution": "Beyond homo sapiens — species transformation through technology or biology",
};

/**
 * Author-to-genre fallback mapping for books without tags
 */
export const AUTHOR_GENRE_MAP: Record<string, string> = {
  "Philip K. Dick": "Cyberpunk",
  "William Gibson": "Cyberpunk",
  "Bruce Sterling": "Cyberpunk",
  "Neal Stephenson": "Post-Cyberpunk",
  "George Orwell": "Dystopian Systems",
  "Aldous Huxley": "Dystopian Systems",
  "Margaret Atwood": "Dystopian Systems",
  "Ray Bradbury": "Dystopian Systems",
  "Yevgeny Zamyatin": "Dystopian Systems",
  "Arthur C. Clarke": "Hard Science Fiction",
  "Stanislaw Lem": "Hard Science Fiction",
  "Greg Egan": "Hard Science Fiction",
  "Kim Stanley Robinson": "Hard Science Fiction",
  "Peter Watts": "Hard Science Fiction",
  "Liu Cixin": "Hard Science Fiction",
  "Isaac Asimov": "Golden Age",
  "Robert A. Heinlein": "Golden Age",
  "Frank Herbert": "Space Opera",
  "Iain M. Banks": "Space Opera",
  "Dan Simmons": "Space Opera",
  "Joe Haldeman": "Space Opera",
  "Ursula K. Le Guin": "Space Opera",
  "Alastair Reynolds": "Space Opera",
  "Vernor Vinge": "Space Opera",
  "Octavia E. Butler": "Biopunk",
  "Jeff VanderMeer": "Biopunk",
  "J.G. Ballard": "Dream Logic",
  "Kurt Vonnegut": "Nonlinear Structure",
  "Ted Chiang": "Hard Science Fiction",
  "Cormac McCarthy": "Dystopian Systems",
  "Anthony Burgess": "Dystopian Systems",
};
