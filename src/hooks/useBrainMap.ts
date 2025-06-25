
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
}

export interface BookLink {
  fromId: string;
  toId: string;
  type: 'tag_shared' | 'author_shared' | 'title_similarity' | 'manual';
  strength: number;
  sharedTags: string[];
  connectionReason: string;
}

export const useBrainMap = () => {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [links, setLinks] = useState<BookLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const generateOrganicConnections = (nodes: BrainNode[]): BookLink[] => {
    const connections: BookLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Tag-based connections (strongest)
        const sharedTags = node1.tags.filter(tag => node2.tags.includes(tag));
        if (sharedTags.length > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'tag_shared',
            strength: sharedTags.length * 2,
            sharedTags,
            connectionReason: `Shared themes: ${sharedTags.join(', ')}`
          });
        }
        
        // Author-based connections
        if (node1.author === node2.author && node1.author !== 'Unknown Author') {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'author_shared',
            strength: 1.5,
            sharedTags: [],
            connectionReason: `Same author: ${node1.author}`
          });
        }
        
        // Title similarity connections
        const title1Words = node1.title.toLowerCase().split(' ').filter(word => word.length > 3);
        const title2Words = node2.title.toLowerCase().split(' ').filter(word => word.length > 3);
        const sharedWords = title1Words.filter(word => title2Words.includes(word));
        
        if (sharedWords.length > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'title_similarity',
            strength: sharedWords.length * 0.8,
            sharedTags: [],
            connectionReason: `Similar titles: ${sharedWords.join(', ')}`
          });
        }
        
        // Organic random connections
        const existingConnections = connections.filter(conn => 
          conn.fromId === node1.id || conn.toId === node1.id ||
          conn.fromId === node2.id || conn.toId === node2.id
        );
        
        if (existingConnections.length < 2 && Math.random() < 0.15) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'manual',
            strength: 0.5,
            sharedTags: [],
            connectionReason: 'Thematic resonance'
          });
        }
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

        const userNodes: BrainNode[] = transmissions.map((transmission, index) => ({
          id: `transmission-${transmission.id}`,
          title: transmission.title || 'Unknown Title',
          author: transmission.author || 'Unknown Author',
          tags: Array.isArray(transmission.tags) ? transmission.tags : [],
          x: Math.random() * (window.innerWidth - 300) + 150,
          y: Math.random() * (window.innerHeight - 300) + 150,
          coverUrl: transmission.cover_url,
          description: transmission.notes,
          transmissionId: transmission.id
        }));

        setNodes(userNodes);

        const uniqueTags = Array.from(new Set(
          userNodes.flatMap(node => node.tags)
        )).filter(tag => tag && tag.trim() !== '').slice(0, 20);
        setAllTags(uniqueTags);

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

  const remapConnections = (focusTag?: string, activeFilters: string[] = []) => {
    let newConnections: BookLink[] = [];
    
    if (activeFilters.length > 0) {
      const filteredNodes = nodes.filter(node => 
        activeFilters.some(filter => node.tags.includes(filter))
      );
      
      newConnections = generateOrganicConnections(filteredNodes);
      
      if (focusTag) {
        const focusNodes = filteredNodes.filter(node => node.tags.includes(focusTag));
        for (let i = 0; i < focusNodes.length; i++) {
          for (let j = i + 1; j < focusNodes.length; j++) {
            const existingConnection = newConnections.find(conn =>
              (conn.fromId === focusNodes[i].id && conn.toId === focusNodes[j].id) ||
              (conn.fromId === focusNodes[j].id && conn.toId === focusNodes[i].id)
            );
            
            if (existingConnection) {
              existingConnection.strength += 1;
              existingConnection.connectionReason = `Enhanced by ${focusTag} filter`;
            } else {
              newConnections.push({
                fromId: focusNodes[i].id,
                toId: focusNodes[j].id,
                type: 'manual',
                strength: 2,
                sharedTags: [focusTag],
                connectionReason: `Connected by ${focusTag}`
              });
            }
          }
        }
      }
    } else {
      newConnections = generateOrganicConnections(nodes);
    }
    
    setLinks(newConnections);
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
