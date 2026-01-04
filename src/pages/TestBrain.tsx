import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import BrainChatInterface from '@/components/BrainChatInterface';
import Header from '@/components/Header';
import NeuralMapHeader from '@/components/NeuralMapHeader';
import NeuralMapBottomSheet from '@/components/NeuralMapBottomSheet';
import NeuralMapLegend from '@/components/NeuralMapLegend';
import NeuralMapEmptyState from '@/components/NeuralMapEmptyState';
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations';
import { usePatternRecognition } from '@/hooks/usePatternRecognition';
import { useNeuralMapConnections, NeuralMapEdge } from '@/hooks/useNeuralMapConnections';
import { filterConceptualTags, CONCEPTUAL_TAGS } from '@/constants/conceptualTags';

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

export interface BrainNode {
  id: string;
  title: string;
  author: string;
  tags: string[];
  contextTags: string[];
  x: number;
  y: number;
  coverUrl?: string;
  description?: string;
  element?: HTMLElement;
  transmissionId: number;
}

interface NodeTooltip {
  node: BrainNode;
  x: number;
  y: number;
}

export interface BookLink {
  fromId: string;
  toId: string;
  type: 'tag_shared' | 'author_shared' | 'title_similarity' | 'manual';
  strength: number;
  sharedTags: string[];
  connectionReason: string;
}

