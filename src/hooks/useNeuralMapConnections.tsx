import { useMemo } from 'react';
import { BrainNode, BookLink } from '@/pages/TestBrain';

// Connection reason types for meaningful edges
export type ConnectionReason = 
  | 'same_author' 
  | 'shared_theme' 
  | 'shared_subgenre' 
  | 'shared_era' 
  | 'same_publisher';

export interface ConnectionData {
  a: string;
  b: string;
  score: number;
  reasons: ConnectionReason[];
  sharedTags: string[];
}

export interface NeuralMapEdge extends BookLink {
  score: number;
  reasons: ConnectionReason[];
}

interface ConnectionResult {
  score: number;
  reasons: ConnectionReason[];
  sharedTags: string[];
  shouldConnect: boolean;
}

// Scoring constants
const SCORE_SAME_AUTHOR = 50;
const SCORE_SHARED_THEME = 10;
const SCORE_SHARED_SUBGENRE = 15;
const SCORE_SHARED_ERA = 5;
const SCORE_SAME_PUBLISHER = 3;

const MAX_THEME_CONTRIBUTION = 40;
const MAX_SUBGENRE_CONTRIBUTION = 45;
const MIN_CONNECTION_SCORE = 10;
const MAX_VISIBLE_CONNECTIONS = 120;
const LARGE_GRAPH_THRESHOLD = 120;

/**
 * Calculate connection strength between two books
 */
export function calculateConnectionStrength(
  bookA: BrainNode,
  bookB: BrainNode
): ConnectionResult {
  let score = 0;
  const reasons: ConnectionReason[] = [];
  const sharedTags: string[] = [];

  // Same author - highest priority
  if (
    bookA.author &&
    bookB.author &&
    bookA.author !== 'Unknown Author' &&
    bookA.author.toLowerCase() === bookB.author.toLowerCase()
  ) {
    score += SCORE_SAME_AUTHOR;
    reasons.push('same_author');
  }

  // Shared conceptual tags (themes)
  const sharedThemes = bookA.tags.filter(tag => 
    bookB.tags.includes(tag) && tag.trim() !== ''
  );
  if (sharedThemes.length > 0) {
    const themeScore = Math.min(sharedThemes.length * SCORE_SHARED_THEME, MAX_THEME_CONTRIBUTION);
    score += themeScore;
    reasons.push('shared_theme');
    sharedTags.push(...sharedThemes);
  }

  // Shared context tags (subgenres/eras)
  const sharedContextTags = bookA.contextTags.filter(tag => 
    bookB.contextTags.includes(tag) && tag.trim() !== ''
  );
  if (sharedContextTags.length > 0) {
    const contextScore = Math.min(sharedContextTags.length * SCORE_SHARED_SUBGENRE, MAX_SUBGENRE_CONTRIBUTION);
    score += contextScore;
    reasons.push('shared_subgenre');
    sharedTags.push(...sharedContextTags);
  }

  // Shared era (from temporal tags or publication year decade)
  const bookAEra = getEra(bookA);
  const bookBEra = getEra(bookB);
  if (bookAEra && bookBEra && bookAEra === bookBEra && !reasons.includes('shared_subgenre')) {
    score += SCORE_SHARED_ERA;
    reasons.push('shared_era');
    sharedTags.push(bookAEra);
  }

  // Same publisher (never sole reason to connect)
  // Note: We don't have publisher in BrainNode currently, but keeping for future
  // Publisher alone cannot create a connection

  const shouldConnect = score >= MIN_CONNECTION_SCORE && reasons.length > 0;

  return { score, reasons, sharedTags, shouldConnect };
}

/**
 * Extract era from a node (from contextTags or inferred from other data)
 */
function getEra(node: BrainNode): string | null {
  // Check contextTags for era-like tags
  const eraTags = node.contextTags.filter(tag => 
    tag.includes('Era') || tag.includes('Age') || tag.includes('Period') ||
    tag.includes('Classic') || tag.includes('Golden') || tag.includes('New Wave') ||
    tag.includes('Cyber') || tag.includes('Post-')
  );
  return eraTags.length > 0 ? eraTags[0] : null;
}

/**
 * Build adjacency maps for efficient neighbor lookup
 */
