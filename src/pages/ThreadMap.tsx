
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { ChronoTimeline } from "@/components/ChronoTimeline";
import GSAPButtonGroup from "@/components/GSAPButtonGroup";
import { Calendar, Clock, BookOpen, TrendingUp, Brain } from "lucide-react";
import { getTransmissions } from "@/services/transmissionsService";
import { SEOHead } from "@/components/SEOHead";

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

  // Calculate temporal statistics from filtered transmissions
  const totalTransmissions = filteredTransmissions.length;
  
  // Era distribution
  const getEra = (year: number): string => {
    if (year < 1900) return 'Victorian Era';
    if (year < 1920) return 'Edwardian Era'; 
    if (year < 1950) return 'Early Modern';
    if (year < 1980) return 'Mid-Century';
    if (year < 2000) return 'Late 20th Century';
    return '21st Century';
  };
  
  const eraDistribution = filteredTransmissions.reduce((acc, t) => {
    if (t.publication_year) {
      const era = getEra(t.publication_year);
      acc[era] = (acc[era] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Publication year range
  const publicationYears = filteredTransmissions
    .map(t => t.publication_year)
    .filter(year => year && year > 1800 && year < 2030) as number[];
  
  const yearRange = publicationYears.length > 0 ? {
    earliest: Math.min(...publicationYears),
    latest: Math.max(...publicationYears),
    span: Math.max(...publicationYears) - Math.min(...publicationYears)
  } : null;
  
  // Temporal jumps (biggest chronological differences)
  const temporalJumps = filteredTransmissions
    .filter(t => t.publication_year)
    .sort((a, b) => (a.publication_year || 0) - (b.publication_year || 0))
    .reduce((jumps, transmission, index, sorted) => {
      if (index > 0) {
        const jump = (transmission.publication_year || 0) - (sorted[index - 1].publication_year || 0);
        if (jump > 20) { // Only significant jumps
          jumps.push({
            from: sorted[index - 1],
            to: transmission,
            years: jump
          });
        }
      }
      return jumps;
    }, [] as Array<{ from: any; to: any; years: number }>)
    .sort((a, b) => b.years - a.years)
    .slice(0, 3);
  
  // Books with temporal data
  const booksWithTemporalData = filteredTransmissions.filter(t => t.publication_year).length;

  return (
    <>
      <SEOHead
        title="Chrono Thread"
        description="Explore the temporal patterns and historical context of your science fiction reading journey"
        keywords={['reading timeline', 'book history', 'publication timeline', 'temporal analysis']}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-light text-slate-200">Chrono Thread</h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base">Temporal navigation • Literary chronology through your transmission timeline</p>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-slate-300 text-sm">Temporal Scope:</span>
            <GSAPButtonGroup
              buttons={[
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' },
                { id: 'all', label: 'All Time' }
              ]}
              selected={timeframe}
              onSelect={(id) => setTimeframe(id as 'month' | 'year' | 'all')}
            />
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            {/* Chrono Timeline Visualization */}
            <div className="xl:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-medium text-slate-200">Temporal Thread</h2>
                <span className="text-slate-400 text-sm">• {booksWithTemporalData} temporal nodes</span>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px] text-slate-400">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="ml-3">Mapping temporal threads...</span>
                  </div>
                </div>
              ) : filteredTransmissions.length > 0 ? (
                <div className="min-h-[400px]">
                  <ChronoTimeline transmissions={filteredTransmissions} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-slate-400">
                  <div className="text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No transmissions found for this timeframe</p>
                    <p className="text-sm mt-2">Start building your chrono thread by adding books with publication years</p>
                  </div>
                </div>
              )}
            </div>

            {/* Temporal Stats Panel */}
            <div className="space-y-8 flex flex-col">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-medium text-slate-200">Temporal Analysis</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Total Books</span>
                    <span className="text-blue-400 font-medium">{totalTransmissions}</span>
                  </div>
                  {yearRange && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Year Span</span>
                        <span className="text-green-400 font-medium">{yearRange.span}y</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">Era Range</span>
                        <span className="text-slate-200 text-xs">{yearRange.earliest}-{yearRange.latest}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Time Jumps</span>
                    <span className="text-purple-400 font-medium">{temporalJumps.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 flex-1">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-slate-200">Era Distribution</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(eraDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([era, count], index) => (
                      <div key={era} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            index === 0 ? 'bg-purple-400' : 
                            index === 1 ? 'bg-blue-400' : 
                            index === 2 ? 'bg-green-400' : 
                            index === 3 ? 'bg-yellow-400' : 
                            index === 4 ? 'bg-pink-400' : 'bg-cyan-400'
                          }`} />
                          <span className="text-slate-300 text-sm truncate">{era}</span>
                        </div>
                        <span className="text-slate-400 text-sm flex-shrink-0 ml-2">{count}</span>
                      </div>
                    ))}
                  {Object.keys(eraDistribution).length === 0 && (
                    <div className="text-slate-500 text-sm italic">
                      No temporal data detected
                    </div>
                  )}
                </div>
              </div>

              {temporalJumps.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-medium text-slate-200">Biggest Time Jumps</h2>
                  </div>
                  <div className="space-y-3">
                    {temporalJumps.slice(0, 3).map((jump, index) => (
                      <div key={index} className="text-xs space-y-1 p-3 bg-slate-700/30 rounded border border-slate-600/30">
                        <div className="font-semibold text-yellow-400">{jump.years} years</div>
                        <div className="text-slate-300 line-clamp-1">
                          {jump.from.title} → {jump.to.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Temporal threads: {totalTransmissions > 0 ? 'Active' : 'Dormant'}</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Chronological mapping: {yearRange ? `${yearRange.span}y span` : 'Awaiting data'}</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ThreadMap;
