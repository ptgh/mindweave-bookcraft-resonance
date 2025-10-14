import React from 'react';
import { Activity, TrendingUp, Circle } from 'lucide-react';
import { ClusterHealth } from '@/services/patternRecognition';

interface ClusterHealthPanelProps {
  clusters: ClusterHealth[];
}

const ClusterHealthPanel: React.FC<ClusterHealthPanelProps> = ({ clusters }) => {
  const getGrowthIcon = (growth: string) => {
    switch (growth) {
      case 'expanding':
        return '📈';
      case 'dormant':
        return '💤';
      default:
        return '➡️';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.5) return 'text-blue-400';
    if (score >= 0.3) return 'text-amber-400';
    return 'text-slate-400';
  };

  if (clusters.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No clusters detected yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-medium text-slate-200">Cluster Health</h3>
        <span className="text-sm text-slate-400">• {clusters.length} active clusters</span>
      </div>

      <div className="space-y-3">
        {clusters.slice(0, 6).map((cluster) => (
          <div
            key={cluster.clusterId}
            className="p-4 rounded-lg border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{getGrowthIcon(cluster.growth)}</span>
                  <h4 className="text-sm font-medium text-slate-200">{cluster.name}</h4>
                </div>
                <div className="text-xs text-slate-400">
                  {cluster.bookCount} books • {cluster.growth}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-2xl font-bold ${getHealthColor(cluster.healthScore)}`}>
                  {(cluster.healthScore * 100).toFixed(0)}
                </div>
                <div className="text-xs text-slate-500">health</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-slate-500">Diversity</div>
                <div className="flex items-center space-x-1">
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${cluster.diversity * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-300">{(cluster.diversity * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-500">Recency</div>
                <div className="flex items-center space-x-1">
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${cluster.recency * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-300">{(cluster.recency * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-500">Books</div>
                <div className="text-slate-300 font-medium">{cluster.bookCount}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="text-xs text-slate-400 space-y-1">
          <div>
            <span className="text-green-400 font-medium">High Health (70%+)</span>: 
            Active, diverse, and growing
          </div>
          <div>
            <span className="text-blue-400 font-medium">Medium Health (50-70%)</span>: 
            Stable with room to grow
          </div>
          <div>
            <span className="text-amber-400 font-medium">Low Health (&lt;50%)</span>: 
            Needs attention or exploration
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterHealthPanel;
