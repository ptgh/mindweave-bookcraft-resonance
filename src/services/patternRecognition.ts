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
   */
  static detectThematicClusters(transmissions: Transmission[]): ThematicCluster[] {
    const clusters: Map<string, ThematicCluster> = new Map();
    
    transmissions.forEach(book => {
      // Only use conceptual tags for clustering
      const tags = filterConceptualTags(book.tags || []);
      
      tags.forEach(tag => {
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
   */
  static findConceptualBridges(transmissions: Transmission[]): ConceptualBridge[] {
    const bridges: ConceptualBridge[] = [];
    
    for (let i = 0; i < transmissions.length; i++) {
      for (let j = i + 1; j < transmissions.length; j++) {
        const book1 = transmissions[i];
        const book2 = transmissions[j];
        
        // Only use conceptual tags for bridges
        const tags1 = new Set(filterConceptualTags(book1.tags || []));
        const tags2 = new Set(filterConceptualTags(book2.tags || []));
        
        const commonTags = Array.from(tags1).filter(tag => tags2.has(tag));
        
        if (commonTags.length > 0) {
          commonTags.forEach(bridgeConcept => {
            bridges.push({
              bookId1: book1.id.toString(),
              bookId2: book2.id.toString(),
              bridgeConcept,
              strength: 1
            });
          });
        }
      }
    }
    
    return bridges.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Calculate reading velocity by theme
   */
  static calculateReadingVelocity(transmissions: Transmission[]): ReadingVelocity[] {
    const themeActivity: Map<string, Date[]> = new Map();
    
    transmissions.forEach(book => {
      // Only use conceptual tags for velocity
      const tags = filterConceptualTags(book.tags || []);
      tags.forEach(tag => {
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
      // Only use conceptual tags for influence mapping
      const authorTags = new Set(
        books.flatMap(b => filterConceptualTags(b.tags || []))
      );
      
      const influences: InfluenceNetwork['influences'] = [];
      
      authorBooks.forEach((otherBooks, otherAuthor) => {
        if (author === otherAuthor) return;
        
        // Only use conceptual tags for comparison
        const otherTags = new Set(
          otherBooks.flatMap(b => filterConceptualTags(b.tags || []))
        );
        
        const commonTags = Array.from(authorTags).filter(tag => otherTags.has(tag));
        
        if (commonTags.length > 0) {
          influences.push({
            targetAuthor: otherAuthor,
            strength: commonTags.length,
            conceptualLink: commonTags[0]
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
