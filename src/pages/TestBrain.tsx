import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import BrainChatInterface from '@/components/BrainChatInterface';
import Header from '@/components/Header';

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

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
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [remappingActive, setRemappingActive] = useState(false);
  
  // Chat highlighting state
  const [chatHighlights, setChatHighlights] = useState<{
    nodeIds: string[];
    linkIds: string[];
    tags: string[];
  }>({ nodeIds: [], linkIds: [], tags: [] });

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

  // Enhanced synaptic firing with more dynamic, alive particle streams
  const triggerSynapticFiring = (sourceNode: BrainNode) => {
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    relatedLinks.forEach((link, index) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Create multiple waves of particles with varying characteristics
      for (let wave = 0; wave < 3; wave++) {
        setTimeout(() => {
          for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'neural-particle';
            
            // More dynamic particle styling with multiple colors
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
            `;
            
            canvasRef.current?.appendChild(particle);

            // Calculate highly organic curved path with multiple control points
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Create flowing, organic curves like neural pathways
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

            // Enhanced particle animation with more life-like movement
            const tl = gsap.timeline();
            
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
                // Enhanced arrival burst with multiple rings
                if (toNode.element) {
                  for (let ring = 0; ring < 3; ring++) {
                    gsap.delayedCall(ring * 0.1, () => {
                      gsap.to(toNode.element, {
                        scale: 2.5 + ring * 0.5,
                        boxShadow: `0 0 ${30 + ring * 15}px ${color}, 0 0 ${60 + ring * 30}px ${color}60, 0 0 ${90 + ring * 45}px ${color}20`,
                        duration: 0.2,
                        ease: "power3.out",
                        yoyo: true,
                        repeat: 1
                      });
                    });
                  }
                  
                  gsap.to(toNode.element, {
                    scale: 1,
                    boxShadow: '0 0 12px rgba(0, 212, 255, 0.9), 0 0 24px rgba(0, 212, 255, 0.6)',
                    duration: 0.8,
                    delay: 0.6,
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
              repeat: 3
            }, "<");

            // Add flowing energy trail effect
            const trail = document.createElement('div');
            trail.style.cssText = `
              position: absolute;
              width: 1px;
              height: 8px;
              background: linear-gradient(180deg, ${color}00 0%, ${color} 50%, ${color}00 100%);
              border-radius: 50%;
              z-index: 18;
              pointer-events: none;
              opacity: 0.7;
            `;
            canvasRef.current?.appendChild(trail);
            
            gsap.to(trail, {
              motionPath: {
                path: pathData,
                autoRotate: true
              },
              duration: 1.8 + Math.random() * 1.2,
              delay: Math.random() * 0.5,
              ease: "power1.inOut",
              onComplete: () => trail.remove()
            });
          }
        }, wave * 200);
      }
    });
  };

  // Create continuously flowing ambient energy streams
  const createAmbientEnergyFlow = () => {
    if (!canvasRef.current || links.length === 0) return;

    const link = links[Math.floor(Math.random() * links.length)];
    const fromNode = nodes.find(n => n.id === link.fromId);
    const toNode = nodes.find(n => n.id === link.toId);
    
    if (!fromNode || !toNode) return;

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
      onComplete: () => ambientParticle.remove()
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
      const baseSize = Math.max(4, Math.min(8, 4 + nodeConnections * 0.6));
      const isHighActivity = nodeConnections > 2;
      
      // Check if node is highlighted by chat
      const isHighlighted = chatHighlights.nodeIds.includes(node.id);
      const highlightColor = isHighlighted ? '#ff6b6b' : (isHighActivity ? '#00ffff' : '#00d4ff');
      const highlightIntensity = isHighlighted ? 1.5 : 1;
      
      nodeElement.style.cssText = `
        position: absolute;
        width: ${baseSize * (isHighlighted ? 1.3 : 1)}px;
        height: ${baseSize * (isHighlighted ? 1.3 : 1)}px;
        background: radial-gradient(circle, 
          ${highlightColor} 0%, 
          ${isHighActivity ? '#00d4ff' : '#0099cc'} 60%, 
          ${isHighActivity ? '#0099cc40' : '#00669940'} 100%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 
          0 0 ${baseSize * 2 * highlightIntensity}px ${highlightColor}90,
          0 0 ${baseSize * 4 * highlightIntensity}px ${highlightColor}50,
          0 0 ${baseSize * 6 * highlightIntensity}px ${highlightColor}20,
          inset 0 0 ${baseSize}px ${highlightColor}30;
        opacity: 0;
        z-index: 10;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid ${highlightColor}80;
      `;

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      nodeElement.addEventListener('mouseenter', (e) => {
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        let tooltipX = rect.left - canvasRect.left + rect.width / 2;
        let tooltipY = rect.top - canvasRect.top - 10;
        
        if (tooltipX < 150) tooltipX = 150;
        if (tooltipX > window.innerWidth - 150) tooltipX = window.innerWidth - 150;
        if (tooltipY < 80) tooltipY = rect.bottom - canvasRect.top + 10;
        
        setTooltip({
          node,
          x: tooltipX,
          y: tooltipY
        });
        
        // Enhanced hover effect with multiple rings
        gsap.timeline()
          .to(nodeElement, {
            scale: 6,
            boxShadow: `
              0 0 ${baseSize * 6}px #00ffff,
              0 0 ${baseSize * 12}px #00ffff80,
              0 0 ${baseSize * 18}px #00ffff40,
              0 0 ${baseSize * 24}px #00ffff20
            `,
            duration: 0.4,
            ease: "back.out(2)"
          });

        triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: `
            0 0 ${baseSize * 2 * highlightIntensity}px ${highlightColor}90,
            0 0 ${baseSize * 4 * highlightIntensity}px ${highlightColor}50,
            0 0 ${baseSize * 6 * highlightIntensity}px ${highlightColor}20
          `,
          duration: 0.4
        });
      });

      // Click event listener removed - only hover functionality remains

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

      // More organic floating with multiple movement layers
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 20 - 10}`,
        y: `+=${Math.random() * 20 - 10}`,
        duration: 6 + Math.random() * 4,
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

      // Spontaneous activity bursts for high-activity nodes
      if (isHighActivity) {
        const burstInterval = setInterval(() => {
          if (Math.random() < 0.3) {
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
            
            if (Math.random() < 0.5) {
              triggerSynapticFiring(node);
            }
          }
        }, 3000 + Math.random() * 7000);
        
        // Clean up interval when component unmounts
        setTimeout(() => clearInterval(burstInterval), 300000);
      }
    });

    // Draw enhanced neural pathways
    drawLivingConnections(svg, nodes, links);

    // Start continuous ambient energy flow
    const ambientFlowInterval = setInterval(createAmbientEnergyFlow, 2000 + Math.random() * 3000);
    
    return () => {
      clearInterval(ambientFlowInterval);
    };

  }, [nodes, links, chatHighlights]);

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

      const getConnectionStyle = (type: string, strength: number) => {
        switch (type) {
          case 'tag_shared': 
            return { 
              colors: ['#00ffff', '#40e0d0', '#00d4ff'], 
              intensity: 0.9 + strength * 0.1,
              filter: 'neural-glow-intense'
            };
          case 'author_shared': 
            return { 
              colors: ['#00d4ff', '#0099ff', '#40e0d0'], 
              intensity: 0.7 + strength * 0.1,
              filter: 'neural-glow-strong'
            };
          case 'title_similarity': 
            return { 
              colors: ['#0099cc', '#00d4ff', '#40e0d0'], 
              intensity: 0.6 + strength * 0.1,
              filter: 'neural-glow-soft'
            };
          default: 
            return { 
              colors: ['#006699', '#0099cc', '#00d4ff'], 
              intensity: 0.4 + strength * 0.1,
              filter: 'neural-glow-soft'
            };
        }
      };

      const style = getConnectionStyle(connection.type, connection.strength);
      
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

      // Create main neural pathway - thinner but more alive
      const baseWidth = Math.max(0.2, Math.min(connection.strength * 0.15 + 0.15, 0.8));
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', baseWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', `url(#${style.filter})`);
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      // Enhanced appearance with organic timing
      gsap.to(path, {
        opacity: style.intensity * (connection.strength > 1.5 ? 1 : 0.8),
        duration: 2.5 + Math.random() * 1.5,
        delay: index * 0.08 + Math.random() * 0.5,
        ease: "power2.out"
      });

      // Living pulsing animation with natural variation
      gsap.to(path, {
        opacity: style.intensity * 1.2,
        strokeWidth: baseWidth * (1.8 + connection.strength * 0.4),
        duration: 3 + Math.random() * 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 4
      });

      // Create flowing energy streams for stronger connections
      if (connection.strength > 1) {
        setTimeout(() => {
          const createEnergyStream = () => {
            for (let stream = 0; stream < Math.min(connection.strength, 4); stream++) {
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
                onComplete: () => energyParticle.remove()
              });
            }
          };

          createEnergyStream();
          
          // Repeat streams
          setInterval(createEnergyStream, 8000 + Math.random() * 4000);
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
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse" />
            <p className="text-cyan-400">Initializing neural consciousness...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
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
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400" />
            <p className="text-cyan-400 mb-2">No transmissions found</p>
            <p className="text-cyan-300 text-sm">Add some books to your library to see the neural network</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <div 
          ref={canvasRef}
          className="brain-canvas absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
        
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />

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
                } ${chatHighlights.tags.includes(tag) ? 'border-red-400 text-red-400' : ''}`}
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

        <div className="absolute top-4 right-4 z-20 text-cyan-400 text-sm">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>Books: {nodes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400/50 rounded-full animate-pulse"></div>
                <span>Links: {links.length}</span>
              </div>
            </div>
            {remappingActive && (
              <div className="text-cyan-300 text-xs mt-1">Remapping...</div>
            )}
          </div>
        </div>

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

        {/* Chat Interface */}
        <BrainChatInterface
          nodes={nodes}
          links={links}
          activeFilters={activeFilters}
          onHighlight={handleChatHighlight}
        />
      </div>
    </div>
  );
};

export default TestBrain;
