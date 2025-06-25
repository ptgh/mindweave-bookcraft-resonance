
import { useState, useEffect } from 'react';
import { getTransmissions, Transmission } from '@/services/transmissionsService';

export interface BrainNode {
  id: string;
  title: string;
  author: string;
  tags: string[];
  x: number;
  y: number;
  coverUrl?: string;
  description?: string;
  element?: HTMLElement;
  transmissionId: number;
  publicationYear?: number;
  thematicResonance: string[];
}

export interface BookLink {
  fromId: string;
  toId: string;
  type: 'temporal_bridge' | 'thematic_resonance' | 'author_consciousness' | 'conceptual_drift' | 'quantum_entanglement';
  strength: number;
  connectionReason: string;
  temporalDistance?: number;
  thematicOverlap?: string[];
}

export const useBrainMap = () => {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [links, setLinks] = useState<BookLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Enhanced thematic analysis
  const extractThematicResonance = (transmission: Transmission): string[] => {
    const themes: string[] = [];
    const title = transmission.title?.toLowerCase() || '';
    const author = transmission.author?.toLowerCase() || '';
    const notes = transmission.notes?.toLowerCase() || '';
    const tags = transmission.tags || [];
    
    const combinedText = `${title} ${author} ${notes} ${tags.join(' ')}`.toLowerCase();

    // Temporal themes
    if (/time|temporal|chronos|future|past|eternity/.test(combinedText)) themes.push('temporal_mechanics');
    if (/space|cosmic|galaxy|universe|stellar/.test(combinedText)) themes.push('cosmic_consciousness');
    if (/mind|consciousness|thought|mental|psychic/.test(combinedText)) themes.push('mind_exploration');
    if (/reality|simulation|virtual|matrix|perception/.test(combinedText)) themes.push('reality_questioning');
    if (/technology|ai|robot|cyber|digital/.test(combinedText)) themes.push('technological_singularity');
    if (/alien|extraterrestrial|contact|species|evolution/.test(combinedText)) themes.push('xenobiological_contact');
    if (/quantum|physics|science|experiment|theory/.test(combinedText)) themes.push('quantum_metaphysics');
    if (/society|dystopia|utopia|political|social/.test(combinedText)) themes.push('social_transformation');
    if (/war|conflict|battle|struggle|resistance/.test(combinedText)) themes.push('existential_conflict');
    if (/identity|self|human|humanity|being/.test(combinedText)) themes.push('identity_metamorphosis');
    if (/communication|language|symbol|meaning/.test(combinedText)) themes.push('linguistic_evolution');
    if (/death|immortal|life|existence|survival/.test(combinedText)) themes.push('mortality_transcendence');

    return themes.length > 0 ? themes : ['conceptual_drift'];
  };

  const generateOrganicConnections = (nodes: BrainNode[]): BookLink[] => {
    const connections: BookLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Temporal bridges - books close in publication years
        const year1 = node1.publicationYear || 2000;
        const year2 = node2.publicationYear || 2000;
        const temporalDistance = Math.abs(year1 - year2);
        
        if (temporalDistance <= 5) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'temporal_bridge',
            strength: 2.5 - (temporalDistance * 0.3),
            connectionReason: `Temporal synchronicity: ${year1}-${year2}`,
            temporalDistance
          });
        }
        
        // Thematic resonance - shared thematic elements
        const sharedThemes = node1.thematicResonance.filter(theme => 
          node2.thematicResonance.includes(theme)
        );
        
        if (sharedThemes.length > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'thematic_resonance',
            strength: sharedThemes.length * 1.8,
            connectionReason: `Thematic resonance: ${sharedThemes.slice(0, 2).join(', ')}`,
            thematicOverlap: sharedThemes
          });
        }
        
        // Author consciousness - same author
        if (node1.author === node2.author && node1.author !== 'Unknown Author') {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'author_consciousness',
            strength: 3.0,
            connectionReason: `Author consciousness: ${node1.author}`
          });
        }
        
        // Conceptual drift - title/concept similarities
        const title1Words = node1.title.toLowerCase().split(' ').filter(word => word.length > 3);
        const title2Words = node2.title.toLowerCase().split(' ').filter(word => word.length > 3);
        const conceptualOverlap = title1Words.filter(word => title2Words.includes(word));
        
        if (conceptualOverlap.length > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'conceptual_drift',
            strength: conceptualOverlap.length * 1.2,
            connectionReason: `Conceptual drift: ${conceptualOverlap.join(', ')}`
          });
        }
        
        // Quantum entanglement - mysterious connections for isolated nodes
        const node1Connections = connections.filter(conn => 
          conn.fromId === node1.id || conn.toId === node1.id
        );
        const node2Connections = connections.filter(conn => 
          conn.fromId === node2.id || conn.toId === node2.id
        );
        
        if (node1Connections.length < 2 && node2Connections.length < 2 && Math.random() < 0.25) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'quantum_entanglement',
            strength: 0.8,
            connectionReason: 'Quantum entanglement across the void'
          });
        }
      }
    }

    // Add temporal cascade connections - books that form chains through time
    const sortedByYear = [...nodes].sort((a, b) => (a.publicationYear || 2000) - (b.publicationYear || 2000));
    for (let i = 0; i < sortedByYear.length - 2; i++) {
      const currentNode = sortedByYear[i];
      const nextNode = sortedByYear[i + 1];
      const futureNode = sortedByYear[i + 2];
      
      // Create cascade if there's thematic continuity
      const currentThemes = currentNode.thematicResonance;
      const nextThemes = nextNode.thematicResonance;
      const futureThemes = futureNode.thematicResonance;
      
      const cascadeTheme = currentThemes.find(theme => 
        nextThemes.includes(theme) && futureThemes.includes(theme)
      );
      
      if (cascadeTheme && Math.random() < 0.4) {
        connections.push({
          fromId: currentNode.id,
          toId: futureNode.id,
          type: 'temporal_bridge',
          strength: 1.5,
          connectionReason: `Temporal cascade via ${cascadeTheme}`
        });
      }
    }

    return connections;
  };

  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const transmissions = await getTransmissions();
        
        if (!transmissions || transmissions.length === 0) {
          setLoading(false);
          return;
        }

        // Filter out young adult fiction and focus on science fiction
        const sciFiTransmissions = transmissions.filter(t => {
          const tags = t.tags || [];
          const combinedText = `${t.title} ${t.author} ${tags.join(' ')}`.toLowerCase();
          
          // Exclude young adult
          if (combinedText.includes('young adult') || combinedText.includes('ya fiction')) {
            return false;
          }
          
          // Include if it's science fiction or related
          return combinedText.includes('science fiction') || 
                 combinedText.includes('sci-fi') ||
                 combinedText.includes('speculative') ||
                 combinedText.includes('cyberpunk') ||
                 combinedText.includes('space opera') ||
                 tags.some(tag => 
                   ['science fiction', 'sci-fi', 'cyberpunk', 'space opera', 'dystopian', 'utopian', 'hard science fiction'].includes(tag.toLowerCase())
                 ) ||
                 // Include by default if no clear genre markers (assume curated sci-fi)
                 (!combinedText.includes('fantasy') && !combinedText.includes('romance'));
        });

        const userNodes: BrainNode[] = sciFiTransmissions.map((transmission, index) => {
          // Extract publication year from title or notes
          let publicationYear: number | undefined;
          const yearMatch = `${transmission.title} ${transmission.notes}`.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            publicationYear = parseInt(yearMatch[0]);
          }

          return {
            id: `transmission-${transmission.id}`,
            title: transmission.title || 'Unknown Title',
            author: transmission.author || 'Unknown Author',
            tags: Array.isArray(transmission.tags) ? 
              transmission.tags.filter(tag => !tag.toLowerCase().includes('young adult')) : 
              [],
            x: Math.random() * (window.innerWidth - 300) + 150,
            y: Math.random() * (window.innerHeight - 300) + 150,
            coverUrl: transmission.cover_url,
            description: transmission.notes,
            transmissionId: transmission.id,
            publicationYear,
            thematicResonance: extractThematicResonance(transmission)
          };
        });

        setNodes(userNodes);

        // Create more sophisticated tag list
        const thematicTags = Array.from(new Set(
          userNodes.flatMap(node => node.thematicResonance)
        )).slice(0, 12);
        
        setAllTags(thematicTags);

        const connections = generateOrganicConnections(userNodes);
        setLinks(connections);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing brain:', error);
        setError(error instanceof Error ? error.message : 'Failed to load transmissions');
        setLoading(false);
      }
    };

    initBrain();
  }, []);

  const remapConnections = (focusTheme?: string) => {
    if (focusTheme) {
      // Enhance connections for nodes with the focused theme
      const enhancedLinks = links.map(link => {
        const fromNode = nodes.find(n => n.id === link.fromId);
        const toNode = nodes.find(n => n.id === link.toId);
        
        if (fromNode && toNode && 
            (fromNode.thematicResonance.includes(focusTheme) || 
             toNode.thematicResonance.includes(focusTheme))) {
          return {
            ...link,
            strength: link.strength * 1.5,
            connectionReason: `${link.connectionReason} (enhanced by ${focusTheme})`
          };
        }
        return link;
      });
      
      setLinks(enhancedLinks);
    } else {
      // Regenerate all connections
      const newConnections = generateOrganicConnections(nodes);
      setLinks(newConnections);
    }
  };

  return {
    nodes,
    links,
    loading,
    error,
    allTags,
    remapConnections
  };
};
