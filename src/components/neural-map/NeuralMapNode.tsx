/**
 * Helper utilities for creating Neural Map DOM nodes imperatively.
 * Supports 3 node types: book, author, protagonist — each with distinct visual style.
 */

import { NodeType } from '@/pages/TestBrain';

export interface NodeRenderOptions {
  isMobile: boolean;
  connectionCount: number;
  isHighlighted?: boolean;
  coverUrl?: string;
  title: string;
  author: string;
  nodeType: NodeType;
}

// Color palettes per node type
const NODE_COLORS: Record<NodeType, { border: string; glow: string; fallbackBg: string; labelColor: string; subtitleColor: string }> = {
  book: {
    border: 'rgba(34, 211, 238, VAR)',     // cyan
    glow: 'rgba(34, 211, 238, VAR)',
    fallbackBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    labelColor: '#e2e8f0',
    subtitleColor: 'rgba(34, 211, 238, 0.5)',
  },
  author: {
    border: 'rgba(251, 191, 36, VAR)',      // amber
    glow: 'rgba(251, 191, 36, VAR)',
    fallbackBg: 'linear-gradient(135deg, #292524 0%, #1c1917 100%)',
    labelColor: '#fef3c7',
    subtitleColor: 'rgba(251, 191, 36, 0.6)',
  },
  protagonist: {
    border: 'rgba(192, 132, 252, VAR)',     // purple
    glow: 'rgba(192, 132, 252, VAR)',
    fallbackBg: 'linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%)',
    labelColor: '#e9d5ff',
    subtitleColor: 'rgba(192, 132, 252, 0.6)',
  },
};

function getColor(nodeType: NodeType, field: 'border' | 'glow', opacity: number): string {
  return NODE_COLORS[nodeType][field].replace('VAR', opacity.toString());
}

/**
 * Get node size based on device, connection count, and type
 */
export function getNodeSize(isMobile: boolean, connectionCount: number, nodeType: NodeType = 'book'): number {
  // Authors slightly larger, protagonists slightly smaller
  const sizeMultiplier = nodeType === 'author' ? 1.1 : nodeType === 'protagonist' ? 0.9 : 1;
  const tier = connectionCount <= 2 ? 'basic' : connectionCount <= 5 ? 'medium' : 'high';
  let base: number;
  if (isMobile) {
    base = tier === 'basic' ? 28 : tier === 'medium' ? 32 : 36;
  } else {
    base = tier === 'basic' ? 40 : tier === 'medium' ? 45 : 50;
  }
  return Math.round(base * sizeMultiplier);
}

/**
 * Get border shape CSS for node type
 */
function getBorderRadius(nodeType: NodeType): string {
  switch (nodeType) {
    case 'book': return '50%';
    case 'author': return '20%';         // Rounded square — distinct from circle
    case 'protagonist': return '50%';     // Circle but with inner diamond overlay
    default: return '50%';
  }
}

/**
 * Create a node element with type-specific styling
 */
