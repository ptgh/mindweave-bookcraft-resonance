
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { ChronoTimeline } from "@/components/ChronoTimeline";
import { Calendar, Clock, BookOpen, TrendingUp, Brain, Sparkles, Target } from "lucide-react";
import { getTransmissions } from "@/services/transmissionsService";
import { SEOHead } from "@/components/SEOHead";
import { TemporalContextModal } from "@/components/TemporalContextModal";
import { ReadingChallengeModal } from "@/components/ReadingChallengeModal";
import { HistoricalContextService } from "@/services/historicalContext";

const ThreadMap = () => {
  const [showTemporalModal, setShowTemporalModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const { data: transmissions = [], isLoading } = useQuery({
    queryKey: ['transmissions'],
    queryFn: getTransmissions,
  });

  // Calculate temporal statistics from all transmissions
  const totalTransmissions = transmissions.length;
  
  // Era distribution
  const getEra = (year: number): string => {
    if (year < 1900) return 'Victorian Era';
    if (year < 1920) return 'Edwardian Era'; 
    if (year < 1950) return 'Early Modern';
    if (year < 1980) return 'Mid-Century';
    if (year < 2000) return 'Late 20th Century';
    return '21st Century';
  };
  
  const eraDistribution = transmissions.reduce((acc, t) => {
    if (t.publication_year) {
      const era = getEra(t.publication_year);
      acc[era] = (acc[era] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Publication year range
  const publicationYears = transmissions
    .map(t => t.publication_year)
    .filter(year => year && year > 1800 && year < 2030) as number[];
  
  const yearRange = publicationYears.length > 0 ? {
    earliest: Math.min(...publicationYears),
    latest: Math.max(...publicationYears),
    span: Math.max(...publicationYears) - Math.min(...publicationYears)
  } : null;
  
  // Temporal jumps (biggest chronological differences)
  const temporalJumps = transmissions
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
  const booksWithTemporalData = transmissions.filter(t => t.publication_year).length;

  return (
    <>
      <SEOHead
        title="Chrono Thread"
        description="Explore the temporal patterns and historical context of your science fiction reading journey"
        keywords={['reading timeline', 'book history', 'publication timeline', 'temporal analysis']}
      />
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-light text-slate-200">Chrono Thread</h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base">Temporal navigation • Literary chronology through your transmission timeline</p>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-6">
            {/* Left Column: Chrono Timeline */}
            <div className="overflow-y-auto scrollbar-hide bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-medium text-slate-200">Temporal Thread</h2>
                  <span className="text-slate-400 text-sm">• {booksWithTemporalData} temporal nodes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTemporalModal(true)}
                    disabled={transmissions.length < 3}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 py-1.5 px-3 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Temporal Analysis
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    disabled={transmissions.length < 3}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 py-1.5 px-3 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Target className="w-4 h-4 text-cyan-400" />
                    Protocol Mission
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px] text-slate-400">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="ml-3">Mapping temporal threads...</span>
                  </div>
                </div>
              ) : transmissions.length > 0 ? (
                <div className="min-h-[400px]">
                  <ChronoTimeline transmissions={transmissions} />
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

            {/* Right Column: Temporal Stats Panels */}
            <div className="overflow-y-auto scrollbar-hide space-y-6">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-medium text-slate-200">Temporal Analysis</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs">Total Books</span>
                    <span className="text-blue-400 text-sm font-medium">{totalTransmissions}</span>
                  </div>
                  {yearRange && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-xs">Year Span</span>
                        <span className="text-green-400 text-sm font-medium">{yearRange.span}y</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-xs">Era Range</span>
                        <span className="text-slate-200 text-xs">{yearRange.earliest}-{yearRange.latest}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs">Time Jumps</span>
                    <span className="text-purple-400 text-sm font-medium">{temporalJumps.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-slate-200">Era Distribution</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(eraDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([era, count], index) => (
                      <div key={era} className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            index === 0 ? 'bg-purple-400' : 
                            index === 1 ? 'bg-blue-400' : 
                            index === 2 ? 'bg-green-400' : 
                            index === 3 ? 'bg-yellow-400' : 
                            index === 4 ? 'bg-pink-400' : 'bg-cyan-400'
                          }`} />
                          <span className="text-slate-300 text-xs whitespace-nowrap overflow-hidden text-ellipsis">{era}</span>
                        </div>
                        <span className="text-slate-400 text-xs flex-shrink-0">{count}</span>
                      </div>
                    ))}
                  {Object.keys(eraDistribution).length === 0 && (
                    <div className="text-slate-500 text-xs italic">
                      No temporal data detected
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-medium text-slate-200">Historical Context</h2>
                </div>
                <div className="space-y-3">
                  {publicationYears.length > 0 ? (
                    <>
                      {HistoricalContextService.getMovementsInRange(
                        Math.min(...publicationYears),
                        Math.max(...publicationYears)
                      ).slice(0, 3).map((movement, idx) => (
                        <div key={idx} className="text-xs p-3 bg-slate-700/30 rounded border border-slate-600/30">
                          <div className="font-semibold text-cyan-400 mb-1">{movement.name}</div>
                          <div className="text-slate-400">{movement.description}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-slate-500 text-sm italic">
                      Add books with publication years to see historical context
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
                  <div className="space-y-2">
                    {temporalJumps.slice(0, 3).map((jump, index) => (
                      <div key={index} className="text-xs space-y-1 p-2.5 bg-slate-700/30 rounded border border-slate-600/30">
                        <div className="font-semibold text-yellow-400 text-xs">{jump.years} years</div>
                        <div className="text-slate-300 text-xs line-clamp-1">
                          {jump.from.title} → {jump.to.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <TemporalContextModal
          isOpen={showTemporalModal}
          onClose={() => setShowTemporalModal(false)}
          transmissions={transmissions}
        />

        <ReadingChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
        />
      </div>
    </>
  );
};

export default ThreadMap;
