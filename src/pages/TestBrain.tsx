
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
      for (let i = 0; i < 4; i++) {
        const particle = document.createElement('div');
        particle.className = 'synaptic-particle';
        const glowIntensity = 6 + i * 3;
        particle.style.cssText = `
          position: absolute;
          width: ${1.5 + i * 0.5}px;
          height: ${1.5 + i * 0.5}px;
          background: radial-gradient(circle, #00ffff ${20 + i * 10}%, transparent 70%);
          border-radius: 50%;
          box-shadow: 
            0 0 ${glowIntensity}px #00ffff,
            0 0 ${glowIntensity * 2}px rgba(0, 255, 255, 0.6),
            0 0 ${glowIntensity * 3}px rgba(0, 255, 255, 0.3);
          z-index: 15;
          pointer-events: none;
          opacity: ${1 - i * 0.15};
        `;
        
        canvasRef.current?.appendChild(particle);

        // Calculate curved path with control points
        const midX = (fromNode.x + toNode.x) / 2 + (Math.random() - 0.5) * 100;
        const midY = (fromNode.y + toNode.y) / 2 + (Math.random() - 0.5) * 100;
        
        // Create organic curved motion path
        gsap.set(particle, {
          x: fromNode.x + 3,
          y: fromNode.y + 3
        });

        // Animate along curved path
        gsap.to(particle, {
          motionPath: {
            path: `M${fromNode.x + 3},${fromNode.y + 3} Q${midX},${midY} ${toNode.x + 3},${toNode.y + 3}`,
            autoRotate: false
          },
          duration: 0.8 + Math.random() * 0.4,
          delay: index * 0.03 + i * 0.02,
          ease: "power2.inOut",
          onComplete: () => {
            // Enhanced synaptic burst at destination
            if (toNode.element) {
              gsap.timeline()
                .to(toNode.element, {
                  scale: 2.5,
                  boxShadow: '0 0 25px #00ffff, 0 0 50px #00ffff80, 0 0 75px #00ffff40',
                  duration: 0.1,
                  ease: "power3.out"
                })
                .to(toNode.element, {
                  scale: 1,
                  boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
                  duration: 0.4,
                  ease: "elastic.out(1, 0.4)"
                });
            }
            particle.remove();
          }
        });

        // Particle pulsing during travel
        gsap.to(particle, {
          scale: 1.8 + i * 0.3,
          opacity: 0.6 + i * 0.1,
          duration: 0.2,
          yoyo: true,
          repeat: 3,
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
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node, .central-pulse').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create enhanced central pulse
    const centralPulse = document.createElement('div');
    centralPulse.className = 'central-pulse';
    centralPulse.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, rgba(0, 255, 255, 0.6) 0%, rgba(0, 255, 255, 0.2) 50%, transparent 100%);
      border: 1px solid rgba(0, 255, 255, 0.5);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
    `;
    canvas.appendChild(centralPulse);

    // Enhanced pulse animation
    gsap.to(centralPulse, {
      scale: 3,
      opacity: 0.3,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes matching transmission card size
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      nodeElement.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, #00d4ff 0%, #0099cc 100%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 
          0 0 6px rgba(0, 212, 255, 0.9),
          0 0 12px rgba(0, 212, 255, 0.5),
          0 0 18px rgba(0, 212, 255, 0.2);
        opacity: 0;
        z-index: 10;
        transition: all 0.3s ease;
        border: 0.5px solid rgba(0, 255, 255, 0.8);
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
        
        gsap.to(nodeElement, {
          scale: 4,
          boxShadow: '0 0 20px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.7), 0 0 60px rgba(0, 212, 255, 0.4)',
          duration: 0.3,
          ease: "back.out(2)"
        });

        triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 6px rgba(0, 212, 255, 0.9), 0 0 12px rgba(0, 212, 255, 0.5), 0 0 18px rgba(0, 212, 255, 0.2)',
          duration: 0.3
        });
      });

      nodeElement.addEventListener('click', () => {
        setSelectedNode(node);
        
        gsap.timeline()
          .to(nodeElement, {
            scale: 6,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(nodeElement, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.5)"
          });

        // Trigger multiple synaptic waves
        for (let wave = 0; wave < 3; wave++) {
          setTimeout(() => triggerSynapticFiring(node), wave * 150);
        }
      });

      canvas.appendChild(nodeElement);

      // Enhanced appearance animation
      gsap.to(nodeElement, {
        opacity: 1,
        scale: 1.5,
        duration: 1,
        delay: index * 0.1,
        ease: "elastic.out(1, 0.6)"
      });

      // Organic floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 20 - 10}`,
        y: `+=${Math.random() * 20 - 10}`,
        duration: 4 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing pulse
      gsap.to(nodeElement, {
        opacity: 0.8,
        scale: 1.1,
        duration: 2 + Math.random() * 1.5,
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
    
    // Create glow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'synaptic-glow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');

    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '2');
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

      // Create organic curved path
      const midX = (fromNode.x + toNode.x) / 2 + (Math.random() - 0.5) * 80;
      const midY = (fromNode.y + toNode.y) / 2 + (Math.random() - 0.5) * 80;
      
      // Control points for more organic curves
      const cp1X = fromNode.x + (midX - fromNode.x) * 0.5 + (Math.random() - 0.5) * 40;
      const cp1Y = fromNode.y + (midY - fromNode.y) * 0.5 + (Math.random() - 0.5) * 40;
      const cp2X = toNode.x + (midX - toNode.x) * 0.5 + (Math.random() - 0.5) * 40;
      const cp2Y = toNode.y + (midY - toNode.y) * 0.5 + (Math.random() - 0.5) * 40;

      const pathData = `M${fromNode.x + 2},${fromNode.y + 2} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${toNode.x + 2},${toNode.y + 2}`;

      // Create gradient for each connection
      const gradientId = `synaptic-gradient-${index}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      const stops = [
        { offset: '0%', color: 'rgba(0, 180, 255, 0.2)', opacity: '0.3' },
        { offset: '25%', color: 'rgba(0, 200, 255, 0.6)', opacity: '0.7' },
        { offset: '50%', color: 'rgba(0, 255, 255, 0.9)', opacity: '1' },
        { offset: '75%', color: 'rgba(0, 200, 255, 0.6)', opacity: '0.7' },
        { offset: '100%', color: 'rgba(0, 180, 255, 0.2)', opacity: '0.3' }
      ];

      stops.forEach(stop => {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
        stopElement.setAttribute('stop-opacity', stop.opacity);
        gradient.appendChild(stopElement);
      });

      defs.appendChild(gradient);

      // Create the main synaptic path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', Math.min(connection.strength * 0.8 + 0.5, 1.5).toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', 'url(#synaptic-glow)');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      // Enhanced appearance animation
      gsap.to(path, {
        opacity: connection.strength > 1 ? 0.9 : 0.7,
        duration: 1.5,
        delay: index * 0.08,
        ease: "power2.out"
      });

      // Intense pulsing animation
      gsap.to(path, {
        opacity: connection.strength > 1 ? 1 : 0.9,
        strokeWidth: Math.min(connection.strength * 1.2 + 1, 2.5),
        duration: 1.5 + Math.random() * 1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });

      // Create flowing energy particles along the path
      if (Math.random() < 0.3) { // 30% chance for energy flow
        setTimeout(() => {
          const energyParticle = document.createElement('div');
          energyParticle.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: #00ffff;
            border-radius: 50%;
            box-shadow: 0 0 4px #00ffff;
            z-index: 8;
            pointer-events: none;
          `;
          canvasRef.current?.appendChild(energyParticle);

          gsap.set(energyParticle, { x: fromNode.x + 2, y: fromNode.y + 2 });
          gsap.to(energyParticle, {
            motionPath: {
              path: pathData,
              autoRotate: false
            },
            duration: 3 + Math.random() * 2,
            ease: "none",
            repeat: -1,
            onComplete: () => energyParticle.remove()
          });
        }, Math.random() * 5000);
      }
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
          <p className="text-cyan-400">Initializing synaptic network...</p>
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

      {/* Node Detail Modal - BookCard style */}
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
          </Card>
        </div>
      )}
    </div>
  );
};

export default TestBrain;
