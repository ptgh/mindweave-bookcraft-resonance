import { supabase } from "@/integrations/supabase/client";

export interface EnrichmentJob {
  id: string;
  author_id: string;
  enrichment_type: string;
  priority: number;
  status: string;
  attempts: number;
  error_message?: string;
  scheduled_for: string;
  processed_at?: string;
  created_at: string;
}

export interface AuthorDataSource {
  id: string;
  author_id: string;
  source_type: string;
  source_url?: string;
  data_retrieved: any;
  confidence_score: number;
  last_validated: string;
  created_at: string;
  updated_at: string;
}

export const getEnrichmentQueue = async (limit: number = 10): Promise<EnrichmentJob[]> => {
  console.log('Fetching enrichment queue...');
  
  const { data, error } = await supabase
    .from('author_enrichment_queue')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching enrichment queue:', error);
    throw error;
  }
  
  return data || [];
};

export const getAuthorDataSources = async (authorId: string): Promise<AuthorDataSource[]> => {
  console.log('Fetching author data sources for:', authorId);
  
  const { data, error } = await supabase
    .from('author_data_sources')
    .select('*')
    .eq('author_id', authorId)
    .order('confidence_score', { ascending: false });
  
  if (error) {
    console.error('Error fetching author data sources:', error);
    throw error;
  }
  
  return data || [];
};

export const triggerEnrichmentJob = async (): Promise<void> => {
  console.log('Triggering author enrichment job...');
  
  try {
    const response = await fetch('https://mmnfjeukxandnhdaovzx.supabase.co/functions/v1/enrich-author-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbmZqZXVreGFuZG5oZGFvdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTE3NTgsImV4cCI6MjA2NjE2Nzc1OH0.p8NPVC-MHX_pn9_2BHEQODSG6JVPOORXPTVkmtVxc1E`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Enrichment job failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Enrichment job result:', result);
  } catch (error) {
    console.error('Error triggering enrichment job:', error);
    throw error;
  }
};

export const getEnrichmentStats = async () => {
  console.log('Fetching enrichment statistics...');
  
  try {
    // Get queue stats
    const { data: queueStats, error: queueError } = await supabase
      .from('author_enrichment_queue')
      .select('status')
      .eq('status', 'pending');
    
    if (queueError) throw queueError;
    
    // Get author completeness stats
    const { data: authorStats, error: authorError } = await supabase
      .from('scifi_authors')
      .select('data_quality_score, needs_enrichment');
    
    if (authorError) throw authorError;
    
    const stats = {
      pendingJobs: queueStats?.length || 0,
      totalAuthors: authorStats?.length || 0,
      completeAuthors: authorStats?.filter(a => a.data_quality_score >= 80).length || 0,
      needsEnrichment: authorStats?.filter(a => a.needs_enrichment).length || 0,
      averageQuality: authorStats?.reduce((sum, a) => sum + (a.data_quality_score || 0), 0) / (authorStats?.length || 1)
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    throw error;
  }
};