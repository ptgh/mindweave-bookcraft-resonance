
import { gsap } from 'gsap';
import { BrainNode, BookLink } from '@/hooks/useBrainMap';

export const createEnhancedSynapticFiring = (
  sourceNode: BrainNode,
  targetNodes: BrainNode[],
  links: BookLink[],
  canvasRef: React.RefObject<HTMLDivElement>
) => {
  const relatedLinks = links.filter(link => 
    link.fromId === sourceNode.id || link.toId === sourceNode.id
  );

  relatedLinks.forEach((link, index) => {
    const fromNode = targetNodes.find(n => n.id === link.fromId);
    const toNode = targetNodes.find(n => n.id === link.toId);
    
    if (!fromNode || !toNode) return;

    // Create multiple waves with different characteristics based on connection type
    const waveCount = getWaveCountByType(link.type);
    const colors = getColorsByType(link.type);
    
    for (let wave = 0; wave < waveCount; wave++) {
      setTimeout(() => {
        createSynapticWave(fromNode, toNode, link, colors, canvasRef, wave);
      }, wave * 150 + Math.random() * 200);
    }
  });
};

const getWaveCountByType = (type: string): number => {
  switch (type) {
    case 'temporal_bridge': return 4;
    case 'thematic_resonance': return 5;
    case 'author_consciousness': return 3;
    case 'conceptual_drift': return 3;
    case 'quantum_entanglement': return 2;
    default: return 2;
  }
};

const getColorsByType = (type: string): string[] => {
  switch (type) {
    case 'temporal_bridge': 
      return ['#40e0d0', '#00ffff', '#87ceeb', '#add8e6'];
    case 'thematic_resonance': 
      return ['#9370db', '#8a2be2', '#da70d6', '#dda0dd'];
    case 'author_consciousness': 
      return ['#00d4ff', '#0099ff', '#4169e1', '#6495ed'];
    case 'conceptual_drift': 
      return ['#20b2aa', '#48d1cc', '#7fffd4', '#afeeee'];
    case 'quantum_entanglement': 
      return ['#ff1493', '#ff69b4', '#ffc0cb', '#ffb6c1'];
    default: 
      return ['#00d4ff', '#40e0d0'];
  }
};

const createSynapticWave = (
  fromNode: BrainNode,
  toNode: BrainNode,
  link: BookLink,
  colors: string[],
  canvasRef: React.RefObject<HTMLDivElement>,
  waveIndex: number
) => {
  if (!canvasRef.current) return;

  const particleCount = Math.floor(link.strength * 3) + 2;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'neural-particle';
    
    const color = colors[i % colors.length];
    const particleSize = 1 + Math.random() * 1.5 + (link.strength * 0.2);
    const glowIntensity = 4 + Math.random() * 6 + (link.strength * 2);
    
    particle.style.cssText = `
      position: absolute;
      width: ${particleSize}px;
      height: ${particleSize}px;
      background: radial-gradient(circle, ${color} 0%, ${color}90 30%, ${color}60 60%, transparent 100%);
      border-radius: 50%;
      box-shadow: 
        0 0 ${glowIntensity}px ${color},
        0 0 ${glowIntensity * 2}px ${color}70,
        0 0 ${glowIntensity * 3}px ${color}40,
        inset 0 0 ${glowIntensity / 2}px ${color}80;
      z-index: 20;
      pointer-events: none;
      opacity: ${0.8 + Math.random() * 0.2};
    `;
    
    canvasRef.current.appendChild(particle);

    // Create more organic, living pathways
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Multiple control points for organic curves
    const curves = createOrganicCurve(fromNode, toNode, distance, waveIndex);
    const pathData = curves.pathData;
    
    gsap.set(particle, {
      x: fromNode.x + 3,
      y: fromNode.y + 3,
      scale: 0.2
    });

    // Enhanced particle animation with mid-path effects
    const tl = gsap.timeline();
    
    tl.to(particle, {
      scale: 1.2 + Math.random() * 0.6,
      duration: 0.2,
      ease: "power2.out"
    })
    .to(particle, {
      motionPath: {
        path: pathData,
        autoRotate: false
      },
      duration: 1.5 + Math.random() * 1.8 + (link.strength * 0.3),
      ease: "power1.inOut",
      onUpdate: function() {
        // Mid-path flash effect
        if (this.progress() > 0.4 && this.progress() < 0.6 && Math.random() < 0.1) {
          gsap.to(particle, {
            boxShadow: `0 0 ${glowIntensity * 4}px ${color}, 0 0 ${glowIntensity * 8}px ${color}50`,
            duration: 0.1,
            yoyo: true,
            repeat: 1
          });
        }
      },
      onComplete: () => {
        // Enhanced arrival burst
        if (toNode.element) {
          createArrivalBurst(toNode.element, color, link.strength);
        }
        particle.remove();
      }
    }, "<0.2")
    .to(particle, {
      scale: 0.4,
      opacity: 0.6 + Math.random() * 0.3,
      duration: 0.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: Math.floor(link.strength) + 1
    }, "<");
  }
};

