import { ConnectionReason } from '@/hooks/useNeuralMapConnections';
import { BrainNode } from '@/pages/TestBrain';

interface EdgeLabelProps {
  fromNode: BrainNode;
  toNode: BrainNode;
  reasons: ConnectionReason[];
  sharedTags: string[];
  score: number;
  hoveredNodeId: string | null;
}

/**
 * Get a short human-readable label for a connection
 */
export function getEdgeLabelText(reasons: ConnectionReason[], sharedTags: string[]): string {
  if (reasons.includes('same_author')) return 'Same Author';
  if (reasons.includes('shared_theme') && sharedTags.length > 0) {
    return sharedTags[0];
  }
  if (reasons.includes('shared_subgenre') && sharedTags.length > 0) {
    return sharedTags[0];
  }
  if (reasons.includes('shared_era') && sharedTags.length > 0) {
    return sharedTags[sharedTags.length - 1];
  }
  return 'Connected';
}

const EdgeLabel = ({ fromNode, toNode, reasons, sharedTags, score, hoveredNodeId }: EdgeLabelProps) => {
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const labelText = getEdgeLabelText(reasons, sharedTags);

  // Show if: no hover active, or one of the connected nodes is hovered
  const isRelevant = !hoveredNodeId || 
    hoveredNodeId === fromNode.id || 
    hoveredNodeId === toNode.id;

  if (!isRelevant) return null;

  return (
    <div
      className="absolute pointer-events-none z-[3] transition-opacity duration-300"
      style={{
        left: midX,
        top: midY,
        transform: 'translate(-50%, -50%)',
        opacity: hoveredNodeId ? 0.9 : 0.6,
      }}
    >
      <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-400/20 rounded-full px-2 py-0.5 text-[9px] text-cyan-300/80 whitespace-nowrap shadow-sm">
        {labelText}
      </div>
    </div>
  );
};

export default EdgeLabel;