export function createBookNodeElement(
  x: number,
  y: number,
  options: NodeRenderOptions
): HTMLElement {
  const nodeType = options.nodeType || 'book';
  const size = getNodeSize(options.isMobile, options.connectionCount, nodeType);
  const halfSize = size / 2;
  const borderRadius = getBorderRadius(nodeType);

  const wrapper = document.createElement('div');
  wrapper.className = `thought-node ${nodeType}-node`;
  wrapper.dataset.nodeType = nodeType;
  wrapper.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x - halfSize}px;
    top: ${y - halfSize}px;
    cursor: pointer;
    z-index: ${nodeType === 'author' ? 12 : nodeType === 'protagonist' ? 11 : 10};
    opacity: 0;
    will-change: transform, opacity;
  `;

  const borderOpacity = options.connectionCount > 5 ? 0.7 : 0.4;
  const glowIntensity = 0.15 + Math.min(options.connectionCount * 0.05, 0.35);
  const glowSize = 8 + options.connectionCount * 2;

  // Inner container with shape clipping
  const circle = document.createElement('div');
  circle.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: ${borderRadius};
    overflow: hidden;
    position: relative;
    border: ${nodeType === 'author' ? '2px' : '1.5px'} solid ${getColor(nodeType, 'border', borderOpacity)};
    box-shadow: 0 0 ${glowSize}px ${getColor(nodeType, 'glow', glowIntensity)};
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    ${nodeType === 'author' ? 'transform: rotate(0deg);' : ''}
  `;

  if (options.coverUrl) {
    const img = document.createElement('img');
    img.src = options.coverUrl;
    img.alt = options.title;
    img.loading = 'lazy';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    `;
    img.onerror = () => {
      img.remove();
      const fallback = createFallbackContent(options.title, size, nodeType);
      circle.appendChild(fallback);
    };
    circle.appendChild(img);
  } else {
    const fallback = createFallbackContent(options.title, size, nodeType);
    circle.appendChild(fallback);
  }

  wrapper.appendChild(circle);

  // Type indicator badge (small icon in corner)
  if (nodeType !== 'book') {
    const badge = document.createElement('div');
    const badgeIcon = nodeType === 'author' ? '✦' : '⟐';
    const badgeColor = nodeType === 'author' ? '#fbbf24' : '#c084fc';
    badge.style.cssText = `
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: ${Math.max(size * 0.35, 14)}px;
      height: ${Math.max(size * 0.35, 14)}px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid ${badgeColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.max(size * 0.2, 8)}px;
      color: ${badgeColor};
      z-index: 15;
      pointer-events: none;
    `;
    badge.textContent = badgeIcon;
    wrapper.appendChild(badge);
  }

  // Glow ring for high-connection nodes
  if (options.connectionCount > 3) {
    const glowRing = document.createElement('div');
    glowRing.style.cssText = `
      position: absolute;
      inset: -3px;
      border-radius: ${borderRadius};
      border: 1px solid ${getColor(nodeType, 'border', 0.15)};
      pointer-events: none;
      animation: pulse 3s ease-in-out infinite;
    `;
    wrapper.appendChild(glowRing);
  }

  // Title label
  const label = document.createElement('div');
  label.className = 'node-label';
  const colors = NODE_COLORS[nodeType];

  if (options.isMobile) {
    label.style.cssText = `
      position: absolute;
      top: ${size + 4}px;
      left: 50%;
      transform: translateX(-50%);
      width: ${Math.max(size + 20, 60)}px;
      text-align: center;
      font-size: 9px;
      line-height: 1.2;
      color: ${colors.labelColor};
      pointer-events: none;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    `;
    label.textContent = options.title;
  } else {
    label.style.cssText = `
      position: absolute;
      top: 50%;
      left: ${size + 6}px;
      transform: translateY(-50%);
      width: 100px;
      font-size: 10px;
      line-height: 1.25;
      color: ${colors.labelColor};
      pointer-events: none;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    `;
    label.textContent = options.title;

    // Sub-label
    const subLabel = document.createElement('div');
    const subText = nodeType === 'book' ? options.author 
      : nodeType === 'protagonist' ? `in "${options.author}"` // author field stores book author for protagonist
      : 'Author';
    subLabel.style.cssText = `
      font-size: 8px;
      color: ${colors.subtitleColor};
      margin-top: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-style: ${nodeType === 'protagonist' ? 'italic' : 'normal'};
    `;
    subLabel.textContent = subText;
    label.appendChild(subLabel);
  }

  wrapper.appendChild(label);

  // Hit area
  const hitArea = document.createElement('div');
  hitArea.className = 'node-hit-area';
  hitArea.style.cssText = `
    position: absolute;
    width: ${Math.max(size + 10, 44)}px;
    height: ${Math.max(size + 10, 44)}px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: ${borderRadius};
    cursor: pointer;
    z-index: 11;
  `;
  wrapper.appendChild(hitArea);

  return wrapper;
}

function createFallbackContent(title: string, size: number, nodeType: NodeType): HTMLElement {
  const colors = NODE_COLORS[nodeType];
  const fallback = document.createElement('div');
  fallback.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${colors.fallbackBg};
    color: ${colors.labelColor};
    font-size: ${Math.max(size * 0.35, 12)}px;
    font-weight: 600;
  `;
  fallback.textContent = title.charAt(0).toUpperCase();
  return fallback;
}

/**
 * Get connection line style based on edge reasons and node types
 */
export function getEdgeLineStyle(reasons: string[], fromType?: NodeType, toType?: NodeType): {
  strokeDasharray: string;
  strokeWidth: number;
  color: string;
  opacity: number;
} {
  // Cross-type edges (author↔book, protagonist↔book)
  if (fromType === 'author' || toType === 'author') {
    if (reasons.includes('wrote')) {
      return { strokeDasharray: 'none', strokeWidth: 1.2, color: '#fbbf24', opacity: 0.35 };
    }
  }
  if (fromType === 'protagonist' || toType === 'protagonist') {
    if (reasons.includes('appears_in')) {
      return { strokeDasharray: '3 2', strokeWidth: 1.0, color: '#c084fc', opacity: 0.3 };
    }
  }

  // Book↔Book edges (existing)
  if (reasons.includes('same_author')) {
    return { strokeDasharray: 'none', strokeWidth: 1.8, color: '#22d3ee', opacity: 0.5 };
  }
  if (reasons.includes('shared_theme')) {
    return { strokeDasharray: 'none', strokeWidth: 1.2, color: '#2dd4bf', opacity: 0.4 };
  }
  if (reasons.includes('shared_subgenre')) {
    return { strokeDasharray: '4 3', strokeWidth: 1.0, color: '#22d3ee', opacity: 0.35 };
  }
  if (reasons.includes('shared_era')) {
    return { strokeDasharray: '6 4', strokeWidth: 0.7, color: '#94a3b8', opacity: 0.3 };
  }
  return { strokeDasharray: 'none', strokeWidth: 0.8, color: '#22d3ee', opacity: 0.25 };
}
