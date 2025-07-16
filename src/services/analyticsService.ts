import { supabase } from "@/integrations/supabase/client";
import { getDeviceType, getBrowserType } from "@/utils/performance";

export interface BookInteraction {
  user_id?: string;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  interaction_type: 'preview' | 'add' | 'digital_copy_click' | 'search' | 'view';
  digital_source?: 'apple_books' | 'internet_archive' | 'project_gutenberg' | 'none';
  source_context?: 'publisher_resonance' | 'author_matrix' | 'search' | 'discovery';
  search_query?: string;
  response_time_ms?: number;
  success?: boolean;
  error_details?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  metric_type: 'page_load' | 'api_response' | 'search_time' | 'cache_hit' | 'image_load';
  metric_value: number;
  context?: 'publisher_resonance' | 'author_matrix' | 'search' | 'discovery';
  network_type?: string;
}

class AnalyticsService {
  private deviceType = getDeviceType();
  private browserType = getBrowserType();
  private userId: string | null = null;

  constructor() {
    // Get current user if authenticated
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      const { data } = await supabase.auth.getUser();
      this.userId = data.user?.id || null;
    } catch (error) {
      console.debug('User not authenticated:', error);
    }
  }

  async logBookInteraction(interaction: BookInteraction): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_book_interaction', {
        p_user_id: this.userId || interaction.user_id,
        p_book_title: interaction.book_title,
        p_book_author: interaction.book_author,
        p_book_isbn: interaction.book_isbn,
        p_interaction_type: interaction.interaction_type,
        p_digital_source: interaction.digital_source,
        p_source_context: interaction.source_context,
        p_device_type: this.deviceType,
        p_browser_type: this.browserType,
        p_search_query: interaction.search_query,
        p_response_time_ms: interaction.response_time_ms,
        p_success: interaction.success ?? true,
        p_error_details: interaction.error_details,
        p_metadata: interaction.metadata
      });

      if (error) {
        console.warn('Failed to log book interaction:', error);
      }
    } catch (error) {
      console.warn('Error logging book interaction:', error);
    }
  }

  async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const networkInfo = this.getNetworkInfo();
      
      const { error } = await supabase.rpc('log_performance_metric', {
        p_metric_type: metric.metric_type,
        p_metric_value: metric.metric_value,
        p_context: metric.context,
        p_user_agent: navigator.userAgent,
        p_device_type: this.deviceType,
        p_network_type: metric.network_type || networkInfo
      });

      if (error) {
        console.warn('Failed to log performance metric:', error);
      }
    } catch (error) {
      console.warn('Error logging performance metric:', error);
    }
  }

  private getNetworkInfo(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Convenience methods for common interactions
  async logBookPreview(book: { title: string; author: string; isbn?: string }, context?: string): Promise<void> {
    await this.logBookInteraction({
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
      interaction_type: 'preview',
      source_context: context as any
    });
  }

  async logBookAdd(book: { title: string; author: string; isbn?: string }, context?: string): Promise<void> {
    await this.logBookInteraction({
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
      interaction_type: 'add',
      source_context: context as any
    });
  }

  async logDigitalCopyClick(
    book: { title: string; author: string; isbn?: string },
    source: 'apple_books' | 'internet_archive' | 'project_gutenberg',
    context?: string
  ): Promise<void> {
    await this.logBookInteraction({
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
      interaction_type: 'digital_copy_click',
      digital_source: source,
      source_context: context as any
    });
  }

  async logSearchTime(query: string, responseTime: number, context?: string): Promise<void> {
    await this.logPerformanceMetric({
      metric_type: 'search_time',
      metric_value: responseTime,
      context: context as any
    });

    await this.logBookInteraction({
      book_title: 'Search Query',
      book_author: 'System',
      interaction_type: 'search',
      search_query: query,
      response_time_ms: responseTime,
      source_context: context as any
    });
  }

  async logPageLoad(loadTime: number, context?: string): Promise<void> {
    await this.logPerformanceMetric({
      metric_type: 'page_load',
      metric_value: loadTime,
      context: context as any
    });
  }

  async logApiResponse(apiName: string, responseTime: number, success: boolean = true): Promise<void> {
    await this.logPerformanceMetric({
      metric_type: 'api_response',
      metric_value: responseTime,
      context: apiName as any
    });
  }

  async logCacheHit(cacheType: string, context?: string): Promise<void> {
    await this.logPerformanceMetric({
      metric_type: 'cache_hit',
      metric_value: 1,
      context: context as any
    });
  }
}

export const analyticsService = new AnalyticsService();