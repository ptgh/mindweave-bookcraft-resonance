import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrainNode } from '@/pages/TestBrain';

export interface DiscoveryResult {
  title: string;
  author: string;
  cover_url?: string;
  reason: string;
  source: string;
}

export function useNeuralMapDiscovery(existingTitles: string[]) {
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSimilar = useCallback(async (node: BrainNode) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const query = `${node.title} ${node.tags.join(' ')}`;
      const { data, error: fnError } = await supabase.functions.invoke('semantic-search', {
        body: { query, limit: 8 }
      });

      if (fnError) throw fnError;

      const existingSet = new Set(existingTitles.map(t => t.toLowerCase()));
      const suggestions: DiscoveryResult[] = (data?.results || [])
        .filter((r: any) => !existingSet.has((r.title || '').toLowerCase()))
        .slice(0, 4)
        .map((r: any) => ({
          title: r.title || 'Unknown',
          author: r.author || 'Unknown',
          cover_url: r.cover_url || r.metadata?.cover_url,
          reason: r.metadata?.tags?.slice(0, 2).join(', ') || 'Thematic similarity',
          source: r.source_type || 'collection'
        }));

      setResults(suggestions);
      if (suggestions.length === 0) {
        setError('No similar books found yet');
      }
    } catch (e) {
      console.error('Discovery search failed:', e);
      setError('No similar books found yet');
    } finally {
      setLoading(false);
    }
  }, [existingTitles]);

  return { results, loading, error, findSimilar };
}
