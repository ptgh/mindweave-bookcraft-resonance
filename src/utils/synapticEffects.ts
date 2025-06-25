
import { gsap } from 'gsap';
import { BrainNode, BookLink } from '@/hooks/useBrainMap';

export class SynapticEffects {
  private canvasRef: React.RefObject<HTMLDivElement>;
  private nodes: BrainNode[];
  private links: BookLink[];

  constructor(canvasRef: React.RefObject<HTMLDivElement>, nodes: BrainNode[], links: BookLink[]) {
    this.canvasRef = canvasRef;
    this.nodes = nodes;
    this.links = links;
  }

  // Enhanced synaptic firing with asymmetric bursts
  triggerSynapticFiring(sourceNode: BrainNode) {
    const relatedLinks = this.links.filter(link => 
      link.fromId === sourceNode.id || link.toId === sourceNode.id
    );

    relatedLinks.forEach((link, index) => {
      const fromNode = this.nodes.find(n => n.id === link.fromId);
      const toNode = this.nodes.find(n => n.id === link.toId);
      
      if (!fromNode || !toNode) return;

      // Create 2-3 asymmetric bursts with random timing
      const burstCount = 2 + Math.floor(Math.random() * 2);
      
      for (let burst = 0; burst < burstCount; burst++) {
        setTimeout(() => {
          for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'neural-particle';
            
            // Enhanced holographic colors
            const colors = ['#00ffff', '#40e0d0', '#9370db', '#4169e1', '#7df9ff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particleSize = 0.8 + Math.random() * 1.5;
            const glowIntensity = 4 + Math.random() * 6;
            
            particle.style.cssText = `
              position: absolute;
              width: ${particleSize}px;
              height: ${particleSize}px;
              background: radial-gradient(circle, ${color} 0%, ${color}80 30%, transparent 60%);
              border-radius: 50%;
              box-shadow: 
                0 0 ${glowIntensity}px ${color},
                0 0 ${glowIntensity * 2}px ${color}60,
                0 0 ${glowIntensity * 3}px ${color}30;
              z-index: 25;
              pointer-events: none;
              opacity: ${0.9 + Math.random() * 0.1};
            `;
            
            this.canvasRef.current?.appendChild(particle);

            // Create organic curved path with multiple control points
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const curvature = 0.7 + Math.random() * 0.6;
            const cp1X = fromNode.x + dx * 0.15 + (Math.random() - 0.5) * distance * curvature;
            const cp1Y = fromNode.y + dy * 0.15 + (Math.random() - 0.5) * distance * curvature;
            const cp2X = fromNode.x + dx * 0.4 + (Math.random() - 0.5) * distance * curvature * 0.8;
            const cp2Y = fromNode.y + dy * 0.4 + (Math.random() - 0.5) * distance * curvature * 0.8;
            const cp3X = fromNode.x + dx * 0.7 + (Math.random() - 0.5) * distance * curvature * 0.6;
            const cp3Y = fromNode.y + dy * 0.7 + (Math.random() - 0.5) * distance * curvature * 0.6;
            
            const pathData = `M${fromNode.x + 2},${fromNode.y + 2} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${cp3X},${cp3Y} L${toNode.x + 2},${toNode.y + 2}`;
            
            gsap.set(particle, {
              x: fromNode.x + 2,
              y: fromNode.y + 2,
              scale: 0.1
            });

            const tl = gsap.timeline();
            
            // Particle growth and travel
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
              duration: 1.4 + Math.random() * 0.8,
              ease: "power1.inOut",
              onUpdate: function() {
                // Flash mid-path
                if (this.progress() > 0.4 && this.progress() < 0.6) {
                  gsap.to(particle, {
                    boxShadow: `0 0 ${glowIntensity * 3}px ${color}, 0 0 ${glowIntensity * 6}px ${color}80`,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                  });
                }
              },
              onComplete: () => {
                // Enhanced arrival burst
                if (toNode.element) {
                  gsap.to(toNode.element, {
                    scale: 2.8,
                    boxShadow: `0 0 20px ${color}, 0 0 40px ${color}80, 0 0 60px ${color}40`,
                    duration: 0.15,
                    ease: "power3.out",
                    yoyo: true,
                    repeat: 1
                  });
                }
                particle.remove();
              }
            }, "<0.2")
            .to(particle, {
              scale: 0.2,
              opacity: 0.8,
              duration: 0.3,
              ease: "sine.inOut",
              yoyo: true,
              repeat: 2
            }, "<");
          }
        }, burst * (150 + Math.random() * 200)); // Asymmetric timing
      }
    });
  }

  // Create ambient background particle field
  createAmbientParticleField() {
    if (!this.canvasRef.current) return;

    const backgroundField = document.createElement('div');
    backgroundField.className = 'neural-background';
    backgroundField.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
      opacity: 0.3;
    `;

    // Create floating ambient particles
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      const size = 0.5 + Math.random() * 1;
      const color = ['#00ffff20', '#40e0d040', '#9370db30'][Math.floor(Math.random() * 3)];
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 ${size * 3}px ${color};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;

      backgroundField.appendChild(particle);

      // Gentle orbital motion
      gsap.to(particle, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: 20 + Math.random() * 15,
        ease: "none",
        repeat: -1,
        yoyo: true
      });

      // Subtle opacity breathing
      gsap.to(particle, {
        opacity: 0.1 + Math.random() * 0.4,
        duration: 4 + Math.random() * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    this.canvasRef.current.appendChild(backgroundField);
  }

  // Continuous ambient energy flow
  createAmbientEnergyFlow() {
    if (!this.canvasRef.current || this.links.length === 0) return;

    const link = this.links[Math.floor(Math.random() * this.links.length)];
    const fromNode = this.nodes.find(n => n.id === link.fromId);
    const toNode = this.nodes.find(n => n.id === link.toId);
    
    if (!fromNode || !toNode) return;

    const ambientParticle = document.createElement('div');
    const color = '#00d4ff30';
    ambientParticle.style.cssText = `
      position: absolute;
      width: 0.6px;
      height: 0.6px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 3px ${color};
      z-index: 12;
      pointer-events: none;
      opacity: 0.5;
    `;
    
    this.canvasRef.current.appendChild(ambientParticle);

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = fromNode.x + dx * 0.5 + (Math.random() - 0.5) * distance * 0.25;
    const midY = fromNode.y + dy * 0.5 + (Math.random() - 0.5) * distance * 0.25;
    
    const pathData = `M${fromNode.x + 1},${fromNode.y + 1} Q${midX},${midY} ${toNode.x + 1},${toNode.y + 1}`;

    gsap.set(ambientParticle, { x: fromNode.x + 1, y: fromNode.y + 1 });
    gsap.to(ambientParticle, {
      motionPath: {
        path: pathData,
        autoRotate: false
      },
      duration: 12 + Math.random() * 8,
      ease: "none",
      onComplete: () => ambientParticle.remove()
    });
  }
}
