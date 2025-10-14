import { useMemo } from 'react';
import { Transmission } from '@/services/transmissionsService';
import {
  patternRecognitionService,
  ThematicCluster,
  ConceptualBridge,
  ReadingPattern,
  InfluenceMap
} from '@/services/patternRecognition';

export const usePatternRecognition = (transmissions: Transmission[]) => {
  const clusters = useMemo(() => {
    if (!transmissions || transmissions.length < 2) return [];
    return patternRecognitionService.detectThematicClusters(transmissions);
  }, [transmissions]);

  const bridges = useMemo(() => {
    if (!transmissions || transmissions.length < 2) return [];
    return patternRecognitionService.identifyConceptualBridges(transmissions);
  }, [transmissions]);

  const patterns = useMemo(() => {
    if (!transmissions || transmissions.length < 3) return [];
    return patternRecognitionService.analyzeReadingPatterns(transmissions);
  }, [transmissions]);

  const influences = useMemo(() => {
    if (!transmissions || transmissions.length < 3) return [];
    return patternRecognitionService.mapAuthorInfluences(transmissions);
  }, [transmissions]);

  const insights = useMemo(() => {
    const insights: string[] = [];

    // Add cluster insights
    if (clusters.length > 0) {
      const topCluster = clusters[0];
      insights.push(
        `Your strongest thematic cluster is "${topCluster.name}" with ${topCluster.books.length} books`
      );
    }

    // Add bridge insights
    if (bridges.length > 0) {
      const strongBridges = bridges.filter(b => b.strength > 0.5);
      if (strongBridges.length > 0) {
        insights.push(
          `Discovered ${strongBridges.length} strong conceptual bridges connecting your books`
        );
      }
    }

    // Add pattern insights
    if (patterns.length > 0) {
      const topPattern = patterns[0];
      insights.push(topPattern.description);
    }

    // Add influence insights
    if (influences.length > 0) {
      insights.push(
        `Mapped influence networks for ${influences.length} authors in your library`
      );
    }

    return insights;
  }, [clusters, bridges, patterns, influences]);

  return {
    clusters,
    bridges,
    patterns,
    influences,
    insights,
    hasData: transmissions.length >= 2
  };
};
