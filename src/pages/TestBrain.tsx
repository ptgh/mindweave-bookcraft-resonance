import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

interface BrainNode {
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

interface NodeTooltip {
  node: BrainNode;
  x: number;
  y: number;
}

interface BookLink {
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
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [tooltip, setTooltip] = useState<NodeTooltip | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [remappingActive, setRemappingActive] = useState(false);

  // Initialize brain data from user's transmissions only
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching transmissions...');
        const transmissions = await getTransmissions();
        
        console.log('User transmissions:', transmissions);

        if (!transmissions || transmissions.length === 0) {
          console.log('No transmissions found');
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

        console.log('Created nodes:', userNodes);
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

  // Enhanced synaptic firing with curved particle paths
  const triggerSynapticFiring = (sourceNode: BrainNode) => {
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    relatedLinks.forEach((link, index) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Create multiple firing particles with organic movement
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'synaptic-particle';
        const glowIntensity = 4 + i * 2;
        const particleSize = 0.8 + i * 0.3;
        particle.style.cssText = `
          position: absolute;
          width: ${particleSize}px;
          height: ${particleSize}px;
          background: radial-gradient(circle, #00ffff ${30 + i * 15}%, transparent 80%);
          border-radius: 50%;
          box-shadow: 
            0 0 ${glowIntensity}px #00ffff,
            0 0 ${glowIntensity * 2}px rgba(0, 255, 255, 0.7),
            0 0 ${glowIntensity * 3}px rgba(0, 255, 255, 0.4);
          z-index: 15;
          pointer-events: none;
          opacity: ${0.9 - i * 0.12};
        `;
        
        canvasRef.current?.appendChild(particle);

        // Calculate highly curved organic path
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Create multiple control points for organic curves
        const midX1 = fromNode.x + dx * 0.25 + (Math.random() - 0.5) * distance * 0.4;
        const midY1 = fromNode.y + dy * 0.25 + (Math.random() - 0.5) * distance * 0.4;
        const midX2 = fromNode.x + dx * 0.75 + (Math.random() - 0.5) * distance * 0.4;
        const midY2 = fromNode.y + dy * 0.75 + (Math.random() - 0.5) * distance * 0.4;
        
        // Create organic curved motion path with multiple control points
        gsap.set(particle, {
          x: fromNode.x + 3,
          y: fromNode.y + 3
        });

        // Animate along highly curved path
        gsap.to(particle, {
          motionPath: {
            path: `M${fromNode.x + 3},${fromNode.y + 3} C${midX1},${midY1} ${midX2},${midY2} ${toNode.x + 3},${toNode.y + 3}`,
            autoRotate: false
          },
          duration: 1.2 + Math.random() * 0.8,
          delay: index * 0.04 + i * 0.03,
          ease: "power2.inOut",
          onComplete: () => {
            // Enhanced synaptic burst at destination
            if (toNode.element) {
              gsap.timeline()
                .to(toNode.element, {
                  scale: 3,
                  boxShadow: '0 0 30px #00ffff, 0 0 60px #00ffff80, 0 0 90px #00ffff40',
                  duration: 0.15,
                  ease: "power3.out"
                })
                .to(toNode.element, {
                  scale: 1,
                  boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
                  duration: 0.5,
                  ease: "elastic.out(1, 0.5)"
                });
            }
            particle.remove();
          }
        });

        // Enhanced particle pulsing during travel
        gsap.to(particle, {
          scale: 2 + i * 0.4,
          opacity: 0.7 + i * 0.1,
          duration: 0.25,
          yoyo: true,
          repeat: 4,
          ease: "sine.inOut"
        });
      }
    });
  };

  // Create and animate nodes
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes (no central pulse anymore)
    canvas.querySelectorAll('.thought-node').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create thought nodes matching transmission card size
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      
      // Dynamic node size based on connections
      const nodeConnections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      const nodeSize = Math.max(3, Math.min(7, 3 + nodeConnections * 0.5));
      
