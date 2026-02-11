/**
 * Helper utilities for creating Neural Map DOM nodes imperatively.
 * Used by TestBrain's GSAP-based rendering pipeline.
 */

export interface NodeRenderOptions {
  isMobile: boolean;
  connectionCount: number;
  isHighlighted?: boolean;
  coverUrl?: string;
  title: string;
  author: string;
}

/**
 * Get node size based on device and connection count
 */
export function getNodeSize(isMobile: boolean, connectionCount: number): number {
  const tier = connectionCount <= 2 ? 'basic' : connectionCount <= 5 ? 'medium' : 'high';
  if (isMobile) {
    return tier === 'basic' ? 28 : tier === 'medium' ? 32 : 36;
  }
  return tier === 'basic' ? 40 : tier === 'medium' ? 45 : 50;
}

/**
 * Create a circular book cover node element with fallback
 */
export function createBookNodeElement(
  x: number,
  y: number,
  options: NodeRenderOptions
): HTMLElement {
  const size = getNodeSize(options.isMobile, options.connectionCount);
  const halfSize = size / 2;

  const wrapper = document.createElement('div');
  wrapper.className = 'thought-node user-node';
  wrapper.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x - halfSize}px;
    top: ${y - halfSize}px;
    cursor: pointer;
    z-index: 10;
    opacity: 0;
    will-change: transform, opacity;
  `;

  // Inner circle container with overflow hidden for clipping
  const circle = document.createElement('div');
  circle.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    border: 1.5px solid rgba(34, 211, 238, ${options.connectionCount > 5 ? 0.6 : 0.3});
    box-shadow: 0 0 ${8 + options.connectionCount * 2}px rgba(34, 211, 238, ${0.15 + Math.min(options.connectionCount * 0.05, 0.35)});
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  `;

  if (options.coverUrl) {
    const img = document.createElement('img');
    img.src = options.coverUrl;
    img.alt = options.title;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    `;
    img.onerror = () => {
      // Replace with fallback
      img.remove();
      const fallback = createFallbackContent(options.title, size);
      circle.appendChild(fallback);
    };
    circle.appendChild(img);
  } else {
    const fallback = createFallbackContent(options.title, size);
    circle.appendChild(fallback);
  }

  wrapper.appendChild(circle);

  // Glow ring for high-connection nodes
  if (options.connectionCount > 3) {
    const glowRing = document.createElement('div');
    glowRing.style.cssText = `
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1px solid rgba(34, 211, 238, 0.15);
      pointer-events: none;
      animation: pulse 3s ease-in-out infinite;
    `;
    wrapper.appendChild(glowRing);
  }

  // Title label
  const label = document.createElement('div');
  label.className = 'node-label';

  if (options.isMobile) {
    // Below the node on mobile
    label.style.cssText = `
      position: absolute;
      top: ${size + 4}px;
      left: 50%;
      transform: translateX(-50%);
      width: ${Math.max(size + 20, 60)}px;
      text-align: center;
      font-size: 9px;
      line-height: 1.2;
      color: #94a3b8;
      pointer-events: none;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    `;
    label.textContent = options.title;
  } else {
    // Beside the node on desktop
    label.style.cssText = `
      position: absolute;
      top: 50%;
      left: ${size + 6}px;
      transform: translateY(-50%);
      width: 100px;
      font-size: 10px;
      line-height: 1.25;
      color: #e2e8f0;
      pointer-events: none;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    `;
    label.textContent = options.title;

    // Author sub-label on desktop
    const authorLabel = document.createElement('div');
    authorLabel.style.cssText = `
      font-size: 8px;
      color: rgba(34, 211, 238, 0.5);
      margin-top: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
    authorLabel.textContent = options.author;
    label.appendChild(authorLabel);
  }

  wrapper.appendChild(label);

  // Invisible hit area for touch (44px min)
  const hitArea = document.createElement('div');
  hitArea.className = 'node-hit-area';
  hitArea.style.cssText = `
    position: absolute;
    width: ${Math.max(size + 10, 44)}px;
    height: ${Math.max(size + 10, 44)}px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 11;
  `;
  wrapper.appendChild(hitArea);

  return wrapper;
}

function createFallbackContent(title: string, size: number): HTMLElement {
  const fallback = document.createElement('div');
  fallback.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #94a3b8;
    font-size: ${Math.max(size * 0.35, 12)}px;
    font-weight: 600;
  `;
  fallback.textContent = title.charAt(0).toUpperCase();
  return fallback;
}

/**
 * Get connection line style based on edge reasons
 */
export function getEdgeLineStyle(reasons: string[]): {
  strokeDasharray: string;
  strokeWidth: number;
  color: string;
  opacity: number;
} {
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
