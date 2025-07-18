import { supabase } from "@/integrations/supabase/client";
import { triggerEnrichmentJob, queueAuthorForEnrichment } from "./authorEnrichmentService";

// Manual enrichment service for testing and debugging
export const manualEnrichmentService = {
  // Queue specific authors for enrichment by name
  async queueAuthorByName(authorName: string): Promise<{ success: boolean; authorId?: string; message: string }> {
    console.log('Queueing author by name:', authorName);
    
    try {
      // Find the author
      const { data: author, error } = await supabase
        .from('scifi_authors')
        .select('id, name, needs_enrichment')
        .ilike('name', `%${authorName}%`)
        .limit(1)
        .single();
      
      if (error || !author) {
        return {
          success: false,
          message: `Author "${authorName}" not found in database`
        };
      }
      
      // Queue for enrichment
      await queueAuthorForEnrichment(author.id);
      
      return {
        success: true,
        authorId: author.id,
        message: `Successfully queued "${author.name}" for enrichment`
      };
    } catch (error) {
      console.error('Error queueing author by name:', error);
      return {
        success: false,
        message: `Error queueing author: ${error.message}`
      };
    }
  },

  // Queue all authors that need enrichment
  async queueAllNeedingEnrichment(): Promise<{ success: boolean; queued: number; message: string }> {
    console.log('Queueing all authors needing enrichment...');
    
    try {
      // Get authors that need enrichment but aren't already queued
      const { data: authors, error } = await supabase
        .from('scifi_authors')
        .select('id, name')
        .eq('needs_enrichment', true)
        .limit(20); // Limit to prevent overwhelming the system
      
      if (error) {
        throw error;
      }
      
      if (!authors || authors.length === 0) {
        return {
          success: true,
          queued: 0,
          message: 'No authors found that need enrichment'
        };
      }
      
      let queuedCount = 0;
      for (const author of authors) {
        try {
          await queueAuthorForEnrichment(author.id);
          queuedCount++;
        } catch (error) {
          console.warn(`Failed to queue ${author.name}:`, error);
        }
      }
      
      return {
        success: true,
        queued: queuedCount,
        message: `Successfully queued ${queuedCount} authors for enrichment`
      };
    } catch (error) {
      console.error('Error queueing all authors:', error);
      return {
        success: false,
        queued: 0,
        message: `Error queueing authors: ${error.message}`
      };
    }
  },

  // Test the enrichment system with specific authors
  async testEnrichmentSystem(): Promise<{ success: boolean; results: any; message: string }> {
    console.log('Testing enrichment system...');
    
    try {
      // First queue a few test authors
      const testAuthors = ['Edwin A. Abbott', 'Donald Barr', 'Bruce Sterling'];
      const queueResults = [];
      
      for (const authorName of testAuthors) {
        const result = await this.queueAuthorByName(authorName);
        queueResults.push({ authorName, ...result });
      }
      
      // Wait a moment for the queue to be populated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trigger the enrichment job
      console.log('Triggering enrichment job...');
      const enrichmentResult = await triggerEnrichmentJob();
      
      return {
        success: true,
        results: {
          queueResults,
          enrichmentResult
        },
        message: 'Enrichment system test completed'
      };
    } catch (error) {
      console.error('Error testing enrichment system:', error);
      return {
        success: false,
        results: null,
        message: `Test failed: ${error.message}`
      };
    }
  },

  // Get system status
  async getSystemStatus(): Promise<{
    queueLength: number;
    authorsNeedingEnrichment: number;
    recentlyProcessed: number;
    systemHealth: 'good' | 'warning' | 'error';
  }> {
    try {
      // Get queue length
      const { data: queueData } = await supabase
        .from('author_enrichment_queue')
        .select('id')
        .eq('status', 'pending');
      
      // Get authors needing enrichment
      const { data: needsEnrichmentData } = await supabase
        .from('scifi_authors')
        .select('id')
        .eq('needs_enrichment', true);
      
      // Get recently processed (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentData } = await supabase
        .from('author_enrichment_queue')
        .select('id')
        .eq('status', 'completed')
        .gte('processed_at', yesterday.toISOString());
      
      const queueLength = queueData?.length || 0;
      const authorsNeedingEnrichment = needsEnrichmentData?.length || 0;
      const recentlyProcessed = recentData?.length || 0;
      
      // Determine system health
      let systemHealth: 'good' | 'warning' | 'error' = 'good';
      if (authorsNeedingEnrichment > 50 && queueLength === 0) {
        systemHealth = 'warning'; // Many authors need enrichment but nothing queued
      }
      if (queueLength > 10 && recentlyProcessed === 0) {
        systemHealth = 'error'; // Queue is backed up and nothing processing
      }
      
      return {
        queueLength,
        authorsNeedingEnrichment,
        recentlyProcessed,
        systemHealth
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        queueLength: 0,
        authorsNeedingEnrichment: 0,
        recentlyProcessed: 0,
        systemHealth: 'error'
      };
    }
  }
};

// Export functions for global access (useful for console debugging)
if (typeof window !== 'undefined') {
  (window as any).enrichmentDebug = {
    queueAuthor: manualEnrichmentService.queueAuthorByName,
    queueAll: manualEnrichmentService.queueAllNeedingEnrichment,
    test: manualEnrichmentService.testEnrichmentSystem,
    status: manualEnrichmentService.getSystemStatus,
    trigger: triggerEnrichmentJob
  };
}