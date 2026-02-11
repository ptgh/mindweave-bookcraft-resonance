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

    candidates.sort((a, b) => b.count - a.count);
    
    // Deduplicate positions - avoid overlapping labels
    const filtered: ClusterLabel[] = [];
    candidates.forEach(candidate => {
      const tooClose = filtered.some(existing => {
        const dx = existing.x - candidate.x;
        const dy = existing.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < 120;
      });
      if (!tooClose) filtered.push(candidate);
    });
    
    return filtered.slice(0, 4);
  }, [nodes]);

  useEffect(() => {
    if (containerRef.current && labels.length > 0) {
      const els = containerRef.current.querySelectorAll('.region-label');
      gsap.fromTo(els, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, delay: 0.8 });
    }
  }, [labels]);

  if (labels.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {labels.map(label => (
        <div
          key={label.tag}
          className="region-label absolute opacity-0"
          style={{
            left: label.x,
            top: label.y - 50, // Position above the cluster, not in it
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-1.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/40 rounded-full px-3 py-1 shadow-lg">
            <div 
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee60' }}
            />
            <span className="text-[10px] text-slate-300 uppercase tracking-widest font-medium whitespace-nowrap">
              {label.tag}
            </span>
            <span className="text-[9px] text-cyan-400/60 ml-0.5">
              {label.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NeuralMapRegionLabels;
