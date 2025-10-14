// Advanced pattern recognition for book networks and reading habits

import { Transmission } from './transmissionsService';

export interface ThematicCluster {
  id: string;
  name: string;
  books: Transmission[];
  centralThemes: string[];
  strength: number;
  bridgeBooks: string[]; // Books that connect to other clusters
}

export interface ConceptualBridge {
  fromBook: Transmission;
  toBook: Transmission;
  bridgeType: 'thematic' | 'temporal' | 'stylistic' | 'philosophical';
  strength: number;
  sharedConcepts: string[];
  explanation: string;
}

export interface ReadingPattern {
  type: 'chronological' | 'thematic_deep_dive' | 'author_exploration' | 'genre_hopping' | 'eclectic';
  confidence: number;
  description: string;
  evidence: string[];
}

export interface InfluenceMap {
  authorId: string;
  authorName: string;
  influences: Array<{
    authorName: string;
    strength: number;
    evidence: string[];
  }>;
  influenced: Array<{
    authorName: string;
    strength: number;
  }>;
}

export interface ReadingVelocity {
  booksPerMonth: number;
  trend: 'accelerating' | 'steady' | 'decelerating';
  peakPeriod?: { start: Date; end: Date; count: number };
  averageTimeBetweenBooks: number; // in days
  momentum: number; // 0-1 score
}

export interface ClusterHealth {
  clusterId: string;
  name: string;
  bookCount: number;
  diversity: number; // 0-1, based on author diversity
  recency: number; // 0-1, how recently books were added
  growth: 'expanding' | 'stable' | 'dormant';
  healthScore: number; // 0-1 overall health
}

export interface ThematicConstellation {
  name: string;
  centralThemes: string[];
  satellites: string[]; // Related but peripheral themes
  books: Transmission[];
  density: number; // How tightly interconnected
  uniqueness: number; // How distinct from other constellations
}

export interface ReadingDNA {
  genreProfile: { genre: string; percentage: number }[];
  temporalPreference: 'classic' | 'modern' | 'mixed' | 'contemporary';
  diversityScore: number; // 0-1
  explorationScore: number; // 0-1, willingness to try new things
  consistencyScore: number; // 0-1, sticking to favorites
  signature: string; // A unique descriptor
}

export class PatternRecognitionService {
  
  // Detect thematic clusters using tag co-occurrence and semantic similarity
  detectThematicClusters(transmissions: Transmission[]): ThematicCluster[] {
    const clusters: ThematicCluster[] = [];
    const tagGroups = new Map<string, Transmission[]>();
    
    // Group books by tags
    transmissions.forEach(book => {
      book.tags.forEach(tag => {
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(book);
      });
    });
    
    // Create clusters from significant tag groups
    Array.from(tagGroups.entries())
      .filter(([_, books]) => books.length >= 2)
      .forEach(([tag, books]) => {
        // Find other tags that commonly co-occur
        const relatedTags = this.findRelatedTags(tag, books);
        
        // Identify bridge books (books that connect to other clusters)
        const bridgeBooks = books
          .filter(book => book.tags.length > 3)
          .map(book => book.title);
        
        clusters.push({
          id: `cluster-${tag.toLowerCase().replace(/\s+/g, '-')}`,
          name: tag,
          books,
          centralThemes: [tag, ...relatedTags.slice(0, 2)],
          strength: this.calculateClusterStrength(books),
          bridgeBooks
        });
      });
    
    return clusters.sort((a, b) => b.strength - a.strength);
  }
  
  // Identify conceptual bridges between books
  identifyConceptualBridges(transmissions: Transmission[]): ConceptualBridge[] {
    const bridges: ConceptualBridge[] = [];
    
    for (let i = 0; i < transmissions.length; i++) {
      for (let j = i + 1; j < transmissions.length; j++) {
        const bridge = this.analyzeBridge(transmissions[i], transmissions[j]);
        if (bridge && bridge.strength > 0.3) {
          bridges.push(bridge);
        }
      }
    }
    
    return bridges.sort((a, b) => b.strength - a.strength).slice(0, 20);
  }
  
