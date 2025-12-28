import { supabase } from "@/integrations/supabase/client";
import { invokeAdminFunction } from "@/utils/adminFunctions";

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
  console.log('Queueing author for enrichment via edge function:', authorId);
  try {
    const { data, error } = await invokeAdminFunction('queue-author-enrichment', {
      authorId,
      priority: 9
    });

    if (error) {
      console.error('queue-author-enrichment error:', error);
      throw error;
    }
    if (!(data as { success?: boolean })?.success) {
      throw new Error((data as { message?: string })?.message || 'Failed to queue author');
    }
    console.log('Successfully queued author:', data);
  } catch (err) {
    console.error('Failed to queue author for enrichment:', err);
    throw err;
  }
};

export const triggerEnrichmentJob = async (authorId?: string): Promise<{ success: boolean; message: string; results?: any }> => {
  console.log('Triggering author enrichment job...', authorId ? `(authorId: ${authorId})` : '');
  
  try {
    const { data, error } = await invokeAdminFunction('enrich-author-data', 
      authorId ? { authorId } : undefined
    );
    
    if (error) {
      console.error('Enrichment job error:', error);
      throw error;
    }
    
    console.log('Enrichment job result:', data);
    return data as { success: boolean; message: string; results?: any };
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
      authorsNeedingEnrichment: authorStats?.filter(a => a.needs_enrichment).length || 0,
      avgQuality: Math.round(authorStats?.reduce((sum, a) => sum + (a.data_quality_score || 0), 0) / (authorStats?.length || 1))
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    throw error;
  }
};

export const bulkProcessAllPending = async (
  onProgress?: (current: number, total: number) => void
): Promise<{ processed: number; successful: number; failed: number }> => {
  console.log('Starting bulk processing of all pending enrichment jobs...');
  
  try {
    // Get total pending jobs
    const { count: totalPending } = await supabase
      .from('author_enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (!totalPending || totalPending === 0) {
      console.log('No pending jobs to process');
      return { processed: 0, successful: 0, failed: 0 };
    }
    
    console.log(`Found ${totalPending} pending jobs. Starting processing...`);
    
    // Calculate number of runs needed (10 jobs per run)
    const runsNeeded = Math.ceil(totalPending / 10);
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    // Process in batches
    for (let i = 0; i < runsNeeded; i++) {
      console.log(`Processing batch ${i + 1}/${runsNeeded}...`);
      
      try {
        const result = await triggerEnrichmentJob();
        
        if (result.success) {
          totalProcessed += result.results?.processed || 0;
          totalSuccessful += result.results?.successful || 0;
          totalFailed += result.results?.failed || 0;
        } else {
          console.error(`Batch ${i + 1} failed:`, result.message);
          totalFailed += 10; // Assume all failed in this batch
        }
        
        // Update progress
        if (onProgress) {
          onProgress(Math.min((i + 1) * 10, totalPending), totalPending);
        }
        
        // Wait between batches to avoid rate limits (except for last batch)
        if (i < runsNeeded - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        }
      } catch (error) {
        console.error(`Error in batch ${i + 1}:`, error);
        totalFailed += 10;
      }
    }
    
    console.log(`Bulk processing complete. Processed: ${totalProcessed}, Successful: ${totalSuccessful}, Failed: ${totalFailed}`);
    
    return {
      processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed
    };
  } catch (error) {
    console.error('Error in bulk processing:', error);
    throw new Error('Failed to bulk process enrichment jobs');
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
