
import { useState } from "react";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, TrendingUp } from "lucide-react";

const ThreadMap = () => {
  const [timeframe, setTimeframe] = useState<'month' | 'year' | 'all'>('year');

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2">Thread Map</h1>
            <p className="text-slate-400">Timeline consciousness map • Mapping the narrative threads of consciousness</p>
          </div>

          <div className="mb-6 flex items-center space-x-4">
            <span className="text-slate-300 text-sm">Timeframe:</span>
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
            {/* Timeline Visualization */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-medium text-slate-200">Consciousness Timeline</h2>
              </div>
              
              <div className="relative">
                {/* Timeline placeholder */}
                <div className="space-y-6">
                  {[
                    { date: "2024 Q2", books: 12, themes: ["Philosophy", "Consciousness"] },
                    { date: "2024 Q1", books: 8, themes: ["Science Fiction", "AI"] },
                    { date: "2023 Q4", books: 15, themes: ["Literature", "History"] }
                  ].map((period, index) => (
                    <div key={period.date} className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full" />
                          {index < 2 && <div className="w-0.5 h-16 bg-slate-600 mt-2" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-200 font-medium">{period.date}</h3>
                            <span className="text-slate-400 text-sm">{period.books} transmissions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {period.themes.map((theme) => (
                              <span
                                key={theme}
                                className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded border border-blue-700/30"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-medium text-slate-200">Reading Frequency</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">This Month</span>
                    <span className="text-green-400 font-medium">4 books</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Average/Month</span>
                    <span className="text-slate-200">6.2 books</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Total Signals</span>
                    <span className="text-blue-400 font-medium">127 books</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-slate-200">Dominant Threads</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { theme: "Consciousness Studies", count: 23, color: "purple" },
                    { theme: "Science Fiction", count: 18, color: "blue" },
                    { theme: "Philosophy", count: 15, color: "green" }
                  ].map((thread) => (
                    <div key={thread.theme} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full bg-${thread.color}-400`} />
                        <span className="text-slate-300 text-sm">{thread.theme}</span>
                      </div>
                      <span className="text-slate-400 text-sm">{thread.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Neural pathways: Initializing</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Consciousness Record: Standby</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default ThreadMap;
