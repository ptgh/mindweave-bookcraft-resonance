// Genre Inference Service
// Infers SF genres from book metadata, tags, and publication year

import { SF_GENRES, SciFiGenre, getGenresForYear } from '@/constants/scifiGenres';

interface BookMetadata {
  title?: string;
  author?: string;
  tags?: string[];
  conceptualNodes?: string[];
  publicationYear?: number;
  notes?: string;
}

export class GenreInferenceService {
  /**
   * Infer primary genre from book metadata
   * Returns the most likely genre based on multiple signals
   */
  static inferGenre(metadata: BookMetadata): SciFiGenre | null {
    const scores = new Map<string, number>();

    // Initialize all genres with 0 score
    SF_GENRES.forEach(genre => scores.set(genre.id, 0));

    // Score based on conceptual nodes/tags (highest weight)
    const allNodes = [
      ...(metadata.tags || []),
      ...(metadata.conceptualNodes || [])
    ].map(t => t.toLowerCase());

    SF_GENRES.forEach(genre => {
      genre.keywords.forEach(keyword => {
        if (allNodes.some(node => node.includes(keyword.toLowerCase()))) {
          scores.set(genre.id, (scores.get(genre.id) || 0) + 3);
        }
      });
    });

    // Score based on publication year (medium weight)
    if (metadata.publicationYear) {
      const yearGenres = getGenresForYear(metadata.publicationYear);
      yearGenres.forEach((genre, index) => {
        // First genre gets 2 points, second gets 1
        const bonus = index === 0 ? 2 : (index === 1 ? 1 : 0.5);
        scores.set(genre.id, (scores.get(genre.id) || 0) + bonus);
      });
    }

    // Score based on title/notes keywords (lower weight)
    const textToSearch = [
      metadata.title || '',
      metadata.notes || ''
    ].join(' ').toLowerCase();

    SF_GENRES.forEach(genre => {
      genre.keywords.forEach(keyword => {
        if (textToSearch.includes(keyword.toLowerCase())) {
          scores.set(genre.id, (scores.get(genre.id) || 0) + 1);
        }
      });
    });

    // Find highest scoring genre
    let maxScore = 0;
    let topGenreId: string | null = null;

    scores.forEach((score, genreId) => {
      if (score > maxScore) {
        maxScore = score;
        topGenreId = genreId;
      }
    });

    // Only return if we have a reasonable confidence (score >= 2)
    if (topGenreId && maxScore >= 2) {
      return SF_GENRES.find(g => g.id === topGenreId) || null;
    }

    return null;
  }

  /**
   * Get all matching genres (for books that span multiple subgenres)
   */
  static inferAllGenres(metadata: BookMetadata): SciFiGenre[] {
    const scores = new Map<string, number>();

    // Initialize all genres with 0 score
    SF_GENRES.forEach(genre => scores.set(genre.id, 0));

    // Score based on conceptual nodes/tags
    const allNodes = [
      ...(metadata.tags || []),
      ...(metadata.conceptualNodes || [])
    ].map(t => t.toLowerCase());

    SF_GENRES.forEach(genre => {
      genre.keywords.forEach(keyword => {
        if (allNodes.some(node => node.includes(keyword.toLowerCase()))) {
          scores.set(genre.id, (scores.get(genre.id) || 0) + 3);
        }
      });
    });

    // Score based on publication year
    if (metadata.publicationYear) {
      const yearGenres = getGenresForYear(metadata.publicationYear);
      yearGenres.forEach((genre, index) => {
        const bonus = index === 0 ? 2 : (index === 1 ? 1 : 0.5);
        scores.set(genre.id, (scores.get(genre.id) || 0) + bonus);
      });
    }

    // Return all genres with score >= 2, sorted by score
    return SF_GENRES
      .filter(genre => (scores.get(genre.id) || 0) >= 2)
      .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
  }

  /**
   * Get genre badge text for display
   */
  static getGenreBadge(genre: SciFiGenre | null): string {
    if (!genre) return '';
    return `${genre.emoji} ${genre.name}`;
  }

  /**
   * Infer genre from conceptual nodes specifically
   */
  static inferFromNodes(nodes: string[]): SciFiGenre | null {
    const lowerNodes = nodes.map(n => n.toLowerCase());
    let maxMatches = 0;
    let bestGenre: SciFiGenre | null = null;

    SF_GENRES.forEach(genre => {
      const matches = genre.keywords.filter(keyword =>
        lowerNodes.some(node => node.includes(keyword.toLowerCase()))
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestGenre = genre;
      }
    });

    return maxMatches >= 1 ? bestGenre : null;
  }
}
