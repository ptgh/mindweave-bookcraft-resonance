
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
            strength: sharedTags.length
          });
        }
      }
    }

    return connections;
  };

  // Create and animate nodes with more dynamic synaptic behavior
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node, .central-pulse').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create subtle central pulse
    const centralPulse = document.createElement('div');
    centralPulse.className = 'central-pulse';
    centralPulse.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(0, 255, 255, 0.2);
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
    `;
    canvas.appendChild(centralPulse);

    // More dynamic central pulse with synaptic bursts
    gsap.to(centralPulse, {
      scale: 2,
      opacity: 0.6,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes
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
        box-shadow: 0 0 6px rgba(0, 212, 255, 0.5);
        opacity: 0;
        z-index: 10;
        transition: all 0.2s ease;
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
        
        // More dramatic synaptic response
        gsap.to(nodeElement, {
          scale: 3,
          boxShadow: '0 0 15px rgba(0, 212, 255, 0.8)',
          duration: 0.2,
          ease: "back.out(2)"
        });

        // Pulse connected nodes
        links.forEach(link => {
          if (link.fromId === node.id || link.toId === node.id) {
            const connectedNodeId = link.fromId === node.id ? link.toId : link.fromId;
            const connectedNode = nodes.find(n => n.id === connectedNodeId);
            if (connectedNode?.element) {
              gsap.to(connectedNode.element, {
                scale: 1.8,
                opacity: 1,
                duration: 0.3
              });
            }
          }
        });
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
          duration: 0.2
        });

        // Reset connected nodes
        links.forEach(link => {
          if (link.fromId === node.id || link.toId === node.id) {
            const connectedNodeId = link.fromId === node.id ? link.toId : link.fromId;
            const connectedNode = nodes.find(n => n.id === connectedNodeId);
            if (connectedNode?.element) {
              gsap.to(connectedNode.element, {
                scale: 1,
                duration: 0.3
              });
            }
          }
        });
      });

      nodeElement.addEventListener('click', () => {
        setSelectedNode(node);
        
        // Synaptic burst effect on click
        gsap.to(nodeElement, {
          scale: 4,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
      });

      canvas.appendChild(nodeElement);

      // More dynamic appearance animation
      gsap.to(nodeElement, {
        opacity: 1,
        scale: 1.2,
        duration: 0.6,
        delay: index * 0.08,
        ease: "elastic.out(1, 0.5)"
      });

      // More complex floating with synaptic micro-movements
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 30 - 15}`,
        y: `+=${Math.random() * 30 - 15}`,
        duration: 4 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Add micro-pulse for synaptic activity
      gsap.to(nodeElement, {
        opacity: 0.7,
        duration: 1.5 + Math.random() * 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });
    });

    // Draw connections with enhanced dynamics
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
      line.setAttribute('x1', (fromNode.x + 3).toString());
      line.setAttribute('y1', (fromNode.y + 3).toString());
      line.setAttribute('x2', (toNode.x + 3).toString());
      line.setAttribute('y2', (toNode.y + 3).toString());
      line.setAttribute('stroke', 'rgba(0, 212, 255, 0.2)');
      line.setAttribute('stroke-width', Math.min(connection.strength * 0.3 + 0.3, 1.2).toString());
      line.setAttribute('opacity', '0');
      svg.appendChild(line);

      // More dynamic line appearance
      gsap.to(line, {
        opacity: 0.3,
        duration: 0.8,
        delay: index * 0.05,
        ease: "power2.out"
      });

      // Enhanced synaptic pulse animation
      gsap.to(line, {
        opacity: 0.6,
        strokeWidth: Math.min(connection.strength * 0.5 + 0.5, 1.8),
        duration: 3 + Math.random() * 2,
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

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute z-30 bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg border border-cyan-400/30 pointer-events-none max-w-xs"
          style={{ 
            left: tooltip.x - 80, 
            top: tooltip.y - 60,
            transform: 'translateX(-50%)'
          }}
        >
          <h4 className="font-semibold text-cyan-400 text-xs mb-1">{tooltip.node.title}</h4>
          <p className="text-xs text-gray-300 mb-1">{tooltip.node.author}</p>
          <div className="flex flex-wrap gap-1">
            {tooltip.node.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs border-cyan-400/50 text-cyan-300">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Smaller Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4 bg-black/90 border-cyan-400/30 text-white">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-bold text-cyan-400 mb-1">{selectedNode.title}</h2>
                  <p className="text-sm text-gray-300">{selectedNode.author}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  {selectedNode.description && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-cyan-400 mb-1">Notes</h3>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {selectedNode.description.length > 200 
                          ? `${selectedNode.description.substring(0, 200)}...`
                          : selectedNode.description
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-400 mb-1">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs border-cyan-400/50 text-cyan-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedNode.coverUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedNode.coverUrl} 
                      alt={selectedNode.title}
                      className="max-w-full h-auto rounded border border-cyan-400/30"
                      style={{ maxHeight: '150px' }}
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
