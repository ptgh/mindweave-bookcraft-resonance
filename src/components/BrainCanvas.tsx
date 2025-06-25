
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
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    // Clear existing nodes
    const existingNodes = canvasRef.current.querySelectorAll('.brain-node');
    existingNodes.forEach(node => node.remove());

    // Create node elements
    nodes.forEach(node => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'brain-node thought-node';
      nodeElement.style.cssText = `
        position: absolute;
        left: ${node.x}px;
        top: ${node.y}px;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #00d4ff 0%, #0099cc 100%);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 8px #00d4ff40, 0 0 16px #00d4ff20;
        z-index: 10;
      `;
      
      // Add hover effects
      nodeElement.addEventListener('mouseenter', () => {
        gsap.to(nodeElement, {
          scale: 1.5,
          boxShadow: '0 0 20px #00d4ff80, 0 0 40px #00d4ff40',
          duration: 0.3
        });
        
        // Trigger synaptic firing
        createEnhancedSynapticFiring(node, nodes, links, canvasRef);
      });
      
      nodeElement.addEventListener('mouseleave', () => {
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: '0 0 8px #00d4ff40, 0 0 16px #00d4ff20',
          duration: 0.3
        });
      });

      // Store reference
      nodeRefs.current[node.id] = nodeElement;
      node.element = nodeElement;
      
      canvasRef.current.appendChild(nodeElement);
    });

    // Apply filter effects
    if (activeFilters.length > 0) {
      nodes.forEach(node => {
        const hasActiveTag = node.thematicResonance.some(tag => 
          activeFilters.includes(tag)
        );
        
        if (nodeRefs.current[node.id]) {
          gsap.to(nodeRefs.current[node.id], {
            opacity: hasActiveTag ? 1 : 0.3,
            scale: hasActiveTag ? 1.2 : 0.8,
            duration: 0.5
          });
        }
      });
    } else {
      // Reset all nodes
      Object.values(nodeRefs.current).forEach(nodeElement => {
        gsap.to(nodeElement, {
          opacity: 1,
          scale: 1,
          duration: 0.5
        });
      });
    }

  }, [nodes, links, activeFilters]);

  return null; // This component only manages DOM elements
};
