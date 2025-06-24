
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Link as LinkIcon } from 'lucide-react';

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
  const [linkingMode, setLinkingMode] = useState(false);
  const [selectedForLinking, setSelectedForLinking] = useState<BrainNode | null>(null);

  // Initialize brain data from user's transmissions only
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        
        // Fetch only user's transmissions from Supabase
        const transmissions = await getTransmissions();
        
        console.log('User transmissions:', transmissions);

        // Process user's transmissions into brain nodes
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

        // Extract all unique tags from user's data only
        const uniqueTags = Array.from(new Set(
          userNodes.flatMap(node => node.tags)
        )).filter(tag => tag && tag.trim() !== '').slice(0, 15);
        setAllTags(uniqueTags);

        // Generate connections based on shared tags
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

  // Generate connections between nodes with shared tags
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

  // Create and animate nodes
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node, .central-pulse').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create subtle central pulse (not a dominant orb)
    const centralPulse = document.createElement('div');
    centralPulse.className = 'central-pulse';
    centralPulse.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: rgba(0, 255, 255, 0.3);
      border: 2px solid rgba(0, 255, 255, 0.5);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
    `;
    canvas.appendChild(centralPulse);

    // Animate central pulse subtly
    gsap.to(centralPulse, {
      scale: 1.5,
      opacity: 0.8,
      duration: 3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes (smaller size)
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node user-node';
      nodeElement.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: #00d4ff;
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
        opacity: 0;
        z-index: 10;
        transition: all 0.3s ease;
      `;

      // Store reference to node data
      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      // Add event listeners
      nodeElement.addEventListener('mouseenter', (e) => {
        const rect = nodeElement.getBoundingClientRect();
        setTooltip({
          node,
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        
        gsap.to(nodeElement, {
          scale: 2.5,
          duration: 0.3,
          ease: "back.out(1.7)"
        });
      });

      nodeElement.addEventListener('mouseleave', () => {
        setTooltip(null);
        gsap.to(nodeElement, {
          scale: 1,
          duration: 0.3
        });
      });

      nodeElement.addEventListener('click', () => {
        if (linkingMode) {
          handleNodeLinking(node);
        } else {
          setSelectedNode(node);
        }
      });

      canvas.appendChild(nodeElement);

      // Animate node appearance
      gsap.to(nodeElement, {
        opacity: 1,
        duration: 0.8,
        delay: index * 0.15,
        ease: "power2.out"
      });

      // Subtle floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 20 - 10}`,
        y: `+=${Math.random() * 20 - 10}`,
        duration: 6 + Math.random() * 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });

    // Draw connections
    drawConnections(svg, nodes, links);

  }, [nodes, links, linkingMode]);

  // Draw connections between related nodes
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
      line.setAttribute('x1', (fromNode.x + 4).toString());
      line.setAttribute('y1', (fromNode.y + 4).toString());
      line.setAttribute('x2', (toNode.x + 4).toString());
      line.setAttribute('y2', (toNode.y + 4).toString());
      line.setAttribute('stroke', connection.type === 'manual' ? '#ff6b6b' : 'rgba(0, 212, 255, 0.3)');
      line.setAttribute('stroke-width', Math.min(connection.strength * 0.5 + 0.5, 2).toString());
      line.setAttribute('opacity', '0');
      svg.appendChild(line);

      // Animate line appearance
      gsap.to(line, {
        opacity: connection.type === 'manual' ? 0.8 : 0.4,
        duration: 1,
        delay: index * 0.1,
        ease: "power2.out"
      });

      // Subtle pulse animation for connections
      gsap.to(line, {
        opacity: connection.type === 'manual' ? 0.9 : 0.5,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  };

  // Handle node linking in linking mode
  const handleNodeLinking = (node: BrainNode) => {
    if (!selectedForLinking) {
      setSelectedForLinking(node);
      // Highlight selected node
      if (node.element) {
        gsap.to(node.element, {
          boxShadow: '0 0 15px #ff6b6b',
          duration: 0.3
        });
      }
    } else if (selectedForLinking.id !== node.id) {
      // Create manual link
      const newLink: BookLink = {
        fromId: selectedForLinking.id,
        toId: node.id,
        type: 'manual',
        strength: 3
      };
      
      setLinks(prev => [...prev, newLink]);
      
      // Reset linking state
      if (selectedForLinking.element) {
        gsap.to(selectedForLinking.element, {
          boxShadow: '0 0 8px rgba(0, 212, 255, 0.6)',
          duration: 0.3
        });
      }
      setSelectedForLinking(null);
      setLinkingMode(false);
    }
  };

  // Filter nodes by tags
  const handleTagFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter(f => f !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
  };

  // Apply filters to nodes
  useEffect(() => {
    if (!canvasRef.current) return;

    const thoughtNodes = canvasRef.current.querySelectorAll('.thought-node');
    
    thoughtNodes.forEach((nodeElement) => {
      const nodeData = (nodeElement as any).nodeData as BrainNode;
      const isVisible = activeFilters.length === 0 || 
        activeFilters.some(filter => nodeData.tags.includes(filter));

      gsap.to(nodeElement, {
        opacity: isVisible ? 1 : 0.2,
        scale: isVisible ? 1 : 0.8,
        duration: 0.5
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
      {/* Brain Canvas */}
      <div 
        ref={canvasRef}
        className="brain-canvas absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      {/* SVG for connections */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />

      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 space-y-4">
        {/* Link Books Button */}
        <Button
          onClick={() => {
            setLinkingMode(!linkingMode);
            setSelectedForLinking(null);
          }}
          variant={linkingMode ? "default" : "outline"}
          size="sm"
          className={`${
            linkingMode 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black'
          }`}
        >
          <LinkIcon size={16} className="mr-2" />
          {linkingMode ? 'Cancel Linking' : '📎 Link Books'}
        </Button>

        {/* Tag Filters */}
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
              <span>Your Books: {nodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full opacity-50"></div>
              <span>Links: {links.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linking Instructions */}
      {linkingMode && (
        <div className="absolute bottom-20 left-4 z-20 text-red-400 text-sm">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 max-w-md">
            <p className="mb-1">🔗 Linking Mode Active</p>
            <p className="text-xs">Click two books to create a conceptual link between them.</p>
            {selectedForLinking && (
              <p className="text-xs mt-2 text-red-300">
                Selected: "{selectedForLinking.title}" - Click another book to link
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute z-30 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-400/30 pointer-events-none max-w-xs"
          style={{ 
            left: tooltip.x - 100, 
            top: tooltip.y - 80,
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

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 bg-black/90 border-cyan-400/30 text-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2">{selectedNode.title}</h2>
                  <p className="text-lg text-gray-300">{selectedNode.author}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {selectedNode.description && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-cyan-400 mb-2">Your Notes</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {selectedNode.description.length > 300 
                          ? `${selectedNode.description.substring(0, 300)}...`
                          : selectedNode.description
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Your Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="border-cyan-400/50 text-cyan-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge variant="outline" className="border-cyan-400/50 text-cyan-300">
                      From Your Library
                    </Badge>
                  </div>
                </div>
                
                {selectedNode.coverUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedNode.coverUrl} 
                      alt={selectedNode.title}
                      className="max-w-full h-auto rounded-lg border border-cyan-400/30"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-20 text-cyan-400/60 text-xs max-w-md">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3">
          <p className="mb-1">🧠 Your Reading Neural Map</p>
          <p className="mb-1">• Only shows books from your library</p>
          <p className="mb-1">• Lines connect books with shared tags</p>
          <p className="mb-1">• Use "Link Books" to manually connect ideas</p>
          <p>• Filter by your own tags to explore themes</p>
        </div>
      </div>
    </div>
  );
};

export default TestBrain;