      nodeElement.style.cssText = `
        position: absolute;
        width: ${nodeSize}px;
        height: ${nodeSize}px;
        background: radial-gradient(circle, #00d4ff 0%, #0099cc 100%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 
          0 0 ${nodeSize * 1.5}px rgba(0, 212, 255, 0.9),
          0 0 ${nodeSize * 3}px rgba(0, 212, 255, 0.5),
          0 0 ${nodeSize * 4.5}px rgba(0, 212, 255, 0.2);
        opacity: 0;
        z-index: 10;
        transition: all 0.3s ease;
        border: 0.5px solid rgba(0, 255, 255, 0.8);
      `;

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      nodeElement.addEventListener('mouseenter', (e) => {
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Better positioning to prevent cutoff
        let tooltipX = rect.left - canvasRect.left + rect.width / 2;
        let tooltipY = rect.top - canvasRect.top - 10;
        
        // Adjust if too close to edges
        if (tooltipX < 150) tooltipX = 150;
        if (tooltipX > window.innerWidth - 150) tooltipX = window.innerWidth - 150;
        if (tooltipY < 80) tooltipY = rect.bottom - canvasRect.top + 10;
        
        setTooltip({
          node,
          x: tooltipX,
          y: tooltipY
        });
        
        gsap.to(nodeElement, {
          scale: 5,
          boxShadow: `0 0 ${nodeSize * 4}px rgba(0, 212, 255, 1), 0 0 ${nodeSize * 8}px rgba(0, 212, 255, 0.7), 0 0 ${nodeSize * 12}px rgba(0, 212, 255, 0.4)`,
          duration: 0.3,
          ease: "back.out(2)"
        });

        triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: `0 0 ${nodeSize * 1.5}px rgba(0, 212, 255, 0.9), 0 0 ${nodeSize * 3}px rgba(0, 212, 255, 0.5), 0 0 ${nodeSize * 4.5}px rgba(0, 212, 255, 0.2)`,
          duration: 0.3
        });
      });

      nodeElement.addEventListener('click', () => {
        setSelectedNode(node);
        
        gsap.timeline()
          .to(nodeElement, {
            scale: 8,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(nodeElement, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.5)"
          });

        // Trigger multiple synaptic waves
        for (let wave = 0; wave < 4; wave++) {
          setTimeout(() => triggerSynapticFiring(node), wave * 120);
        }
      });

      canvas.appendChild(nodeElement);

      // Enhanced appearance animation
      gsap.to(nodeElement, {
        opacity: 1,
        scale: 1.5,
        duration: 1.2,
        delay: index * 0.08,
        ease: "elastic.out(1, 0.6)"
      });

      // Organic floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 15 - 7.5}`,
        y: `+=${Math.random() * 15 - 7.5}`,
        duration: 5 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing pulse
      gsap.to(nodeElement, {
        opacity: 0.7,
        scale: 1.2,
        duration: 2.5 + Math.random() * 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });
    });

    // Draw enhanced curved connections
    drawOrganicConnections(svg, nodes, links);

  }, [nodes, links]);

  const drawOrganicConnections = (svg: SVGSVGElement, nodes: BrainNode[], connections: BookLink[]) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    `;

    // Create enhanced gradient and filter definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Create enhanced glow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'synaptic-glow');
    filter.setAttribute('x', '-100%');
    filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%');
    filter.setAttribute('height', '300%');

    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '1.5');
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
    defs.appendChild(filter);
    svg.appendChild(defs);

    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      
      if (!fromNode || !toNode) return;

      // Create highly organic curved path with multiple control points
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Multiple control points for complex organic curves
      const cp1X = fromNode.x + dx * 0.2 + (Math.random() - 0.5) * distance * 0.3;
      const cp1Y = fromNode.y + dy * 0.2 + (Math.random() - 0.5) * distance * 0.3;
      const cp2X = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * 0.4;
      const cp2Y = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * 0.4;
      const cp3X = fromNode.x + dx * 0.8 + (Math.random() - 0.5) * distance * 0.3;
      const cp3Y = fromNode.y + dy * 0.8 + (Math.random() - 0.5) * distance * 0.3;

      const pathData = `M${fromNode.x + 2},${fromNode.y + 2} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${cp3X},${cp3Y} L${toNode.x + 2},${toNode.y + 2}`;

      // Create dynamic gradient for each connection
      const gradientId = `synaptic-gradient-${index}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      // Different colors based on connection type
      const getConnectionColor = (type: string) => {
        switch (type) {
          case 'tag_shared': return { base: '#00ffff', intensity: 0.9 };
          case 'author_shared': return { base: '#00d4ff', intensity: 0.7 };
          case 'title_similarity': return { base: '#0099cc', intensity: 0.6 };
          default: return { base: '#006699', intensity: 0.4 };
        }
      };

      const colorConfig = getConnectionColor(connection.type);
      const stops = [
        { offset: '0%', color: `${colorConfig.base}20`, opacity: '0.2' },
        { offset: '20%', color: `${colorConfig.base}60`, opacity: `${colorConfig.intensity * 0.6}` },
        { offset: '50%', color: `${colorConfig.base}`, opacity: `${colorConfig.intensity}` },
        { offset: '80%', color: `${colorConfig.base}60`, opacity: `${colorConfig.intensity * 0.6}` },
        { offset: '100%', color: `${colorConfig.base}20`, opacity: '0.2' }
      ];

      stops.forEach(stop => {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
        stopElement.setAttribute('stop-opacity', stop.opacity);
        gradient.appendChild(stopElement);
      });

      defs.appendChild(gradient);

      // Create the main synaptic path - much thinner but with depth
      const baseWidth = Math.max(0.3, Math.min(connection.strength * 0.2 + 0.2, 1));
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', baseWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', 'url(#synaptic-glow)');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      // Enhanced appearance animation
      gsap.to(path, {
        opacity: connection.strength > 1.5 ? 0.95 : 0.75,
        duration: 2,
        delay: index * 0.06,
        ease: "power2.out"
      });

      // Intense pulsing animation with depth
      gsap.to(path, {
        opacity: connection.strength > 1.5 ? 1 : 0.9,
        strokeWidth: baseWidth * (1.5 + connection.strength * 0.3),
        duration: 2 + Math.random() * 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });

      // Create flowing energy particles along the path for stronger connections
      if (connection.strength > 1) {
        setTimeout(() => {
          const createEnergyFlow = () => {
            const energyParticle = document.createElement('div');
            energyParticle.style.cssText = `
              position: absolute;
              width: 0.8px;
              height: 0.8px;
              background: ${colorConfig.base};
              border-radius: 50%;
              box-shadow: 0 0 3px ${colorConfig.base};
              z-index: 8;
              pointer-events: none;
              opacity: ${colorConfig.intensity};
            `;
            canvasRef.current?.appendChild(energyParticle);

            gsap.set(energyParticle, { x: fromNode.x + 2, y: fromNode.y + 2 });
            gsap.to(energyParticle, {
              motionPath: {
                path: pathData,
                autoRotate: false
              },
              duration: 4 + Math.random() * 3,
              ease: "none",
              onComplete: () => energyParticle.remove()
            });
          };

          // Create multiple energy flows for stronger connections
          for (let i = 0; i < Math.min(connection.strength, 3); i++) {
            setTimeout(createEnergyFlow, i * 1500);
          }
          
          // Repeat the flow
          setInterval(() => {
            for (let i = 0; i < Math.min(connection.strength, 3); i++) {
              setTimeout(createEnergyFlow, i * 1500);
            }
          }, 8000);
        }, Math.random() * 3000);
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
    
    // Trigger remapping animation
    setTimeout(() => {
      remapConnections(tag);
      setRemappingActive(false);
    }, 300);
  };

  const remapConnections = (focusTag?: string) => {
    // Create new connections based on active filters
    let newConnections: BookLink[] = [];
    
    if (activeFilters.length > 0) {
      // Filter-based remapping
      const filteredNodes = nodes.filter(node => 
        activeFilters.some(filter => node.tags.includes(filter))
      );
      
      newConnections = generateOrganicConnections(filteredNodes);
      
      // Add stronger connections for nodes with the focus tag
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
      // Reset to original organic connections
      newConnections = generateOrganicConnections(nodes);
    }
    
    setLinks(newConnections);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const thoughtNodes = canvasRef.current.querySelectorAll('.thought-node');
    
    thoughtNodes.forEach((nodeElement) => {
      const nodeData = (nodeElement as any).nodeData as BrainNode;
      const isVisible = activeFilters.length === 0 || 
        activeFilters.some(filter => nodeData.tags.includes(filter));

      gsap.to(nodeElement, {
        opacity: isVisible ? 1 : 0.15,
        scale: isVisible ? 1 : 0.7,
        duration: 0.5,
        ease: "power2.out"
      });
    });
  }, [activeFilters]);

  // Remap connections when filters change
  useEffect(() => {
    if (!remappingActive) {
      remapConnections();
    }
  }, [activeFilters, nodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse" />
          <p className="text-cyan-400">Initializing synaptic network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-red-400" />
          <p className="text-red-400 mb-2">Error loading transmissions</p>
          <p className="text-red-300 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400" />
          <p className="text-cyan-400 mb-2">No transmissions found</p>
          <p className="text-cyan-300 text-sm">Add some books to your library to see the neural network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div 
        ref={canvasRef}
        className="brain-canvas absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />

      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 space-y-4">
        <div className="flex flex-wrap gap-2 max-w-md">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeFilters.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer text-xs transition-all ${
                activeFilters.includes(tag) 
                  ? 'bg-cyan-400 text-black hover:bg-cyan-300' 
                  : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black'
              }`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="text-cyan-400/70 text-xs">
          Click tags to remap connections • {activeFilters.length > 0 ? 'Filtered view' : 'All connections'}
        </div>
      </div>

      {/* Node Counter */}
      <div className="absolute top-4 right-4 z-20 text-cyan-400 text-sm">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span>Books: {nodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400/50 rounded-full"></div>
              <span>Links: {links.length}</span>
            </div>
          </div>
          {remappingActive && (
            <div className="text-cyan-300 text-xs mt-1">Remapping...</div>
          )}
        </div>
      </div>

      {/* Clean Tooltip - matching your design */}
      {tooltip && (
        <div 
          className="absolute z-30 pointer-events-none"
          style={{ 
            left: tooltip.x - 100, 
            top: tooltip.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-slate-800/95 border border-cyan-400/50 rounded-lg p-4 max-w-xs shadow-lg">
            <div className="flex items-start space-x-4">
              {tooltip.node.coverUrl && (
                <div className="w-12 h-16 bg-slate-700 rounded border border-slate-600 overflow-hidden flex-shrink-0">
                  <img 
                    src={tooltip.node.coverUrl} 
                    alt={tooltip.node.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-cyan-400 text-sm mb-1 leading-tight">{tooltip.node.title}</h4>
                <p className="text-xs text-slate-300 mb-2">{tooltip.node.author}</p>
                
                <div className="text-xs text-cyan-300/70">
                  {links.filter(link => link.fromId === tooltip.node.id || link.toId === tooltip.node.id).length} connections
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Modal - matching your design */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="bg-slate-900/95 border-slate-700 text-white max-w-sm mx-4 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start space-x-4">
                {selectedNode.coverUrl && (
                  <img 
                    src={selectedNode.coverUrl} 
                    alt={selectedNode.title}
                    className="w-12 h-16 rounded border border-slate-600 flex-shrink-0 object-cover"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-200 font-medium text-sm leading-tight">
                        {selectedNode.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">{selectedNode.author}</p>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-white transition-colors ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-cyan-300/70">
                    {links.filter(link => link.fromId === selectedNode.id || link.toId === selectedNode.id).length} connections
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TestBrain;