const createOrganicCurve = (fromNode: BrainNode, toNode: BrainNode, distance: number, waveIndex: number) => {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  
  // Create more complex, organic curves with temporal variation
  const timeOffset = Date.now() * 0.001 + waveIndex * 0.5;
  const organicFactor = 0.4 + Math.sin(timeOffset) * 0.2;
  
  const cp1X = fromNode.x + dx * 0.2 + Math.sin(timeOffset * 0.7) * distance * organicFactor;
  const cp1Y = fromNode.y + dy * 0.2 + Math.cos(timeOffset * 0.8) * distance * organicFactor;
  
  const cp2X = fromNode.x + dx * 0.4 + Math.sin(timeOffset * 1.1) * distance * organicFactor * 0.8;
  const cp2Y = fromNode.y + dy * 0.4 + Math.cos(timeOffset * 1.2) * distance * organicFactor * 0.8;
  
  const cp3X = fromNode.x + dx * 0.7 + Math.sin(timeOffset * 0.9) * distance * organicFactor * 0.6;
  const cp3Y = fromNode.y + dy * 0.7 + Math.cos(timeOffset * 1.0) * distance * organicFactor * 0.6;
  
  return {
    pathData: `M${fromNode.x + 3},${fromNode.y + 3} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${cp3X},${cp3Y} L${toNode.x + 3},${toNode.y + 3}`
  };
};

const createArrivalBurst = (element: HTMLElement, color: string, strength: number) => {
  const burstRings = Math.floor(strength) + 2;
  
  for (let ring = 0; ring < burstRings; ring++) {
    gsap.delayedCall(ring * 0.08, () => {
      gsap.to(element, {
        scale: 3 + ring * 0.8,
        boxShadow: `
          0 0 ${20 + ring * 12}px ${color}, 
          0 0 ${40 + ring * 24}px ${color}70, 
          0 0 ${60 + ring * 36}px ${color}40,
          0 0 ${80 + ring * 48}px ${color}20
        `,
        duration: 0.15,
        ease: "power3.out",
        yoyo: true,
        repeat: 1
      });
    });
  }
  
  gsap.to(element, {
    scale: 1,
    boxShadow: `0 0 8px ${color}90, 0 0 16px ${color}60`,
    duration: 1.2,
    delay: 0.8,
    ease: "elastic.out(1, 0.4)"
  });
};

export const createBackgroundEnergyField = (canvasRef: React.RefObject<HTMLDivElement>) => {
  if (!canvasRef.current) return;

  // Create floating energy particles in background
  for (let i = 0; i < 25; i++) {
    const particle = document.createElement('div');
    particle.className = 'background-energy-particle';
    
    const colors = ['#00d4ff20', '#40e0d020', '#9370db15', '#20b2aa20'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
      position: absolute;
      width: ${0.5 + Math.random() * 1}px;
      height: ${0.5 + Math.random() * 1}px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 3px ${color};
      z-index: 5;
      pointer-events: none;
      opacity: ${0.3 + Math.random() * 0.4};
      left: ${Math.random() * window.innerWidth}px;
      top: ${Math.random() * window.innerHeight}px;
    `;
    
    canvasRef.current.appendChild(particle);

    // Gentle floating motion
    gsap.to(particle, {
      x: `+=${Math.random() * 200 - 100}`,
      y: `+=${Math.random() * 200 - 100}`,
      duration: 15 + Math.random() * 20,
      ease: "none",
      repeat: -1,
      yoyo: true
    });

    // Gentle pulsing
    gsap.to(particle, {
      opacity: 0.1,
      scale: 0.3,
      duration: 8 + Math.random() * 12,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 10
    });
  }
};
