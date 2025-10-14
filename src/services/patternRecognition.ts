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
  trend: 'accelerating' | 'steady' | 'slowing';
  momentum: number; // 0-1 score
  projection: {
    nextMonthEstimate: number;
    confidence: number;
  };
}

export interface ClusterHealth {
  clusterId: string;
  vitality: number; // 0-1 score
  diversity: number; // 0-1 score
  connectivity: number; // average bridges per book
  growthPotential: string[];
}

export interface ThematicConstellation {
  id: string;
  centralTheme: string;
  satellites: string[]; // related themes
  intensity: number; // how strongly clustered
  evolution: 'emerging' | 'stable' | 'declining';
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
  
  // Advanced analytics methods
  
  calculateReadingVelocity(transmissions: Transmission[]): ReadingVelocity {
    if (transmissions.length < 2) {
      return {
        booksPerMonth: 0,
        trend: 'steady',
        momentum: 0,
        projection: { nextMonthEstimate: 0, confidence: 0 }
      };
    }
    
    const sorted = [...transmissions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstDate = new Date(sorted[0].created_at);
    const lastDate = new Date(sorted[sorted.length - 1].created_at);
    const monthsSpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    const booksPerMonth = monthsSpan > 0 ? transmissions.length / monthsSpan : 0;
    
    // Calculate trend by comparing first half vs second half
    const midpoint = Math.floor(transmissions.length / 2);
    const firstHalfRate = midpoint / ((new Date(sorted[midpoint].created_at).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const secondHalfRate = (transmissions.length - midpoint) / ((lastDate.getTime() - new Date(sorted[midpoint].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    let trend: 'accelerating' | 'steady' | 'slowing' = 'steady';
    if (secondHalfRate > firstHalfRate * 1.2) trend = 'accelerating';
    else if (secondHalfRate < firstHalfRate * 0.8) trend = 'slowing';
    
    const momentum = Math.min(secondHalfRate / (firstHalfRate || 1), 2) / 2;
    
    return {
      booksPerMonth: Math.round(booksPerMonth * 10) / 10,
      trend,
      momentum,
      projection: {
        nextMonthEstimate: Math.round(secondHalfRate * 10) / 10,
        confidence: transmissions.length >= 10 ? 0.8 : 0.5
      }
    };
  }
  
  analyzeClusterHealth(clusters: ThematicCluster[]): ClusterHealth[] {
    return clusters.map(cluster => {
      const vitality = Math.min(cluster.books.length / 10, 1);
      const diversity = cluster.centralThemes.length / 5;
      const connectivity = cluster.bridgeBooks.length / cluster.books.length;
      
      const growthPotential: string[] = [];
      if (vitality > 0.6) growthPotential.push('Strong thematic foundation');
      if (diversity > 0.5) growthPotential.push('Rich conceptual space');
      if (connectivity > 0.3) growthPotential.push('Well-connected to other themes');
      
      return {
        clusterId: cluster.id,
        vitality,
        diversity,
        connectivity,
        growthPotential
      };
    });
  }
  
  mapThematicConstellations(transmissions: Transmission[]): ThematicConstellation[] {
    const clusters = this.detectThematicClusters(transmissions);
    const constellations: ThematicConstellation[] = [];
    
    clusters.forEach(cluster => {
      const recentBooks = cluster.books.filter(b => {
        const monthsAgo = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo < 6;
      });
      
      let evolution: 'emerging' | 'stable' | 'declining' = 'stable';
      if (recentBooks.length > cluster.books.length * 0.6) evolution = 'emerging';
      else if (recentBooks.length < cluster.books.length * 0.2) evolution = 'declining';
      
      constellations.push({
        id: cluster.id,
        centralTheme: cluster.name,
        satellites: cluster.centralThemes.slice(1),
        intensity: cluster.strength,
        evolution
      });
    });
    
    return constellations.sort((a, b) => b.intensity - a.intensity);
  }
}

export const patternRecognitionService = new PatternRecognitionService();
