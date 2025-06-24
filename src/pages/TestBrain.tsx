
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

  // Enhanced synaptic firing animation
  const triggerSynapticFiring = (sourceNode: BrainNode) => {
    const relatedLinks = links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    relatedLinks.forEach((link, index) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Create firing particle
      const particle = document.createElement('div');
      particle.className = 'synaptic-particle';
      particle.style.cssText = `
        position: absolute;
        width: 3px;
        height: 3px;
        background: #00ffff;
        border-radius: 50%;
        box-shadow: 0 0 8px #00ffff;
        z-index: 15;
        pointer-events: none;
      `;
      
      canvasRef.current?.appendChild(particle);

      // Animate particle along the connection path
      gsap.set(particle, {
        x: fromNode.x + 2,
        y: fromNode.y + 2
      });

      gsap.to(particle, {
        x: toNode.x + 2,
        y: toNode.y + 2,
        duration: 0.8 + Math.random() * 0.4,
        delay: index * 0.1,
        ease: "power2.out",
        onComplete: () => {
          // Flash destination node
          if (toNode.element) {
            gsap.to(toNode.element, {
              scale: 2,
              boxShadow: '0 0 20px #00ffff',
              duration: 0.2,
              yoyo: true,
              repeat: 1
            });
          }
          particle.remove();
        }
      });

      // Scale up the particle during travel
      gsap.to(particle, {
        scale: 2,
        duration: 0.4,
        yoyo: true,
        repeat: 1
      });
    });
  };

  // Create and animate nodes with enhanced synaptic behavior
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node, .central-pulse').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create more subtle central pulse
    const centralPulse = document.createElement('div');
    centralPulse.className = 'central-pulse';
    centralPulse.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
    `;
    canvas.appendChild(centralPulse);

    // Subtle pulse animation
    gsap.to(centralPulse, {
      scale: 1.5,
      opacity: 0.4,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes (same size as BookCard)
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      nodeElement.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #00d4ff;
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 0 0 4px rgba(0, 212, 255, 0.6);
        opacity: 0;
        z-index: 10;
        transition: all 0.3s ease;
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
        
        // Enhanced synaptic response with firing
        gsap.to(nodeElement, {
          scale: 4,
          boxShadow: '0 0 20px rgba(0, 212, 255, 1)',
          duration: 0.3,
          ease: "back.out(2)"
        });

        // Trigger synaptic firing to connected nodes
        triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 4px rgba(0, 212, 255, 0.6)',
          duration: 0.3
        });
      });

      nodeElement.addEventListener('click', () => {
        setSelectedNode(node);
        
        // Synaptic burst effect on click
        gsap.to(nodeElement, {
          scale: 6,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });

        // Trigger stronger synaptic firing
        triggerSynapticFiring(node);
      });

      canvas.appendChild(nodeElement);

      // Enhanced appearance animation
      gsap.to(nodeElement, {
        opacity: 1,
        scale: 1.5,
        duration: 0.8,
        delay: index * 0.1,
        ease: "elastic.out(1, 0.5)"
      });

      // Floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 20 - 10}`,
        y: `+=${Math.random() * 20 - 10}`,
        duration: 5 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing pulse
      gsap.to(nodeElement, {
        opacity: 0.8,
        duration: 2 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });
    });

    // Draw enhanced connections
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

    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      
      if (!fromNode || !toNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (fromNode.x + 2).toString());
      line.setAttribute('y1', (fromNode.y + 2).toString());
      line.setAttribute('x2', (toNode.x + 2).toString());
      line.setAttribute('y2', (toNode.y + 2).toString());
      line.setAttribute('stroke', 'rgba(0, 212, 255, 0.4)');
      line.setAttribute('stroke-width', Math.min(connection.strength * 0.5 + 0.5, 2).toString());
      line.setAttribute('opacity', '0');
      svg.appendChild(line);

      // Enhanced line appearance with glow
      gsap.to(line, {
        opacity: 0.6,
        duration: 1,
        delay: index * 0.08,
        ease: "power2.out"
      });

      // Synaptic pulse along connections
      gsap.to(line, {
        opacity: 0.9,
        strokeWidth: Math.min(connection.strength * 0.8 + 0.8, 2.5),
        duration: 2.5 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
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

      {/* Smaller Node Detail Modal - matching BookCard style */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 bg-slate-800/50 border-slate-700 text-white">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-medium text-slate-200 mb-1">{selectedNode.title}</h2>
                  <p className="text-sm text-slate-400">{selectedNode.author}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  {selectedNode.description && (
                    <div className="mb-3">
                      <h3 className="text-xs font-medium text-slate-300 mb-1">Notes</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedNode.description.length > 150 
                          ? `${selectedNode.description.substring(0, 150)}...`
                          : selectedNode.description
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xs font-medium text-slate-300 mb-1">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedNode.coverUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedNode.coverUrl} 
                      alt={selectedNode.title}
                      className="max-w-full h-auto rounded border border-slate-600"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TestBrain;
