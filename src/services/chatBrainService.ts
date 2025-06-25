
import { BrainNode, BookLink } from '@/hooks/useBrainMap';

export interface ChatBrainQuery {
  question: string;
  brainData: {
    nodes: BrainNode[];
    links: BookLink[];
  };
}

export interface ChatBrainResponse {
  answer: string;
  highlightedNodes?: string[];
  suggestedConnections?: string[];
}

export const chatWithBrain = async (
  question: string, 
  nodes: BrainNode[], 
  links: BookLink[]
): Promise<ChatBrainResponse> => {
  const systemPrompt = `
You are an assistant analyzing a conceptual neural map of a user's science fiction reading history.
Each book has tags, author, publication year, thematic resonance, and connections to other books.

Available connection types:
- temporal_bridge: Books from similar time periods
- thematic_resonance: Books sharing similar themes
- author_consciousness: Books by the same author
- conceptual_drift: Books with conceptual similarities
- quantum_entanglement: Mysterious connections for isolated books
- year_proximity: Books published within 3 years of each other

Available themes: temporal_mechanics, cosmic_consciousness, mind_exploration, reality_questioning, 
technological_singularity, xenobiological_contact, quantum_metaphysics, social_transformation, 
existential_conflict, identity_metamorphosis, linguistic_evolution, mortality_transcendence, 
planetary_ecology, galactic_expansion.

Provide meaningful, insightful answers about connections, patterns, and recommendations. 
Be specific about book titles and authors when relevant.
Keep responses concise but informative (2-3 paragraphs max).
`;

  const brainSummary = {
    totalNodes: nodes.length,
    totalConnections: links.length,
    themes: Array.from(new Set(nodes.flatMap(n => n.thematicResonance))),
    yearRange: {
      earliest: Math.min(...nodes.filter(n => n.publicationYear).map(n => n.publicationYear!)),
      latest: Math.max(...nodes.filter(n => n.publicationYear).map(n => n.publicationYear!))
    },
    topAuthors: getTopAuthors(nodes),
    connectionTypes: getConnectionTypeStats(links)
  };

  const sampleBooks = nodes.slice(0, 10).map(node => ({
    title: node.title,
    author: node.author,
    year: node.publicationYear,
    themes: node.thematicResonance
  }));

  const userPrompt = `
Question: ${question}

Brain Overview:
${JSON.stringify(brainSummary, null, 2)}

Sample Books:
${JSON.stringify(sampleBooks, null, 2)}

Connection Examples:
${links.slice(0, 5).map(link => `${link.type}: ${link.connectionReason}`).join('\n')}
`;

  try {
    // This would connect to your ChatGPT API
    // For now, return a mock response
    const mockResponse = generateMockResponse(question, nodes, links);
    return mockResponse;
  } catch (error) {
    console.error('Error chatting with brain:', error);
    return {
      answer: "I'm having trouble accessing my neural pathways right now. Please try again.",
      highlightedNodes: []
    };
  }
};

const getTopAuthors = (nodes: BrainNode[]) => {
  const authorCounts = nodes.reduce((acc, node) => {
    acc[node.author] = (acc[node.author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(authorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }));
};

const getConnectionTypeStats = (links: BookLink[]) => {
  const typeCounts = links.reduce((acc, link) => {
    acc[link.type] = (acc[link.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return typeCounts;
};

const generateMockResponse = (question: string, nodes: BrainNode[], links: BookLink[]): ChatBrainResponse => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('most connected') || lowerQuestion.includes('thematically connected')) {
    const connectionCounts = nodes.map(node => ({
      ...node,
      connectionCount: links.filter(link => link.fromId === node.id || link.toId === node.id).length
    })).sort((a, b) => b.connectionCount - a.connectionCount);
    
    const topConnected = connectionCounts.slice(0, 3);
    
    return {
      answer: `The most thematically connected books in your neural web are: ${topConnected.map(book => 
        `"${book.title}" by ${book.author} (${book.connectionCount} connections)`
      ).join(', ')}. These books serve as major hubs in your consciousness network, connecting multiple thematic streams including ${topConnected[0]?.thematicResonance.slice(0, 3).join(', ')}.`,
      highlightedNodes: topConnected.map(book => book.id)
    };
  }
  
  if (lowerQuestion.includes('1990') || lowerQuestion.includes('decade')) {
    const nineties = nodes.filter(node => 
      node.publicationYear && node.publicationYear >= 1990 && node.publicationYear < 2000
    );
    
    const themes = Array.from(new Set(nineties.flatMap(n => n.thematicResonance)));
    
    return {
      answer: `Your 1990s science fiction collection shows a fascinating concentration on ${themes.slice(0, 4).join(', ')}. Books like ${nineties.slice(0, 2).map(b => `"${b.title}"`).join(' and ')} represent the decade's exploration of emerging digital consciousness and cyberpunk aesthetics. This era in your library bridges the gap between analog and digital science fiction narratives.`,
      highlightedNodes: nineties.map(book => book.id)
    };
  }
  
  if (lowerQuestion.includes('connection') && (lowerQuestion.includes('neuromancer') || lowerQuestion.includes('dispossessed'))) {
    return {
      answer: `The connection between cyberpunk and utopian science fiction represents a fascinating dialectic in your neural map. While "Neuromancer" explores technological dystopia and digital consciousness, "The Dispossessed" examines social utopia and anarchist philosophy. Both books share the theme of questioning reality and social structures, creating a temporal bridge across different decades of science fiction thought.`,
      highlightedNodes: nodes.filter(n => 
        n.title.toLowerCase().includes('neuromancer') || 
        n.title.toLowerCase().includes('dispossessed')
      ).map(n => n.id)
    };
  }
  
  return {
    answer: `Your science fiction neural web contains ${nodes.length} consciousness nodes connected by ${links.length} synaptic pathways. The dominant themes include ${Array.from(new Set(nodes.flatMap(n => n.thematicResonance))).slice(0, 5).join(', ')}. This represents a living map of speculative thought spanning multiple decades of human imagination.`,
    highlightedNodes: []
  };
};
