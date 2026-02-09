import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import type { BrainNode, BookLink } from '@/pages/TestBrain';

const MAX_PARTICLES = 40;

export function useNeuralParticles() {
  const activeParticlesRef = useRef<number>(0);
  const lastHoverTimeRef = useRef<Map<string, number>>(new Map());

  const canCreateParticle = useCallback(() => {
    return activeParticlesRef.current < MAX_PARTICLES;
  }, []);

  const triggerSynapticFiring = useCallback((
    sourceNode: BrainNode,
    nodes: BrainNode[],
    links: BookLink[],
    canvasRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!canCreateParticle()) return;

    const relatedLinks = links.filter(link =>
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    ).slice(0, 3);

    relatedLinks.forEach((link) => {
      const fromNode = nodes.find(n => n.id === link.fromId);
      const toNode = nodes.find(n => n.id === link.toId);
      if (!fromNode || !toNode || !canCreateParticle()) return;

      for (let i = 0; i < 3; i++) {
        activeParticlesRef.current++;
        const particle = document.createElement('div');
        particle.className = 'neural-particle';

        const colors = ['#00ffff', '#40e0d0', '#00d4ff', '#0099ff', '#7df9ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleSize = 1 + Math.random() * 2;
        const glowIntensity = 6 + Math.random() * 8;

        particle.style.cssText = `
          position: absolute;
          width: ${particleSize}px;
          height: ${particleSize}px;
          background: radial-gradient(circle, ${color} 0%, ${color}80 40%, transparent 70%);
          border-radius: 50%;
          box-shadow: 0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}80, 0 0 ${glowIntensity * 3}px ${color}40, inset 0 0 ${glowIntensity / 2}px ${color};
          z-index: 20;
          pointer-events: none;
          opacity: ${0.8 + Math.random() * 0.2};
          will-change: transform;
        `;

        canvasRef.current?.appendChild(particle);

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = 0.6 + Math.random() * 0.8;

        const midX1 = fromNode.x + dx * 0.2 + (Math.random() - 0.5) * distance * curvature;
        const midY1 = fromNode.y + dy * 0.2 + (Math.random() - 0.5) * distance * curvature;
        const midX2 = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * curvature * 0.8;
        const midY2 = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * curvature * 0.8;
        const midX3 = fromNode.x + dx * 0.8 + (Math.random() - 0.5) * distance * curvature * 0.6;
        const midY3 = fromNode.y + dy * 0.8 + (Math.random() - 0.5) * distance * curvature * 0.6;

        const pathData = `M${fromNode.x + 3},${fromNode.y + 3} C${midX1},${midY1} ${midX2},${midY2} ${midX3},${midY3} L${toNode.x + 3},${toNode.y + 3}`;

        gsap.set(particle, { x: fromNode.x + 3, y: fromNode.y + 3, scale: 0.2 });

        const tl = gsap.timeline({
          onComplete: () => { activeParticlesRef.current--; }
        });

        tl.to(particle, { scale: 1.5 + Math.random() * 0.8, duration: 0.3, ease: "power2.out" })
          .to(particle, {
            motionPath: { path: pathData, autoRotate: false },
            duration: 1.8 + Math.random() * 1.2,
            ease: "power1.inOut",
            onComplete: () => {
              if (toNode.element) {
                gsap.to(toNode.element, {
                  scale: 2.5,
                  boxShadow: `0 0 30px ${color}, 0 0 60px ${color}60`,
                  duration: 0.2,
                  ease: "power3.out",
                  yoyo: true,
                  repeat: 1
                });
                gsap.to(toNode.element, {
                  scale: 1,
                  boxShadow: '0 0 12px rgba(0, 212, 255, 0.9), 0 0 24px rgba(0, 212, 255, 0.6)',
                  duration: 0.8,
                  delay: 0.4,
                  ease: "elastic.out(1, 0.6)"
                });
              }
              particle.remove();
            }
          }, "<0.3")
          .to(particle, {
            scale: 0.3,
            opacity: 0.9,
            duration: 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 2
          }, "<");
      }
    });
  }, [canCreateParticle]);

  const createAmbientFlow = useCallback((
    nodes: BrainNode[],
    links: BookLink[],
    canvasRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!canvasRef.current || links.length === 0 || !canCreateParticle()) return;

    const link = links[Math.floor(Math.random() * links.length)];
    const fromNode = nodes.find(n => n.id === link.fromId);
    const toNode = nodes.find(n => n.id === link.toId);
    if (!fromNode || !toNode) return;

    activeParticlesRef.current++;
    const ambientParticle = document.createElement('div');
    const color = '#00d4ff40';
    ambientParticle.style.cssText = `
      position: absolute; width: 0.8px; height: 0.8px;
      background: ${color}; border-radius: 50%;
      box-shadow: 0 0 4px ${color}; z-index: 15;
      pointer-events: none; opacity: 0.6; will-change: transform;
    `;

    canvasRef.current.appendChild(ambientParticle);

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * 0.3;
    const midY = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * 0.3;

    const pathData = `M${fromNode.x + 2},${fromNode.y + 2} Q${midX},${midY} ${toNode.x + 2},${toNode.y + 2}`;

    gsap.set(ambientParticle, { x: fromNode.x + 2, y: fromNode.y + 2 });
    gsap.to(ambientParticle, {
      motionPath: { path: pathData, autoRotate: false },
      duration: 8 + Math.random() * 4,
      ease: "none",
      onComplete: () => {
        ambientParticle.remove();
        activeParticlesRef.current--;
      }
    });
  }, [canCreateParticle]);

  const shouldThrottleHover = useCallback((nodeId: string) => {
    const now = Date.now();
    const lastHover = lastHoverTimeRef.current.get(nodeId) || 0;
    if (now - lastHover > 500) {
      lastHoverTimeRef.current.set(nodeId, now);
      return false;
    }
    return true;
  }, []);

  const resetParticles = useCallback(() => {
    activeParticlesRef.current = 0;
  }, []);

  return {
    canCreateParticle,
    triggerSynapticFiring,
    createAmbientFlow,
    shouldThrottleHover,
    resetParticles,
    maxParticles: MAX_PARTICLES,
    activeParticlesRef,
  };
}
