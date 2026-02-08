import { useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BrainNode } from '@/pages/TestBrain';

interface NeuralMapRegionLabelsProps {
  nodes: BrainNode[];
}

interface ClusterLabel {
  tag: string;
  x: number;
  y: number;
  count: number;
}

const NeuralMapRegionLabels = ({ nodes }: NeuralMapRegionLabelsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const labels = useMemo<ClusterLabel[]>(() => {
    if (nodes.length < 3) return [];

    // Count tags and collect positions
    const tagData = new Map<string, { xs: number[]; ys: number[] }>();
    
    nodes.forEach(node => {
      node.tags.forEach(tag => {
        if (!tagData.has(tag)) tagData.set(tag, { xs: [], ys: [] });
        const d = tagData.get(tag)!;
        d.xs.push(node.x);
        d.ys.push(node.y);
      });
    });

    // Filter to tags with 3+ nodes, compute centroids
    const candidates: ClusterLabel[] = [];
    tagData.forEach((data, tag) => {
      if (data.xs.length < 3) return;
      const x = data.xs.reduce((a, b) => a + b, 0) / data.xs.length;
      const y = data.ys.reduce((a, b) => a + b, 0) / data.ys.length;
      candidates.push({ tag, x, y, count: data.xs.length });
    });

    // Sort by count, take top 5
    candidates.sort((a, b) => b.count - a.count);
    return candidates.slice(0, 5);
  }, [nodes]);

  // Fade in labels
  useEffect(() => {
    if (containerRef.current && labels.length > 0) {
      const els = containerRef.current.querySelectorAll('.region-label');
      gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 1.5, stagger: 0.2, delay: 0.5 });
    }
  }, [labels]);

  if (labels.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
      {labels.map(label => (
        <div
          key={label.tag}
          className="region-label absolute text-slate-400/35 text-[11px] uppercase tracking-[0.25em] font-medium select-none opacity-0"
          style={{
            left: label.x,
            top: label.y,
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 8px rgba(0,0,0,0.6)'
          }}
        >
          {label.tag}
        </div>
      ))}
    </div>
  );
};

export default NeuralMapRegionLabels;
