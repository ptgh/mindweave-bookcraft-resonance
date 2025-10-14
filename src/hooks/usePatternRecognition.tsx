import { useMemo } from 'react';
import { Transmission } from '@/services/transmissionsService';
import { PatternRecognitionService } from '@/services/patternRecognition';

export const usePatternRecognition = (transmissions: Transmission[]) => {
  const clusters = useMemo(() => 
    PatternRecognitionService.detectThematicClusters(transmissions),
    [transmissions]
  );

  const bridges = useMemo(() => 
    PatternRecognitionService.findConceptualBridges(transmissions),
    [transmissions]
  );

  const velocities = useMemo(() => 
    PatternRecognitionService.calculateReadingVelocity(transmissions),
    [transmissions]
  );

  const influenceNetwork = useMemo(() => 
    PatternRecognitionService.mapInfluenceNetwork(transmissions),
    [transmissions]
  );

  const getBookClusters = (bookId: string) => 
    PatternRecognitionService.getBookClusterInfo(bookId, clusters);

  const getBookBridges = (bookId: string) => 
    PatternRecognitionService.getBookBridges(bookId, bridges);

  return {
    clusters,
    bridges,
    velocities,
    influenceNetwork,
    getBookClusters,
    getBookBridges
  };
};
