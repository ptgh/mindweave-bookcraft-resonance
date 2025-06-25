
import Header from "@/components/Header";
import { useState, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { gData, BrainNode, BookLink } from '@/data/test-brain';

// Export types for other components to use
export type { BrainNode, BookLink };

const TestBrain = () => {
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  const graphRef = useRef<any>();

  useEffect(() => {
    // auto zooming
    graphRef.current.cameraPosition(
      { x: 0, y: 0, z: 3 }, // new position
      2000  // ms transition duration
    );
  }, []);

  const handleNodeHover = (node: any) => {
    highlightNode(node);
  };

  const handleLinkHover = (link: any) => {
    highlightLink(link);
  };

  const highlightNode = (node: any, autoZoom = false) => {
    setHoverNode(node);

    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();

    if (node) {
      newHighlightNodes.add(node.id);
      node.neighbors.forEach((neighbor: any) => newHighlightNodes.add(neighbor.id));
      node.links.forEach((link: any) => newHighlightLinks.add(link.id));
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);

    if (autoZoom) {
      // auto zooming
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        2000  // ms transition duration
      );
    }
  };

  const highlightLink = (link: any) => {
    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();

    newHighlightLinks.add(link.id);
    newHighlightNodes.add(link.source.id);
    newHighlightNodes.add(link.target.id);

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  // Wrapper function for onNodeClick that matches expected signature
  const handleNodeClick = (node: any, event: MouseEvent) => {
    highlightNode(node, true); // Enable auto zoom on click
  };

  const nodeColor = (node: any) => {
    if (highlightNodes.size === 0) {
      return 'rgba(30, 58, 138, 0.8)'; // Default node color
    }

    return highlightNodes.has(node.id) ? 'rgb(99 102 241)' : 'rgba(30, 58, 138, 0.15)';
  };

  const linkColor = (link: any) => {
    if (highlightLinks.size === 0) {
      return 'rgba(71, 85, 105, 0.5)'; // Default link color
    }

    return highlightLinks.has(link.id) ? 'rgb(99 102 241)' : 'rgba(71, 85, 105, 0.06)';
  };

  const nodeLabel = (node: any) => {
    return `<div style="color: white; font-size: 0.8em; text-align: left;">
              <b>${node.name}</b>
              <br>
              ${node.description}
            </div>`;
  };

  const handleBgClick = () => {
    highlightNode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="feature-block">
          <h1 className="text-3xl font-semibold text-slate-200 mb-4">
            Neural Network Visualization
          </h1>
          <p className="text-slate-400 mb-8">
            Explore the interconnectedness of concepts and ideas in a dynamic 3D graph. Hover over nodes to highlight connections.
          </p>

          <div className="relative">
            <ForceGraph3D
              ref={graphRef}
              graphData={gData}
              nodeLabel={nodeLabel}
              nodeAutoColorBy="group"
              nodeColor={nodeColor}
              linkColor={linkColor}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={link => highlightLinks.has(link.id) ? 1 : 0}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              onLinkHover={handleLinkHover}
              onBackgroundClick={handleBgClick}
            />
          </div>

          {hoverNode && (
            <div className="absolute top-4 left-4 bg-slate-800/80 border border-slate-700/50 rounded-lg p-4 text-slate-300 text-sm max-w-md">
              <h3 className="font-medium text-slate-200 mb-2">{hoverNode.name}</h3>
              <p>{hoverNode.description}</p>
              <ul className="mt-2">
                <li className="mb-1">
                  <span className="font-semibold">Group:</span> {hoverNode.group}
                </li>
                <li>
                  <span className="font-semibold">Degree:</span> {hoverNode.links.length}
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TestBrain;
