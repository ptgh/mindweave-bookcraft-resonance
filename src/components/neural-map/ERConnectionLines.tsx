import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';

interface ConnectionDef {
  fromCardId: string;
  toCardId: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface ERConnectionLinesProps {
  connections: ConnectionDef[];
  containerRef: React.RefObject<HTMLDivElement>;
}

const ERConnectionLines = ({ connections, containerRef }: ERConnectionLinesProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || connections.length === 0) return;

    const svg = svgRef.current;
    const container = containerRef.current;

    // Clear previous
    svg.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // Set SVG size to match scrollable content
    svg.setAttribute('width', String(container.scrollWidth));
    svg.setAttribute('height', String(container.scrollHeight));

    // Add defs for glow
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'er-glow');
    filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '2');
    blur.setAttribute('result', 'glow');
    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mn1.setAttribute('in', 'glow');
    const mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1); merge.appendChild(mn2);
    filter.appendChild(blur); filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    connections.forEach((conn, idx) => {
      const fromEl = container.querySelector(`#${CSS.escape(conn.fromCardId)}`);
      const toEl = container.querySelector(`#${CSS.escape(conn.toCardId)}`);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      // Calculate positions relative to container's scroll position
      const fromX = fromRect.right - containerRect.left + scrollLeft;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top + scrollTop;
      const toX = toRect.left - containerRect.left + scrollLeft;
      const toY = toRect.top + toRect.height / 2 - containerRect.top + scrollTop;

      // Draw a smooth curve
      const midX = (fromX + toX) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M${fromX},${fromY} C${midX},${fromY} ${midX},${toY} ${toX},${toY}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke', conn.color);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0');
      path.setAttribute('filter', 'url(#er-glow)');
      if (conn.dashed) path.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(path);

      // Label
      const labelX = midX;
      const labelY = (fromY + toY) / 2 - 8;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(labelX));
      text.setAttribute('y', String(labelY));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', conn.color);
      text.setAttribute('font-size', '9');
      text.setAttribute('opacity', '0');
      text.setAttribute('class', 'font-medium');
      text.textContent = conn.label;
      svg.appendChild(text);

      // Animate in
      gsap.to(path, { opacity: 0.4, duration: 0.8, delay: 0.5 + idx * 0.03, ease: 'power2.out' });
      gsap.to(text, { opacity: 0.5, duration: 0.8, delay: 0.6 + idx * 0.03, ease: 'power2.out' });

      // Gentle pulse
      gsap.to(path, {
        opacity: 0.55,
        duration: 3 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        delay: 1 + Math.random() * 2,
        ease: 'sine.inOut',
      });
    });

    return () => {
      svg.querySelectorAll('path, text').forEach(el => gsap.killTweensOf(el));
    };
  }, [connections, containerRef]);

  return (
    <svg
      ref={svgRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default ERConnectionLines;
