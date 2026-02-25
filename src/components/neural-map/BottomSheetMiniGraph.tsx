import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { gsap } from "gsap";
import { BrainNode } from "@/pages/TestBrain";

interface BottomSheetMiniGraphProps {
  node: BrainNode;
  allNodes: BrainNode[];
  neighbors: Array<{ nodeId: string; score: number }>;
  onSelectNode: (nodeId: string) => void;
}

const BottomSheetMiniGraph = ({ node, allNodes, neighbors, onSelectNode }: BottomSheetMiniGraphProps) => {
  const SIZE = 320;
  const CENTER = SIZE / 2;
  const RADIUS = 110;
  const NODE_R = 22;
  const svgRef = useRef<SVGSVGElement>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const getNode = (id: string) => allNodes.find(n => n.id === id);
  const maxScore = Math.max(...neighbors.map(n => n.score), 1);

  const handleImageError = (id: string) => {
    setFailedImages(prev => new Set([...prev, id]));
  };

  const renderFallbackCircle = (cx: number, cy: number, r: number, title: string) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#22d3ee" strokeOpacity={0.3} strokeWidth={1} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize="10" fontWeight="500">
        {title.charAt(0).toUpperCase()}
      </text>
    </g>
  );

  // Position neighbors radially
  const positioned = neighbors.map((n, i) => {
    const angle = (2 * Math.PI * i) / neighbors.length - Math.PI / 2;
    return {
      ...n,
      x: CENTER + Math.cos(angle) * RADIUS,
      y: CENTER + Math.sin(angle) * RADIUS,
      node: getNode(n.nodeId)
    };
  }).filter(n => n.node);

  // GSAP entrance animation
  useEffect(() => {
    if (!svgRef.current || positioned.length === 0) return;
    
    const neighborGroups = svgRef.current.querySelectorAll('.neighbor-node');
    const centerGroup = svgRef.current.querySelector('.center-node');
    const edges = svgRef.current.querySelectorAll('.edge-line');
    
    // Start small and invisible
    gsap.set(neighborGroups, { scale: 0, transformOrigin: 'center center', opacity: 0 });
    gsap.set(edges, { opacity: 0 });
    if (centerGroup) gsap.set(centerGroup, { scale: 0, transformOrigin: 'center center', opacity: 0 });

    // Animate center first
    if (centerGroup) {
      gsap.to(centerGroup, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
    }

    // Then edges
    gsap.to(edges, { opacity: 1, duration: 0.3, delay: 0.3, stagger: 0.05 });

    // Then neighbors with stagger
    gsap.to(neighborGroups, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      delay: 0.35,
      stagger: 0.08,
      ease: 'back.out(1.7)',
    });
  }, [node.id, positioned.length]);

  if (positioned.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500/60 text-sm">
        No direct connections to visualize
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center">
      <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {/* Edges */}
        {positioned.map(n => {
          const opacity = 0.15 + (n.score / maxScore) * 0.45;
          const width = 0.5 + (n.score / maxScore) * 1.5;
          return (
            <line
              key={`edge-${n.nodeId}`}
              className="edge-line"
              x1={CENTER} y1={CENTER}
              x2={n.x} y2={n.y}
              stroke="#22d3ee"
              strokeOpacity={opacity}
              strokeWidth={width}
            />
          );
        })}

        {/* Center node */}
        <g className="center-node">
          <circle cx={CENTER} cy={CENTER} r={NODE_R + 2} fill="none" stroke="#22d3ee" strokeOpacity={0.3} strokeWidth={1} />
          {node.coverUrl && !failedImages.has(node.id) ? (
            <>
              <clipPath id="center-clip">
                <circle cx={CENTER} cy={CENTER} r={NODE_R} />
              </clipPath>
              <image
                href={node.coverUrl}
                x={CENTER - NODE_R} y={CENTER - NODE_R}
                width={NODE_R * 2} height={NODE_R * 2}
                clipPath="url(#center-clip)"
                preserveAspectRatio="xMidYMid slice"
                onError={() => handleImageError(node.id)}
              />
            </>
          ) : (
            renderFallbackCircle(CENTER, CENTER, NODE_R, node.title)
          )}
          <circle cx={CENTER} cy={CENTER} r={NODE_R} fill="none" stroke="#22d3ee" strokeOpacity={0.5} strokeWidth={1.5} />
        </g>

        {/* Neighbor nodes */}
        {positioned.map((n, i) => {
          const neighborNode = n.node!;
          const clipId = `neighbor-clip-${i}`;
          const hasCover = neighborNode.coverUrl && !failedImages.has(n.nodeId);
          return (
            <g
              key={n.nodeId}
              className="cursor-pointer neighbor-node"
              onClick={() => onSelectNode(n.nodeId)}
              style={{ pointerEvents: 'all' }}
            >
              {hasCover ? (
                <>
                  <clipPath id={clipId}>
                    <circle cx={n.x} cy={n.y} r={NODE_R - 2} />
                  </clipPath>
                  <image
                    href={neighborNode.coverUrl}
                    x={n.x - (NODE_R - 2)} y={n.y - (NODE_R - 2)}
                    width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
                    clipPath={`url(#${clipId})`}
                    preserveAspectRatio="xMidYMid slice"
                    onError={() => handleImageError(n.nodeId)}
                  />
                </>
              ) : (
                renderFallbackCircle(n.x, n.y, NODE_R - 2, neighborNode.title)
              )}
              <circle
                cx={n.x} cy={n.y} r={NODE_R - 2}
                fill="none" stroke="#22d3ee"
                strokeOpacity={0.3} strokeWidth={1}
                className="hover:stroke-opacity-60 transition-all"
              />
              {/* Title label with word-wrap */}
              <foreignObject
                x={n.x - 40} y={n.y + NODE_R + 4}
                width={80} height={30}
                className="pointer-events-none"
              >
                <div
                  style={{ fontSize: '8px', color: '#94a3b8', opacity: 0.7, textAlign: 'center', lineHeight: '1.2' }}
                  className="line-clamp-2 select-none"
                >
                  {neighborNode.title}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BottomSheetMiniGraph;
