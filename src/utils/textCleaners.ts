/**
 * Unified text cleaning and normalization utilities.
 * Use these across the app to ensure consistent matching and display.
 */

/**
 * Normalize a title for comparison/matching:
 * - lowercase
 * - remove leading articles (the, a, an)
 * - strip punctuation
 * - collapse whitespace
 */
export function normalizeTitle(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean a person name (author, director, etc.) for display and matching:
 * - Remove non-Latin script characters (Bengali, etc.)
 * - Remove parenthetical notes
 * - Normalize separators (or, and, ,)
 * - Clean up extra spaces
 */
export function cleanPersonName(name: string): string {
  if (!name) return "";
  
  return name
    .replace(/[\u0980-\u09FF]+/g, "") // Remove Bengali characters
    .replace(/[\u0900-\u097F]+/g, "") // Remove Devanagari (Hindi)
    .replace(/[\u4E00-\u9FFF]+/g, "") // Remove CJK characters
    .replace(/\s*\([^)]*\)\s*/g, " ") // Remove parenthetical notes
    .replace(/\s+(or|and|,)\s+/gi, ", ") // Normalize separators
    .replace(/[^\w\s,.''-]/g, "") // Keep only alphanumeric, spaces, common punctuation
    .replace(/\s+/g, " ") // Clean up extra spaces
    .trim();
}

/**
 * Clean and normalize ISBN for matching:
 * - Remove hyphens and spaces
 * - Lowercase (for ISBN-10 with X check digit)
 */
export function cleanIsbn(isbn: string): string {
  if (!isbn) return "";
  return isbn.replace(/[-\s]/g, "").toLowerCase();
}

/**
 * Normalize text for fuzzy matching (general purpose):
 * - lowercase
 * - remove punctuation
 * - normalize whitespace
 */
export function normalizeForMatching(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate text with ellipsis, preferring to break at comma or space
 */
export function truncateWithBreak(text: string, maxLength: number = 30): { display: string; full: string } {
  const cleaned = cleanPersonName(text);
  if (cleaned.length <= maxLength) {
    return { display: cleaned, full: cleaned };
  }
  
  // Find a good break point (comma or space)
  const breakPoint = cleaned.lastIndexOf(",", maxLength) > 10
    ? cleaned.lastIndexOf(",", maxLength)
    : cleaned.lastIndexOf(" ", maxLength);
    
  return {
    display: cleaned.substring(0, breakPoint > 10 ? breakPoint : maxLength) + "...",
    full: cleaned
  };
}

/**
 * Calculate simple Jaccard-like similarity for short strings (0-1)
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeForMatching(str1);
  const norm2 = normalizeForMatching(str2);
  
  if (norm1 === norm2) return 1;
  if (!norm1 || !norm2) return 0;

  const words1 = new Set(norm1.split(" "));
  const words2 = new Set(norm2.split(" "));

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  const jaccardSim = intersection / union;

  // Also check for substring containment
  const containsBonus = norm1.includes(norm2) || norm2.includes(norm1) ? 0.2 : 0;

  return Math.min(1, jaccardSim + containsBonus);
}
