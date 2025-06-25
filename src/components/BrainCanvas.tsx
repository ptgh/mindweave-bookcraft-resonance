
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { BrainNode, BookLink } from '@/hooks/useBrainMap';
import { SynapticEffects } from '@/utils/synapticEffects';

interface BrainCanvasProps {
  nodes: BrainNode[];
  links: BookLink[];
  activeFilters: string[];
  onTooltipChange: (tooltip: { node: BrainNode; x: number; y: number } | null) => void;
}

const BrainCanvas: React.FC<BrainCanvasProps> = ({ 
  nodes, 
  links, 
  activeFilters,
  onTooltipChange 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const synapticEffectsRef = useRef<SynapticEffects | null>(null);

  // Initialize synaptic effects
  useEffect(() => {
    if (canvasRef.current && nodes.length > 0) {
      synapticEffectsRef.current = new SynapticEffects(canvasRef, nodes, links);
      synapticEffectsRef.current.createAmbientParticleField();
      
      // Start ambient energy flow
      const ambientInterval = setInterval(() => {
        synapticEffectsRef.current?.createAmbientEnergyFlow();
      }, 3000 + Math.random() * 4000);
      
      return () => clearInterval(ambientInterval);
    }
  }, [nodes, links]);

  // Create and animate neuron-like nodes
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;
    
    // Clear existing nodes
    canvas.querySelectorAll('.thought-node').forEach(el => el.remove());
    svg.innerHTML = '';

    nodes.forEach((node, index) => {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'thought-node neuron-node';
      
      const nodeConnections = links.filter(link => 
        link.fromId === node.id || link.toId === node.id
      ).length;
      const baseSize = Math.max(4, Math.min(6, 4 + nodeConnections * 0.3));
      const isHighActivity = nodeConnections > 2;
      
      nodeElement.style.cssText = `
        position: absolute;
        width: ${baseSize}px;
        height: ${baseSize}px;
        background: radial-gradient(circle at 30% 30%, 
          ${isHighActivity ? '#00ffff' : '#00d4ff'} 0%, 
          ${isHighActivity ? '#40e0d0' : '#0099cc'} 40%, 
          ${isHighActivity ? '#9370db40' : '#00669940'} 70%,
          transparent 100%);
        border-radius: 50%;
        left: ${node.x}px;
        top: ${node.y}px;
        cursor: pointer;
        box-shadow: 
          0 0 ${baseSize * 1.5}px ${isHighActivity ? '#00ffff' : '#00d4ff'}90,
          0 0 ${baseSize * 3}px ${isHighActivity ? '#00ffff' : '#00d4ff'}50,
          inset 0 0 ${baseSize * 0.5}px ${isHighActivity ? '#00ffff80' : '#00d4ff60'};
        opacity: 0;
        z-index: 15;
        border: 0.5px solid ${isHighActivity ? '#00ffff60' : '#00d4ff40'};
      `;

      // Add pulsing nucleus using ::before
      nodeElement.style.setProperty('--nucleus-color', isHighActivity ? '#00ffff' : '#40e0d0');
      
      const style = document.createElement('style');
      style.textContent = `
        .neuron-node::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, var(--nucleus-color) 0%, transparent 70%);
          border-radius: 50%;
          animation: nucleusPulse 2s ease-in-out infinite;
        }
        
        @keyframes nucleusPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      `;
      document.head.appendChild(style);

      (nodeElement as any).nodeData = node;
      node.element = nodeElement;

      // Enhanced hover interactions
      nodeElement.addEventListener('mouseenter', (e) => {
        const rect = nodeElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        let tooltipX = rect.left - canvasRect.left + rect.width / 2;
        let tooltipY = rect.top - canvasRect.top - 10;
        
        if (tooltipX < 150) tooltipX = 150;
        if (tooltipX > window.innerWidth - 150) tooltipX = window.innerWidth - 150;
        if (tooltipY < 80) tooltipY = rect.bottom - canvasRect.top + 10;
        
        onTooltipChange({
          node,
          x: tooltipX,
          y: tooltipY
        });
        
        // Enhanced hover with ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0px;
          height: 0px;
          border: 1px solid #00ffff80;
          border-radius: 50%;
          pointer-events: none;
          z-index: 10;
        `;
        nodeElement.appendChild(ripple);
        
        gsap.timeline()
          .to(nodeElement, {
            scale: 4,
            boxShadow: `
              0 0 ${baseSize * 4}px #00ffff,
              0 0 ${baseSize * 8}px #00ffff80,
              0 0 ${baseSize * 12}px #00ffff40
            `,
            duration: 0.3,
            ease: "back.out(2)"
          })
          .to(ripple, {
            width: '40px',
            height: '40px',
            marginLeft: '-20px',
            marginTop: '-20px',
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => ripple.remove()
          }, "<");

        synapticEffectsRef.current?.triggerSynapticFiring(node);
      });

      nodeElement.addEventListener('mouseleave', () => {
        onTooltipChange(null);
        gsap.to(nodeElement, {
          scale: 1,
          boxShadow: `
            0 0 ${baseSize * 1.5}px ${isHighActivity ? '#00ffff' : '#00d4ff'}90,
            0 0 ${baseSize * 3}px ${isHighActivity ? '#00ffff' : '#00d4ff'}50
          `,
          duration: 0.3
        });
      });

      canvas.appendChild(nodeElement);

      // Staggered appearance animation
      gsap.timeline({ delay: index * 0.08 })
        .from(nodeElement, {
          scale: 0,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(1.7)"
        })
        .to(nodeElement, {
          opacity: 1,
          duration: 0.3
        }, "<0.2");

      // Organic floating motion
      gsap.to(nodeElement, {
        x: `+=${Math.random() * 15 - 7.5}`,
        y: `+=${Math.random() * 15 - 7.5}`,
        duration: 8 + Math.random() * 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

      // Subtle breathing effect
      gsap.to(nodeElement, {
        scale: 1.1 + Math.random() * 0.2,
        opacity: 0.8 + Math.random() * 0.15,
        duration: 4 + Math.random() * 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2
      });

      // Spontaneous activity for high-activity nodes
      if (isHighActivity) {
        const burstInterval = setInterval(() => {
          if (Math.random() < 0.25) {
            gsap.to(nodeElement, {
              boxShadow: `
                0 0 ${baseSize * 6}px #00ffff,
                0 0 ${baseSize * 12}px #00ffff70,
                0 0 ${baseSize * 18}px #00ffff40
              `,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              ease: "sine.inOut"
            });
            
            if (Math.random() < 0.4) {
              synapticEffectsRef.current?.triggerSynapticFiring(node);
            }
          }
        }, 4000 + Math.random() * 8000);
        
        setTimeout(() => clearInterval(burstInterval), 300000);
      }
    });

    // Draw enhanced neural pathways
    drawLivingConnections(svg, nodes, links);

  }, [nodes, links]);

  // Enhanced connection drawing with wiggling filaments
  const drawLivingConnections = (svg: SVGSVGElement, nodes: BrainNode[], connections: BookLink[]) => {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 8;
    `;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Enhanced glow filters
    const createAdvancedGlow = (id: string, blur: number) => {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', id);
      filter.setAttribute('x', '-300%');
      filter.setAttribute('y', '-300%');
      filter.setAttribute('width', '700%');
      filter.setAttribute('height', '700%');

      const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feGaussianBlur.setAttribute('stdDeviation', blur.toString());
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
      return filter;
    };

    defs.appendChild(createAdvancedGlow('hologram-glow', 1.5));
    defs.appendChild(createAdvancedGlow('hologram-glow-intense', 2.5));
    svg.appendChild(defs);

    connections.forEach((connection, index) => {
      const fromNode = nodes.find(n => n.id === connection.fromId);
      const toNode = nodes.find(n => n.id === connection.toId);
      
      if (!fromNode || !toNode) return;

      // Multi-stage cubic Bézier curves for biological branching
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const curveFactor = 0.5 + Math.random() * 0.4;
      const cp1X = fromNode.x + dx * 0.1 + (Math.random() - 0.5) * distance * curveFactor;
      const cp1Y = fromNode.y + dy * 0.1 + (Math.random() - 0.5) * distance * curveFactor;
      const cp2X = fromNode.x + dx * 0.3 + (Math.random() - 0.5) * distance * curveFactor * 0.8;
      const cp2Y = fromNode.y + dy * 0.3 + (Math.random() - 0.5) * distance * curveFactor * 0.8;
      const cp3X = fromNode.x + dx * 0.7 + (Math.random() - 0.5) * distance * curveFactor * 0.6;
      const cp3Y = fromNode.y + dy * 0.7 + (Math.random() - 0.5) * distance * curveFactor * 0.6;
      const cp4X = fromNode.x + dx * 0.9 + (Math.random() - 0.5) * distance * curveFactor * 0.3;
      const cp4Y = fromNode.y + dy * 0.9 + (Math.random() - 0.5) * distance * curveFactor * 0.3;

      let pathData = `M${fromNode.x + 2},${fromNode.y + 2} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${cp3X},${cp3Y} C${cp3X},${cp3Y} ${cp4X},${cp4Y} ${toNode.x + 2},${toNode.y + 2}`;

      const getConnectionStyle = (type: string, strength: number) => {
        switch (type) {
          case 'tag_shared': 
            return { 
              colors: ['#00ffff', '#40e0d0', '#9370db'], 
              intensity: 0.8 + strength * 0.1,
              filter: 'hologram-glow-intense'
            };
          case 'author_shared': 
            return { 
              colors: ['#00d4ff', '#4169e1', '#40e0d0'], 
              intensity: 0.6 + strength * 0.1,
              filter: 'hologram-glow'
            };
          default: 
            return { 
              colors: ['#0099cc', '#00d4ff', '#40e0d0'], 
              intensity: 0.4 + strength * 0.1,
              filter: 'hologram-glow'
            };
        }
      };

      const style = getConnectionStyle(connection.type, connection.strength);
      
      const gradientId = `hologram-gradient-${index}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');

      const stops = [
        { offset: '0%', color: `${style.colors[0]}30`, opacity: '0.2' },
        { offset: '25%', color: `${style.colors[1]}`, opacity: `${style.intensity * 0.6}` },
        { offset: '50%', color: `${style.colors[2]}`, opacity: `${style.intensity}` },
        { offset: '75%', color: `${style.colors[1]}`, opacity: `${style.intensity * 0.6}` },
        { offset: '100%', color: `${style.colors[0]}30`, opacity: '0.2' }
      ];

      stops.forEach(stop => {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
        stopElement.setAttribute('stop-opacity', stop.opacity);
        gradient.appendChild(stopElement);
      });

      defs.appendChild(gradient);

      const baseWidth = Math.max(0.15, Math.min(connection.strength * 0.12 + 0.1, 0.6));
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', `url(#${gradientId})`);
      path.setAttribute('stroke-width', baseWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', `url(#${style.filter})`);
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      // Animated appearance
      gsap.to(path, {
        opacity: style.intensity * 0.9,
        duration: 2 + Math.random() * 1,
        delay: index * 0.06 + Math.random() * 0.3,
        ease: "power2.out"
      });

      // Opacity wave pulses along the stroke
      gsap.to(path, {
        opacity: style.intensity * 1.3,
        strokeWidth: baseWidth * 1.6,
        duration: 5 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });

      // Slow motion perturbation - wiggling filaments
      const wiggleAnimation = () => {
        const newCp1X = cp1X + (Math.random() - 0.5) * 20;
        const newCp1Y = cp1Y + (Math.random() - 0.5) * 20;
        const newCp2X = cp2X + (Math.random() - 0.5) * 15;
        const newCp2Y = cp2Y + (Math.random() - 0.5) * 15;
        
        const newPathData = `M${fromNode.x + 2},${fromNode.y + 2} C${newCp1X},${newCp1Y} ${newCp2X},${newCp2Y} ${cp3X},${cp3Y} C${cp3X},${cp3Y} ${cp4X},${cp4Y} ${toNode.x + 2},${toNode.y + 2}`;
        
        gsap.to(path, {
          attr: { d: newPathData },
          duration: 8 + Math.random() * 7,
          ease: "sine.inOut",
          onComplete: () => {
            // Return to original path
            gsap.to(path, {
              attr: { d: pathData },
              duration: 8 + Math.random() * 7,
              ease: "sine.inOut",
              onComplete: wiggleAnimation
            });
          }
        });
      };
      
      // Start wiggling after random delay
      setTimeout(wiggleAnimation, Math.random() * 10000);

      // Fade-out/fade-in cycling for re-mapping simulation
      if (Math.random() < 0.3) {
        gsap.to(path, {
          opacity: 0,
          duration: 2,
          delay: 15 + Math.random() * 20,
          onComplete: () => {
            gsap.to(path, {
              opacity: style.intensity * 0.9,
              duration: 3,
              delay: 2 + Math.random() * 5
            });
          }
        });
      }
    });
  };

  // Filter visibility based on active filters
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
        duration: 0.4,
        ease: "power2.out"
      });
    });
  }, [activeFilters]);

  return (
    <>
      <div 
        ref={canvasRef}
        className="brain-canvas absolute inset-0 w-full h-full"
        style={{ zIndex: 10 }}
      />
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 8 }} />
    </>
  );
};

export default BrainCanvas;
