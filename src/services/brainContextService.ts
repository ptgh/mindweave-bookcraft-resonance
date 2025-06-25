
import { BrainNode, BookLink } from '@/pages/TestBrain';

export interface BrainAnalysis {
  totalNodes: number;
  totalLinks: number;
  connectionDensity: number;
  topTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ author: string; count: number }>;
  mostConnectedBooks: Array<{ title: string; connections: number; id: string }>;
  connectionTypes: Record<string, number>;
  clusterAnalysis: Array<{ theme: string; nodeIds: string[]; strength: number }>;
}

export class BrainContextService {
  static analyzeBrainData(nodes: BrainNode[], links: BookLink[]): BrainAnalysis {
    // Calculate connection density
    const maxPossibleConnections = nodes.length * (nodes.length - 1) / 2;
    const connectionDensity = maxPossibleConnections > 0 ? (links.length / maxPossibleConnections) * 100 : 0;

    // Analyze tag frequencies
    const tagFrequency = new Map<string, number>();
    nodes.forEach(node => {
      node.tags.forEach(tag => {
        if (tag && tag.trim() !== '' && tag.toLowerCase() !== 'young adult') {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
        }
      });
    });

    const topTags = Array.from(tagFrequency.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Analyze author frequencies
    const authorFrequency = new Map<string, number>();
    nodes.forEach(node => {
      if (node.author && node.author !== 'Unknown Author') {
        authorFrequency.set(node.author, (authorFrequency.get(node.author) || 0) + 1);
      }
    });

    const topAuthors = Array.from(authorFrequency.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Find most connected books
    const nodeConnections = new Map<string, number>();
    links.forEach(link => {
      nodeConnections.set(link.fromId, (nodeConnections.get(link.fromId) || 0) + 1);
      nodeConnections.set(link.toId, (nodeConnections.get(link.toId) || 0) + 1);
    });

    const mostConnectedBooks = nodes
      .map(node => ({
        title: node.title,
        id: node.id,
        connections: nodeConnections.get(node.id) || 0
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 8);

    // Analyze connection types
    const connectionTypes = links.reduce((acc, link) => {
      acc[link.type] = (acc[link.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify thematic clusters
    const clusterAnalysis = this.identifyThematicClusters(nodes, links, topTags.slice(0, 5));

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      connectionDensity,
      topTags,
      topAuthors,
      mostConnectedBooks,
      connectionTypes,
      clusterAnalysis
    };
  }

  private static identifyThematicClusters(
    nodes: BrainNode[], 
    links: BookLink[], 
    topTags: Array<{ tag: string; count: number }>
  ): Array<{ theme: string; nodeIds: string[]; strength: number }> {
    return topTags.map(({ tag }) => {
      const themeNodes = nodes.filter(node => 
        node.tags.some(nodeTag => nodeTag.toLowerCase() === tag.toLowerCase())
      );
      
      const themeLinks = links.filter(link => 
        themeNodes.some(node => node.id === link.fromId) &&
        themeNodes.some(node => node.id === link.toId)
      );

      const strength = themeLinks.reduce((sum, link) => sum + link.strength, 0);

      return {
        theme: tag,
        nodeIds: themeNodes.map(node => node.id),
        strength
      };
    }).filter(cluster => cluster.nodeIds.length > 1);
  }

  static generateQuerySuggestions(analysis: BrainAnalysis): string[] {
    const suggestions = [
      "What are the strongest thematic connections in my reading network?",
      "Which books serve as bridges between different genres?"
    ];

    if (analysis.topAuthors.length > 0) {
      suggestions.push(`Tell me about the ${analysis.topAuthors[0].author} books in my collection`);
    }

    if (analysis.topTags.length > 0) {
      suggestions.push(`Explore the ${analysis.topTags[0].tag} theme in my library`);
    }

    if (analysis.mostConnectedBooks.length > 0) {
      suggestions.push(`Why is "${analysis.mostConnectedBooks[0].title}" so well connected?`);
    }

    suggestions.push("What should I read next based on my network?");
    suggestions.push("Show me books that connect different time periods");

    return suggestions.slice(0, 6);
  }
}
