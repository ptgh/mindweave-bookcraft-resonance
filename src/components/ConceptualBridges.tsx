import React from 'react';
import { Link2, Sparkles } from 'lucide-react';

interface BridgeData {
  fromBook: { title: string; author: string };
  toBook: { title: string; author: string };
  bridgeType: 'thematic' | 'temporal' | 'stylistic' | 'philosophical';
  strength: number;
  sharedConcepts: string[];
  explanation: string;
}

interface ConceptualBridgesProps {
  bridges: BridgeData[];
  onBridgeSelect?: (bridge: BridgeData) => void;
}

const ConceptualBridges: React.FC<ConceptualBridgesProps> = ({ bridges, onBridgeSelect }) => {
  const getBridgeColor = (type: BridgeData['bridgeType']) => {
    switch (type) {
      case 'thematic': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'temporal': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'stylistic': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'philosophical': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  const getBridgeIcon = (type: BridgeData['bridgeType']) => {
    return type === 'thematic' ? '🌉' : type === 'temporal' ? '⏳' : type === 'stylistic' ? '🎨' : '💭';
  };

  if (bridges.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No conceptual bridges detected yet.</p>
        <p className="text-xs mt-2">Add more books with diverse tags to discover unexpected connections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Link2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-slate-200">Conceptual Bridges</h3>
        <span className="text-sm text-slate-400">• {bridges.length} discovered</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bridges.map((bridge, index) => (
          <div
            key={index}
            onClick={() => onBridgeSelect?.(bridge)}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getBridgeColor(bridge.bridgeType)}`}
          >
            <div className="flex items-start space-x-3 mb-3">
              <span className="text-2xl flex-shrink-0">{getBridgeIcon(bridge.bridgeType)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">
                  {bridge.bridgeType} Bridge
                </div>
                <div className="text-sm font-medium line-clamp-2 mb-1">
                  {bridge.fromBook.title}
                </div>
                <div className="text-xs opacity-60 mb-2">by {bridge.fromBook.author}</div>
              </div>
            </div>

            <div className="flex items-center justify-center my-2">
              <div className="flex-1 h-px bg-current opacity-20"></div>
              <div className="px-2">
                <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse"></div>
              </div>
              <div className="flex-1 h-px bg-current opacity-20"></div>
            </div>

            <div className="flex items-start space-x-3 mb-3">
              <div className="w-8 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2 mb-1">
                  {bridge.toBook.title}
                </div>
                <div className="text-xs opacity-60">by {bridge.toBook.author}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-xs opacity-80 line-clamp-2 mb-2">{bridge.explanation}</p>
              <div className="flex flex-wrap gap-1">
                {bridge.sharedConcepts.slice(0, 3).map((concept, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-current/20"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="opacity-60">Strength</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1.5 bg-current/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current rounded-full transition-all"
                    style={{ width: `${bridge.strength * 100}%` }}
                  ></div>
                </div>
                <span className="font-medium">{Math.round(bridge.strength * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center space-x-2">
            <span>🌉 Thematic:</span>
            <span className="flex-1">Shared concepts and themes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⏳ Temporal:</span>
            <span className="flex-1">Published in same era or timeframe</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🎨 Stylistic:</span>
            <span className="flex-1">Similar narrative techniques</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💭 Philosophical:</span>
            <span className="flex-1">Explore related ideas or worldviews</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptualBridges;
