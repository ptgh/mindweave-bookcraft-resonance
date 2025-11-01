import { Transmission } from '@/services/transmissionsService';
import { filterConceptualTags } from '@/constants/conceptualTags';
import { TEMPORAL_CONTEXT_TAGS, getTagCategory } from '@/constants/temporalTags';

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

export interface TemporalCluster {
  id: string;
  era: string;
  books: string[];
  strength: number;
  historicalForces: string[];
  technologicalContext: string[];
}

export interface TemporalBridge {
  bookId1: string;
  bookId2: string;
  bridgeType: 'era' | 'force' | 'tech' | 'evolution' | 'cross-temporal';
  description: string;
  strength: number;
}

export interface TemporalEvolution {
  conceptualTheme: string;
  timeline: Array<{
    era: string;
    bookIds: string[];
    manifestation: string;
  }>;
  evolutionStrength: number;
}

export class PatternRecognitionService {
  /**
   * Detect thematic clusters in a collection of books
   * Includes conceptual tags and context tags
   */
  static detectThematicClusters(transmissions: Transmission[]): ThematicCluster[] {
    const clusters: Map<string, ThematicCluster> = new Map();
    
    transmissions.forEach(book => {
      // Use conceptual tags, temporal tags, and legacy context tags
      const conceptualTags = filterConceptualTags(book.tags || []);
      const temporalTags = book.temporal_context_tags || [];
      const contextTags = book.historical_context_tags || [];
      const allTags = [...conceptualTags, ...temporalTags, ...contextTags];
      
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
   * Now includes temporal bridges and cross-temporal connections
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
        
        // Check temporal tag bridges (NEW)
        const temporalTags1 = new Set(book1.temporal_context_tags || []);
        const temporalTags2 = new Set(book2.temporal_context_tags || []);
        const commonTemporal = Array.from(temporalTags1).filter(tag => temporalTags2.has(tag));
        
        // Check legacy context tag bridges
        const contextTags1 = new Set(book1.historical_context_tags || []);
        const contextTags2 = new Set(book2.historical_context_tags || []);
        const commonContext = Array.from(contextTags1).filter(tag => contextTags2.has(tag));
        
        // Create bridges for conceptual tags (strength 2.0)
        commonConceptual.forEach(bridgeConcept => {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Conceptual] ${bridgeConcept}`,
            strength: 2.0
          });
        });
        
        // Create bridges for temporal tags (strength 1.8)
        commonTemporal.forEach(bridgeConcept => {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Temporal] ${bridgeConcept}`,
            strength: 1.8
          });
        });
        
