/**
 * Neural Map node renderer — creates distinct, readable DOM nodes.
 * 
 * Node types & shapes:
 *   Book        → rounded square (12px radius) with cover image, cyan border
 *   Author      → circle with portrait, amber/gold border
 *   Protagonist → hexagon-clipped circle, purple border
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

// ── Palette ────────────────────────────────────────────────────────────
const NODE_COLORS: Record<NodeType, {
  border: string; glow: string; fallbackBg: string;
  labelColor: string; subtitleColor: string; accent: string;
}> = {
  book: {
    border: 'rgba(34, 211, 238, VAR)',
    glow:   'rgba(34, 211, 238, VAR)',
    fallbackBg: 'linear-gradient(135deg, #0c1929 0%, #0f172a 100%)',
    labelColor: '#e2e8f0',
    subtitleColor: 'rgba(34, 211, 238, 0.6)',
    accent: '#22d3ee',
  },
  author: {
    border: 'rgba(251, 191, 36, VAR)',
    glow:   'rgba(251, 191, 36, VAR)',
    fallbackBg: 'linear-gradient(135deg, #292524 0%, #1c1917 100%)',
    labelColor: '#fef3c7',
    subtitleColor: 'rgba(251, 191, 36, 0.7)',
    accent: '#fbbf24',
  },
  protagonist: {
    border: 'rgba(192, 132, 252, VAR)',
    glow:   'rgba(192, 132, 252, VAR)',
    fallbackBg: 'linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%)',
    labelColor: '#e9d5ff',
    subtitleColor: 'rgba(192, 132, 252, 0.7)',
    accent: '#c084fc',
  },
};

function getColor(nodeType: NodeType, field: 'border' | 'glow', opacity: number): string {
  return NODE_COLORS[nodeType][field].replace('VAR', opacity.toString());
}

// ── Node sizes ─────────────────────────────────────────────────────────
export function getNodeSize(isMobile: boolean, connectionCount: number, nodeType: NodeType = 'book'): number {
  // Books are largest (they show covers), authors medium, protagonists compact
  const typeBase: Record<NodeType, number> = {
    book: isMobile ? 48 : 60,
    author: isMobile ? 44 : 54,
    protagonist: isMobile ? 38 : 46,
  };
  const base = typeBase[nodeType];
  // Slight growth for well-connected nodes
  const growth = Math.min(connectionCount * 1.5, 10);
  return Math.round(base + growth);
}

// ── Shape helpers ──────────────────────────────────────────────────────
function getBorderRadius(nodeType: NodeType): string {
  switch (nodeType) {
    case 'book': return '14px';        // Rounded square
    case 'author': return '50%';       // Circle
    case 'protagonist': return '50%';  // Circle (we add hexagon clip inside)
    default: return '50%';
  }
}

function getClipPath(nodeType: NodeType): string | null {
  if (nodeType === 'protagonist') {
    // Hexagonal clip
    return 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
  }
  return null;
}

// ── Main node factory ──────────────────────────────────────────────────
export function createBookNodeElement(
  x: number,
  y: number,
  options: NodeRenderOptions
): HTMLElement {
  const nodeType = options.nodeType || 'book';
  const size = getNodeSize(options.isMobile, options.connectionCount, nodeType);
  const halfSize = size / 2;
  const borderRadius = getBorderRadius(nodeType);
  const clipPath = getClipPath(nodeType);
  const colors = NODE_COLORS[nodeType];

  // Outer wrapper — positioned absolutely in the canvas
  const wrapper = document.createElement('div');
  wrapper.className = `thought-node ${nodeType}-node`;
  wrapper.dataset.nodeType = nodeType;
  wrapper.style.cssText = `
    position: absolute;
    width: ${size}px;
    left: ${x - halfSize}px;
    top: ${y - halfSize}px;
    cursor: pointer;
    z-index: ${nodeType === 'author' ? 12 : nodeType === 'protagonist' ? 11 : 10};
    opacity: 0;
    will-change: transform, opacity;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  const borderOpacity = Math.min(0.5 + options.connectionCount * 0.04, 0.85);
  const glowIntensity = 0.18 + Math.min(options.connectionCount * 0.05, 0.4);
  const glowSize = 10 + options.connectionCount * 2;
  const borderWidth = nodeType === 'author' ? 2.5 : 2;

  // ── Image container ──────────────────────────────────────────────
  const imageBox = document.createElement('div');
  const imageBoxStyle = `
    width: ${size}px;
    height: ${size}px;
    border-radius: ${borderRadius};
    overflow: hidden;
    position: relative;
    border: ${borderWidth}px solid ${getColor(nodeType, 'border', borderOpacity)};
    box-shadow: 0 0 ${glowSize}px ${getColor(nodeType, 'glow', glowIntensity)},
                inset 0 0 ${glowSize / 2}px ${getColor(nodeType, 'glow', glowIntensity * 0.3)};
    transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
    flex-shrink: 0;
  `;
  imageBox.style.cssText = clipPath
    ? `${imageBoxStyle} clip-path: ${clipPath};`
    : imageBoxStyle;

  if (options.coverUrl) {
    const img = document.createElement('img');
    img.src = options.coverUrl;
    img.alt = options.title;
    img.loading = 'lazy';
    img.style.cssText = `
      width: 100%; height: 100%;
      object-fit: cover; display: block;
    `;
    img.onerror = () => {
      img.remove();
      imageBox.appendChild(createFallbackContent(options.title, size, nodeType));
    };
    imageBox.appendChild(img);
  } else {
    imageBox.appendChild(createFallbackContent(options.title, size, nodeType));
  }

  wrapper.appendChild(imageBox);

  // ── Type badge (small icon in corner) ────────────────────────────
  if (nodeType !== 'book') {
    const badge = document.createElement('div');
    const badgeIcon = nodeType === 'author' ? '✦' : '◈';
    badge.style.cssText = `
      position: absolute;
      top: -3px; right: -3px;
      width: ${Math.max(size * 0.3, 16)}px;
      height: ${Math.max(size * 0.3, 16)}px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.92);
      border: 1.5px solid ${colors.accent};
      display: flex; align-items: center; justify-content: center;
      font-size: ${Math.max(size * 0.18, 9)}px;
      color: ${colors.accent};
      z-index: 15;
      pointer-events: none;
      box-shadow: 0 0 6px ${getColor(nodeType, 'glow', 0.3)};
    `;
    badge.textContent = badgeIcon;
    // Position relative to imageBox
    imageBox.style.position = 'relative';
    imageBox.appendChild(badge);
  }

  // ── Outer glow ring for highly connected nodes ───────────────────
  if (options.connectionCount > 3) {
    const glowRing = document.createElement('div');
    glowRing.style.cssText = `
      position: absolute;
      inset: -4px;
      border-radius: ${borderRadius};
      border: 1px solid ${getColor(nodeType, 'border', 0.12)};
      pointer-events: none;
      animation: pulse 4s ease-in-out infinite;
      ${clipPath ? `clip-path: ${clipPath};` : ''}
    `;
    imageBox.appendChild(glowRing);
  }

  // ── Label (always visible, below node) ───────────────────────────
  const label = document.createElement('div');
  label.className = 'node-label';
  const maxLabelWidth = Math.max(size + 30, 80);
  label.style.cssText = `
    width: ${maxLabelWidth}px;
    text-align: center;
    margin-top: 5px;
    pointer-events: none;
    line-height: 1.25;
  `;

  const titleEl = document.createElement('div');
  titleEl.style.cssText = `
    font-size: ${options.isMobile ? '9px' : '11px'};
    font-weight: 600;
    color: ${colors.labelColor};
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  `;
  titleEl.textContent = options.title;
  label.appendChild(titleEl);

  // Sub-label (author name for books, "Author" badge for authors, book title for protagonists)
  if (!options.isMobile || nodeType !== 'book') {
    const subLabel = document.createElement('div');
    let subText = '';
    if (nodeType === 'book') subText = options.author;
    else if (nodeType === 'author') subText = 'Author';
    else subText = `in "${options.author}"`;

    subLabel.style.cssText = `
      font-size: ${options.isMobile ? '8px' : '9px'};
      color: ${colors.subtitleColor};
      margin-top: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-style: ${nodeType === 'protagonist' ? 'italic' : 'normal'};
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
    `;
    subLabel.textContent = subText;
    label.appendChild(subLabel);
  }

  wrapper.appendChild(label);

  // ── Hit area (for touch accessibility) ───────────────────────────
  const hitArea = document.createElement('div');
  hitArea.className = 'node-hit-area';
  hitArea.style.cssText = `
    position: absolute;
    width: ${Math.max(size + 12, 48)}px;
    height: ${Math.max(size + 12, 48)}px;
    left: 50%; top: ${halfSize}px;
    transform: translate(-50%, -50%);
    border-radius: ${borderRadius};
    cursor: pointer;
    z-index: 11;
  `;
  wrapper.appendChild(hitArea);

  return wrapper;
}

// ── Fallback (initial letter) ──────────────────────────────────────────
function createFallbackContent(title: string, size: number, nodeType: NodeType): HTMLElement {
  const colors = NODE_COLORS[nodeType];
  const fallback = document.createElement('div');
  fallback.style.cssText = `
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: ${colors.fallbackBg};
    color: ${colors.labelColor};
    font-size: ${Math.max(size * 0.38, 14)}px;
    font-weight: 700;
    letter-spacing: 0.5px;
  `;
  fallback.textContent = title.charAt(0).toUpperCase();
  return fallback;
}

// ── Edge styles ────────────────────────────────────────────────────────
export function getEdgeLineStyle(reasons: string[], fromType?: NodeType, toType?: NodeType): {
  strokeDasharray: string;
  strokeWidth: number;
  color: string;
  opacity: number;
} {
  // Author → Book (wrote)
  if ((fromType === 'author' || toType === 'author') && reasons.includes('wrote')) {
    return { strokeDasharray: 'none', strokeWidth: 1.8, color: '#fbbf24', opacity: 0.45 };
  }
  // Protagonist → Book (appears in)
  if ((fromType === 'protagonist' || toType === 'protagonist') && reasons.includes('appears_in')) {
    return { strokeDasharray: '5 3', strokeWidth: 1.4, color: '#c084fc', opacity: 0.4 };
  }
  // Book ↔ Book
  if (reasons.includes('same_author')) {
    return { strokeDasharray: 'none', strokeWidth: 2, color: '#22d3ee', opacity: 0.5 };
  }
  if (reasons.includes('shared_theme')) {
    return { strokeDasharray: 'none', strokeWidth: 1.5, color: '#2dd4bf', opacity: 0.4 };
  }
  if (reasons.includes('shared_subgenre')) {
    return { strokeDasharray: '6 4', strokeWidth: 1.2, color: '#22d3ee', opacity: 0.35 };
  }
  if (reasons.includes('shared_era')) {
    return { strokeDasharray: '8 5', strokeWidth: 0.9, color: '#94a3b8', opacity: 0.3 };
  }
  return { strokeDasharray: 'none', strokeWidth: 1, color: '#22d3ee', opacity: 0.25 };
}
