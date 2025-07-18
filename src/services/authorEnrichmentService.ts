
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

export const queueAuthorForEnrichment = async (authorId: string): Promise<void> => {
  console.log('Queueing author for enrichment:', authorId);
  
  try {
    // Check if already queued and pending
    const { data: existing } = await supabase
      .from('author_enrichment_queue')
      .select('id, status')
      .eq('author_id', authorId)
      .eq('status', 'pending')
      .single();
    
    if (existing) {
      console.log('Author already queued for enrichment');
      return;
    }
    
    // Queue the author
    const { error } = await supabase
      .from('author_enrichment_queue')
      .insert({
        author_id: authorId,
        enrichment_type: 'full',
        priority: 8, // High priority for manual requests
        status: 'pending'
      });
    
    if (error) {
      console.error('Error queueing author for enrichment:', error);
      throw error;
    }
    
    console.log('Successfully queued author for enrichment');
  } catch (error) {
    console.error('Failed to queue author for enrichment:', error);
    throw error;
  }
};

export const triggerEnrichmentJob = async (): Promise<{ success: boolean; message: string; results?: any }> => {
  console.log('Triggering author enrichment job...');
  
  try {
    const { data, error } = await supabase.functions.invoke('enrich-author-data', {
      body: {}
    });
    
    if (error) {
      console.error('Enrichment job error:', error);
      throw error;
    }
    
    console.log('Enrichment job result:', data);
    return data;
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

// Helper function to check enrichment job status
export const checkEnrichmentStatus = async (authorId: string): Promise<EnrichmentJob | null> => {
  try {
    const { data, error } = await supabase
      .from('author_enrichment_queue')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking enrichment status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in checkEnrichmentStatus:', error);
    return null;
  }
};
