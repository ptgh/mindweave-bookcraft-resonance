
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { getTransmissions, Transmission } from "@/services/transmissionsService";
import { useAuth } from "@/hooks/useAuth";

interface BookNode {
  id: number;
  title: string;
  author: string;
  x: number;
  y: number;
  tags: string[];
  cover_url: string;
  connections: number[];
  publisher_series?: {
    name: string;
    badge_emoji: string;
  };
}

interface Connection {
  from: number;
  to: number;
  type: 'tag' | 'author' | 'similarity';
  strength: number;
  label?: string;
}

const TestBrain = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<BookNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user) {
      loadBrainData();
    }
  }, [user, authLoading, navigate]);

  const loadBrainData = async () => {
    try {
      console.log('Loading brain data...');
      setLoading(true);
      setError(null);
      
      const transmissions = await getTransmissions();
      console.log('Transmissions loaded:', transmissions.length);
      
      if (transmissions.length === 0) {
        setLoading(false);
        return;
      }

      // Convert transmissions to nodes with better positioning
      const bookNodes: BookNode[] = transmissions.map((book, index) => {
        const angle = (index / transmissions.length) * 2 * Math.PI;
        const radius = Math.min(300, 50 + transmissions.length * 8);
        
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          tags: book.tags || [],
          cover_url: book.cover_url || '',
          connections: [],
          publisher_series: book.publisher_series
        };
      });

      // Generate connections based on metadata
      const allConnections: Connection[] = [];
      const tags = new Set<string>();

      bookNodes.forEach(node => {
        node.tags.forEach(tag => tags.add(tag));
      });

      bookNodes.forEach((node, i) => {
        bookNodes.slice(i + 1).forEach(otherNode => {
          const connections: Connection[] = [];

          // Tag-based connections
          const sharedTags = node.tags.filter(tag => otherNode.tags.includes(tag));
          if (sharedTags.length > 0) {
            connections.push({
              from: node.id,
              to: otherNode.id,
              type: 'tag',
              strength: sharedTags.length * 0.5,
              label: sharedTags[0]
            });
          }

          // Author connections
          if (node.author === otherNode.author && node.author) {
            connections.push({
              from: node.id,
              to: otherNode.id,
              type: 'author',
              strength: 0.8,
              label: 'Same Author'
            });
          }

          // Title similarity (simple word matching)
          const nodeWords = node.title.toLowerCase().split(' ');
          const otherWords = otherNode.title.toLowerCase().split(' ');
          const commonWords = nodeWords.filter(word => 
            word.length > 3 && otherWords.includes(word)
          );
          
          if (commonWords.length > 0) {
            connections.push({
              from: node.id,
              to: otherNode.id,
              type: 'similarity',
              strength: commonWords.length * 0.3,
              label: 'Similar Title'
            });
          }

          // Add strongest connection only (limit to prevent clutter)
          if (connections.length > 0) {
            const strongest = connections.reduce((prev, current) => 
              current.strength > prev.strength ? current : prev
            );
            allConnections.push(strongest);
          }
        });
      });

      setNodes(bookNodes);
      setConnections(allConnections);
      setAvailableTags(Array.from(tags));
      setLoading(false);
      
    } catch (err: any) {
      console.error('Failed to load brain data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getVisibleConnections = () => {
    if (!selectedTag) return connections;
    
    return connections.filter(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      return fromNode?.tags.includes(selectedTag) || toNode?.tags.includes(selectedTag);
    });
  };

  const getNodeConnections = (nodeId: number) => {
    return getVisibleConnections().filter(conn => 
      conn.from === nodeId || conn.to === nodeId
    );
  };

  if (authLoading || loading) {
    return (
      <AuthWrapper fallback={<Auth />}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyan-400 animate-pulse flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-spin border-t-transparent" />
            </div>
            <p className="text-cyan-400">
              {authLoading ? 'Establishing connection...' : 'Initializing synaptic network...'}
            </p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  if (error) {
    return (
      <AuthWrapper fallback={<Auth />}>
        <div className="min-h-screen bg-black">
          <Header />
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-400 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-400" />
              </div>
              <h3 className="text-red-400 text-lg font-medium mb-2">Neural Network Error</h3>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => loadBrainData()}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  if (nodes.length === 0) {
    return (
      <AuthWrapper fallback={<Auth />}>
        <div className="min-h-screen bg-black">
          <Header />
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
              </div>
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Neural Pathways</h3>
              <p className="text-slate-400 text-sm mb-4">Add some transmissions to see your knowledge network</p>
              <button
                onClick={() => navigate('/library')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add Transmissions
              </button>
            </div>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-black">
        <Header />
        
        <div className="relative w-full h-screen overflow-hidden">
          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-md">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  !selectedTag 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Connections
              </button>
              {availableTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedTag === tag 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {getVisibleConnections().map((connection, index) => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;

              const isHighlighted = hoveredNode === connection.from || hoveredNode === connection.to;
              const opacity = isHighlighted ? 0.8 : 0.3;
              
              const color = connection.type === 'tag' ? '#06b6d4' : 
                           connection.type === 'author' ? '#f59e0b' : '#8b5cf6';

              return (
                <line
                  key={index}
                  x1={fromNode.x + 75}
                  y1={fromNode.y + 100}
                  x2={toNode.x + 75}
                  y2={toNode.y + 100}
                  stroke={color}
                  strokeWidth={Math.max(1, connection.strength * 2)}
                  opacity={opacity}
                  className="animate-pulse"
                />
              );
            })}
          </svg>

          {/* Book nodes */}
          {nodes.map(node => {
            const nodeConnections = getNodeConnections(node.id);
            const isConnected = nodeConnections.length > 0;
            
            return (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ 
                  left: `${node.x}px`, 
                  top: `${node.y}px`,
                  zIndex: hoveredNode === node.id ? 20 : 10
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Book card */}
                <div className={`
                  w-36 h-48 bg-slate-800 rounded-lg border transition-all duration-300
                  ${isConnected ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' : 'border-slate-600'}
                  ${hoveredNode === node.id ? 'scale-110 shadow-xl' : 'hover:scale-105'}
                `}>
                  {/* Cover image */}
                  <div className="w-full h-32 bg-slate-700 rounded-t-lg overflow-hidden">
                    {node.cover_url ? (
                      <img 
                        src={node.cover_url} 
                        alt={node.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <span className="text-xs">No Cover</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Book info */}
                  <div className="p-2">
                    <h3 className="text-slate-200 text-xs font-medium truncate" title={node.title}>
                      {node.title}
                    </h3>
                    <p className="text-slate-400 text-xs truncate" title={node.author}>
                      {node.author}
                    </p>
                    
                    {/* Publisher badge */}
                    {node.publisher_series && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs">{node.publisher_series.badge_emoji}</span>
                        <span className="text-slate-500 text-xs truncate">
                          {node.publisher_series.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Connection count */}
                    {nodeConnections.length > 0 && (
                      <div className="text-cyan-400 text-xs mt-1">
                        {nodeConnections.length} connection{nodeConnections.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tooltip for connections */}
                {hoveredNode === node.id && nodeConnections.length > 0 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-30 min-w-48">
                    <h4 className="text-slate-200 text-xs font-medium mb-1">Connections:</h4>
                    {nodeConnections.slice(0, 3).map((conn, idx) => {
                      const otherNodeId = conn.from === node.id ? conn.to : conn.from;
                      const otherNode = nodes.find(n => n.id === otherNodeId);
                      return (
                        <div key={idx} className="text-slate-400 text-xs">
                          → {otherNode?.title} ({conn.label})
                        </div>
                      );
                    })}
                    {nodeConnections.length > 3 && (
                      <div className="text-slate-500 text-xs">
                        +{nodeConnections.length - 3} more...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Stats overlay */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 rounded-lg p-3 text-xs text-slate-400">
            <div>Nodes: {nodes.length}</div>
            <div>Connections: {getVisibleConnections().length}</div>
            {selectedTag && <div>Filter: {selectedTag}</div>}
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default TestBrain;