function buildAdjacencyMaps(edges: NeuralMapEdge[]) {
  const directNeighborsMap = new Map<string, Set<string>>();
  const edgeReasonsMap = new Map<string, { reasons: ConnectionReason[]; sharedTags: string[]; score: number }>();

  edges.forEach(edge => {
    // Direct neighbors
    if (!directNeighborsMap.has(edge.fromId)) {
      directNeighborsMap.set(edge.fromId, new Set());
    }
    if (!directNeighborsMap.has(edge.toId)) {
      directNeighborsMap.set(edge.toId, new Set());
    }
    directNeighborsMap.get(edge.fromId)!.add(edge.toId);
    directNeighborsMap.get(edge.toId)!.add(edge.fromId);

    // Edge reasons
    const edgeKey = [edge.fromId, edge.toId].sort().join('|');
    edgeReasonsMap.set(edgeKey, {
      reasons: edge.reasons,
      sharedTags: edge.sharedTags,
      score: edge.score
    });
  });

  return { directNeighborsMap, edgeReasonsMap };
}

/**
 * Group nodes for efficient candidate generation in large graphs
 */
function groupNodesByAttributes(nodes: BrainNode[]) {
  const authorBuckets = new Map<string, BrainNode[]>();
  const tagBuckets = new Map<string, BrainNode[]>();

  nodes.forEach(node => {
    // Author bucket
    if (node.author && node.author !== 'Unknown Author') {
      const key = node.author.toLowerCase();
      if (!authorBuckets.has(key)) authorBuckets.set(key, []);
      authorBuckets.get(key)!.push(node);
    }

    // Tag buckets
    node.tags.forEach(tag => {
      if (!tagBuckets.has(tag)) tagBuckets.set(tag, []);
      tagBuckets.get(tag)!.push(node);
    });

    // Context tag buckets
    node.contextTags.forEach(tag => {
      if (!tagBuckets.has(tag)) tagBuckets.set(tag, []);
      tagBuckets.get(tag)!.push(node);
    });
  });

  return { authorBuckets, tagBuckets };
}

/**
 * Build edges from node buckets (for large graphs)
 */
function buildEdgesFromBuckets(
  authorBuckets: Map<string, BrainNode[]>,
  tagBuckets: Map<string, BrainNode[]>
): NeuralMapEdge[] {
  const edgesMap = new Map<string, NeuralMapEdge>();

  // Process author buckets
  authorBuckets.forEach(nodes => {
    if (nodes.length < 2) return;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const result = calculateConnectionStrength(nodes[i], nodes[j]);
        if (result.shouldConnect) {
          const key = [nodes[i].id, nodes[j].id].sort().join('|');
          if (!edgesMap.has(key) || edgesMap.get(key)!.score < result.score) {
            edgesMap.set(key, createEdge(nodes[i].id, nodes[j].id, result));
          }
        }
      }
    }
  });

  // Process tag buckets
  tagBuckets.forEach(nodes => {
    if (nodes.length < 2) return;
    for (let i = 0; i < Math.min(nodes.length, 10); i++) {
      for (let j = i + 1; j < Math.min(nodes.length, 10); j++) {
        const result = calculateConnectionStrength(nodes[i], nodes[j]);
        if (result.shouldConnect) {
          const key = [nodes[i].id, nodes[j].id].sort().join('|');
          if (!edgesMap.has(key) || edgesMap.get(key)!.score < result.score) {
            edgesMap.set(key, createEdge(nodes[i].id, nodes[j].id, result));
          }
        }
      }
    }
  });

  return Array.from(edgesMap.values());
}

/**
 * Create edge object from connection result
 */
function createEdge(fromId: string, toId: string, result: ConnectionResult): NeuralMapEdge {
  const primaryReason = result.reasons[0];
  let type: BookLink['type'] = 'tag_shared';
  
  if (primaryReason === 'same_author') type = 'author_shared';
  else if (primaryReason === 'shared_theme' || primaryReason === 'shared_subgenre') type = 'tag_shared';
  
  const reasonLabels = result.reasons.map(r => {
    switch (r) {
      case 'same_author': return 'Same author';
      case 'shared_theme': return `Themes: ${result.sharedTags.slice(0, 2).join(', ')}`;
      case 'shared_subgenre': return `Subgenres: ${result.sharedTags.slice(0, 2).join(', ')}`;
      case 'shared_era': return `Era: ${result.sharedTags[result.sharedTags.length - 1] || 'shared'}`;
      case 'same_publisher': return 'Same publisher';
      default: return r;
    }
  });

  return {
    fromId,
    toId,
    type,
    strength: result.score / 50, // Normalize to existing strength scale
    sharedTags: result.sharedTags,
    connectionReason: reasonLabels.join(' • '),
    score: result.score,
    reasons: result.reasons
  };
}

