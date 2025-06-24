
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
  type: 'tag_shared' | 'manual';
  strength: number;
  sharedTags: string[];
}

const TestBrain = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [links, setLinks] = useState<BookLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [tooltip, setTooltip] = useState<NodeTooltip | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Initialize brain data from user's transmissions only
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        
        const transmissions = await getTransmissions();
        
        console.log('User transmissions:', transmissions);

        const userNodes: BrainNode[] = transmissions.map((transmission, index) => ({
          id: `transmission-${transmission.id}`,
          title: transmission.title || 'Unknown Title',
          author: transmission.author || 'Unknown Author',
          tags: transmission.tags || [],
          x: Math.random() * (window.innerWidth - 200) + 100,
          y: Math.random() * (window.innerHeight - 200) + 100,
          coverUrl: transmission.cover_url,
          description: transmission.notes,
          transmissionId: transmission.id
        }));

        setNodes(userNodes);

        const uniqueTags = Array.from(new Set(
          userNodes.flatMap(node => node.tags)
        )).filter(tag => tag && tag.trim() !== '').slice(0, 15);
        setAllTags(uniqueTags);

        const connections = generateConnections(userNodes);
        setLinks(connections);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing brain:', error);
        setLoading(false);
      }
    };

    initBrain();
  }, []);

  const generateConnections = (nodes: BrainNode[]): BookLink[] => {
    const connections: BookLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        const sharedTags = node1.tags.filter(tag => node2.tags.includes(tag));
        
        if (sharedTags.length > 0) {
          connections.push({
            fromId: node1.id,
            toId: node2.id,
            type: 'tag_shared',
            strength: sharedTags.length,
            sharedTags
          });
        }
      }
    }

    return connections;
  };

  // Enhanced synaptic firing animation with more dramatic effects
  const triggerSynapticFiring = (sourceNode: BrainNode) => {
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    relatedLinks.forEach((link, index) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Create multiple firing particles for more intense effect
      for (let i = 0; i < 3; i++) {
        const particle = document.createElement('div');
        particle.className = 'synaptic-particle';
        particle.style.cssText = `
          position: absolute;
          width: ${2 + i}px;
          height: ${2 + i}px;
          background: ${i === 0 ? '#00ffff' : i === 1 ? '#0099ff' : '#0066ff'};
          border-radius: 50%;
          box-shadow: 0 0 ${8 + i * 4}px ${i === 0 ? '#00ffff' : i === 1 ? '#0099ff' : '#0066ff'};
          z-index: 15;
          pointer-events: none;
          opacity: ${1 - i * 0.2};
        `;
        
        canvasRef.current?.appendChild(particle);

        // Animate particle along the connection path with staggered timing
        gsap.set(particle, {
          x: fromNode.x + 3,
          y: fromNode.y + 3
        });

        gsap.to(particle, {
          x: toNode.x + 3,
          y: toNode.y + 3,
          duration: 0.6 + Math.random() * 0.3,
          delay: index * 0.05 + i * 0.03,
          ease: "power2.out",
          onComplete: () => {
            // Enhanced destination node flash
            if (toNode.element) {
              gsap.timeline()
                .to(toNode.element, {
                  scale: 3,
                  boxShadow: '0 0 30px #00ffff, 0 0 60px #00ffff80',
                  duration: 0.15,
                  ease: "power2.out"
                })
                .to(toNode.element, {
                  scale: 1,
                  boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
                  duration: 0.25,
                  ease: "elastic.out(1, 0.3)"
                });
            }
            particle.remove();
          }
        });

        // Enhanced particle scaling during travel
        gsap.to(particle, {
          scale: 2 + i * 0.5,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        });
      }
    });
  };

  // Create and animate nodes with enhanced effects
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node, .central-pulse').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create enhanced central pulse
    const centralPulse = document.createElement('div');
    centralPulse.className = 'central-pulse';
    centralPulse.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: rgba(0, 255, 255, 0.2);
      border: 2px solid rgba(0, 255, 255, 0.4);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    `;
    canvas.appendChild(centralPulse);

    // Enhanced pulse animation
    gsap.to(centralPulse, {
      scale: 2,
      opacity: 0.6,
      duration: 4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes with better sizing to match transmission cards
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      nodeElement.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: #00d4ff;
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.8), 0 0 16px rgba(0, 212, 255, 0.4);
        opacity: 0;
        z-index: 10;
        transition: all 0.3s ease;
        border: 1px solid rgba(0, 255, 255, 0.6);
      `;

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      nodeElement.addEventListener('mouseenter', (e) => {
        const rect = nodeElement.getBoundingClientRect();
        setTooltip({
          node,
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        
        // Enhanced synaptic response
        gsap.to(nodeElement, {
          scale: 5,
          boxShadow: '0 0 30px rgba(0, 212, 255, 1), 0 0 60px rgba(0, 212, 255, 0.5)',
          duration: 0.3,
          ease: "back.out(2)"
        });

        // Trigger synaptic firing
        triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 8px rgba(0, 212, 255, 0.8), 0 0 16px rgba(0, 212, 255, 0.4)',
          duration: 0.3
        });
      });

      nodeElement.addEventListener('click', () => {
        setSelectedNode(node);
        
        // Intense synaptic burst effect
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

        // Trigger multiple waves of synaptic firing
        for (let wave = 0; wave < 3; wave++) {
          setTimeout(() => triggerSynapticFiring(node), wave * 200);
        }
      });

      canvas.appendChild(nodeElement);

      // Enhanced appearance animation
      gsap.to(nodeElement, {
        opacity: 1,
        scale: 1.8,
        duration: 1,
        delay: index * 0.15,
        ease: "elastic.out(1, 0.5)"
      });

      // More dynamic floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 30 - 15}`,
        y: `+=${Math.random() * 30 - 15}`,
        duration: 6 + Math.random() * 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Enhanced breathing pulse
      gsap.to(nodeElement, {
        opacity: 0.7,
        scale: 1.2,
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });
    });

    // Draw enhanced connections with depth
    drawConnections(svg, nodes, links);

  }, [nodes, links]);

  const drawConnections = (svg: SVGSVGElement, nodes: BrainNode[], connections: BookLink[]) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    `;

    // Create gradient definitions for dimensional effect
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      
      if (!fromNode || !toNode) return;

      // Create gradient for each connection
      const gradientId = `gradient-${index}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(0, 212, 255, 0.8)');
      stop1.setAttribute('stop-opacity', '0.8');

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '50%');
      stop2.setAttribute('stop-color', 'rgba(0, 255, 255, 1)');
      stop2.setAttribute('stop-opacity', '1');

      const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop3.setAttribute('offset', '100%');
      stop3.setAttribute('stop-color', 'rgba(0, 212, 255, 0.8)');
      stop3.setAttribute('stop-opacity', '0.8');

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      gradient.appendChild(stop3);
      defs.appendChild(gradient);

      // Create the main connection line with enhanced visual depth
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (fromNode.x + 3).toString());
      line.setAttribute('y1', (fromNode.y + 3).toString());
      line.setAttribute('x2', (toNode.x + 3).toString());
      line.setAttribute('y2', (toNode.y + 3).toString());
      line.setAttribute('stroke', `url(#${gradientId})`);
      line.setAttribute('stroke-width', Math.min(connection.strength * 1.2 + 1, 3).toString());
      line.setAttribute('opacity', '0');
      line.setAttribute('filter', 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.5))');
      svg.appendChild(line);

      // Create shadow/depth line
      const shadowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      shadowLine.setAttribute('x1', (fromNode.x + 4).toString());
      shadowLine.setAttribute('y1', (fromNode.y + 4).toString());
      shadowLine.setAttribute('x2', (toNode.x + 4).toString());
      shadowLine.setAttribute('y2', (toNode.y + 4).toString());
      shadowLine.setAttribute('stroke', 'rgba(0, 100, 150, 0.3)');
      shadowLine.setAttribute('stroke-width', Math.min(connection.strength * 1.2 + 1, 3).toString());
      shadowLine.setAttribute('opacity', '0');
      svg.insertBefore(shadowLine, line);

      // Enhanced line appearance with depth
      gsap.to([shadowLine, line], {
        opacity: connection.strength > 1 ? 0.9 : 0.6,
        duration: 1.2,
        delay: index * 0.1,
        ease: "power2.out"
      });

      // Dynamic pulsing with varied intensity based on connection strength
      gsap.to(line, {
        opacity: connection.strength > 1 ? 1 : 0.8,
        strokeWidth: Math.min(connection.strength * 1.5 + 1.5, 4),
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 4
      });
    });
  };

  const handleTagFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter(f => f !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const thoughtNodes = canvasRef.current.querySelectorAll('.thought-node');
    
    thoughtNodes.forEach((nodeElement) => {
      const nodeData = (nodeElement as any).nodeData as BrainNode;
      const isVisible = activeFilters.length === 0 || 
        activeFilters.some(filter => nodeData.tags.includes(filter));

      gsap.to(nodeElement, {
        opacity: isVisible ? 1 : 0.1,
        scale: isVisible ? 1 : 0.6,
        duration: 0.4
      });
    });
  }, [activeFilters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse" />
          <p className="text-cyan-400">Initializing neural map...</p>
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
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {tooltip && (
        <div 
          className="absolute z-30 bg-black/95 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-400/50 pointer-events-none max-w-xs shadow-lg"
          style={{ 
            left: tooltip.x - 100, 
            top: tooltip.y - 70,
            transform: 'translateX(-50%)'
          }}
        >
          <h4 className="font-semibold text-cyan-400 text-sm mb-1">{tooltip.node.title}</h4>
          <p className="text-xs text-gray-300 mb-2">{tooltip.node.author}</p>
          <div className="flex flex-wrap gap-1">
            {tooltip.node.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs border-cyan-400/50 text-cyan-300">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Node Detail Modal - exact size as transmission cards */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 w-full max-w-sm mx-4 text-white">
            <div className="flex items-start space-x-4">
              {selectedNode.coverUrl && (
                <img 
                  src={selectedNode.coverUrl} 
                  alt={selectedNode.title}
                  className="w-12 h-16 rounded border border-slate-600 flex-shrink-0"
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
                
                {selectedNode.description && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedNode.description.length > 100 
                        ? `${selectedNode.description.substring(0, 100)}...`
                        : selectedNode.description
                      }
                    </p>
                  </div>
                )}
                
                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedNode.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {selectedNode.tags.length > 3 && (
                      <span className="text-slate-400 text-xs px-2 py-1">
                        +{selectedNode.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestBrain;
