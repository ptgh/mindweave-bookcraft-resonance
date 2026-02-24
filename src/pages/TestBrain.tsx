import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import BrainChatInterface from '@/components/BrainChatInterface';
import Header from '@/components/Header';
import NeuralMapHeader from '@/components/NeuralMapHeader';
import NeuralMapBottomSheet from '@/components/NeuralMapBottomSheet';
import NeuralMapLegend from '@/components/NeuralMapLegend';
import NeuralMapEmptyState from '@/components/NeuralMapEmptyState';
import NeuralMapRegionLabels from '@/components/NeuralMapRegionLabels';
import EdgeLabel, { getEdgeLabelText } from '@/components/neural-map/EdgeLabel';
import { createBookNodeElement, getNodeSize, getEdgeLineStyle } from '@/components/neural-map/NeuralMapNode';
import { useGSAPAnimations } from '@/hooks/useGSAPAnimations';
import { usePatternRecognition } from '@/hooks/usePatternRecognition';
import { useNeuralMapConnections, NeuralMapEdge } from '@/hooks/useNeuralMapConnections';
import { filterConceptualTags, CONCEPTUAL_TAGS } from '@/constants/conceptualTags';

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

export type NodeType = 'book' | 'author' | 'protagonist';

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
  nodeType: NodeType;
  /** For author nodes: the author's ID in scifi_authors */
  authorId?: string;
  /** For protagonist nodes: the book they appear in */
  bookTitle?: string;
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
  const edgeLabelsRef = useRef<HTMLDivElement>(null);
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const tooltipHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTooltipHoveredRef = useRef(false);
  
  // Focus mode state
  const [focusedBookId, setFocusedBookId] = useState<string | null>(null);
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { mainContainerRef } = useGSAPAnimations();
  const { clusters, bridges, getBookClusters } = usePatternRecognition(transmissions);
  
  // Performance: track active particles (desktop only)
  const activeParticlesRef = useRef<number>(0);
  const MAX_PARTICLES = 40;
  const lastHoverTimeRef = useRef<Map<string, number>>(new Map());
  
  // Chat highlighting state
  const [chatHighlights, setChatHighlights] = useState<{
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  }>({ nodeIds: [], linkIds: [], tags: [] });

  // Compute visible nodes based on tag filter
  const visibleNodes = useMemo(() => {
    if (activeFilters.length === 0) return nodes;
    return nodes.filter(node => 
      activeFilters.some(filter => 
        node.tags.includes(filter) || node.contextTags.includes(filter)
      )
    );
  }, [nodes, activeFilters]);

  // Use connection hook
  const {
    edges: computedEdges,
    getDirectNeighbors,
    getSecondDegreeNeighbors,
    getTopRelated,
    getConnectionBreakdown,
    getEdgeData
  } = useNeuralMapConnections(visibleNodes, activeFilters.length > 0 ? activeFilters[0] : null);

  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return computedEdges.filter(edge => 
      visibleNodeIds.has(edge.fromId) && visibleNodeIds.has(edge.toId)
    );
  }, [computedEdges, visibleNodes]);

  useEffect(() => {
    setLinks(visibleEdges as BookLink[]);
  }, [visibleEdges]);

  // Top edge labels for desktop
  const topEdgeLabels = useMemo(() => {
    if (isMobile) return [];
    return visibleEdges
      .filter(e => (e as NeuralMapEdge).score >= 20)
      .sort((a, b) => ((b as NeuralMapEdge).score || 0) - ((a as NeuralMapEdge).score || 0))
      .slice(0, 30);
  }, [visibleEdges, isMobile]);

  // Initialize brain data
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedTransmissions = await getTransmissions();
        setTransmissions(fetchedTransmissions);
        
        if (!fetchedTransmissions || fetchedTransmissions.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch author portraits from scifi_authors
        const uniqueAuthors = [...new Set(fetchedTransmissions.map(t => t.author).filter(Boolean))];
        const { data: authorRows } = await supabase
          .from('scifi_authors')
          .select('id, name, portrait_url, bio, nationality, birth_year, death_year')
          .in('name', uniqueAuthors);
        
        const authorMap = new Map<string, { id: string; portrait_url: string | null; bio: string | null }>();
        (authorRows || []).forEach(a => authorMap.set(a.name, { id: a.id, portrait_url: a.portrait_url, bio: a.bio }));

        // Extract unique protagonists
        const protagonistMap = new Map<string, { name: string; portrait_url: string | null; bookTitle: string; author: string }>();
        fetchedTransmissions.forEach(t => {
          if (t.protagonist && t.protagonist.trim() !== '' && t.protagonist !== t.author) {
            if (!protagonistMap.has(t.protagonist)) {
              protagonistMap.set(t.protagonist, {
                name: t.protagonist,
                portrait_url: t.protagonist_portrait_url || null,
                bookTitle: t.title,
                author: t.author
              });
            }
          }
        });

        // Group books by primary tag for spatial clustering
        const tagGroups = new Map<string, number[]>();
        fetchedTransmissions.forEach((t, idx) => {
          const tags = filterConceptualTags(Array.isArray(t.tags) ? t.tags : []);
          const primaryTag = tags[0] || 'uncategorized';
          if (!tagGroups.has(primaryTag)) tagGroups.set(primaryTag, []);
          tagGroups.get(primaryTag)!.push(idx);
        });

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const centerX = vw / 2;
        const centerY = vh / 2;
        const clusterRadius = Math.min(vw, vh) * 0.38;
        const tagList = Array.from(tagGroups.keys());
        const clusterCenters = new Map<string, { cx: number; cy: number }>();
        tagList.forEach((tag, i) => {
          const angle = (2 * Math.PI * i) / tagList.length - Math.PI / 2;
          clusterCenters.set(tag, {
            cx: centerX + Math.cos(angle) * clusterRadius,
            cy: centerY + Math.sin(angle) * clusterRadius,
          });
        });

        // ── Structured layout: books in a grid, more spacing ──
        const nodePositions: { x: number; y: number }[] = new Array(fetchedTransmissions.length);
        const mobile = window.innerWidth < 768;
        const nodeSize = mobile ? 52 : 68;
        const minDist = nodeSize + (mobile ? 36 : 50);
        const padding = mobile ? 30 : 50;
        const topPad = mobile ? 130 : 120;
        const bottomPad = 240;
        
        const placedPositions: { x: number; y: number }[] = [];
        
        // Sort transmissions by author to group same-author books
        const sortedIndices = Array.from({ length: fetchedTransmissions.length }, (_, i) => i);
        sortedIndices.sort((a, b) => {
          const authorA = (fetchedTransmissions[a].author || '').toLowerCase();
          const authorB = (fetchedTransmissions[b].author || '').toLowerCase();
          return authorA.localeCompare(authorB);
        });
        
        // Calculate grid dimensions for available space
        const availableW = vw - padding * 2;
        const availableH = vh - topPad - bottomPad;
        const cols = Math.max(3, Math.floor(availableW / (minDist + 10)));
        const rowSpacing = Math.max(minDist + 15, availableH / Math.ceil(fetchedTransmissions.length / cols));
        const colSpacing = availableW / cols;
        
        sortedIndices.forEach((originalIdx, gridIdx) => {
          const col = gridIdx % cols;
          const row = Math.floor(gridIdx / cols);
          
          // Base grid position with slight organic jitter
          const jitterX = (Math.random() - 0.5) * colSpacing * 0.15;
          const jitterY = (Math.random() - 0.5) * rowSpacing * 0.12;
          
          let bx = padding + col * colSpacing + colSpacing / 2 + jitterX;
          let by = topPad + row * rowSpacing + rowSpacing / 2 + jitterY;
          
          // Clamp
          bx = Math.max(padding + nodeSize / 2, Math.min(vw - padding - nodeSize / 2, bx));
          by = Math.max(topPad, Math.min(vh - bottomPad, by));
          
          nodePositions[originalIdx] = { x: bx, y: by };
          placedPositions.push({ x: bx, y: by });
        });

        // Create book nodes
        const bookNodes: BrainNode[] = fetchedTransmissions.map((transmission, index) => ({
          id: `transmission-${transmission.id}`,
          title: transmission.title || 'Unknown Title',
          author: transmission.author || 'Unknown Author',
          tags: filterConceptualTags(Array.isArray(transmission.tags) ? transmission.tags : []),
          contextTags: Array.isArray(transmission.historical_context_tags) ? transmission.historical_context_tags : [],
          x: nodePositions[index].x,
          y: nodePositions[index].y,
          coverUrl: transmission.cover_url,
          description: transmission.notes,
          transmissionId: transmission.id,
          nodeType: 'book' as NodeType,
        }));

        // Create author nodes — positioned deliberately near their book cluster
        const authorNodes: BrainNode[] = [];
        const addedAuthors = new Set<string>();
        bookNodes.forEach(bookNode => {
          if (addedAuthors.has(bookNode.author) || bookNode.author === 'Unknown Author') return;
          addedAuthors.add(bookNode.author);
          
          const authorData = authorMap.get(bookNode.author);
          const authorBooks = bookNodes.filter(b => b.author === bookNode.author);
          const avgX = authorBooks.reduce((s, b) => s + b.x, 0) / authorBooks.length;
          const avgY = authorBooks.reduce((s, b) => s + b.y, 0) / authorBooks.length;
          
          // Place author above or to the left of their books cluster
          const offsetY = mobile ? -45 : -55;
          let ax = avgX;
          let ay = avgY + offsetY;
          
          // Avoid collisions with placed positions
          for (let attempt = 0; attempt < 15; attempt++) {
            const hasCollision = placedPositions.some(p => {
              const ddx = p.x - ax; const ddy = p.y - ay;
              return Math.sqrt(ddx * ddx + ddy * ddy) < (mobile ? 40 : 55);
            });
            if (!hasCollision) break;
            ax += (Math.random() - 0.5) * 40;
            ay += (Math.random() - 0.5) * 30;
          }
          
          ax = Math.max(padding, Math.min(vw - padding, ax));
          ay = Math.max(topPad, Math.min(vh - bottomPad, ay));
          placedPositions.push({ x: ax, y: ay });
          
          authorNodes.push({
            id: `author-${bookNode.author}`,
            title: bookNode.author,
            author: bookNode.author,
            tags: [...new Set(authorBooks.flatMap(b => b.tags))].slice(0, 3),
            contextTags: [],
            x: ax,
            y: ay,
            coverUrl: authorData?.portrait_url || undefined,
            description: authorData?.bio || undefined,
            transmissionId: 0,
            nodeType: 'author' as NodeType,
            authorId: authorData?.id,
          });
        });

        // Create protagonist nodes — placed below their parent book
        const protagonistNodes: BrainNode[] = [];
        protagonistMap.forEach((pData, name) => {
          const parentBook = bookNodes.find(b => b.title === pData.bookTitle);
          if (!parentBook) return;
          
          // Position protagonist below their book
          const offsetY = mobile ? 50 : 65;
          let px = parentBook.x + (Math.random() - 0.5) * 20;
          let py = parentBook.y + offsetY;
          
          // Collision avoidance
          for (let attempt = 0; attempt < 12; attempt++) {
            const hasCollision = placedPositions.some(p => {
              const ddx = p.x - px; const ddy = p.y - py;
              return Math.sqrt(ddx * ddx + ddy * ddy) < (mobile ? 35 : 45);
            });
            if (!hasCollision) break;
            px += (Math.random() - 0.5) * 30;
            py += (Math.random() - 0.5) * 25;
          }
          
          px = Math.max(padding, Math.min(vw - padding, px));
          py = Math.max(topPad, Math.min(vh - bottomPad, py));
          placedPositions.push({ x: px, y: py });
          
          protagonistNodes.push({
            id: `protagonist-${name}`,
            title: name,
            author: pData.author,
            tags: parentBook.tags.slice(0, 2),
            contextTags: [],
            x: px,
            y: py,
            coverUrl: pData.portrait_url || undefined,
            description: `Protagonist of "${pData.bookTitle}"`,
            transmissionId: 0,
            nodeType: 'protagonist' as NodeType,
            bookTitle: pData.bookTitle,
          });
        });

        const allNodes = [...bookNodes, ...authorNodes, ...protagonistNodes];
        setNodes(allNodes);

        const usedTags = Array.from(new Set(
          allNodes.flatMap(node => node.tags)
        )).filter(tag => tag && tag.trim() !== '');
        
        const tagCounts = new Map<string, number>();
        allNodes.forEach(node => {
          node.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });
        const sortedTags = usedTags.sort((a, b) => 
          (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0)
        );
        
        setAllTags(sortedTags);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing brain:', error);
        setError(error instanceof Error ? error.message : 'Failed to load transmissions');
        setLoading(false);
      }
    };

    initBrain();
  }, []);

  // Synaptic firing (desktop only)
  const triggerSynapticFiring = useCallback((sourceNode: BrainNode) => {
    if (isMobile) return; // No particles on mobile
    if (activeParticlesRef.current >= MAX_PARTICLES) return;
    
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    const limitedLinks = relatedLinks.slice(0, 3);

    limitedLinks.forEach((link) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      if (!fromNode || !toNode) return;

      if (activeParticlesRef.current >= MAX_PARTICLES) return;
      
      for (let i = 0; i < 2; i++) {
        activeParticlesRef.current++;
        const particle = document.createElement('div');
        
        const colors = ['#00ffff', '#40e0d0', '#00d4ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleSize = 1.5 + Math.random() * 1.5;
        
        particle.style.cssText = `
          position: absolute;
          width: ${particleSize}px;
          height: ${particleSize}px;
          background: radial-gradient(circle, ${color} 0%, transparent 70%);
          border-radius: 50%;
          box-shadow: 0 0 6px ${color};
          z-index: 20;
          pointer-events: none;
          opacity: 0.8;
          will-change: transform;
        `;
        
        canvasRef.current?.appendChild(particle);

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * 0.4;
        const midY = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * 0.4;
        
        const pathData = `M${fromNode.x},${fromNode.y} Q${midX},${midY} ${toNode.x},${toNode.y}`;
        
        gsap.set(particle, { x: fromNode.x, y: fromNode.y, scale: 0.3 });

        gsap.timeline({
          onComplete: () => {
            particle.remove();
            activeParticlesRef.current--;
          }
        })
        .to(particle, { scale: 1.2, duration: 0.2, ease: "power2.out" })
        .to(particle, {
          motionPath: { path: pathData, autoRotate: false },
          duration: 2 + Math.random() * 1,
          ease: "power1.inOut",
        }, "<0.1")
        .to(particle, { opacity: 0, duration: 0.4 }, "-=0.4");
      }
    });
  }, [isMobile, links, nodes]);

  // Create and animate nodes
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing
    canvas.querySelectorAll('.thought-node').forEach(el => {
      const interval = (el as any)._burstInterval;
      if (interval) clearInterval(interval);
      el.remove();
    });
    svg.innerHTML = '';

    // Create nodes using the new cover-based renderer
    nodes.forEach((node, index) => {
      const nodeConnections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;

      const nodeElement = createBookNodeElement(node.x, node.y, {
        isMobile,
        connectionCount: nodeConnections,
        coverUrl: node.coverUrl,
        title: node.title,
        author: node.author,
        isHighlighted: chatHighlights.nodeIds.includes(node.id),
        nodeType: node.nodeType,
      });

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      // Event handlers
      let tooltipTimeout: NodeJS.Timeout | null = null;
      
      const showTooltip = () => {
        if (isMobile) return;
        if (tooltipHideTimeoutRef.current) {
          clearTimeout(tooltipHideTimeoutRef.current);
          tooltipHideTimeoutRef.current = null;
        }
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        let tooltipX = rect.left - canvasRect.left + rect.width / 2;
        let tooltipY = rect.top - canvasRect.top - 15;
        if (tooltipX < 150) tooltipX = 150;
        if (tooltipX > window.innerWidth - 150) tooltipX = window.innerWidth - 150;
        if (tooltipY < 80) tooltipY = rect.bottom - canvasRect.top + 15;
        
        setTooltip({ node, x: tooltipX, y: tooltipY });
      };

      const scheduleHideTooltip = () => {
        if (tooltipHideTimeoutRef.current) clearTimeout(tooltipHideTimeoutRef.current);
        tooltipHideTimeoutRef.current = setTimeout(() => {
          if (!isTooltipHoveredRef.current) {
            setTooltip(null);
            setHoveredNodeId(null);
          }
        }, 400);
      };

      if (!isMobile) {
        nodeElement.addEventListener('mouseenter', () => {
          if (tooltipHideTimeoutRef.current) {
            clearTimeout(tooltipHideTimeoutRef.current);
            tooltipHideTimeoutRef.current = null;
          }
          tooltipTimeout = setTimeout(showTooltip, 100);
          setHoveredNodeId(node.id);
          
          gsap.killTweensOf(nodeElement);
          gsap.to(nodeElement, {
            scale: 1.15,
            duration: 0.2,
            ease: "power2.out"
          });
          
          const circle = nodeElement.querySelector('div') as HTMLElement;
          if (circle) {
            const hoverColor = node.nodeType === 'author' ? 'rgba(251, 191, 36, 0.8)' 
              : node.nodeType === 'protagonist' ? 'rgba(192, 132, 252, 0.8)' 
              : 'rgba(34, 211, 238, 0.8)';
            const hoverGlow = node.nodeType === 'author' ? 'rgba(251, 191, 36, 0.4)' 
              : node.nodeType === 'protagonist' ? 'rgba(192, 132, 252, 0.4)' 
              : 'rgba(34, 211, 238, 0.4)';
            circle.style.borderColor = hoverColor;
            circle.style.boxShadow = `0 0 20px ${hoverGlow}`;
          }

          const now = Date.now();
          const lastHover = lastHoverTimeRef.current.get(node.id) || 0;
          if (now - lastHover > 500) {
            lastHoverTimeRef.current.set(node.id, now);
            triggerSynapticFiring(node);
          }
        });

        nodeElement.addEventListener('mouseleave', () => {
          if (tooltipTimeout) { clearTimeout(tooltipTimeout); tooltipTimeout = null; }
          scheduleHideTooltip();
          
          gsap.to(nodeElement, {
            scale: 1,
            duration: 0.3,
          });
          
          const circle = nodeElement.querySelector('div') as HTMLElement;
          if (circle) {
            const baseColor = node.nodeType === 'author' ? 'rgba(251, 191, 36, VAR)' 
              : node.nodeType === 'protagonist' ? 'rgba(192, 132, 252, VAR)' 
              : 'rgba(34, 211, 238, VAR)';
            circle.style.borderColor = baseColor.replace('VAR', String(nodeConnections > 5 ? 0.6 : 0.3));
            circle.style.boxShadow = `0 0 ${8 + nodeConnections * 2}px ${baseColor.replace('VAR', String(0.15 + Math.min(nodeConnections * 0.05, 0.35)))}`;
          }

          gsap.to(nodeElement, {
            x: `+=${Math.random() * 6 - 3}`,
            y: `+=${Math.random() * 6 - 3}`,
            duration: 8 + Math.random() * 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 0.5
          });
        });
      }

      // Click/touch handler
      const handleNodeSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedNode(node);
        setTooltip(null);
      };

      nodeElement.addEventListener('click', handleNodeSelect);
      nodeElement.addEventListener('touchend', handleNodeSelect, { passive: false });

      canvas.appendChild(nodeElement);

      // Appear animation
      gsap.timeline({ delay: index * 0.08 })
        .from(nodeElement, {
          scale: 0,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(1.5)"
        })
        .to(nodeElement, {
          opacity: 1,
          duration: 0.3
        }, "<0.2");

      // Gentle floating (desktop only, reduced)
      if (!isMobile) {
        gsap.to(nodeElement, {
          x: `+=${Math.random() * 6 - 3}`,
          y: `+=${Math.random() * 6 - 3}`,
          duration: 8 + Math.random() * 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }
    });

    // Draw connections
    drawConnections(svg, nodes, links);

    // Ambient particles (desktop only, very infrequent)
    let ambientInterval: ReturnType<typeof setInterval> | null = null;
    if (!isMobile) {
      ambientInterval = setInterval(() => {
        if (activeParticlesRef.current >= MAX_PARTICLES || links.length === 0) return;
        const link = links[Math.floor(Math.random() * links.length)];
        const fromNode = nodes.find(n => n.id === link.fromId);
        const toNode = nodes.find(n => n.id === link.toId);
        if (!fromNode || !toNode) return;

        activeParticlesRef.current++;
        const p = document.createElement('div');
        p.style.cssText = `position:absolute;width:1px;height:1px;background:#00d4ff40;border-radius:50%;box-shadow:0 0 4px #00d4ff40;z-index:15;pointer-events:none;opacity:0.5;will-change:transform;`;
        canvas.appendChild(p);

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const midX = fromNode.x + dx*0.5 + (Math.random()-0.5)*dist*0.3;
        const midY = fromNode.y + dy*0.5 + (Math.random()-0.5)*dist*0.3;
        
        gsap.set(p, { x: fromNode.x, y: fromNode.y });
        gsap.to(p, {
          motionPath: { path: `M${fromNode.x},${fromNode.y} Q${midX},${midY} ${toNode.x},${toNode.y}`, autoRotate: false },
          duration: 8 + Math.random() * 4,
          ease: "none",
          onComplete: () => { p.remove(); activeParticlesRef.current--; }
        });
      }, 12000 + Math.random() * 8000);
    }
    
    return () => {
      if (ambientInterval) clearInterval(ambientInterval);
      // Kill all GSAP tweens targeting elements inside the canvas to prevent
      // "Cannot read properties of null" errors when navigating away.
      canvas.querySelectorAll('.thought-node').forEach(el => {
        gsap.killTweensOf(el);
        const interval = (el as any)._burstInterval;
        if (interval) clearInterval(interval);
        el.remove();
      });
      // Kill tweens on any remaining particles
      canvas.querySelectorAll('div[style*="pointer-events: none"]').forEach(el => {
        gsap.killTweensOf(el);
        el.remove();
      });
      // Kill SVG path tweens
      if (svgRef.current) {
        svgRef.current.querySelectorAll('path').forEach(el => gsap.killTweensOf(el));
      }
      activeParticlesRef.current = 0;
    };
  }, [nodes, links, chatHighlights, selectedNode, isMobile]);

  const drawConnections = (svg: SVGSVGElement, nodes: BrainNode[], connections: BookLink[]) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;z-index:1;`;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Glow filters
    const createGlowFilter = (id: string, blur: number) => {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', id);
      filter.setAttribute('x', '-200%'); filter.setAttribute('y', '-200%');
      filter.setAttribute('width', '500%'); filter.setAttribute('height', '500%');
      const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feBlur.setAttribute('stdDeviation', blur.toString());
      feBlur.setAttribute('result', 'coloredBlur');
      const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      const n1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      n1.setAttribute('in', 'coloredBlur');
      const n2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      n2.setAttribute('in', 'SourceGraphic');
      feMerge.appendChild(n1); feMerge.appendChild(n2);
      filter.appendChild(feBlur); filter.appendChild(feMerge);
      return filter;
    };

    defs.appendChild(createGlowFilter('glow-soft', 2));
    defs.appendChild(createGlowFilter('glow-strong', 3));
    svg.appendChild(defs);

    connections.forEach((connection) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      if (!fromNode || !toNode) return;

      const edge = connection as any;
      const reasons: string[] = edge.reasons || [];
      const fromType = edge.fromType || fromNode.nodeType;
      const toType = edge.toType || toNode.nodeType;
      const lineStyle = getEdgeLineStyle(reasons, fromType, toType);

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Structured curves — gentler, more vertical flow
      // Cross-type edges (author↔book, protagonist↔book) use nearly straight lines
      const isCrossType = fromType !== toType;
      const curveFactor = isCrossType ? 0.05 : 0.12 + Math.random() * 0.08;
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);
      const midX = fromNode.x + dx * 0.5 + perpX * dist * curveFactor;
      const midY = fromNode.y + dy * 0.5 + perpY * dist * curveFactor;
      const pathData = `M${fromNode.x},${fromNode.y} Q${midX},${midY} ${toNode.x},${toNode.y}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', lineStyle.color);
      path.setAttribute('stroke-width', lineStyle.strokeWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('stroke-linecap', 'round');
      
      if (lineStyle.strokeDasharray !== 'none') {
        path.setAttribute('stroke-dasharray', lineStyle.strokeDasharray);
      }

      const score = edge.score || connection.strength * 50;
      if (score >= 40) {
        path.setAttribute('filter', 'url(#glow-strong)');
      } else if (score >= 20) {
        path.setAttribute('filter', 'url(#glow-soft)');
      }
      
      svg.appendChild(path);

      gsap.to(path, {
        opacity: lineStyle.opacity,
        duration: 1.5 + Math.random() * 0.5,
        delay: Math.random() * 0.3,
        ease: "power2.out"
      });

      // Gentle pulse for strong connections only
      if (score >= 25) {
        gsap.to(path, {
          opacity: lineStyle.opacity * 1.2,
          strokeWidth: lineStyle.strokeWidth * 1.1,
          duration: 4 + Math.random() * 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 4
        });
      }
    });
  };

  // Apply opacity for filters and focus mode
  useEffect(() => {
    if (!canvasRef.current) return;

    const thoughtNodes = canvasRef.current.querySelectorAll('.thought-node');
    const directNeighbors = focusedBookId ? new Set(getDirectNeighbors(focusedBookId)) : null;
    const secondDegreeNeighbors = focusedBookId ? new Set(getSecondDegreeNeighbors(focusedBookId)) : null;
    
    // Desktop hover dimming
    const hoverNeighbors = hoveredNodeId ? new Set(getDirectNeighbors(hoveredNodeId)) : null;
    
    thoughtNodes.forEach((nodeElement) => {
      const nodeData = (nodeElement as any).nodeData as BrainNode;
      
      const isVisibleByFilter = activeFilters.length === 0 || 
        activeFilters.some(filter => nodeData.tags.includes(filter) || nodeData.contextTags.includes(filter));

      let targetOpacity = 1;
      let targetScale = 1;
      
      if (!isVisibleByFilter) {
        targetOpacity = 0.15;
        targetScale = 0.7;
      } else if (focusedBookId) {
        if (nodeData.id === focusedBookId) {
          targetOpacity = 1;
          targetScale = 1.15;
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
      } else if (hoveredNodeId && !isMobile) {
        // Desktop hover: dim unrelated
        if (nodeData.id === hoveredNodeId) {
          targetOpacity = 1;
          targetScale = 1.15;
        } else if (hoverNeighbors?.has(nodeData.id)) {
          targetOpacity = 1;
          targetScale = 1;
        } else {
          targetOpacity = 0.2;
          targetScale = 0.9;
        }
      }

      gsap.to(nodeElement, {
        opacity: targetOpacity,
        scale: targetScale,
        duration: 0.4,
        ease: "power2.out"
      });
    });
  }, [activeFilters, focusedBookId, hoveredNodeId, getDirectNeighbors, getSecondDegreeNeighbors, isMobile]);

  const handleTagFilter = (tag: string) => {
    setRemappingActive(true);
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter(f => f !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
    setTimeout(() => setRemappingActive(false), 300);
  };

  const handleClearFilters = () => {
    setRemappingActive(true);
    setActiveFilters([]);
    setTimeout(() => setRemappingActive(false), 300);
  };

  const handleChatHighlight = (highlights: { nodeIds: string[]; linkIds: string[]; tags: string[] }) => {
    setChatHighlights(highlights);
    highlights.nodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) setTimeout(() => triggerSynapticFiring(node), Math.random() * 1000);
    });
    setTimeout(() => setChatHighlights({ nodeIds: [], linkIds: [], tags: [] }), 10000);
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

        {/* Edge labels (desktop only, top 30 strongest) */}
        {!isMobile && (
          <div ref={edgeLabelsRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
            {topEdgeLabels.map((edge) => {
              const fromNode = nodes.find(n => n.id === edge.fromId);
              const toNode = nodes.find(n => n.id === edge.toId);
              if (!fromNode || !toNode) return null;
              const e = edge as NeuralMapEdge;
              return (
                <EdgeLabel
                  key={`${edge.fromId}-${edge.toId}`}
                  fromNode={fromNode}
                  toNode={toNode}
                  reasons={e.reasons}
                  sharedTags={e.sharedTags}
                  score={e.score}
                  hoveredNodeId={hoveredNodeId}
                />
              );
            })}
          </div>
        )}

        {/* Region labels */}
        <NeuralMapRegionLabels nodes={visibleNodes} />

        {remappingActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="bg-slate-800/95 backdrop-blur-sm border border-cyan-400/50 rounded-lg px-6 py-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-sm font-medium">Remapping</span>
              </div>
            </div>
          </div>
        )}

        {/* Desktop tooltip on hover */}
        {tooltip && !isMobile && (
          <div 
            className="absolute z-30"
            style={{ 
              left: tooltip.x - 100, 
              top: tooltip.y > window.innerHeight * 0.65 ? tooltip.y - 220 : tooltip.y,
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => {
              isTooltipHoveredRef.current = true;
              if (tooltipHideTimeoutRef.current) {
                clearTimeout(tooltipHideTimeoutRef.current);
                tooltipHideTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              isTooltipHoveredRef.current = false;
              tooltipHideTimeoutRef.current = setTimeout(() => {
                setTooltip(null);
                setHoveredNodeId(null);
              }, 300);
            }}
          >
            <div 
              className="relative bg-slate-900/80 backdrop-blur-xl border border-cyan-400/25 rounded-xl p-3.5 max-w-[250px] shadow-[0_0_30px_rgba(34,211,238,0.12)] cursor-pointer hover:border-cyan-400/40 transition-colors"
              onClick={() => {
                setSelectedNode(tooltip.node);
                setTooltip(null);
                setHoveredNodeId(null);
                isTooltipHoveredRef.current = false;
              }}
            >
              <div className="flex items-start space-x-3">
                {tooltip.node.coverUrl && (
                  <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-cyan-400/25 shadow-md">
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
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300/60 mt-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full"></div>
                    <span>{links.filter(link => link.fromId === tooltip.node.id || link.toId === tooltip.node.id).length} connections</span>
                  </div>
                  {(() => {
                    const top2 = getTopRelated(tooltip.node.id, 2);
                    return top2.map(({ nodeId }) => {
                      const edgeData = getEdgeData(tooltip.node.id, nodeId);
                      const neighbor = nodes.find(n => n.id === nodeId);
                      if (!edgeData || !neighbor) return null;
                      const reason = edgeData.reasons[0];
                      let label = '';
                      if (reason === 'same_author') label = `Same author as ${neighbor.title}`;
                      else if (reason === 'shared_theme') label = `Shares ${edgeData.sharedTags[0] || 'theme'} with ${neighbor.title}`;
                      else if (reason === 'shared_subgenre') label = `Shares ${edgeData.sharedTags[0] || 'subgenre'} with ${neighbor.title}`;
                      else label = `Connected to ${neighbor.title}`;
                      return (
                        <p key={nodeId} className="text-[10px] text-cyan-400/50 mt-0.5 line-clamp-1">{label}</p>
                      );
                    });
                  })()}
                </div>
              </div>
              <p className="text-[9px] text-cyan-300/50 mt-2 text-center">Click to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Neural Assistant */}
      <BrainChatInterface
        nodes={nodes}
        links={links}
        activeFilters={activeFilters}
        onHighlight={handleChatHighlight}
      />

      {/* Legend */}
      <NeuralMapLegend 
        nodeCount={visibleNodes.length} 
        edgeCount={visibleEdges.length}
        bookCount={visibleNodes.filter(n => n.nodeType === 'book').length}
        authorCount={visibleNodes.filter(n => n.nodeType === 'author').length}
        protagonistCount={visibleNodes.filter(n => n.nodeType === 'protagonist').length}
      />

      {/* Empty/Sparse States */}
      <NeuralMapEmptyState 
        nodeCount={visibleNodes.length} 
        edgeCount={visibleEdges.length} 
        isFiltered={activeFilters.length > 0}
        onClearFilter={handleClearFilters}
      />

      {/* Bottom Sheet */}
      {selectedNode && (
        <NeuralMapBottomSheet
          node={selectedNode}
          allNodes={nodes}
          connectionBreakdown={getConnectionBreakdown(selectedNode.id)}
          topRelated={getTopRelated(selectedNode.id, 4)}
          typedConnections={(() => {
            const neighbors = getTopRelated(selectedNode.id, 10);
            return neighbors.map(({ nodeId }) => {
              const edgeData = getEdgeData(selectedNode.id, nodeId);
              const neighbor = nodes.find(n => n.id === nodeId);
              if (!edgeData || !neighbor) return null;
              const reason = edgeData.reasons[0];
              let label = '';
              if (reason === 'same_author') label = 'Same author as';
              else if (reason === 'shared_theme') label = `Shares ${edgeData.sharedTags[0] || 'theme'} with`;
              else if (reason === 'shared_subgenre') label = `Shares ${edgeData.sharedTags[0] || 'subgenre'} with`;
              else if (reason === 'shared_era') label = `Same era as`;
              else label = 'Connected to';
              return { nodeId, label, nodeTitle: neighbor.title };
            }).filter(Boolean) as Array<{ nodeId: string; label: string; nodeTitle: string }>;
          })()}
          onClose={() => setSelectedNode(null)}
          onFocusNetwork={() => {
            setFocusedBookId(selectedNode.id);
            setSelectedNode(null);
          }}
          onSelectRelated={(nodeId) => {
            const relatedNode = nodes.find(n => n.id === nodeId);
            if (relatedNode) setSelectedNode(relatedNode);
          }}
        />
      )}
    </div>
  );
};

export default TestBrain;