const TestBrain = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [links, setLinks] = useState<BookLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<NodeTooltip | null>(null);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [remappingActive, setRemappingActive] = useState(false);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  
  // NEW: Focus mode state
  const [focusedBookId, setFocusedBookId] = useState<string | null>(null);
  
  // Initialize GSAP animations
  const { mainContainerRef } = useGSAPAnimations();
  
  // Pattern recognition
  const { clusters, bridges, getBookClusters } = usePatternRecognition(transmissions);
  
  // Performance optimization: track active particles
  const activeParticlesRef = useRef<number>(0);
  const MAX_PARTICLES = 80;
  const lastHoverTimeRef = useRef<Map<string, number>>(new Map());
  
  // Chat highlighting state
  const [chatHighlights, setChatHighlights] = useState<{
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  }>({ nodeIds: [], linkIds: [], tags: [] });
  
  // Occasional floating mini-card state
  const [floatingCard, setFloatingCard] = useState<{
    node: BrainNode;
    x: number;
    y: number;
  } | null>(null);

  // NEW: Compute visible nodes based on tag filter
  const visibleNodes = useMemo(() => {
    if (activeFilters.length === 0) return nodes;
    return nodes.filter(node => 
      activeFilters.some(filter => 
        node.tags.includes(filter) || node.contextTags.includes(filter)
      )
    );
  }, [nodes, activeFilters]);

  // NEW: Use the new connection hook for meaningful edges
  const {
    edges: computedEdges,
    getDirectNeighbors,
    getSecondDegreeNeighbors,
    getTopRelated,
    getConnectionBreakdown
  } = useNeuralMapConnections(visibleNodes, activeFilters.length > 0 ? activeFilters[0] : null);

  // NEW: Compute visible edges (sync with visibleNodes)
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return computedEdges.filter(edge => 
      visibleNodeIds.has(edge.fromId) && visibleNodeIds.has(edge.toId)
    );
  }, [computedEdges, visibleNodes]);

  // NEW: Sync links state with computed edges
  useEffect(() => {
    setLinks(visibleEdges as BookLink[]);
  }, [visibleEdges]);

  // Initialize brain data from user's transmissions only
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching transmissions...');
        const fetchedTransmissions = await getTransmissions();
        setTransmissions(fetchedTransmissions);
        
        console.log('User transmissions:', fetchedTransmissions);

        if (!fetchedTransmissions || fetchedTransmissions.length === 0) {
          console.log('No transmissions found');
          setLoading(false);
          return;
        }

        const userNodes: BrainNode[] = fetchedTransmissions.map((transmission, index) => ({
          id: `transmission-${transmission.id}`,
          title: transmission.title || 'Unknown Title',
          author: transmission.author || 'Unknown Author',
          tags: filterConceptualTags(Array.isArray(transmission.tags) ? transmission.tags : []),
          contextTags: Array.isArray(transmission.historical_context_tags) ? transmission.historical_context_tags : [],
          x: Math.random() * (window.innerWidth - 300) + 150,
          y: Math.random() * (window.innerHeight - 300) + 150,
          coverUrl: transmission.cover_url,
          description: transmission.notes,
          transmissionId: transmission.id
        }));

        console.log('Created nodes:', userNodes);
        setNodes(userNodes);

        // Show conceptual tags that are actually used in books
        // This makes the tag bar more relevant to the user's collection
        const usedTags = Array.from(new Set(
          userNodes.flatMap(node => node.tags)
        )).filter(tag => tag && tag.trim() !== '');
        
        // Sort tags by frequency (most used first)
        const tagCounts = new Map<string, number>();
        userNodes.forEach(node => {
          node.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });
        const sortedTags = usedTags.sort((a, b) => 
          (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0)
        );
        
        setAllTags(sortedTags);

        // Connections are now computed by useNeuralMapConnections hook
        // No need to set links here - the hook handles it

        setLoading(false);
      } catch (error) {
        console.error('Error initializing brain:', error);
        setError(error instanceof Error ? error.message : 'Failed to load transmissions');
        setLoading(false);
      }
    };

    initBrain();
  }, []);

  // Track which cards have been shown to avoid repetition
  const [shownCardIds, setShownCardIds] = useState<Set<string>>(new Set());

  // Occasional floating mini-card - show random book cards subtly every 15-25 seconds
  useEffect(() => {
    if (nodes.length === 0 || loading) return;
    
    const showRandomCard = () => {
      // Only show if no tooltip or modal is active
      if (tooltip || selectedNode) return;
      
      // Get nodes that haven't been shown yet
      let availableNodes = nodes.filter(n => !shownCardIds.has(n.id));
      
      // If all nodes have been shown, reset the tracking
      if (availableNodes.length === 0) {
        setShownCardIds(new Set());
        availableNodes = nodes;
      }
      
      // Pick a random node from available ones
      const randomNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
      const canvas = canvasRef.current;
      if (!randomNode || !canvas) return;
      
      // Mark this node as shown
      setShownCardIds(prev => new Set([...prev, randomNode.id]));
      
      // Position near the node but with some randomness
      const canvasRect = canvas.getBoundingClientRect();
      const x = Math.min(Math.max(randomNode.x, 120), canvasRect.width - 120);
      const y = Math.min(Math.max(randomNode.y - 80, 100), canvasRect.height - 150);
      
      setFloatingCard({ node: randomNode, x, y });
      
      // Auto-hide after 4 seconds
      setTimeout(() => setFloatingCard(null), 4000);
    };
    
    // Show first card after 8 seconds, then every 15-25 seconds
    const initialDelay = setTimeout(showRandomCard, 8000);
    const interval = setInterval(() => {
      if (Math.random() < 0.6) showRandomCard(); // 60% chance to show
    }, 18000 + Math.random() * 7000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [nodes, loading, tooltip, selectedNode, shownCardIds]);

  const generateOrganicConnections = (nodes: BrainNode[]): BookLink[] => {
    const connections: BookLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        let totalStrength = 0;
        let connectionReasons: string[] = [];
        let allSharedItems: string[] = [];
        
        // Conceptual tag connections (highest priority)
        const sharedConceptualTags = node1.tags.filter(tag => node2.tags.includes(tag));
        if (sharedConceptualTags.length > 0) {
          totalStrength += sharedConceptualTags.length * 2.0;
          allSharedItems.push(...sharedConceptualTags);
          connectionReasons.push(`Conceptual: ${sharedConceptualTags.slice(0, 2).join(', ')}`);
        }
        
        // Context tag connections (medium priority)
        const sharedContextTags = node1.contextTags.filter(tag => node2.contextTags.includes(tag));
        if (sharedContextTags.length > 0) {
          totalStrength += sharedContextTags.length * 1.5;
          allSharedItems.push(...sharedContextTags);
          connectionReasons.push(`Context: ${sharedContextTags.slice(0, 2).join(', ')}`);
        }
        
        // Cross-taxonomy bonus
        if (sharedConceptualTags.length > 0 && sharedContextTags.length > 0) {
          totalStrength += 0.5;
        }
        
        // Create connection if taxonomies match
        if (totalStrength > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'tag_shared',
            strength: totalStrength,
            sharedTags: allSharedItems,
            connectionReason: connectionReasons.join(' • ')
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
        
        // Title similarity connections (for series, similar themes)
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
        
        // Create some organic random connections for books with few connections
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

  // Optimized synaptic firing with particle limiting
  const triggerSynapticFiring = (sourceNode: BrainNode) => {
    // Check particle limit
    if (activeParticlesRef.current >= MAX_PARTICLES) return;
    
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    // Limit to 3 most relevant links
    const limitedLinks = relatedLinks.slice(0, 3);

    limitedLinks.forEach((link, index) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Reduced waves and particles
      for (let wave = 0; wave < 2; wave++) {
        setTimeout(() => {
          // Check again before creating wave
          if (activeParticlesRef.current >= MAX_PARTICLES) return;
          
          for (let i = 0; i < 3; i++) {
            activeParticlesRef.current++;
            const particle = document.createElement('div');
            particle.className = 'neural-particle';
            
            const colors = ['#00ffff', '#40e0d0', '#00d4ff', '#0099ff', '#7df9ff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particleSize = 1 + Math.random() * 2;
            const glowIntensity = 6 + Math.random() * 8;
            
            particle.style.cssText = `
              position: absolute;
              width: ${particleSize}px;
              height: ${particleSize}px;
              background: radial-gradient(circle, ${color} 0%, ${color}80 40%, transparent 70%);
              border-radius: 50%;
              box-shadow: 
                0 0 ${glowIntensity}px ${color},
                0 0 ${glowIntensity * 2}px ${color}80,
                0 0 ${glowIntensity * 3}px ${color}40,
                inset 0 0 ${glowIntensity / 2}px ${color};
              z-index: 20;
              pointer-events: none;
              opacity: ${0.8 + Math.random() * 0.2};
              will-change: transform;
            `;
            
            canvasRef.current?.appendChild(particle);

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const curvature = 0.6 + Math.random() * 0.8;
            const midX1 = fromNode.x + dx * 0.2 + (Math.random() - 0.5) * distance * curvature;
            const midY1 = fromNode.y + dy * 0.2 + (Math.random() - 0.5) * distance * curvature;
            const midX2 = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * curvature * 0.8;
            const midY2 = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * curvature * 0.8;
            const midX3 = fromNode.x + dx * 0.8 + (Math.random() - 0.5) * distance * curvature * 0.6;
            const midY3 = fromNode.y + dy * 0.8 + (Math.random() - 0.5) * distance * curvature * 0.6;
            
            const pathData = `M${fromNode.x + 3},${fromNode.y + 3} C${midX1},${midY1} ${midX2},${midY2} ${midX3},${midY3} L${toNode.x + 3},${toNode.y + 3}`;
            
            gsap.set(particle, {
              x: fromNode.x + 3,
              y: fromNode.y + 3,
              scale: 0.2
            });

            const tl = gsap.timeline({
              onComplete: () => {
                activeParticlesRef.current--;
              }
            });
            
            tl.to(particle, {
              scale: 1.5 + Math.random() * 0.8,
              duration: 0.3,
              ease: "power2.out"
            })
            .to(particle, {
              motionPath: {
                path: pathData,
                autoRotate: false
              },
              duration: 1.8 + Math.random() * 1.2,
              ease: "power1.inOut",
              onComplete: () => {
                if (toNode.element) {
                  gsap.to(toNode.element, {
                    scale: 2.5,
                    boxShadow: `0 0 30px ${color}, 0 0 60px ${color}60`,
                    duration: 0.2,
                    ease: "power3.out",
                    yoyo: true,
                    repeat: 1
                  });
                  
                  gsap.to(toNode.element, {
                    scale: 1,
                    boxShadow: '0 0 12px rgba(0, 212, 255, 0.9), 0 0 24px rgba(0, 212, 255, 0.6)',
                    duration: 0.8,
                    delay: 0.4,
                    ease: "elastic.out(1, 0.6)"
                  });
                }
                particle.remove();
              }
            }, "<0.3")
            .to(particle, {
              scale: 0.3,
              opacity: 0.9,
              duration: 0.4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: 2
            }, "<");
          }
        }, wave * 200);
      }
    });
  };

  // Optimized ambient energy flow
  const createAmbientEnergyFlow = () => {
    if (!canvasRef.current || links.length === 0) return;
    if (activeParticlesRef.current >= MAX_PARTICLES) return;

    const link = links[Math.floor(Math.random() * links.length)];
    const fromNode = nodes.find(n => n.id === link.fromId);
    const toNode = nodes.find(n => n.id === link.toId);
    
    if (!fromNode || !toNode) return;

    activeParticlesRef.current++;
    const ambientParticle = document.createElement('div');
    const color = '#00d4ff40';
    ambientParticle.style.cssText = `
      position: absolute;
      width: 0.8px;
      height: 0.8px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 4px ${color};
      z-index: 15;
      pointer-events: none;
      opacity: 0.6;
      will-change: transform;
    `;
    
    canvasRef.current.appendChild(ambientParticle);

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * 0.3;
    const midY = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * 0.3;
    
    const pathData = `M${fromNode.x + 2},${fromNode.y + 2} Q${midX},${midY} ${toNode.x + 2},${toNode.y + 2}`;

    gsap.set(ambientParticle, { x: fromNode.x + 2, y: fromNode.y + 2 });
    gsap.to(ambientParticle, {
      motionPath: {
        path: pathData,
        autoRotate: false
      },
      duration: 8 + Math.random() * 4,
      ease: "none",
      onComplete: () => {
        ambientParticle.remove();
        activeParticlesRef.current--;
      }
    });
  };

  // Create and animate nodes with more organic behavior
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create dynamic thought nodes
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      
      // Dynamic node characteristics based on connections and activity
      const nodeConnections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      
      // Book-like visual representation based on connection count
      const connectionTier = nodeConnections <= 2 ? 'basic' : nodeConnections <= 5 ? 'medium' : 'high';
      const baseSize = connectionTier === 'basic' ? 6 : connectionTier === 'medium' ? 8 : 10;
      const isHighActivity = nodeConnections > 2;
      
      // Pattern recognition: check if node belongs to clusters
      const nodeClusters = getBookClusters(node.id.replace('transmission-', ''));
      const hasCluster = nodeClusters.length > 0;
      
      // Color-code by cluster theme (subtle)
      let clusterColor = '#00d4ff'; // default blue
      if (hasCluster && nodeClusters[0]) {
        // Assign colors based on cluster theme (subtle variations)
        const themeHash = nodeClusters[0].theme.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = (themeHash * 137.508) % 360; // Golden angle for distribution
        clusterColor = `hsl(${hue}, 70%, 60%)`;
      }
      
      // Check if node is highlighted by chat
      const isHighlighted = chatHighlights.nodeIds.includes(node.id);
      const highlightColor = isHighlighted ? '#ff6b6b' : clusterColor;
      const highlightIntensity = isHighlighted ? 1.5 : 1;
      
      // Enhanced book-like visual with rings based on connection tier
      const ringStyles = connectionTier === 'high' 
        ? `0 0 0 2px ${highlightColor}40, 0 0 0 5px ${highlightColor}20, 0 0 0 8px ${highlightColor}10`
        : connectionTier === 'medium'
        ? `0 0 0 2px ${highlightColor}30, 0 0 0 4px ${highlightColor}15`
        : '';
      
      // Book-spine gradient for high-activity nodes
      const bookGradient = connectionTier === 'high'
        ? `linear-gradient(180deg, ${highlightColor} 0%, ${highlightColor}80 20%, ${highlightColor}40 80%, ${highlightColor} 100%)`
        : `radial-gradient(circle, ${highlightColor} 0%, ${isHighActivity ? '#00d4ff' : '#0099cc'} 60%, ${isHighActivity ? '#0099cc40' : '#00669940'} 100%)`;

      nodeElement.style.cssText = `
        position: absolute;
        width: ${baseSize * (isHighlighted ? 1.3 : 1)}px;
        height: ${baseSize * (isHighlighted ? 1.3 : 1)}px;
        background: ${bookGradient};
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 
          ${ringStyles ? ringStyles + ',' : ''}
          0 0 ${baseSize * 2 * highlightIntensity}px ${highlightColor}90,
          0 0 ${baseSize * 4 * highlightIntensity}px ${highlightColor}50,
          0 0 ${baseSize * 6 * highlightIntensity}px ${highlightColor}20,
          inset 0 0 ${baseSize}px ${highlightColor}30;
        opacity: 0;
        z-index: 10;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        border: 1px solid ${highlightColor}80;
        will-change: transform, opacity;
      `;
      
      // Add invisible hit area for easier clicking (min 44px for touch)
      const hitArea = document.createElement('div');
      hitArea.className = 'node-hit-area';
      hitArea.style.cssText = `
        position: absolute;
        width: 44px;
        height: 44px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        cursor: pointer;
        z-index: 11;
      `;
      nodeElement.appendChild(hitArea);

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      // Debounced tooltip with stable positioning
      let tooltipTimeout: NodeJS.Timeout | null = null;
      
      const showTooltip = () => {
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Fixed position relative to node
        let tooltipX = rect.left - canvasRect.left + rect.width / 2;
        let tooltipY = rect.top - canvasRect.top - 15;
        
        if (tooltipX < 150) tooltipX = 150;
        if (tooltipX > window.innerWidth - 150) tooltipX = window.innerWidth - 150;
        if (tooltipY < 80) tooltipY = rect.bottom - canvasRect.top + 15;
        
        setTooltip({
          node,
          x: tooltipX,
          y: tooltipY
        });
      };

      nodeElement.addEventListener('mouseenter', (e) => {
        // Throttle hover events - only trigger once per 500ms per node
        const now = Date.now();
        const lastHover = lastHoverTimeRef.current.get(node.id) || 0;
        const shouldTrigger = now - lastHover > 500;
        
        // Debounce tooltip appearance (100ms) for stability
        tooltipTimeout = setTimeout(showTooltip, 100);
        
        // STABILITY FIX: Kill all ongoing animations to freeze the node in place
        gsap.killTweensOf(nodeElement);
        
        // Set stable hover state
        gsap.to(nodeElement, {
          scale: 2.5,
          opacity: 1,
          boxShadow: `
            0 0 ${baseSize * 4}px #00ffff,
            0 0 ${baseSize * 8}px #00ffff80,
            0 0 ${baseSize * 12}px #00ffff40
          `,
          duration: 0.2,
          ease: "power2.out"
        });

        if (shouldTrigger) {
          lastHoverTimeRef.current.set(node.id, now);
          triggerSynapticFiring(node);
        }
      });

      nodeElement.addEventListener('mouseleave', () => {
        // Clear tooltip timeout
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        
        // Don't hide tooltip if this node is selected
        if (selectedNode?.id !== node.id) {
          setTooltip(null);
        }
        
        // Restore base state
        gsap.to(nodeElement, {
          scale: selectedNode?.id === node.id ? 2 : 1,
          boxShadow: selectedNode?.id === node.id 
            ? `0 0 ${baseSize * 6}px #00ffff, 0 0 ${baseSize * 12}px #00ffff60`
            : `
              ${ringStyles ? ringStyles + ',' : ''}
              0 0 ${baseSize * 2 * highlightIntensity}px ${highlightColor}90,
              0 0 ${baseSize * 4 * highlightIntensity}px ${highlightColor}50,
              0 0 ${baseSize * 6 * highlightIntensity}px ${highlightColor}20
            `,
          duration: 0.3
        });
        
        // STABILITY FIX: Restart gentle animations with reduced range
        gsap.to(nodeElement, {
          x: `+=${Math.random() * 10 - 5}`,
          y: `+=${Math.random() * 10 - 5}`,
          duration: 6 + Math.random() * 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.5
        });
        
        // Restart breathing pulse
        gsap.to(nodeElement, {
          scale: (1.3 + Math.random() * 0.4) * (isHighlighted ? 1.2 : 1),
          opacity: 0.7 + Math.random() * 0.2,
          duration: 3 + Math.random() * 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.5
        });
      });

      // Click/touch handler for selection and preview modal
      const handleNodeSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedNode(node);
        setTooltip(null); // Hide tooltip when modal opens
        
        // Visual feedback for selection
        gsap.to(nodeElement, {
          scale: 5,
          boxShadow: `0 0 ${baseSize * 10}px #00ffff, 0 0 ${baseSize * 20}px #00ffff80`,
          duration: 0.3,
          ease: "back.out(2)"
        });
        
        triggerSynapticFiring(node);
      };

      nodeElement.addEventListener('click', handleNodeSelect);
      nodeElement.addEventListener('touchend', handleNodeSelect, { passive: false });

      canvas.appendChild(nodeElement);

      // Enhanced appearance animation with staggered emergence
      gsap.timeline({ delay: index * 0.12 })
        .from(nodeElement, {
          scale: 0,
          opacity: 0,
          duration: 0.8,
          ease: "back.out(2)"
        })
        .to(nodeElement, {
          opacity: 1,
          duration: 0.4
        }, "<0.3");

      // More organic floating with reduced movement for stability
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 10 - 5}`,
        y: `+=${Math.random() * 10 - 5}`,
        duration: 8 + Math.random() * 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing pulse with variation
      gsap.to(nodeElement, {
        scale: (1.3 + Math.random() * 0.4) * (isHighlighted ? 1.2 : 1),
        opacity: 0.7 + Math.random() * 0.2,
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });

      // Reduced spontaneous activity bursts
      if (isHighActivity) {
        const burstInterval = setInterval(() => {
          if (Math.random() < 0.2 && activeParticlesRef.current < MAX_PARTICLES) {
            gsap.to(nodeElement, {
              boxShadow: `
                0 0 ${baseSize * 8}px #00ffff,
                0 0 ${baseSize * 16}px #00ffff60,
                0 0 ${baseSize * 24}px #00ffff30
              `,
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              ease: "sine.inOut"
            });
            
            if (Math.random() < 0.3) {
              triggerSynapticFiring(node);
            }
          }
        }, 5000 + Math.random() * 10000);
        
        // Clean up interval when component unmounts
        setTimeout(() => clearInterval(burstInterval), 300000);
      }
    });

    // Draw enhanced neural pathways
    drawLivingConnections(svg, nodes, links);

    // Reduced ambient energy flow frequency
    const ambientFlowInterval = setInterval(createAmbientEnergyFlow, 4000 + Math.random() * 4000);
    
    return () => {
      clearInterval(ambientFlowInterval);
      // Reset particle counter on cleanup
      activeParticlesRef.current = 0;
    };

  }, [nodes, links, chatHighlights, selectedNode]);

  const drawLivingConnections = (svg: SVGSVGElement, nodes: BrainNode[], connections: BookLink[]) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    `;

    // Enhanced gradient and filter definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Create multiple glow filters for different effects
    const createGlowFilter = (id: string, blur: number, intensity: number) => {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', id);
      filter.setAttribute('x', '-200%');
      filter.setAttribute('y', '-200%');
      filter.setAttribute('width', '500%');
      filter.setAttribute('height', '500%');

      const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feGaussianBlur.setAttribute('stdDeviation', blur.toString());
      feGaussianBlur.setAttribute('result', 'coloredBlur');

      const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      feMergeNode1.setAttribute('in', 'coloredBlur');
      const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      feMergeNode2.setAttribute('in', 'SourceGraphic');

      feMerge.appendChild(feMergeNode1);
      feMerge.appendChild(feMergeNode2);
      filter.appendChild(feGaussianBlur);
      filter.appendChild(feMerge);
      return filter;
    };

    defs.appendChild(createGlowFilter('neural-glow-soft', 2, 0.8));
    defs.appendChild(createGlowFilter('neural-glow-strong', 3, 1.2));
    defs.appendChild(createGlowFilter('neural-glow-intense', 4, 1.8));
    svg.appendChild(defs);

    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      
      if (!fromNode || !toNode) return;

      // Create highly organic curved pathways
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // More complex control points for natural neural pathways
      const curveFactor = 0.4 + Math.random() * 0.6;
      const cp1X = fromNode.x + dx * 0.15 + (Math.random() - 0.5) * distance * curveFactor;
      const cp1Y = fromNode.y + dy * 0.15 + (Math.random() - 0.5) * distance * curveFactor;
      const cp2X = fromNode.x + dx * 0.4 + (Math.random() - 0.5) * distance * curveFactor * 0.8;
      const cp2Y = fromNode.y + dy * 0.4 + (Math.random() - 0.5) * distance * curveFactor * 0.8;
      const cp3X = fromNode.x + dx * 0.7 + (Math.random() - 0.5) * distance * curveFactor * 0.6;
      const cp3Y = fromNode.y + dy * 0.7 + (Math.random() - 0.5) * distance * curveFactor * 0.6;
      const cp4X = fromNode.x + dx * 0.9 + (Math.random() - 0.5) * distance * curveFactor * 0.3;
      const cp4Y = fromNode.y + dy * 0.9 + (Math.random() - 0.5) * distance * curveFactor * 0.3;

      const pathData = `M${fromNode.x + 2},${fromNode.y + 2} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${cp3X},${cp3Y} C${cp3X},${cp3Y} ${cp4X},${cp4Y} ${toNode.x + 2},${toNode.y + 2}`;

      // Dynamic gradient based on connection strength and type
      const gradientId = `neural-gradient-${index}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      // NEW: Score-based styling (preserving Leafnode aesthetic)
      const getConnectionStyle = (conn: BookLink) => {
        // Cast to NeuralMapEdge if it has score/reasons
        const edge = conn as any;
        const score = edge.score || (conn.strength * 50); // Fallback for legacy
        const reasons = edge.reasons || [];
        
        // Base colors - keeping Leafnode cyan/teal aesthetic
        const baseColors = ['#00ffff', '#40e0d0', '#00d4ff'];
        
        // Intensity based on score (10-100+ mapped to 0.4-1.0)
        const intensity = Math.min(0.4 + (score / 100) * 0.6, 1.0);
        
        // Filter based on score
        let filter = 'neural-glow-soft';
        if (score >= 60) filter = 'neural-glow-intense';
        else if (score >= 30) filter = 'neural-glow-strong';
        
        // Slightly warmer tint for same_author (subtle, not rainbow)
        let colors = baseColors;
        if (reasons.includes('same_author')) {
          colors = ['#00e5ff', '#40f0e0', '#00e0ff']; // Slightly brighter cyan
        }
        
        // Check if era connection (for dashed styling)
        const isEraConnection = reasons.includes('shared_era');
        
        return { 
          colors, 
          intensity,
          filter,
          isEraConnection,
          score
        };
      };

      const style = getConnectionStyle(connection);
      
      // Create flowing gradient with multiple color stops
      const stops = [
        { offset: '0%', color: `${style.colors[0]}20`, opacity: '0.3' },
        { offset: '15%', color: `${style.colors[1]}40`, opacity: `${style.intensity * 0.4}` },
        { offset: '35%', color: `${style.colors[0]}`, opacity: `${style.intensity * 0.8}` },
        { offset: '50%', color: `${style.colors[2]}`, opacity: `${style.intensity}` },
        { offset: '65%', color: `${style.colors[0]}`, opacity: `${style.intensity * 0.8}` },
        { offset: '85%', color: `${style.colors[1]}40`, opacity: `${style.intensity * 0.4}` },
        { offset: '100%', color: `${style.colors[0]}20`, opacity: '0.3' }
      ];

      stops.forEach(stop => {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
        stopElement.setAttribute('stop-opacity', stop.opacity);
        gradient.appendChild(stopElement);
      });

      defs.appendChild(gradient);

      // Create main neural pathway - width based on score
      const scoreNormalized = Math.min(style.score / 100, 1); // 0-1 range
      const baseWidth = Math.max(0.3, Math.min(0.3 + scoreNormalized * 0.8, 1.1));
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', baseWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', `url(#${style.filter})`);
      path.setAttribute('stroke-linecap', 'round');
      
      // NEW: Dashed line for era connections
      if (style.isEraConnection) {
        path.setAttribute('stroke-dasharray', '4 3');
      }
      
      svg.appendChild(path);

      // Enhanced appearance with organic timing
      gsap.to(path, {
        opacity: style.intensity * (style.score > 30 ? 1 : 0.8),
        duration: 2.5 + Math.random() * 1.5,
        delay: index * 0.08 + Math.random() * 0.5,
        ease: "power2.out"
      });

      // Living pulsing animation with natural variation
      gsap.to(path, {
        opacity: style.intensity * 1.2,
        strokeWidth: baseWidth * (1.5 + scoreNormalized * 0.5),
        duration: 3 + Math.random() * 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 4
      });

      // Optimized energy streams for stronger connections (based on score now)
      if (style.score > 30 && activeParticlesRef.current < MAX_PARTICLES) {
        setTimeout(() => {
          const createEnergyStream = () => {
            if (activeParticlesRef.current >= MAX_PARTICLES) return;
            
            // Reduced particle count - max 2 streams
            const streamCount = Math.min(Math.floor(style.score / 40) + 1, 2);
            for (let stream = 0; stream < streamCount; stream++) {
              activeParticlesRef.current++;
              const energyParticle = document.createElement('div');
              energyParticle.style.cssText = `
                position: absolute;
                width: 1.2px;
                height: 1.2px;
                background: ${style.colors[stream % style.colors.length]};
                border-radius: 50%;
                box-shadow: 0 0 4px ${style.colors[stream % style.colors.length]};
                z-index: 12;
                pointer-events: none;
                opacity: ${style.intensity * 0.9};
                will-change: transform;
              `;
              canvasRef.current?.appendChild(energyParticle);

              gsap.set(energyParticle, { x: fromNode.x + 2, y: fromNode.y + 2 });
              gsap.to(energyParticle, {
                motionPath: {
                  path: pathData,
                  autoRotate: false
                },
                duration: 5 + Math.random() * 4,
                ease: "none",
                delay: stream * 0.8,
                onComplete: () => {
                  energyParticle.remove();
                  activeParticlesRef.current--;
                }
              });
            }
          };

          createEnergyStream();
          
          // Less frequent repeat streams
          setInterval(createEnergyStream, 12000 + Math.random() * 6000);
        }, Math.random() * 5000);
      }
    });
  };

  const handleTagFilter = (tag: string) => {
    setRemappingActive(true);
    
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter(f => f !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
    
    setTimeout(() => {
      remapConnections(tag);
      setRemappingActive(false);
    }, 300);
  };

  const handleClearFilters = () => {
    setRemappingActive(true);
    setActiveFilters([]);
    setTimeout(() => {
      remapConnections();
      setRemappingActive(false);
    }, 300);
  };

  const remapConnections = (focusTag?: string) => {
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

  // Apply opacity based on filters AND focus mode
  useEffect(() => {
    if (!canvasRef.current) return;

    const thoughtNodes = canvasRef.current.querySelectorAll('.thought-node');
    
    // Get focus mode neighbors
    const directNeighbors = focusedBookId ? new Set(getDirectNeighbors(focusedBookId)) : null;
    const secondDegreeNeighbors = focusedBookId ? new Set(getSecondDegreeNeighbors(focusedBookId)) : null;
    
    thoughtNodes.forEach((nodeElement) => {
      const nodeData = (nodeElement as any).nodeData as BrainNode;
      
      // First check tag filter
      const isVisibleByFilter = activeFilters.length === 0 || 
        activeFilters.some(filter => nodeData.tags.includes(filter) || nodeData.contextTags.includes(filter));

      // Then apply focus mode opacity if active
      let targetOpacity = 1;
      let targetScale = 1;
      
      if (!isVisibleByFilter) {
        targetOpacity = 0.15;
        targetScale = 0.7;
      } else if (focusedBookId) {
        if (nodeData.id === focusedBookId) {
          targetOpacity = 1;
          targetScale = 1.2;
        } else if (directNeighbors?.has(nodeData.id)) {
          targetOpacity = 1;
          targetScale = 1;
        } else if (secondDegreeNeighbors?.has(nodeData.id)) {
          targetOpacity = 0.6;
          targetScale = 0.9;
        } else {
          targetOpacity = 0.15;
          targetScale = 0.7;
        }
      }

      gsap.to(nodeElement, {
        opacity: targetOpacity,
        scale: targetScale,
        duration: 0.5,
        ease: "power2.out"
      });
    });
  }, [activeFilters, focusedBookId, getDirectNeighbors, getSecondDegreeNeighbors]);

  useEffect(() => {
    if (!remappingActive) {
      remapConnections();
    }
  }, [activeFilters, nodes]);

  // Handle chat highlights
  const handleChatHighlight = (highlights: { nodeIds: string[]; linkIds: string[]; tags: string[] }) => {
    setChatHighlights(highlights);
    
    // Trigger synaptic firing for highlighted nodes
    highlights.nodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setTimeout(() => triggerSynapticFiring(node), Math.random() * 1000);
      }
    });

    // Clear highlights after 10 seconds
    setTimeout(() => {
      setChatHighlights({ nodeIds: [], linkIds: [], tags: [] });
    }, 10000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse" />
            <p className="text-slate-300 text-lg font-medium mb-2">Initializing Neural Consciousness</p>
            <p className="text-slate-400 text-sm">Mapping your literary connections...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-400 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-red-400/20" />
            </div>
            <p className="text-slate-300 text-lg font-medium mb-2">Signal Interrupted</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all"
            >
              Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
            </div>
            <p className="text-slate-300 text-lg font-medium mb-2">No Signals Detected</p>
            <p className="text-slate-400 text-sm">Add transmissions to your collection to visualize the neural network</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mainContainerRef} className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Header />
      
      <NeuralMapHeader
        nodeCount={nodes.length}
        linkCount={links.length}
        activeFilters={activeFilters}
        allTags={allTags}
        onTagFilter={handleTagFilter}
        onClearFilters={handleClearFilters}
        chatHighlights={chatHighlights}
        focusedBookId={focusedBookId}
        onExitFocus={() => setFocusedBookId(null)}
        visibleNodeCount={visibleNodes.length}
        visibleEdgeCount={visibleEdges.length}
      />
      
      <div className="fixed top-[60px] left-0 right-0 bottom-0">
        <div 
          ref={canvasRef}
          className="brain-canvas absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
        
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />

        {remappingActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            {/* Neural network animation background */}
            <svg className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 w-48 h-48" viewBox="0 0 200 200">
              {/* Animated nodes */}
              <circle cx="100" cy="50" r="3" fill="#22d3ee" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="70" cy="100" r="3" fill="#22d3ee" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="130" cy="100" r="3" fill="#22d3ee" opacity="0.7">
                <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="150" r="3" fill="#22d3ee" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
              </circle>
              
              {/* Animated connecting lines */}
              <line x1="100" y1="50" x2="70" y2="100" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="100" y1="50" x2="130" y2="100" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.3s" repeatCount="indefinite" />
              </line>
              <line x1="70" y1="100" x2="130" y2="100" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.15;0.6;0.15" dur="2.5s" repeatCount="indefinite" />
              </line>
              <line x1="70" y1="100" x2="100" y2="150" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.9s" repeatCount="indefinite" />
              </line>
              <line x1="130" y1="100" x2="100" y2="150" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.1s" repeatCount="indefinite" />
              </line>
            </svg>
            
            <div className="bg-slate-800/95 backdrop-blur-sm border border-cyan-400/50 rounded-lg px-6 py-3 shadow-2xl relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-sm font-medium">Remapping</span>
              </div>
            </div>
          </div>
        )}

        {tooltip && (
          <div 
            className="absolute z-30 pointer-events-none"
            style={{ 
              left: tooltip.x - 100, 
              top: tooltip.y,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Unified translucent card style - matches floating card */}
            <div className="relative bg-slate-900/40 backdrop-blur-md border border-cyan-400/20 rounded-xl p-3 max-w-[220px] shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <div className="flex items-center space-x-3">
                {tooltip.node.coverUrl && (
                  <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-cyan-400/25">
                    <img 
                      src={tooltip.node.coverUrl} 
                      alt={tooltip.node.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-100 text-sm leading-tight line-clamp-2">
                    {tooltip.node.title}
                  </h4>
                  <p className="text-xs text-cyan-400/70 mt-0.5">
                    {tooltip.node.author}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300/60 mt-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full"></div>
                    <span>{links.filter(link => link.fromId === tooltip.node.id || link.toId === tooltip.node.id).length} connections</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Occasional floating mini-card - unified translucent style */}
      {floatingCard && !tooltip && !selectedNode && (
        <div 
          className="absolute z-25 animate-fade-in cursor-pointer"
          style={{ 
            left: floatingCard.x, 
            top: floatingCard.y,
            transform: 'translateX(-50%)'
          }}
          onClick={() => {
            setSelectedNode(floatingCard.node);
            setFloatingCard(null);
          }}
        >
          <div className="relative bg-slate-900/40 backdrop-blur-md border border-cyan-400/20 rounded-xl p-3 max-w-[220px] shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-200 hover:bg-slate-900/50 hover:border-cyan-400/30 hover:scale-105">
            <div className="flex items-center space-x-3">
              {floatingCard.node.coverUrl && (
                <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-cyan-400/25">
                  <img 
                    src={floatingCard.node.coverUrl} 
                    alt={floatingCard.node.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-100 text-sm leading-tight line-clamp-2">
                  {floatingCard.node.title}
                </h4>
                <p className="text-xs text-cyan-400/70 mt-0.5">
                  {floatingCard.node.author}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-cyan-300/60 mt-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full"></div>
                  <span>{links.filter(link => link.fromId === floatingCard.node.id || link.toId === floatingCard.node.id).length} connections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Neural Assistant - Single unified chat interface */}
      <BrainChatInterface
        nodes={nodes}
        links={links}
        activeFilters={activeFilters}
        onHighlight={handleChatHighlight}
      />

      {/* Legend */}
      <NeuralMapLegend nodeCount={visibleNodes.length} edgeCount={visibleEdges.length} />

      {/* Empty/Sparse States */}
      <NeuralMapEmptyState 
        nodeCount={visibleNodes.length} 
        edgeCount={visibleEdges.length} 
        isFiltered={activeFilters.length > 0}
        onClearFilter={handleClearFilters}
      />

      {/* Neural Map Bottom Sheet (replaces old modal) */}
      {selectedNode && (
        <NeuralMapBottomSheet
          node={selectedNode}
          allNodes={nodes}
          connectionBreakdown={getConnectionBreakdown(selectedNode.id)}
          topRelated={getTopRelated(selectedNode.id, 4)}
          onClose={() => setSelectedNode(null)}
          onFocusNetwork={() => {
            setFocusedBookId(selectedNode.id);
            setSelectedNode(null);
          }}
          onSelectRelated={(nodeId) => {
            const relatedNode = nodes.find(n => n.id === nodeId);
            if (relatedNode) {
              setSelectedNode(relatedNode);
            }
          }}
        />
      )}
    </div>
  );
};

export default TestBrain;
