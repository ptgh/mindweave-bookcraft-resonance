import { Transmission } from '@/services/transmissionsService';
import { filterConceptualTags } from '@/constants/conceptualTags';

export interface ThematicCluster {
  id: string;
  theme: string;
  books: string[];
  strength: number;
  tags: string[];
}

export interface ConceptualBridge {
  bookId1: string;
  bookId2: string;
  bridgeConcept: string;
  strength: number;
}

export interface ReadingVelocity {
  theme: string;
  booksPerMonth: number;
  trend: 'accelerating' | 'steady' | 'slowing';
}

export interface InfluenceNetwork {
  authorId: string;
  author: string;
  influences: Array<{
    targetAuthor: string;
    strength: number;
    conceptualLink: string;
  }>;
}

export class PatternRecognitionService {
  /**
   * Detect thematic clusters in a collection of books
   * Includes conceptual tags and context tags
   */
  static detectThematicClusters(transmissions: Transmission[]): ThematicCluster[] {
    const clusters: Map<string, ThematicCluster> = new Map();
    
    transmissions.forEach(book => {
      // Use both conceptual tags and context tags for clustering
      const conceptualTags = filterConceptualTags(book.tags || []);
      const contextTags = book.historical_context_tags || [];
      const allTags = [...conceptualTags, ...contextTags];
      
      allTags.forEach(tag => {
        if (!tag || !tag.trim()) return;
        
        if (!clusters.has(tag)) {
          clusters.set(tag, {
            id: `cluster-${tag.toLowerCase().replace(/\s+/g, '-')}`,
            theme: tag,
            books: [],
            strength: 0,
            tags: [tag]
          });
        }
        
        const cluster = clusters.get(tag)!;
        cluster.books.push(book.id.toString());
        cluster.strength += 1;
      });
    });
    
    // Filter out weak clusters (less than 2 books)
    return Array.from(clusters.values())
      .filter(cluster => cluster.books.length >= 2)
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Find conceptual bridges between seemingly disparate books
   * Includes cross-taxonomy bridges
   */
  static findConceptualBridges(transmissions: Transmission[]): ConceptualBridge[] {
    const bridges: ConceptualBridge[] = [];
    
    for (let i = 0; i < transmissions.length; i++) {
      for (let j = i + 1; j < transmissions.length; j++) {
        const book1 = transmissions[i];
        const book2 = transmissions[j];
        
        // Check conceptual tag bridges
        const conceptualTags1 = new Set(filterConceptualTags(book1.tags || []));
        const conceptualTags2 = new Set(filterConceptualTags(book2.tags || []));
        const commonConceptual = Array.from(conceptualTags1).filter(tag => conceptualTags2.has(tag));
        
        // Check context tag bridges
        const contextTags1 = new Set(book1.historical_context_tags || []);
        const contextTags2 = new Set(book2.historical_context_tags || []);
        const commonContext = Array.from(contextTags1).filter(tag => contextTags2.has(tag));
        
        // Create bridges for conceptual tags
        commonConceptual.forEach(bridgeConcept => {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Conceptual] ${bridgeConcept}`,
            strength: 2
          });
        });
        
        // Create bridges for context tags
        commonContext.forEach(bridgeConcept => {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Context] ${bridgeConcept}`,
            strength: 1.5
          });
        });
        
        // Cross-taxonomy bridge: stronger connection if books share both types
        if (commonConceptual.length > 0 && commonContext.length > 0) {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Cross-Taxonomy] ${commonConceptual[0]} + ${commonContext[0]}`,
            strength: 3
          });
        }
      }
    }
    
    return bridges.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Calculate reading velocity by theme
   * Includes all three taxonomies
   */
  static calculateReadingVelocity(transmissions: Transmission[]): ReadingVelocity[] {
    const themeActivity: Map<string, Date[]> = new Map();
    
    transmissions.forEach(book => {
      // Use conceptual tags, context tags, and genres
      const conceptualTags = filterConceptualTags(book.tags || []);
      const contextTags = book.historical_context_tags || [];
      const allThemes = [...conceptualTags, ...contextTags];
      
      allThemes.forEach(tag => {
        if (!tag || !tag.trim()) return;
        if (!themeActivity.has(tag)) {
          themeActivity.set(tag, []);
        }
        themeActivity.get(tag)!.push(new Date(book.created_at));
      });
    });
    
    const velocities: ReadingVelocity[] = [];
    const now = new Date();
    
    themeActivity.forEach((dates, theme) => {
      if (dates.length < 2) return;
      
      dates.sort((a, b) => a.getTime() - b.getTime());
      
      // Calculate books per month in the last 6 months
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentBooks = dates.filter(date => date >= sixMonthsAgo);
      const monthsElapsed = Math.max(1, (now.getTime() - sixMonthsAgo.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const booksPerMonth = recentBooks.length / monthsElapsed;
      
      // Determine trend
      const midPoint = Math.floor(recentBooks.length / 2);
      const firstHalf = recentBooks.slice(0, midPoint).length;
      const secondHalf = recentBooks.slice(midPoint).length;
      
      let trend: 'accelerating' | 'steady' | 'slowing' = 'steady';
      if (secondHalf > firstHalf * 1.2) trend = 'accelerating';
      else if (secondHalf < firstHalf * 0.8) trend = 'slowing';
      
      velocities.push({
        theme,
        booksPerMonth: Math.round(booksPerMonth * 10) / 10,
        trend
      });
    });
    
    return velocities.sort((a, b) => b.booksPerMonth - a.booksPerMonth);
  }

  /**
   * Map influence networks between authors
   * Uses all three taxonomies for richer connections
   */
  static mapInfluenceNetwork(transmissions: Transmission[]): InfluenceNetwork[] {
    const authorBooks: Map<string, Transmission[]> = new Map();
    
    transmissions.forEach(book => {
      const author = book.author || 'Unknown';
      if (!authorBooks.has(author)) {
        authorBooks.set(author, []);
      }
      authorBooks.get(author)!.push(book);
    });
    
    const networks: InfluenceNetwork[] = [];
    
    authorBooks.forEach((books, author) => {
      // Use all three taxonomies for influence mapping
      const authorConceptualTags = new Set(
        books.flatMap(b => filterConceptualTags(b.tags || []))
      );
      const authorContextTags = new Set(
        books.flatMap(b => b.historical_context_tags || [])
      );
      
      const influences: InfluenceNetwork['influences'] = [];
      
      authorBooks.forEach((otherBooks, otherAuthor) => {
        if (author === otherAuthor) return;
        
        const otherConceptualTags = new Set(
          otherBooks.flatMap(b => filterConceptualTags(b.tags || []))
        );
        const otherContextTags = new Set(
          otherBooks.flatMap(b => b.historical_context_tags || [])
        );
        
        const commonConceptual = Array.from(authorConceptualTags).filter(tag => otherConceptualTags.has(tag));
        const commonContext = Array.from(authorContextTags).filter(tag => otherContextTags.has(tag));
        
        const totalStrength = (commonConceptual.length * 2) + (commonContext.length * 1.5);
        
        if (totalStrength > 0) {
          const linkDescription = [
            commonConceptual.length > 0 ? commonConceptual[0] : null,
            commonContext.length > 0 ? commonContext[0] : null
          ].filter(Boolean).join(' + ');
          
          influences.push({
            targetAuthor: otherAuthor,
            strength: totalStrength,
            conceptualLink: linkDescription || 'Shared themes'
          });
        }
      });
      
      if (influences.length > 0) {
        networks.push({
          authorId: author.toLowerCase().replace(/\s+/g, '-'),
          author,
          influences: influences.sort((a, b) => b.strength - a.strength).slice(0, 5)
        });
      }
    });
    
    return networks;
  }

  /**
   * Get cluster info for a specific book
   */
  static getBookClusterInfo(bookId: string, clusters: ThematicCluster[]): ThematicCluster[] {
    return clusters.filter(cluster => cluster.books.includes(bookId));
  }

  /**
   * Get bridge connections for a specific book
   */
  static getBookBridges(bookId: string, bridges: ConceptualBridge[]): ConceptualBridge[] {
    return bridges.filter(
      bridge => bridge.bookId1 === bookId || bridge.bookId2 === bookId
    );
  }
}
