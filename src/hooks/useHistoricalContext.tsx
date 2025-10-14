import { useMemo } from 'react';
import { Transmission } from '@/services/transmissionsService';
import { historicalContextService, HistoricalContext } from '@/services/historicalContext';

export const useHistoricalContext = (transmissions: Transmission[]) => {
  const contexts = useMemo(() => {
    return transmissions
      .filter(t => t.publication_year)
      .map(t => ({
        transmission: t,
        context: historicalContextService.getHistoricalContext(t.publication_year!)
      }));
  }, [transmissions]);

  const decadeAnalysis = useMemo(() => {
    const decades = new Map<number, Transmission[]>();
    
    transmissions.forEach(t => {
      if (t.publication_year) {
        const decade = Math.floor(t.publication_year / 10) * 10;
        if (!decades.has(decade)) {
          decades.set(decade, []);
        }
        decades.get(decade)!.push(t);
      }
    });

    return Array.from(decades.entries()).map(([decade, books]) => ({
      decade,
      books,
      zeitgeist: historicalContextService.getDecadeZeitgeist(decade),
      count: books.length
    })).sort((a, b) => b.decade - a.decade);
  }, [transmissions]);

  const temporalDissonances = useMemo(() => {
    return transmissions
      .filter(t => t.publication_year && t.narrative_time_period)
      .map(t => ({
        book: t,
        analysis: historicalContextService.analyzeTemporalDissonance(
          t.publication_year!,
          t.narrative_time_period
        )
      }));
  }, [transmissions]);

  const literaryMovements = useMemo(() => {
    const movements = new Map<string, Transmission[]>();
    
    contexts.forEach(({ transmission, context }) => {
      if (context.literaryMovement) {
        const name = context.literaryMovement.name;
        if (!movements.has(name)) {
          movements.set(name, []);
        }
        movements.get(name)!.push(transmission);
      }
    });

    return Array.from(movements.entries()).map(([name, books]) => ({
      name,
      books,
      count: books.length
    })).sort((a, b) => b.count - a.count);
  }, [contexts]);

  const insights = useMemo(() => {
    const insights: string[] = [];

    if (decadeAnalysis.length > 0) {
      const topDecade = decadeAnalysis[0];
      insights.push(
        `Most books from the ${topDecade.decade}s (${topDecade.count} books) - ${topDecade.zeitgeist.themes[0]}`
      );
    }

    if (literaryMovements.length > 0) {
      const topMovement = literaryMovements[0];
      insights.push(
        `Strong affinity for ${topMovement.name} (${topMovement.count} books)`
      );
    }

    if (temporalDissonances.length > 0) {
      const farFuture = temporalDissonances.filter(d => d.analysis.dissonance === 'far_future');
      if (farFuture.length > 0) {
        insights.push(
          `${farFuture.length} books explore far future scenarios`
        );
      }
    }

    return insights;
  }, [decadeAnalysis, literaryMovements, temporalDissonances]);

  return {
    contexts,
    decadeAnalysis,
    temporalDissonances,
    literaryMovements,
    insights,
    hasData: contexts.length > 0
  };
};
