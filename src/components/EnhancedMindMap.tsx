
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Transmission } from "@/services/transmissionsService";

interface EnhancedMindMapProps {
  transmissions: Transmission[];
}

interface NodeData {
  id: string;
  x: number;
  y: number;
  title: string;
  author: string;
  tags: string[];
  element?: HTMLElement;
}

const EnhancedMindMap = ({ transmissions }: EnhancedMindMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Initialize nodes with enhanced positioning
  useEffect(() => {
    if (!containerRef.current || transmissions.length === 0) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const nodeData: NodeData[] = transmissions.map((transmission, index) => {
      // Create spiral pattern for better distribution
      const angle = (index * 2.4) + (Math.random() * 0.5);
      const radius = 80 + (index * 15) + (Math.random() * 40);
      const spiralRadius = Math.min(radius, Math.min(rect.width, rect.height) / 3);
      
      return {
        id: `node-${transmission.id}`,
        x: centerX + Math.cos(angle) * spiralRadius,
        y: centerY + Math.sin(angle) * spiralRadius,
        title: transmission.title,
        author: transmission.author,
        tags: transmission.tags
      };
    });

    setNodes(nodeData);
  }, [transmissions]);

  // Enhanced node creation and animation
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    container.querySelectorAll('.mind-node').forEach(el => el.remove());
    svg.innerHTML = '';

    // Create connections first
    const connections = createConnections(nodes);
    drawConnections(svg, connections);

    // Create and animate nodes
    nodes.forEach((node, index) => {
      const nodeElement = createNodeElement(node, index);
      container.appendChild(nodeElement);
      node.element = nodeElement;

      // Enhanced entrance animation
      gsap.timeline({ delay: index * 0.1 })
        .from(nodeElement, {
          scale: 0,
          opacity: 0,
          rotation: 180,
          duration: 0.8,
          ease: "back.out(2)"
        })
        .to(nodeElement, {
          opacity: 1,
          duration: 0.3
        }, "<0.5");

      // Floating animation
      gsap.to(nodeElement, {
        y: `+=${Math.sin(index) * 10}`,
        x: `+=${Math.cos(index) * 5}`,
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing animation
      gsap.to(nodeElement, {
        scale: 1.1,
        duration: 2 + Math.random(),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });
    });

    // Cleanup function
    return () => {
      container.querySelectorAll('.mind-node').forEach(el => el.remove());
    };
  }, [nodes]);

  const createNodeElement = (node: NodeData, index: number) => {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'mind-node';
    nodeElement.id = node.id;
    
    // Dynamic sizing based on tag count
    const size = Math.max(8, Math.min(16, 8 + node.tags.length * 2));
    const intensity = Math.min(1, node.tags.length / 5);
    
    nodeElement.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${node.x - size/2}px;
      top: ${node.y - size/2}px;
      border-radius: 50%;
      background: radial-gradient(circle, 
        rgba(137, 180, 250, ${0.8 + intensity * 0.2}) 0%, 
        rgba(137, 180, 250, ${0.6 + intensity * 0.2}) 50%, 
        rgba(137, 180, 250, ${0.2 + intensity * 0.1}) 100%);
      border: 1px solid rgba(137, 180, 250, 0.8);
      box-shadow: 
        0 0 ${size}px rgba(137, 180, 250, 0.4),
        0 0 ${size * 2}px rgba(137, 180, 250, 0.2),
        inset 0 0 ${size/2}px rgba(137, 180, 250, 0.3);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
    `;

    // Enhanced hover effects
    nodeElement.addEventListener('mouseenter', () => {
      setHoveredNode(node.id);
      
      gsap.timeline()
        .to(nodeElement, {
          scale: 3,
          boxShadow: `
            0 0 ${size * 3}px rgba(137, 180, 250, 0.8),
            0 0 ${size * 6}px rgba(137, 180, 250, 0.4),
            0 0 ${size * 9}px rgba(137, 180, 250, 0.2)
          `,
          duration: 0.3,
          ease: "back.out(1.7)"
        });

      // Trigger connection highlight
      highlightNodeConnections(node.id);
    });

    nodeElement.addEventListener('mouseleave', () => {
      setHoveredNode(null);
      
      gsap.to(nodeElement, {
        scale: 1,
        boxShadow: `
          0 0 ${size}px rgba(137, 180, 250, 0.4),
          0 0 ${size * 2}px rgba(137, 180, 250, 0.2)
        `,
        duration: 0.3
      });

      // Remove connection highlights
      clearConnectionHighlights();
    });

    return nodeElement;
  };

  const createConnections = (nodes: NodeData[]) => {
    const connections: Array<{from: NodeData, to: NodeData, strength: number}> = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Calculate connection strength based on shared tags
        const sharedTags = node1.tags.filter(tag => node2.tags.includes(tag));
        const strength = sharedTags.length;
        
        if (strength > 0 || Math.random() < 0.15) {
          connections.push({
            from: node1,
            to: node2,
            strength: Math.max(strength, 0.5)
          });
        }
      }
    }
    
    return connections;
  };

  const drawConnections = (svg: SVGSVGElement, connections: Array<{from: NodeData, to: NodeData, strength: number}>) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '5';

    connections.forEach((connection, index) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Create curved path
      const midX = (connection.from.x + connection.to.x) / 2;
      const midY = (connection.from.y + connection.to.y) / 2;
      const offset = Math.random() * 50 - 25;
      
      const pathData = `M ${connection.from.x} ${connection.from.y} Q ${midX + offset} ${midY + offset} ${connection.to.x} ${connection.to.y}`;
      
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `rgba(137, 180, 250, ${Math.min(connection.strength * 0.3, 0.6)})`);
      path.setAttribute('stroke-width', `${Math.max(0.5, connection.strength * 0.8)}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.classList.add('connection-path');
      
      svg.appendChild(path);

      // Animate connection appearance
      gsap.to(path, {
        opacity: Math.min(connection.strength * 0.4, 0.7),
        duration: 1.5,
        delay: index * 0.05,
        ease: "power2.out"
      });

      // Breathing animation for connections
      gsap.to(path, {
        opacity: Math.min(connection.strength * 0.6, 0.9),
        strokeWidth: Math.max(1, connection.strength * 1.2),
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });
    });
  };

  const highlightNodeConnections = (nodeId: string) => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll('.connection-path');
    paths.forEach(path => {
      gsap.to(path, {
        stroke: 'rgba(255, 255, 255, 0.8)',
        strokeWidth: '2',
        opacity: 0.9,
        duration: 0.3
      });
    });
  };

  const clearConnectionHighlights = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll('.connection-path');
    paths.forEach(path => {
      gsap.to(path, {
        stroke: 'rgba(137, 180, 250, 0.4)',
        strokeWidth: '1',
        opacity: 0.4,
        duration: 0.3
      });
    });
  };

  if (transmissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-slate-600 animate-pulse" />
          <p>No transmissions to map</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-900/20 rounded-lg">
      <svg ref={svgRef} className="absolute inset-0" />
      
      {/* Tooltip for hovered node */}
      {hoveredNode && nodes.find(n => n.id === hoveredNode) && (
        <div 
          className="absolute z-20 pointer-events-none"
          style={{
            left: nodes.find(n => n.id === hoveredNode)!.x + 20,
            top: nodes.find(n => n.id === hoveredNode)!.y - 40
          }}
        >
          <div className="bg-slate-800/95 border border-blue-400/50 rounded-lg p-3 max-w-xs shadow-lg">
            <h4 className="font-semibold text-blue-400 text-sm mb-1">
              {nodes.find(n => n.id === hoveredNode)!.title}
            </h4>
            <p className="text-xs text-slate-300">
              {nodes.find(n => n.id === hoveredNode)!.author}
            </p>
            <div className="text-xs text-blue-300/70 mt-1">
              {nodes.find(n => n.id === hoveredNode)!.tags.length} concepts
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMindMap;
