
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { getTransmissions, Transmission } from '@/services/transmissionsService';

interface MiniBrainNode {
  id: string;
  title: string;
  x: number;
  y: number;
  element?: HTMLElement;
}

const MiniBrainVisual = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MiniBrainNode[]>([]);

  useEffect(() => {
    const initMiniBrain = async () => {
      try {
        const transmissions = await getTransmissions();
        
        if (transmissions && transmissions.length > 0) {
          // Create mini nodes from transmissions (limit to 8-10 for visual clarity)
          const miniNodes: MiniBrainNode[] = transmissions.slice(0, 8).map((transmission, index) => {
            const angle = (index * 2 * Math.PI) / Math.min(transmissions.length, 8);
            const radius = 25;
            const centerX = 60;
            const centerY = 35;
            
            return {
              id: `mini-${transmission.id}`,
              title: transmission.title,
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            };
          });

          setNodes(miniNodes);
        }
      } catch (error) {
        console.log('Mini brain initialization error:', error);
      }
    };

    initMiniBrain();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.mini-node').forEach(el => el.remove());

    // Create central pulse
    const centralNode = document.createElement('div');
    centralNode.className = 'mini-node central-pulse';
    centralNode.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: radial-gradient(circle, #00ffff 0%, #0099cc 100%);
      border-radius: 50%;
      left: 56px;
      top: 31px;
      box-shadow: 0 0 6px rgba(0, 212, 255, 0.8);
      opacity: 0.9;
      z-index: 10;
    `;
    canvas.appendChild(centralNode);

    // Animate central pulse
    gsap.to(centralNode, {
      scale: 1.5,
      opacity: 0.6,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    // Create mini nodes
    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'mini-node';
      
      nodeElement.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: radial-gradient(circle, #00d4ff 0%, #0099cc 100%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        box-shadow: 0 0 3px rgba(0, 212, 255, 0.7);
        opacity: 0;
        z-index: 8;
      `;

      node.element = nodeElement;
      canvas.appendChild(nodeElement);

      // Animate appearance
      gsap.to(nodeElement, {
        opacity: 0.8,
        scale: 1.2,
        duration: 0.8,
        delay: index * 0.1,
        ease: "back.out(2)"
      });

      // Floating animation
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 6 - 3}`,
        y: `+=${Math.random() * 6 - 3}`,
        duration: 3 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Breathing pulse
      gsap.to(nodeElement, {
        opacity: 0.4,
        scale: 0.8,
        duration: 2 + Math.random(),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });
    });

    // Create synaptic firing effect
    const createMiniSynapticFiring = () => {
      if (nodes.length < 2) return;

      const sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
      const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
      
      if (sourceNode === targetNode) return;

      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 0.5px;
        height: 0.5px;
        background: #00ffff;
        border-radius: 50%;
        box-shadow: 0 0 2px #00ffff;
        z-index: 12;
        pointer-events: none;
        opacity: 0.9;
      `;
      
      canvas.appendChild(particle);

      gsap.set(particle, { x: sourceNode.x + 1, y: sourceNode.y + 1 });
      gsap.to(particle, {
        x: targetNode.x + 1,
        y: targetNode.y + 1,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          if (targetNode.element) {
            gsap.to(targetNode.element, {
              scale: 2,
              duration: 0.1,
              yoyo: true,
              repeat: 1,
              ease: "power2.out"
            });
          }
          particle.remove();
        }
      });

      gsap.to(particle, {
        opacity: 0,
        duration: 1,
        ease: "sine.out"
      });
    };

    // Start periodic synaptic firing
    const firingInterval = setInterval(createMiniSynapticFiring, 2000);

    return () => {
      clearInterval(firingInterval);
    };
  }, [nodes]);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-16 overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, rgba(0, 212, 255, 0.05) 0%, transparent 70%)' }}
    />
  );
};

export default MiniBrainVisual;
