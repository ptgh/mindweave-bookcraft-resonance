
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import MindMap from "@/components/MindMap";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, TrendingUp, Brain } from "lucide-react";
import { getTransmissions } from "@/services/transmissionsService";

const ThreadMap = () => {
  const [timeframe, setTimeframe] = useState<'month' | 'year' | 'all'>('year');

  const { data: transmissions = [], isLoading } = useQuery({
    queryKey: ['transmissions'],
    queryFn: getTransmissions,
  });

  // Filter transmissions based on timeframe
  const filteredTransmissions = transmissions.filter(transmission => {
    if (timeframe === 'all') return true;
    
    const transmissionDate = new Date(transmission.created_at);
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeframe === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return transmissionDate >= cutoffDate;
  });

  // Calculate stats from real data
  const totalTransmissions = filteredTransmissions.length;
  const allTags = filteredTransmissions.flatMap(t => t.tags);
  const uniqueTags = Array.from(new Set(allTags));
  const tagCounts = uniqueTags.map(tag => ({
    tag,
    count: allTags.filter(t => t === tag).length
  })).sort((a, b) => b.count - a.count);

  const currentMonth = new Date().getMonth();
  const currentMonthTransmissions = transmissions.filter(t => 
    new Date(t.created_at).getMonth() === currentMonth
  ).length;

  const averagePerMonth = transmissions.length > 0 ? 
    Math.round(transmissions.length / Math.max(1, Math.ceil((Date.now() - new Date(transmissions[transmissions.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30)))) : 0;

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-light text-slate-200">Chrono Thread</h1>
            </div>
            <p className="text-slate-400">Consciousness mapping • Neural pathway visualization of your transmission network</p>
          </div>

          <div className="mb-6 flex items-center space-x-4">
            <span className="text-slate-300 text-sm">Temporal Scope:</span>
            <div className="flex space-x-2">
              {(['month', 'year', 'all'] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                  className={timeframe === period 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  }
                >
                  {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Mind Map Visualization */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-medium text-slate-200">Consciousness Web</h2>
                <span className="text-slate-400 text-sm">• {filteredTransmissions.length} active nodes</span>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[600px] text-slate-400">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  <span className="ml-3">Mapping neural pathways...</span>
                </div>
              ) : filteredTransmissions.length > 0 ? (
                <MindMap transmissions={filteredTransmissions} />
              ) : (
                <div className="flex items-center justify-center h-[600px] text-slate-400">
                  <div className="text-center">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No transmissions found for this timeframe</p>
                    <p className="text-sm mt-2">Start building your consciousness map by adding transmissions</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-medium text-slate-200">Signal Frequency</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">This Month</span>
                    <span className="text-green-400 font-medium">{currentMonthTransmissions} signals</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Average/Month</span>
                    <span className="text-slate-200">{averagePerMonth} signals</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Total Nodes</span>
                    <span className="text-blue-400 font-medium">{totalTransmissions} transmissions</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-slate-200">Dominant Threads</h2>
                </div>
                <div className="space-y-3">
                  {tagCounts.slice(0, 5).map((thread, index) => (
                    <div key={thread.tag} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-purple-400' : 
                          index === 1 ? 'bg-blue-400' : 
                          index === 2 ? 'bg-green-400' : 
                          index === 3 ? 'bg-yellow-400' : 'bg-pink-400'
                        }`} />
                        <span className="text-slate-300 text-sm">{thread.tag}</span>
                      </div>
                      <span className="text-slate-400 text-sm">{thread.count}</span>
                    </div>
                  ))}
                  {tagCounts.length === 0 && (
                    <div className="text-slate-500 text-sm italic">
                      No conceptual threads detected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Neural pathways: Active</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Consciousness Record: {totalTransmissions} nodes mapped</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default ThreadMap;
