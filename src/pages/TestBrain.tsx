
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { getTransmissions, Transmission } from '@/services/transmissionsService';
import { searchBooksEnhanced, EnhancedBookSuggestion } from '@/services/enhanced-google-books-api';
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
  source: 'supabase' | 'google';
  coverUrl?: string;
  description?: string;
  element?: HTMLElement;
}

interface NodeTooltip {
  node: BrainNode;
  x: number;
  y: number;
}

const TestBrain = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [tooltip, setTooltip] = useState<NodeTooltip | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Initialize brain data from both sources
  useEffect(() => {
    const initBrain = async () => {
      try {
        setLoading(true);
        
        // Fetch data from both sources concurrently
        const [supabaseData, googleData] = await Promise.all([
          getTransmissions(),
          searchBooksEnhanced('science fiction', 20)
        ]);

        console.log('Supabase data:', supabaseData);
        console.log('Google Books data:', googleData);

        // Process Supabase data
        const supabaseNodes: BrainNode[] = supabaseData.map((transmission, index) => ({
          id: `supabase-${transmission.id}`,
          title: transmission.title || 'Unknown Title',
          author: transmission.author || 'Unknown Author',
          tags: transmission.tags || [],
          x: Math.random() * (window.innerWidth - 200) + 100,
          y: Math.random() * (window.innerHeight - 200) + 100,
          source: 'supabase',
          coverUrl: transmission.cover_url,
          description: transmission.notes
        }));

        // Process Google Books data
        const googleNodes: BrainNode[] = googleData.map((book, index) => ({
          id: `google-${book.id}`,
          title: book.title,
          author: book.author,
          tags: book.categories || ['Science Fiction'],
          x: Math.random() * (window.innerWidth - 200) + 100,
          y: Math.random() * (window.innerHeight - 200) + 100,
          source: 'google',
          coverUrl: book.coverUrl,
          description: book.description
        }));

        const allNodes = [...supabaseNodes, ...googleNodes];
        setNodes(allNodes);

        // Extract all unique tags
        const uniqueTags = Array.from(new Set(
          allNodes.flatMap(node => node.tags)
        )).slice(0, 10); // Limit to 10 most common tags
        setAllTags(uniqueTags);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing brain:', error);
        setLoading(false);
      }
    };

    initBrain();
  }, []);

  // Create and animate nodes
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    
    // Clear existing nodes
    canvas.innerHTML = '';

    // Create central node
    const centralNode = document.createElement('div');
    centralNode.className = 'central-node';
    centralNode.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      background: radial-gradient(circle, #00ffff, #0088ff);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 30px #00ffff;
      z-index: 10;
    `;
    canvas.appendChild(centralNode);

    // Animate central node pulse
    gsap.to(centralNode, {
      scale: 1.2,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create thought nodes
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = `thought-node ${node.source}`;
      nodeElement.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: ${node.source === 'supabase' ? '#ff6b6b' : '#4ecdc4'};
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 0 0 10px ${node.source === 'supabase' ? '#ff6b6b' : '#4ecdc4'};
        opacity: 0;
        z-index: 5;
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
          scale: 2,
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
        setSelectedNode(node);
      });

      canvas.appendChild(nodeElement);

      // Animate node appearance
      gsap.to(nodeElement, {
        opacity: 1,
        duration: 0.5,
        delay: index * 0.1,
        ease: "power2.out"
      });

      // Floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 40 - 20}`,
        y: `+=${Math.random() * 40 - 20}`,
        duration: 4 + Math.random() * 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Flickering effect
      gsap.to(nodeElement, {
        opacity: 0.6,
        duration: 2 + Math.random() * 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    });

    // Create connection trails between nodes with shared tags
    createConnectionTrails(canvas, nodes);

  }, [nodes]);

  // Create connection trails between related nodes
  const createConnectionTrails = (canvas: HTMLElement, nodes: BrainNode[]) => {
    const connections: Array<{from: BrainNode, to: BrainNode, strength: number}> = [];
    
    // Find connections based on shared tags
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        const sharedTags = node1.tags.filter(tag => node2.tags.includes(tag));
        
        if (sharedTags.length > 0) {
          connections.push({
            from: node1,
            to: node2,
            strength: sharedTags.length
          });
        }
      }
    }

    // Create SVG for trails
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    canvas.appendChild(svg);

    // Draw connection lines
    connections.slice(0, 20).forEach((connection, index) => { // Limit connections to avoid clutter
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', connection.from.x.toString());
      line.setAttribute('y1', connection.from.y.toString());
      line.setAttribute('x2', connection.to.x.toString());
      line.setAttribute('y2', connection.to.y.toString());
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', Math.min(connection.strength, 3).toString());
      line.setAttribute('opacity', '0.3');
      svg.appendChild(line);

      // Animate line appearance
      gsap.fromTo(line, {
        strokeDasharray: '0,1000'
      }, {
        strokeDasharray: '1000,0',
        duration: 2,
        delay: index * 0.2,
        ease: "power2.out"
      });
    });
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
        opacity: isVisible ? 1 : 0.1,
        scale: isVisible ? 1 : 0.5,
        duration: 0.5
      });
    });
  }, [activeFilters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse" />
          <p className="text-cyan-400">Initializing neural network...</p>
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

      {/* Tag Filters */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-md">
        {allTags.map(tag => (
          <Badge
            key={tag}
            variant={activeFilters.includes(tag) ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
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

      {/* Node Counter */}
      <div className="absolute top-4 right-4 z-20 text-cyan-400 text-sm">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Supabase: {nodes.filter(n => n.source === 'supabase').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
              <span>Google: {nodes.filter(n => n.source === 'google').length}</span>
            </div>
          </div>
        </div>
      </div>

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
                      <h3 className="text-sm font-semibold text-cyan-400 mb-2">Description</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {selectedNode.description.length > 300 
                          ? `${selectedNode.description.substring(0, 300)}...`
                          : selectedNode.description
                        }
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="border-cyan-400/50 text-cyan-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge 
                      variant="outline" 
                      className={`${selectedNode.source === 'supabase' ? 'border-red-400/50 text-red-300' : 'border-teal-400/50 text-teal-300'}`}
                    >
                      Source: {selectedNode.source === 'supabase' ? 'Your Library' : 'Google Books'}
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
          <p className="mb-1">🧠 Neural Map of Book Relationships</p>
          <p className="mb-1">• Hover over nodes to see details</p>
          <p className="mb-1">• Click nodes for full information</p>
          <p>• Use tag filters to explore connections</p>
        </div>
      </div>
    </div>
  );
};

export default TestBrain;
