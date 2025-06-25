
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BrainNode, BookLink } from '@/hooks/useBrainMap';
import { createEnhancedSynapticFiring } from '@/utils/synapticEffects';

interface BrainCanvasProps {
  nodes: BrainNode[];
  links: BookLink[];
  canvasRef: React.RefObject<HTMLDivElement>;
  activeFilters: string[];
}

export const BrainCanvas: React.FC<BrainCanvasProps> = ({ 
  nodes, 
  links, 
  canvasRef, 
  activeFilters 
}) => {
  const nodeElements = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    // Clear previous nodes
    nodeElements.current.clear();
    canvasRef.current.innerHTML = '';

    // Create node elements
    nodes.forEach(node => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node neural-particle';
      nodeElement.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #00d4ff 0%, #40e0d0 40%, transparent 80%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        box-shadow: 
          0 0 8px #00d4ff90,
          0 0 16px #00d4ff60,
          0 0 24px #00d4ff30;
        z-index: 15;
        cursor: pointer;
        opacity: 0.8;
      `;

      // Store reference for synaptic firing
      nodeElements.current.set(node.id, nodeElement);
      node.element = nodeElement;

      // Add hover effects
      nodeElement.addEventListener('mouseenter', () => {
        gsap.to(nodeElement, {
          scale: 2,
          boxShadow: '0 0 20px #00d4ff, 0 0 40px #40e0d0, 0 0 60px #9370db',
          duration: 0.3
        });

        // Trigger synaptic firing on hover
        createEnhancedSynapticFiring(node, nodes, links, canvasRef);
      });

      nodeElement.addEventListener('mouseleave', () => {
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 8px #00d4ff90, 0 0 16px #00d4ff60, 0 0 24px #00d4ff30',
          duration: 0.5
        });
      });

      canvasRef.current?.appendChild(nodeElement);
    });

    // Create connection lines (SVG)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;

    links.forEach(link => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Create organic curve
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const cp1x = fromNode.x + dx * 0.3 + Math.sin(Date.now() * 0.001) * 20;
      const cp1y = fromNode.y + dy * 0.3 + Math.cos(Date.now() * 0.001) * 20;
      const cp2x = fromNode.x + dx * 0.7 + Math.sin(Date.now() * 0.0015) * 15;
      const cp2y = fromNode.y + dy * 0.7 + Math.cos(Date.now() * 0.0015) * 15;
      
      const pathData = `M${fromNode.x + 3},${fromNode.y + 3} C${cp1x},${cp1y} ${cp2x},${cp2y} ${toNode.x + 3},${toNode.y + 3}`;
      
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', getConnectionColor(link.type));
      path.setAttribute('stroke-width', `${link.strength * 0.5 + 0.3}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.4');
      path.style.filter = 'blur(0.3px)';

      svg.appendChild(path);

      // Animate the connection
      gsap.to(path, {
        strokeDasharray: '4 8',
        strokeDashoffset: '-12',
        duration: 3 + Math.random() * 2,
        ease: 'none',
        repeat: -1
      });
    });

    canvasRef.current?.appendChild(svg);

    // Add nucleus pulsing to all nodes
    nodeElements.current.forEach(element => {
      gsap.to(element, {
        scale: 1.2,
        opacity: 1,
        duration: 2 + Math.random() * 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2
      });
    });

  }, [nodes, links, canvasRef]);

  return null; // This component renders directly to the canvas ref
};

const getConnectionColor = (type: string): string => {
  switch (type) {
    case 'temporal_bridge': return '#40e0d0';
    case 'thematic_resonance': return '#9370db';
    case 'author_consciousness': return '#00d4ff';
    case 'conceptual_drift': return '#20b2aa';
    case 'quantum_entanglement': return '#ff1493';
    default: return '#00d4ff';
  }
};