  // Analyze reading patterns
  analyzeReadingPatterns(transmissions: Transmission[]): ReadingPattern[] {
    const patterns: ReadingPattern[] = [];
    
    // Chronological pattern
    const chronologicalScore = this.detectChronologicalPattern(transmissions);
    if (chronologicalScore > 0.3) {
      patterns.push({
        type: 'chronological',
        confidence: chronologicalScore,
        description: 'You tend to read books in chronological order, following historical progression',
        evidence: this.getChronologicalEvidence(transmissions)
      });
    }
    
    // Thematic deep dive
    const thematicScore = this.detectThematicPattern(transmissions);
    if (thematicScore > 0.4) {
      patterns.push({
        type: 'thematic_deep_dive',
        confidence: thematicScore,
        description: 'You explore themes deeply, reading multiple books on similar topics',
        evidence: this.getThematicEvidence(transmissions)
      });
    }
    
    // Author exploration
    const authorScore = this.detectAuthorPattern(transmissions);
    if (authorScore > 0.3) {
      patterns.push({
        type: 'author_exploration',
        confidence: authorScore,
        description: 'You tend to explore multiple works by the same authors',
        evidence: this.getAuthorEvidence(transmissions)
      });
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Map author influences based on reading order and thematic connections
  mapAuthorInfluences(transmissions: Transmission[]): InfluenceMap[] {
    const authorBooks = new Map<string, Transmission[]>();
    
    transmissions.forEach(book => {
      if (!authorBooks.has(book.author)) {
        authorBooks.set(book.author, []);
      }
      authorBooks.get(book.author)!.push(book);
    });
    
    const influenceMaps: InfluenceMap[] = [];
    
    authorBooks.forEach((books, author) => {
      const influences = this.detectInfluences(author, books, transmissions);
      
      if (influences.length > 0) {
        influenceMaps.push({
          authorId: author.toLowerCase().replace(/\s+/g, '-'),
          authorName: author,
          influences,
          influenced: [] // Could be calculated based on reading order
        });
      }
    });
    
    return influenceMaps;
  }
  
  // Private helper methods
  
  private findRelatedTags(mainTag: string, books: Transmission[]): string[] {
    const tagCounts = new Map<string, number>();
    
    books.forEach(book => {
      book.tags.forEach(tag => {
        if (tag !== mainTag) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 3);
  }
  
  private calculateClusterStrength(books: Transmission[]): number {
    // Strength based on number of books, tag overlap, and recency
    const sizeScore = Math.min(books.length / 10, 1);
    const tagOverlapScore = this.calculateTagOverlap(books);
    return (sizeScore + tagOverlapScore) / 2;
  }
  
  private calculateTagOverlap(books: Transmission[]): number {
    if (books.length < 2) return 0;
    
    const allTags = books.flatMap(b => b.tags);
    const uniqueTags = new Set(allTags);
    
    return 1 - (uniqueTags.size / allTags.length);
  }
  
  private analyzeBridge(book1: Transmission, book2: Transmission): ConceptualBridge | null {
    const sharedTags = book1.tags.filter(tag => book2.tags.includes(tag));
    
    if (sharedTags.length === 0) return null;
    
    const strength = sharedTags.length / Math.max(book1.tags.length, book2.tags.length);
    
    let bridgeType: ConceptualBridge['bridgeType'] = 'thematic';
    let explanation = `Connected through ${sharedTags.join(', ')}`;
    
    // Check for temporal bridge
    if (book1.publication_year && book2.publication_year) {
      const yearDiff = Math.abs(book1.publication_year - book2.publication_year);
      if (yearDiff < 5) {
        bridgeType = 'temporal';
        explanation = `Contemporary works from similar era (${Math.min(book1.publication_year, book2.publication_year)}s)`;
      }
    }
    
    return {
      fromBook: book1,
      toBook: book2,
      bridgeType,
      strength,
      sharedConcepts: sharedTags,
      explanation
    };
  }
  
  private detectChronologicalPattern(transmissions: Transmission[]): number {
    const booksWithYears = transmissions.filter(t => t.publication_year);
    if (booksWithYears.length < 3) return 0;
    
    const sorted = [...booksWithYears].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    let chronologicalPairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i].publication_year || 0) >= (sorted[i-1].publication_year || 0)) {
        chronologicalPairs++;
      }
    }
    
    return chronologicalPairs / (sorted.length - 1);
  }
  
  private detectThematicPattern(transmissions: Transmission[]): number {
    const clusters = this.detectThematicClusters(transmissions);
    const booksInClusters = new Set(clusters.flatMap(c => c.books.map(b => b.id)));
    return booksInClusters.size / transmissions.length;
  }
  
  private detectAuthorPattern(transmissions: Transmission[]): number {
    const authorCounts = new Map<string, number>();
    transmissions.forEach(t => {
      authorCounts.set(t.author, (authorCounts.get(t.author) || 0) + 1);
    });
    
    const multiBookAuthors = Array.from(authorCounts.values()).filter(count => count > 1);
    return multiBookAuthors.length / authorCounts.size;
  }
  
  private getChronologicalEvidence(transmissions: Transmission[]): string[] {
    const sorted = transmissions
      .filter(t => t.publication_year)
      .sort((a, b) => (a.publication_year || 0) - (b.publication_year || 0));
    
    return sorted.slice(0, 3).map(t => 
      `${t.title} (${t.publication_year})`
    );
  }
  
  private getThematicEvidence(transmissions: Transmission[]): string[] {
    const clusters = this.detectThematicClusters(transmissions);
    return clusters.slice(0, 2).map(c => 
      `${c.name}: ${c.books.length} books`
    );
  }
  
  private getAuthorEvidence(transmissions: Transmission[]): string[] {
    const authorCounts = new Map<string, number>();
    transmissions.forEach(t => {
      authorCounts.set(t.author, (authorCounts.get(t.author) || 0) + 1);
    });
    
    return Array.from(authorCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([author, count]) => `${author}: ${count} books`);
  }
  
  private detectInfluences(
    targetAuthor: string,
    authorBooks: Transmission[],
    allTransmissions: Transmission[]
  ): Array<{ authorName: string; strength: number; evidence: string[] }> {
    const influences: Map<string, { count: number; sharedThemes: Set<string> }> = new Map();
    
    const authorTags = new Set(authorBooks.flatMap(b => b.tags));
    
    allTransmissions.forEach(book => {
      if (book.author !== targetAuthor) {
        const sharedTags = book.tags.filter(tag => authorTags.has(tag));
        if (sharedTags.length > 0) {
          if (!influences.has(book.author)) {
            influences.set(book.author, { count: 0, sharedThemes: new Set() });
          }
          const inf = influences.get(book.author)!;
          inf.count++;
          sharedTags.forEach(tag => inf.sharedThemes.add(tag));
        }
      }
    });
    
    return Array.from(influences.entries())
      .map(([author, data]) => ({
        authorName: author,
        strength: data.count / authorBooks.length,
        evidence: Array.from(data.sharedThemes).slice(0, 3)
      }))
      .filter(inf => inf.strength > 0.2)
      .sort((a, b) => b.strength - a.strength);
  }

  // Enhanced Pattern Recognition Features

  calculateReadingVelocity(transmissions: Transmission[]): ReadingVelocity | null {
    if (transmissions.length < 2) return null;

    const sortedBooks = [...transmissions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstDate = new Date(sortedBooks[0].created_at);
    const lastDate = new Date(sortedBooks[sortedBooks.length - 1].created_at);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = daysDiff / 30;

    const booksPerMonth = transmissions.length / Math.max(monthsDiff, 0.1);

    // Calculate recent vs older velocity to determine trend
    const midpoint = Math.floor(sortedBooks.length / 2);
    const recentBooks = sortedBooks.slice(midpoint);
    const olderBooks = sortedBooks.slice(0, midpoint);

    const recentVelocity = recentBooks.length / Math.max(
      (new Date(recentBooks[recentBooks.length - 1].created_at).getTime() - 
       new Date(recentBooks[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30), 
      0.1
    );

    const olderVelocity = olderBooks.length / Math.max(
      (new Date(olderBooks[olderBooks.length - 1].created_at).getTime() - 
       new Date(olderBooks[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30), 
      0.1
    );

    const trend = recentVelocity > olderVelocity * 1.2 ? 'accelerating' : 
                  recentVelocity < olderVelocity * 0.8 ? 'decelerating' : 'steady';

    const averageTimeBetweenBooks = daysDiff / (transmissions.length - 1);
    
    // Momentum based on recency and velocity
    const recentActivity = transmissions.filter(t => 
      (Date.now() - new Date(t.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000
    ).length;
    const momentum = Math.min(recentActivity / 5, 1); // Cap at 1

    return {
      booksPerMonth: Number(booksPerMonth.toFixed(2)),
      trend,
      averageTimeBetweenBooks: Number(averageTimeBetweenBooks.toFixed(1)),
      momentum: Number(momentum.toFixed(2))
    };
  }

  analyzeClusterHealth(clusters: ThematicCluster[]): ClusterHealth[] {
    return clusters.map(cluster => {
      const uniqueAuthors = new Set(cluster.books.map(b => b.author)).size;
      const diversity = uniqueAuthors / cluster.books.length;

      const recentBooks = cluster.books.filter(b => 
        (Date.now() - new Date(b.created_at).getTime()) < 90 * 24 * 60 * 60 * 1000
      );
      const recency = recentBooks.length / cluster.books.length;

      const sortedByDate = [...cluster.books].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const midpoint = Math.floor(sortedByDate.length / 2);
      const recentHalf = sortedByDate.slice(midpoint);
      const olderHalf = sortedByDate.slice(0, midpoint);
      
      const growth: 'expanding' | 'stable' | 'dormant' = 
        recentHalf.length > olderHalf.length * 1.3 ? 'expanding' :
        recentHalf.length < olderHalf.length * 0.7 ? 'dormant' : 'stable';

      const healthScore = (diversity * 0.3 + recency * 0.4 + cluster.strength * 0.3);

      return {
        clusterId: cluster.name.toLowerCase().replace(/\s+/g, '_'),
        name: cluster.name,
        bookCount: cluster.books.length,
        diversity: Number(diversity.toFixed(2)),
        recency: Number(recency.toFixed(2)),
        growth,
        healthScore: Number(healthScore.toFixed(2))
      };
    }).sort((a, b) => b.healthScore - a.healthScore);
  }

  mapThematicConstellations(transmissions: Transmission[]): ThematicConstellation[] {
    const tagFrequency = new Map<string, number>();
    transmissions.forEach(t => {
      t.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    const coreThemes = Array.from(tagFrequency.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    const constellations: ThematicConstellation[] = [];

    coreThemes.forEach(coreTheme => {
      const coreBooks = transmissions.filter(t => t.tags.includes(coreTheme));
      
      const relatedTags = new Map<string, number>();
      coreBooks.forEach(book => {
        book.tags.forEach(tag => {
          if (tag !== coreTheme) {
            relatedTags.set(tag, (relatedTags.get(tag) || 0) + 1);
          }
        });
      });

      const satellites = Array.from(relatedTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      const constellationBooks = transmissions.filter(t => 
        t.tags.includes(coreTheme) || satellites.some(sat => t.tags.includes(sat))
      );

      const density = constellationBooks.length / transmissions.length;
      const uniqueness = 1 - (satellites.filter(s => coreThemes.includes(s)).length / satellites.length);

      constellations.push({
        name: coreTheme,
        centralThemes: [coreTheme],
        satellites,
        books: constellationBooks,
        density: Number(density.toFixed(2)),
        uniqueness: Number(uniqueness.toFixed(2))
      });
    });

    return constellations.sort((a, b) => b.books.length - a.books.length);
  }

  generateReadingDNA(transmissions: Transmission[]): ReadingDNA | null {
    if (transmissions.length < 5) return null;

    // Genre distribution
    const genreCount = new Map<string, number>();
    transmissions.forEach(t => {
      t.tags.forEach(tag => {
        genreCount.set(tag, (genreCount.get(tag) || 0) + 1);
      });
    });

    const totalTags = Array.from(genreCount.values()).reduce((a, b) => a + b, 0);
    const genreProfile = Array.from(genreCount.entries())
      .map(([genre, count]) => ({
        genre,
        percentage: Number(((count / totalTags) * 100).toFixed(1))
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Temporal preference
    const years = transmissions
      .filter(t => t.publication_year)
      .map(t => t.publication_year!);
    
    const avgYear = years.reduce((a, b) => a + b, 0) / years.length;
    const temporalPreference = 
      avgYear < 1970 ? 'classic' :
      avgYear < 2000 ? 'modern' :
      avgYear < 2015 ? 'contemporary' : 'mixed';

    // Diversity score
    const uniqueAuthors = new Set(transmissions.map(t => t.author)).size;
    const diversityScore = Math.min(uniqueAuthors / transmissions.length, 1);

    // Exploration vs consistency
    const topGenreCount = Math.max(...Array.from(genreCount.values()));
    const consistencyScore = topGenreCount / transmissions.length;
    const explorationScore = 1 - consistencyScore;

    // Generate signature
    const topGenres = genreProfile.slice(0, 3).map(g => g.genre);
    const signature = `${temporalPreference}-${topGenres.join('-')}-explorer`.toLowerCase();

    return {
      genreProfile,
      temporalPreference,
      diversityScore: Number(diversityScore.toFixed(2)),
      explorationScore: Number(explorationScore.toFixed(2)),
      consistencyScore: Number(consistencyScore.toFixed(2)),
      signature
    };
  }
}

export const patternRecognitionService = new PatternRecognitionService();