        // Create bridges for legacy context tags (strength 1.5)
        commonContext.forEach(bridgeConcept => {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Context] ${bridgeConcept}`,
            strength: 1.5
          });
        });
        
        // Cross-temporal bridge: Conceptual + Temporal = strongest connection (strength 3.5)
        if (commonConceptual.length > 0 && commonTemporal.length > 0) {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Cross-Temporal] ${commonConceptual[0]} × ${commonTemporal[0]}`,
            strength: 3.5
          });
        }
        
        // Cross-taxonomy bridge: Conceptual + Context (strength 3.0)
        if (commonConceptual.length > 0 && commonContext.length > 0) {
          bridges.push({
            bookId1: book1.id.toString(),
            bookId2: book2.id.toString(),
            bridgeConcept: `[Cross-Taxonomy] ${commonConceptual[0]} + ${commonContext[0]}`,
            strength: 3.0
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
      // Use conceptual tags, temporal tags, and legacy context tags
      const conceptualTags = filterConceptualTags(book.tags || []);
      const temporalTags = book.temporal_context_tags || [];
      const contextTags = book.historical_context_tags || [];
      const allThemes = [...conceptualTags, ...temporalTags, ...contextTags];
      
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

  /**
   * Detect temporal clusters - group books by era/force/tech context
   */
  static detectTemporalClusters(transmissions: Transmission[]): TemporalCluster[] {
    const clusters: Map<string, TemporalCluster> = new Map();
    
    transmissions.forEach(book => {
      const temporalTags = book.temporal_context_tags || [];
      
      temporalTags.forEach(tag => {
        const category = getTagCategory(tag);
        if (!category) return;
        
        if (!clusters.has(tag)) {
          clusters.set(tag, {
            id: `temporal-${tag.toLowerCase().replace(/\s+/g, '-')}`,
            era: tag,
            books: [],
            strength: 0,
            historicalForces: [],
            technologicalContext: []
          });
        }
        
        const cluster = clusters.get(tag)!;
        cluster.books.push(book.id.toString());
        cluster.strength += 1;
        
        // Categorize tags
        if (category === 'historicalForces' && !cluster.historicalForces.includes(tag)) {
          cluster.historicalForces.push(tag);
        } else if (category === 'technologicalContext' && !cluster.technologicalContext.includes(tag)) {
          cluster.technologicalContext.push(tag);
        }
      });
    });
    
    return Array.from(clusters.values())
      .filter(cluster => cluster.books.length >= 2)
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Find temporal bridges - connections across different eras
   */
  static findTemporalBridges(transmissions: Transmission[]): TemporalBridge[] {
    const bridges: TemporalBridge[] = [];
    
    for (let i = 0; i < transmissions.length; i++) {
      for (let j = i + 1; j < transmissions.length; j++) {
        const book1 = transmissions[i];
        const book2 = transmissions[j];
        
        const temporal1 = book1.temporal_context_tags || [];
        const temporal2 = book2.temporal_context_tags || [];
        
        // Find era tags
        const era1 = temporal1.filter(t => TEMPORAL_CONTEXT_TAGS.literaryEra.includes(t as any));
        const era2 = temporal2.filter(t => TEMPORAL_CONTEXT_TAGS.literaryEra.includes(t as any));
        
        // Find shared forces/tech despite different eras
        const forces1 = new Set(temporal1.filter(t => TEMPORAL_CONTEXT_TAGS.historicalForces.includes(t as any)));
        const forces2 = new Set(temporal2.filter(t => TEMPORAL_CONTEXT_TAGS.historicalForces.includes(t as any)));
        const commonForces = Array.from(forces1).filter(f => forces2.has(f));
        
        const tech1 = new Set(temporal1.filter(t => TEMPORAL_CONTEXT_TAGS.technologicalContext.includes(t as any)));
        const tech2 = new Set(temporal2.filter(t => TEMPORAL_CONTEXT_TAGS.technologicalContext.includes(t as any)));
        const commonTech = Array.from(tech1).filter(t => tech2.has(t));
        
        // Create bridges for books from different eras sharing forces/tech
        if (era1.length > 0 && era2.length > 0 && era1[0] !== era2[0]) {
          if (commonForces.length > 0) {
            bridges.push({
              bookId1: book1.id.toString(),
              bookId2: book2.id.toString(),
              bridgeType: 'force',
              description: `${commonForces[0]} connects ${era1[0]} to ${era2[0]}`,
              strength: 2.5
            });
          }
          
          if (commonTech.length > 0) {
            bridges.push({
              bookId1: book1.id.toString(),
              bookId2: book2.id.toString(),
              bridgeType: 'tech',
              description: `${commonTech[0]} connects ${era1[0]} to ${era2[0]}`,
              strength: 2.5
            });
          }
          
          // Evolution bridge: same tech/force appears in multiple eras
          if (commonForces.length > 0 && commonTech.length > 0) {
            bridges.push({
              bookId1: book1.id.toString(),
              bookId2: book2.id.toString(),
              bridgeType: 'evolution',
              description: `${commonForces[0]} + ${commonTech[0]} evolved from ${era1[0]} to ${era2[0]}`,
              strength: 3.0
            });
          }
        }
      }
    }
    
    return bridges.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Detect temporal evolution - how themes evolve across eras
   */
  static detectTemporalEvolution(transmissions: Transmission[]): TemporalEvolution[] {
    const conceptualThemes = new Map<string, Map<string, string[]>>();
    
    transmissions.forEach(book => {
      const conceptualTags = filterConceptualTags(book.tags || []);
      const temporalTags = book.temporal_context_tags || [];
      const eras = temporalTags.filter(t => TEMPORAL_CONTEXT_TAGS.literaryEra.includes(t as any));
      
      if (eras.length === 0) return;
      
      conceptualTags.forEach(concept => {
        if (!conceptualThemes.has(concept)) {
          conceptualThemes.set(concept, new Map());
        }
        
        const eraMap = conceptualThemes.get(concept)!;
        eras.forEach(era => {
          if (!eraMap.has(era)) {
            eraMap.set(era, []);
          }
          eraMap.get(era)!.push(book.id.toString());
        });
      });
    });
    
    const evolutions: TemporalEvolution[] = [];
    
    conceptualThemes.forEach((eraMap, conceptualTheme) => {
      if (eraMap.size < 2) return; // Need at least 2 eras for evolution
      
      const timeline = Array.from(eraMap.entries())
        .sort((a, b) => {
          // Sort by era chronology
          const indexA = TEMPORAL_CONTEXT_TAGS.literaryEra.indexOf(a[0] as any);
          const indexB = TEMPORAL_CONTEXT_TAGS.literaryEra.indexOf(b[0] as any);
          return indexA - indexB;
        })
        .map(([era, bookIds]) => ({
          era,
          bookIds,
          manifestation: `${conceptualTheme} in ${era}`
        }));
      
      evolutions.push({
        conceptualTheme,
        timeline,
        evolutionStrength: eraMap.size * 1.5
      });
    });
    
    return evolutions.sort((a, b) => b.evolutionStrength - a.evolutionStrength);
  }
}