/**
 * Hook to compute neural map connections with memoization and performance caps
 */
export function useNeuralMapConnections(
  visibleNodes: BrainNode[],
  activeTagFilter: string | null
) {
  // Build edges with memoization
  const edges = useMemo(() => {
    if (visibleNodes.length < 2) return [];

    let candidateEdges: NeuralMapEdge[];

    if (visibleNodes.length <= LARGE_GRAPH_THRESHOLD) {
      // Small graph: pairwise comparison
      candidateEdges = [];
      for (let i = 0; i < visibleNodes.length; i++) {
        for (let j = i + 1; j < visibleNodes.length; j++) {
          const result = calculateConnectionStrength(visibleNodes[i], visibleNodes[j]);
          if (result.shouldConnect) {
            candidateEdges.push(createEdge(visibleNodes[i].id, visibleNodes[j].id, result));
          }
        }
      }
    } else {
      // Large graph: use bucketing
      const { authorBuckets, tagBuckets } = groupNodesByAttributes(visibleNodes);
      candidateEdges = buildEdgesFromBuckets(authorBuckets, tagBuckets);
    }

    // Sort by score and cap
    candidateEdges.sort((a, b) => b.score - a.score);
    return candidateEdges.slice(0, MAX_VISIBLE_CONNECTIONS);
  }, [visibleNodes]);

  // Build adjacency maps
  const { directNeighborsMap, edgeReasonsMap } = useMemo(
    () => buildAdjacencyMaps(edges),
    [edges]
  );

  // Get neighbors for a node
  const getDirectNeighbors = (nodeId: string): string[] => {
    return Array.from(directNeighborsMap.get(nodeId) || []);
  };

  // Get second-degree neighbors
  const getSecondDegreeNeighbors = (nodeId: string): string[] => {
    const direct = directNeighborsMap.get(nodeId) || new Set();
    const secondDegree = new Set<string>();
    
    direct.forEach(neighborId => {
      const neighborNeighbors = directNeighborsMap.get(neighborId) || new Set();
      neighborNeighbors.forEach(id => {
        if (id !== nodeId && !direct.has(id)) {
          secondDegree.add(id);
        }
      });
    });

    return Array.from(secondDegree);
  };

  // Get edge data between two nodes
  const getEdgeData = (nodeA: string, nodeB: string) => {
    const key = [nodeA, nodeB].sort().join('|');
    return edgeReasonsMap.get(key) || null;
  };

  // Get top related books by score
  const getTopRelated = (nodeId: string, limit = 4): Array<{ nodeId: string; score: number }> => {
    const neighbors = getDirectNeighbors(nodeId);
    const scored = neighbors.map(neighborId => {
      const data = getEdgeData(nodeId, neighborId);
      return { nodeId: neighborId, score: data?.score || 0 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  };

  // Get connection breakdown for a node
  const getConnectionBreakdown = (nodeId: string) => {
    const neighbors = getDirectNeighbors(nodeId);
    const breakdown = {
      sameAuthor: 0,
      sharedThemes: [] as string[],
      sharedSubgenres: [] as string[],
      sharedEras: [] as string[],
      total: neighbors.length
    };

    neighbors.forEach(neighborId => {
      const data = getEdgeData(nodeId, neighborId);
      if (!data) return;

      data.reasons.forEach(reason => {
        switch (reason) {
          case 'same_author':
            breakdown.sameAuthor++;
            break;
          case 'shared_theme':
            data.sharedTags.forEach(tag => {
              if (!breakdown.sharedThemes.includes(tag)) {
                breakdown.sharedThemes.push(tag);
              }
            });
            break;
          case 'shared_subgenre':
            data.sharedTags.forEach(tag => {
              if (!breakdown.sharedSubgenres.includes(tag)) {
                breakdown.sharedSubgenres.push(tag);
              }
            });
            break;
          case 'shared_era':
            data.sharedTags.forEach(tag => {
              if (!breakdown.sharedEras.includes(tag)) {
                breakdown.sharedEras.push(tag);
              }
            });
            break;
        }
      });
    });

    return breakdown;
  };

  return {
    edges,
    directNeighborsMap,
    edgeReasonsMap,
    getDirectNeighbors,
    getSecondDegreeNeighbors,
    getEdgeData,
    getTopRelated,
    getConnectionBreakdown
  };
}
